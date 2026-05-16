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

  if (current < 3) {
    // v2 used to add an auth_session table; the open-source build removes the
    // auth flow entirely, so the migration is folded into v3 below. Anyone
    // upgrading from v2 still gets the auth_session table cleaned up in v5.
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

  if (current < 5) {
    // Open-source migration: drop the auth_session table (encrypted token blob
    // from the legacy SaaS flow) and any usage/limit/auth meta keys that
    // referenced the now-removed bisbi.io backend.
    db.exec(`
      DROP TABLE IF EXISTS auth_session;
      DROP TABLE IF EXISTS usage_queue;
      DELETE FROM meta WHERE key LIKE 'auth_%'
        OR key LIKE 'usage_words_%'
        OR key = 'usage_words_limit'
        OR key = 'device_hwid_v1';
    `);
    db.pragma('user_version = 5');
  }
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
