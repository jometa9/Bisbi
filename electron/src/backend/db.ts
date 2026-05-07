import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { Database } from 'better-sqlite3';

let cached: Database | null = null;

function dbPath(): string {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'bisbi.sqlite');
}

function loadDriver(): typeof import('better-sqlite3') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('better-sqlite3') as typeof import('better-sqlite3');
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const tokens = trimmed.match(/\S+/g)?.length ?? 0;
  const cjk = trimmed.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  return tokens + cjk;
}

export function getDb(): Database {
  if (cached) return cached;
  const DriverCtor = loadDriver();
  const db = new DriverCtor(dbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  cached = db;
  return cached;
}

function migrate(db: Database): void {
  const current = (db.pragma('user_version', { simple: true }) as number) ?? 0;

  if (current < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transcriptions (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        text TEXT NOT NULL,
        language TEXT,
        duration_ms INTEGER,
        model TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at
        ON transcriptions(created_at DESC);
    `);
    db.pragma('user_version = 1');
  }

  if (current < 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        token_enc BLOB NOT NULL,
        user_info_enc BLOB,
        updated_at INTEGER NOT NULL
      );
    `);
    db.pragma('user_version = 2');
  }

  if (current < 3) {
    db.exec(`
      ALTER TABLE transcriptions ADD COLUMN audio_duration_ms INTEGER;
      ALTER TABLE transcriptions ADD COLUMN word_count INTEGER;
    `);
    const rows = db.prepare('SELECT id, text FROM transcriptions').all() as {
      id: string;
      text: string;
    }[];
    const update = db.prepare('UPDATE transcriptions SET word_count = ? WHERE id = ?');
    const tx = db.transaction((items: { id: string; text: string }[]) => {
      for (const r of items) update.run(countWords(r.text), r.id);
    });
    tx(rows);
    db.prepare('DELETE FROM meta WHERE key = ?').run('total_words');
    db.pragma('user_version = 3');
  }

  if (current < 4) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usage_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        words INTEGER NOT NULL,
        audio_seconds INTEGER NOT NULL,
        transcribed_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_usage_queue_next_attempt
        ON usage_queue(next_attempt_at);
    `);
    db.pragma('user_version = 4');
  }
}

export interface AuthRow {
  tokenEnc: Buffer;
  userInfoEnc: Buffer | null;
  updatedAt: number;
}

export function authGet(): AuthRow | null {
  const row = getDb()
    .prepare(
      'SELECT token_enc as tokenEnc, user_info_enc as userInfoEnc, updated_at as updatedAt FROM auth_session WHERE id = 1'
    )
    .get() as AuthRow | undefined;
  return row ?? null;
}

export function authSet(tokenEnc: Buffer, userInfoEnc: Buffer | null): void {
  getDb()
    .prepare(
      `INSERT INTO auth_session(id, token_enc, user_info_enc, updated_at)
       VALUES(1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         token_enc = excluded.token_enc,
         user_info_enc = excluded.user_info_enc,
         updated_at = excluded.updated_at`
    )
    .run(tokenEnc, userInfoEnc, Date.now());
}

export function authClear(): void {
  getDb().prepare('DELETE FROM auth_session WHERE id = 1').run();
}

export function metaGet(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM meta WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function metaSet(key: string, value: string | null): void {
  if (value === null) {
    getDb().prepare('DELETE FROM meta WHERE key = ?').run(key);
    return;
  }
  getDb()
    .prepare(
      'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value);
}

export interface TranscriptionRow {
  id: string;
  createdAt: number;
  text: string;
  language: string | null;
  durationMs: number | null;
  model: string | null;
  audioDurationMs: number | null;
  wordCount: number | null;
}

export function insertTranscription(row: TranscriptionRow): void {
  getDb()
    .prepare(
      `INSERT INTO transcriptions(id, created_at, text, language, duration_ms, model, audio_duration_ms, word_count)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      row.id,
      row.createdAt,
      row.text,
      row.language ?? null,
      row.durationMs ?? null,
      row.model ?? null,
      row.audioDurationMs ?? null,
      row.wordCount ?? null
    );
}

export function listTranscriptions(limit = 100): TranscriptionRow[] {
  const rows = getDb()
    .prepare(
      `SELECT id, created_at as createdAt, text, language,
              duration_ms as durationMs, model,
              audio_duration_ms as audioDurationMs,
              word_count as wordCount
       FROM transcriptions
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(limit) as TranscriptionRow[];
  return rows;
}

export function deleteTranscription(id: string): void {
  getDb().prepare('DELETE FROM transcriptions WHERE id = ?').run(id);
}

export function clearTranscriptions(): void {
  getDb().prepare('DELETE FROM transcriptions').run();
}

export const FREE_MONTHLY_WORD_LIMIT_DEFAULT = 2000;

export function currentMonthKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

function usageWordsKey(monthKey: string = currentMonthKey()): string {
  return `usage_words_${monthKey}`;
}

const USAGE_LIMIT_META_KEY = 'usage_words_limit';

export function getMonthlyWordUsage(monthKey: string = currentMonthKey()): number {
  const v = metaGet(usageWordsKey(monthKey));
  if (!v) return 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function addMonthlyWordUsage(
  words: number,
  monthKey: string = currentMonthKey()
): number {
  const inc = Math.max(0, Math.floor(words));
  if (inc === 0) return getMonthlyWordUsage(monthKey);
  const next = getMonthlyWordUsage(monthKey) + inc;
  metaSet(usageWordsKey(monthKey), String(next));
  return next;
}

export function setMonthlyWordUsageFromServer(
  words: number,
  monthKey: string = currentMonthKey()
): void {
  const v = Math.max(0, Math.floor(words));
  metaSet(usageWordsKey(monthKey), String(v));
}

export function getMonthlyWordLimit(): number {
  const v = metaGet(USAGE_LIMIT_META_KEY);
  if (!v) return FREE_MONTHLY_WORD_LIMIT_DEFAULT;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : FREE_MONTHLY_WORD_LIMIT_DEFAULT;
}

export function setMonthlyWordLimit(limit: number | null | undefined): void {
  if (limit == null || !Number.isFinite(limit) || limit <= 0) {
    metaSet(USAGE_LIMIT_META_KEY, null);
    return;
  }
  metaSet(USAGE_LIMIT_META_KEY, String(Math.floor(limit)));
}

export interface UsageQueueRow {
  id: number;
  words: number;
  audioSeconds: number;
  transcribedAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError: string | null;
}

export function enqueueUsage(input: {
  words: number;
  audioSeconds: number;
  transcribedAt?: number;
}): UsageQueueRow {
  const words = Math.max(0, Math.floor(input.words));
  const audioSeconds = Math.max(0, Math.floor(input.audioSeconds));
  const transcribedAt = input.transcribedAt ?? Date.now();
  const info = getDb()
    .prepare(
      `INSERT INTO usage_queue(words, audio_seconds, transcribed_at, attempts, next_attempt_at)
       VALUES(?, ?, ?, 0, 0)`
    )
    .run(words, audioSeconds, transcribedAt);
  return {
    id: Number(info.lastInsertRowid),
    words,
    audioSeconds,
    transcribedAt,
    attempts: 0,
    nextAttemptAt: 0,
    lastError: null,
  };
}

export function peekDueUsage(now: number = Date.now(), limit = 50): UsageQueueRow[] {
  const rows = getDb()
    .prepare(
      `SELECT id, words, audio_seconds as audioSeconds,
              transcribed_at as transcribedAt, attempts,
              next_attempt_at as nextAttemptAt, last_error as lastError
       FROM usage_queue
       WHERE next_attempt_at <= ?
       ORDER BY id ASC
       LIMIT ?`
    )
    .all(now, limit) as UsageQueueRow[];
  return rows;
}

export function deleteUsageQueueRow(id: number): void {
  getDb().prepare('DELETE FROM usage_queue WHERE id = ?').run(id);
}

export function bumpUsageQueueRow(
  id: number,
  attempts: number,
  nextAttemptAt: number,
  lastError: string | null
): void {
  getDb()
    .prepare(
      `UPDATE usage_queue
         SET attempts = ?, next_attempt_at = ?, last_error = ?
       WHERE id = ?`
    )
    .run(attempts, nextAttemptAt, lastError, id);
}

export function countPendingUsage(): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) as c FROM usage_queue')
    .get() as { c: number } | undefined;
  return row?.c ?? 0;
}

export interface StatsTotals {
  totalTranscriptions: number;
  totalAudioMs: number;
  totalWords: number;
}

export function getStatsTotals(): StatsTotals {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) as totalTranscriptions,
              COALESCE(SUM(audio_duration_ms), 0) as totalAudioMs,
              COALESCE(SUM(word_count), 0) as totalWords
       FROM transcriptions`
    )
    .get() as StatsTotals;
  return {
    totalTranscriptions: Number(row.totalTranscriptions) || 0,
    totalAudioMs: Number(row.totalAudioMs) || 0,
    totalWords: Number(row.totalWords) || 0,
  };
}
