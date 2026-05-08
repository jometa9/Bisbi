import {
  bumpUsageQueueRow,
  countPendingUsage,
  deleteUsageQueueRow,
  peekDueUsage,
  setMonthlyWordLimit,
  setMonthlyWordUsageFromServer,
} from './db';
import { getAuthToken } from './auth';
import { apiFetch } from './apiClient';

const BACKOFF_MS = [
  30_000,
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
];

function backoffFor(attempts: number): number {
  const idx = Math.min(attempts, BACKOFF_MS.length - 1);
  return BACKOFF_MS[idx];
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

interface PostUsageResult {
  status: number;
  body: UsageResponse | null;
}

async function postUsage(
  token: string,
  payload: { words: number; audioSeconds: number; transcribedAt: number }
): Promise<PostUsageResult> {
  const resp = await apiFetch('/api/usage', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      words: payload.words,
      audioSeconds: payload.audioSeconds,
      transcribedAt: new Date(payload.transcribedAt).toISOString(),
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

export async function flushUsageQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const token = getAuthToken();
    if (!token) return;
    const rows = peekDueUsage();
    for (const row of rows) {
      try {
        const res = await postUsage(token, {
          words: row.words,
          audioSeconds: row.audioSeconds,
          transcribedAt: row.transcribedAt,
        });
        if (res.body) applyServerResponse(res.body);
        deleteUsageQueueRow(row.id);
      } catch (err) {
        const attempts = row.attempts + 1;
        const next = Date.now() + backoffFor(attempts);
        bumpUsageQueueRow(
          row.id,
          attempts,
          next,
          err instanceof Error ? err.message : String(err)
        );
        break;
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
  const pending = countPendingUsage();
  if (pending === 0) {
    flushTimer = setTimeout(() => {
      void flushUsageQueue();
    }, 5 * 60_000);
    return;
  }
  const rows = peekDueUsage(Date.now() + 365 * 24 * 60 * 60_000, 1);
  if (rows.length === 0) return;
  const wait = Math.max(1000, rows[0].nextAttemptAt - Date.now());
  flushTimer = setTimeout(() => {
    void flushUsageQueue();
  }, wait);
}

export function startUsageSync(): void {
  void flushUsageQueue();
}

export function stopUsageSync(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
