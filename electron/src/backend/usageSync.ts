import { WEB_BASE } from '../buildConfig';
import {
  bumpUsageQueueRow,
  countPendingUsage,
  currentMonthKey,
  deleteUsageQueueRow,
  peekDueUsage,
  setMonthlyWordLimit,
  setMonthlyWordUsageFromServer,
} from './db';
import { getAuthToken } from './auth';

// Backoff schedule (ms). After exhausting the schedule we keep using the last
// value so the queue keeps trying without ever giving up — the user can be
// offline for days and we still reconcile when they come back.
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

async function postUsage(
  token: string,
  payload: { words: number; audioSeconds: number; transcribedAt: number }
): Promise<UsageResponse> {
  const resp = await fetch(`${WEB_BASE}/api/usage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      words: payload.words,
      audioSeconds: payload.audioSeconds,
      transcribedAt: new Date(payload.transcribedAt).toISOString(),
    }),
  });
  if (!resp.ok) {
    throw new Error(`POST /api/usage failed: ${resp.status}`);
  }
  return (await resp.json()) as UsageResponse;
}

function applyServerResponse(res: UsageResponse): void {
  setMonthlyWordUsageFromServer(res.wordsUsed, res.monthKey);
  setMonthlyWordLimit(res.wordsLimit);
  if (res.exceeded && res.wordsLimit != null && onLimitReached) {
    onLimitReached({ used: res.wordsUsed, limit: res.wordsLimit });
  }
}

// Drains the queue best-effort. Stops at the first failure so we don't burn
// retries while offline; the scheduler will pick it up later.
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
        deleteUsageQueueRow(row.id);
        applyServerResponse(res);
      } catch (err) {
        const attempts = row.attempts + 1;
        const next = Date.now() + backoffFor(attempts);
        bumpUsageQueueRow(
          row.id,
          attempts,
          next,
          err instanceof Error ? err.message : String(err)
        );
        // Stop on first failure: likely network/API down, don't hammer.
        break;
      }
    }
  } finally {
    flushing = false;
    scheduleNextFlush();
  }
}

// Schedule a flush at the soonest pending row's next_attempt_at. If nothing is
// pending we still poll every 5 minutes — cheap and lets us catch a queue that
// was added off-cycle.
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
  // Wake at the earliest due time (we always check the head when flushing).
  const rows = peekDueUsage(Date.now() + 365 * 24 * 60 * 60_000, 1);
  if (rows.length === 0) return;
  const wait = Math.max(1000, rows[0].nextAttemptAt - Date.now());
  flushTimer = setTimeout(() => {
    void flushUsageQueue();
  }, wait);
}

export function startUsageSync(): void {
  // Kick an immediate flush at startup so any backlog from a previous session
  // gets delivered before the user makes new transcriptions.
  void flushUsageQueue();
}

export function stopUsageSync(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
