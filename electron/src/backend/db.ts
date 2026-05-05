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
  // Latin/whitespace-separated tokens.
  const tokens = trimmed.match(/\S+/g)?.length ?? 0;
  // CJK languages don't separate words with spaces, so each ideograph counts.
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
    // Single-row table for the current logged-in session. Token is stored as
    // an encrypted BLOB (safeStorage) and user info as encrypted JSON, so the
    // sqlite file is useless if copied off-device.
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
    // Capture the actual audio duration and word count of each transcription so
    // the Home page can show all-time totals (and derive words-per-minute) by
    // summing across the table instead of relying on a separate counter.
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
    // Drop the old cached counter — totals are now derived from the table.
    db.prepare('DELETE FROM meta WHERE key = ?').run('total_words');
    db.pragma('user_version = 3');
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
