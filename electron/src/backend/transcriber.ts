import { app } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { BUILD_CONFIG } from '../buildConfig';
import { apiFetch } from './apiClient';
import { getAuthToken } from './auth';

let activeWhisper: ChildProcess | null = null;

export function cancelActiveTranscription(): boolean {
  const child = activeWhisper;
  if (!child || child.killed) return false;
  try { child.kill('SIGKILL'); } catch {}
  return true;
}

export interface TranscribeOutput {
  text: string;
  language: string | null;
  durationMs: number;
  audioDurationMs: number;
  modelFile: string;
}

function platformDir(): string {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'darwin') return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  if (platform === 'win32') return 'win32-x64';
  throw new Error(`Plataforma no soportada: ${platform}-${arch}`);
}

function whisperBinaryName(): string {
  return process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli';
}

function resourceRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'whisper');
  }
  return path.resolve(__dirname, '..', '..', '..', 'resources', 'whisper');
}

export function whisperBinaryPath(): string {
  return path.join(resourceRoot(), platformDir(), whisperBinaryName());
}

export function whisperModelPath(): string {
  return path.join(resourceRoot(), BUILD_CONFIG.OFFLINE_MODEL_FILE);
}

export interface ResourceCheck {
  ok: boolean;
  binaryPath: string;
  modelPath: string;
  missing: string[];
}

export function checkResources(): ResourceCheck {
  const binaryPath = whisperBinaryPath();
  const modelPath = whisperModelPath();
  const missing: string[] = [];
  if (!fs.existsSync(binaryPath)) missing.push(binaryPath);
  if (!fs.existsSync(modelPath)) missing.push(modelPath);
  return { ok: missing.length === 0, binaryPath, modelPath, missing };
}

function writeWavFile(pcm: Buffer, sampleRate: number, channels: number): string {
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const tmpDir = path.join(os.tmpdir(), 'bisbi');
  fs.mkdirSync(tmpDir, { recursive: true });
  const file = path.join(tmpDir, `${randomUUID()}.wav`);
  fs.writeFileSync(file, Buffer.concat([header, pcm]));
  return file;
}

export async function transcribePcm(
  pcm: Buffer,
  sampleRate: number,
  channels: number
): Promise<TranscribeOutput> {
  const check = checkResources();
  if (!check.ok) {
    throw new Error('Resources missing');
  }

  const wavPath = writeWavFile(pcm, sampleRate, channels);
  const startedAt = Date.now();
  const bytesPerFrame = 2 * Math.max(1, channels);
  const audioDurationMs = Math.round((pcm.length / (sampleRate * bytesPerFrame)) * 1000);

  try {
    const args = [
      '-m', check.modelPath,
      '-f', wavPath,
      '-l', 'auto',
      '-otxt',
      '-nt',
      '-t', String(Math.max(2, Math.floor(os.cpus().length / 2))),
      '--temperature', '0.0',
      '--no-speech-thold', '0.6',
      '--suppress-nst',
      '-fa',
    ];

    const text = await runWhisper(check.binaryPath, args, wavPath);
    const durationMs = Date.now() - startedAt;
    return {
      text: text.trim(),
      language: null,
      durationMs,
      audioDurationMs,
      modelFile: BUILD_CONFIG.OFFLINE_MODEL_FILE,
    };
  } finally {
    try { fs.unlinkSync(wavPath); } catch {}
    const txt = `${wavPath}.txt`;
    try { fs.unlinkSync(txt); } catch {}
  }
}

export class CloudTranscribeError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'CloudTranscribeError';
  }
}

function buildWavBuffer(pcm: Buffer, sampleRate: number, channels: number): Buffer {
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

export async function transcribeCloud(
  pcm: Buffer,
  sampleRate: number,
  channels: number
): Promise<TranscribeOutput> {
  const token = getAuthToken();
  if (!token) {
    throw new CloudTranscribeError('Not authenticated');
  }
  const startedAt = Date.now();
  const bytesPerFrame = 2 * Math.max(1, channels);
  const audioDurationMs = Math.round((pcm.length / (sampleRate * bytesPerFrame)) * 1000);
  const audioSeconds = Math.round(audioDurationMs / 1000);
  console.log(
    `[transcriber] cloud transcription started: language=auto audioSeconds=${audioSeconds} pcmBytes=${pcm.length} sampleRate=${sampleRate} channels=${channels}`
  );

  const wav = buildWavBuffer(pcm, sampleRate, channels);
  const form = new FormData();
  // Copy into a fresh ArrayBuffer so the Blob constructor doesn't choke on
  // Buffer's union-typed underlying buffer (Node 20 typings include
  // SharedArrayBuffer, which Blob's BlobPart does not accept).
  const wavBytes = new Uint8Array(wav.byteLength);
  wavBytes.set(wav);
  form.append('file', new Blob([wavBytes.buffer], { type: 'audio/wav' }), 'audio.wav');
  form.append('audioSeconds', String(audioSeconds));

  let resp: Response;
  try {
    console.log('[transcriber] cloud request POST /api/transcribe');
    resp = await apiFetch('/api/transcribe', {
      method: 'POST',
      body: form,
      token,
    });
    console.log(`[transcriber] cloud response status=${resp.status} in ${Date.now() - startedAt}ms`);
  } catch (err) {
    console.error('[transcriber] cloud request failed:', err instanceof Error ? err.message : String(err));
    throw new CloudTranscribeError(
      err instanceof Error ? err.message : String(err)
    );
  }

  if (!resp.ok) {
    let detail = '';
    try {
      detail = await resp.text();
    } catch {}
    console.error(`[transcriber] cloud transcription failed status=${resp.status} detail=${detail.slice(0, 200)}`);
    throw new CloudTranscribeError(
      `Cloud transcription failed (${resp.status}): ${detail.slice(0, 200)}`,
      resp.status
    );
  }

  let payload: { text?: string; language?: string | null; model?: string } = {};
  try {
    payload = (await resp.json()) as typeof payload;
  } catch (err) {
    throw new CloudTranscribeError(
      `Malformed cloud response: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const durationMs = Date.now() - startedAt;
  const text = (payload.text ?? '').trim();
  const resolvedLanguage = payload.language ?? 'auto';
  console.log(
    `[transcriber] cloud transcription done: model=${payload.model ?? 'cloud'} language=${resolvedLanguage} durationMs=${durationMs} textLength=${text.length}`
  );
  return {
    text,
    language: payload.language ?? null,
    durationMs,
    audioDurationMs,
    modelFile: payload.model ?? 'cloud',
  };
}

function runWhisper(bin: string, args: string[], wavPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    activeWhisper = child;
    let stderr = '';
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      if (activeWhisper === child) activeWhisper = null;
      reject(err);
    });
    child.on('close', (code, signal) => {
      if (activeWhisper === child) activeWhisper = null;
      if (signal === 'SIGKILL' || signal === 'SIGTERM') {
        reject(new Error('cancelled'));
        return;
      }
      if (code !== 0) {
        reject(new Error(`whisper-cli exited ${code}: ${stderr.slice(-500)}`));
        return;
      }
      const txtPath = `${wavPath}.txt`;
      if (!fs.existsSync(txtPath)) {
        resolve('');
        return;
      }
      try {
        const text = fs.readFileSync(txtPath, 'utf8');
        resolve(text);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });
}
