import { randomUUID } from 'crypto';
import {
  bumpUsageQueueRow,
  countPendingUsage,
  deleteUsageQueueRow,
  enqueueUsage,
  peekDueUsage,
  setMonthlyWordLimit,
  setMonthlyWordUsageFromServer,
} from './db';
import { getAuthToken } from './auth';
import { apiFetch } from './apiClient';

const BATCH_INTERVAL_MS = 10 * 60_000;
const MAX_BATCH_SIZE = 20;
const FAR_FUTURE_MS = 365 * 24 * 60 * 60_000;

const RETRY_BACKOFF_MS = [
  30_000,
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
];

function backoffFor(attempts: number): number {
  const idx = Math.min(attempts, RETRY_BACKOFF_MS.length - 1);
  return RETRY_BACKOFF_MS[idx];
}

interface UsageResponse {
  ok: boolean;
  tier: string;
  monthKey: string;
  wordsUsed: number;
  audioSeconds: number;
  transcriptionsCount: number;
  wordsLimit: number | null;
  exceeded: boolean;
  remaining: number | null;
}

let flushing = false;
let flushTimer: NodeJS.Timeout | null = null;
let onLimitReached: ((info: { used: number; limit: number }) => void) | null =
  null;

export function setUsageEventHandlers(handlers: {
  onLimitReached?: (info: { used: number; limit: number }) => void;
}): void {
  onLimitReached = handlers.onLimitReached ?? null;
}

interface BatchPayload {
  words: number;
  audioSeconds: number;
  transcribedAt: number;
  transcriptionsCount: number;
  batchId: string;
}

interface PostUsageResult {
  status: number;
  body: UsageResponse | null;
}

async function postBatch(token: string, payload: BatchPayload): Promise<PostUsageResult> {
  const resp = await apiFetch('/api/usage', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
      'X-Bisbi-Batch-Id': payload.batchId,
    },
    body: JSON.stringify({
      words: payload.words,
      audioSeconds: payload.audioSeconds,
      transcribedAt: new Date(payload.transcribedAt).toISOString(),
      transcriptionsCount: payload.transcriptionsCount,
      batchId: payload.batchId,
    }),
  });
  let body: UsageResponse | null = null;
  try {
    body = (await resp.json()) as UsageResponse;
  } catch {
    body = null;
  }
  if (!resp.ok && resp.status !== 429) {
    throw new Error(`POST /api/usage failed: ${resp.status}`);
  }
  return { status: resp.status, body };
}

function applyServerResponse(res: UsageResponse): void {
  setMonthlyWordUsageFromServer(res.wordsUsed, res.monthKey);
  setMonthlyWordLimit(res.wordsLimit);
  if (res.exceeded && res.wordsLimit != null && onLimitReached) {
    onLimitReached({ used: res.wordsUsed, limit: res.wordsLimit });
  }
}

export function recordUsage(input: { words: number; audioSeconds: number }): void {
  const words = Math.max(0, Math.floor(input.words));
  if (words <= 0) return;

  enqueueUsage({
    words,
    audioSeconds: Math.max(0, Math.floor(input.audioSeconds)),
    nextAttemptAt: Date.now() + BATCH_INTERVAL_MS,
  });

  if (countPendingUsage() >= MAX_BATCH_SIZE) {
    void flushUsageQueue(true);
    return;
  }
  scheduleNextFlush();
}

export async function flushUsageQueue(force = false): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const token = getAuthToken();
    if (!token) return;

    const cutoff = force ? Date.now() + FAR_FUTURE_MS : Date.now();
    const rows = peekDueUsage(cutoff);
    if (rows.length === 0) return;

    const totalWords = rows.reduce((s, r) => s + r.words, 0);
    const totalAudioSeconds = rows.reduce((s, r) => s + r.audioSeconds, 0);
    const transcribedAt = rows.reduce((m, r) => Math.max(m, r.transcribedAt), 0);
    const batchId = randomUUID();

    try {
      const res = await postBatch(token, {
        words: totalWords,
        audioSeconds: totalAudioSeconds,
        transcribedAt,
        transcriptionsCount: rows.length,
        batchId,
      });
      if (res.body) applyServerResponse(res.body);
      for (const row of rows) deleteUsageQueueRow(row.id);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      for (const row of rows) {
        const attempts = row.attempts + 1;
        const nextAttemptAt = Date.now() + backoffFor(attempts);
        bumpUsageQueueRow(row.id, attempts, nextAttemptAt, errMsg);
      }
    }
  } finally {
    flushing = false;
    scheduleNextFlush();
  }
}

function scheduleNextFlush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (countPendingUsage() === 0) return;

  const [next] = peekDueUsage(Date.now() + FAR_FUTURE_MS, 1);
  if (!next) return;
  const wait = Math.max(1000, next.nextAttemptAt - Date.now());
  flushTimer = setTimeout(() => {
    void flushUsageQueue();
  }, wait);
}

export function startUsageSync(): void {
  void flushUsageQueue(true);
}

export function stopUsageSync(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
