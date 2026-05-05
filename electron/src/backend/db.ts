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
}

export function insertTranscription(row: TranscriptionRow): void {
  getDb()
    .prepare(
      `INSERT INTO transcriptions(id, created_at, text, language, duration_ms, model)
       VALUES(?, ?, ?, ?, ?, ?)`
    )
    .run(
      row.id,
      row.createdAt,
      row.text,
      row.language ?? null,
      row.durationMs ?? null,
      row.model ?? null
    );
}

export function listTranscriptions(limit = 100): TranscriptionRow[] {
  const rows = getDb()
    .prepare(
      `SELECT id, created_at as createdAt, text, language, duration_ms as durationMs, model
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
