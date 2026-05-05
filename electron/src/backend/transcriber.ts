import { app } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { BUILD_CONFIG } from '../buildConfig';

export interface TranscribeOptions {
  language: string; // 'auto' or ISO code (e.g. 'es', 'en')
  threads?: number;
}

export interface TranscribeOutput {
  text: string;
  language: string | null;
  durationMs: number;
}

function platformDir(): string {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'darwin') return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  if (platform === 'win32') return 'win32-x64';
  if (platform === 'linux') return 'linux-x64';
  throw new Error(`Plataforma no soportada: ${platform}-${arch}`);
}

function whisperBinaryName(): string {
  return process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli';
}

function resourceRoot(): string {
  // In production, electron-builder copies `resources/whisper` to
  // `process.resourcesPath/whisper`. In dev we read from the repo root.
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'whisper');
  }
  return path.resolve(__dirname, '..', '..', '..', 'resources', 'whisper');
}

export function whisperBinaryPath(): string {
  return path.join(resourceRoot(), platformDir(), whisperBinaryName());
}

export function whisperModelPath(): string {
  return path.join(resourceRoot(), BUILD_CONFIG.WHISPER_MODEL_FILE);
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
  header.writeUInt16LE(1, 20); // PCM format
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
  channels: number,
  opts: TranscribeOptions
): Promise<TranscribeOutput> {
  const check = checkResources();
  if (!check.ok) {
    throw new Error(
      `Falta el binario o el modelo de whisper.cpp.\n` +
        `Esperados:\n  - ${check.binaryPath}\n  - ${check.modelPath}\n` +
        `Ver README para descargarlos.`
    );
  }

  const wavPath = writeWavFile(pcm, sampleRate, channels);
  const startedAt = Date.now();

  try {
    const args = [
      '-m', check.modelPath,
      '-f', wavPath,
      '-l', opts.language || 'auto',
      '-otxt',
      '-nt', // no timestamps in the txt output
      '-t', String(opts.threads ?? Math.max(2, Math.floor(os.cpus().length / 2))),
    ];

    const text = await runWhisper(check.binaryPath, args, wavPath);
    const durationMs = Date.now() - startedAt;
    return {
      text: text.trim(),
      language: opts.language === 'auto' ? null : opts.language,
      durationMs,
    };
  } finally {
    try { fs.unlinkSync(wavPath); } catch {}
    const txt = `${wavPath}.txt`;
    try { fs.unlinkSync(txt); } catch {}
  }
}

function runWhisper(bin: string, args: string[], wavPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`whisper-cli exited ${code}: ${stderr.slice(-500)}`));
        return;
      }
      const txtPath = `${wavPath}.txt`;
      try {
        const text = fs.readFileSync(txtPath, 'utf8');
        resolve(text);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });
}
