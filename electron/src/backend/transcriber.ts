import { app } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { BUILD_CONFIG } from '../buildConfig';

let activeWhisper: ChildProcess | null = null;

export function cancelActiveTranscription(): boolean {
  const child = activeWhisper;
  if (!child || child.killed) return false;
  try { child.kill('SIGKILL'); } catch {}
  return true;
}

export interface TranscribeOptions {
  language: string;
  threads?: number;
  vocabulary?: string;
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
  channels: number,
  opts: TranscribeOptions
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
      '-l', opts.language || 'auto',
      '-otxt',
      '-nt',
      '-t', String(opts.threads ?? Math.max(2, Math.floor(os.cpus().length / 2))),
      '--temperature', '0.0',
      '--no-speech-thold', '0.6',
      '--suppress-nst',
      '-fa',
    ];
    const prompt = opts.vocabulary?.trim();
    if (prompt) {
      args.push('--prompt', prompt);
    }

    const text = await runWhisper(check.binaryPath, args, wavPath);
    const durationMs = Date.now() - startedAt;
    return {
      text: text.trim(),
      language: opts.language === 'auto' ? null : opts.language,
      durationMs,
      audioDurationMs,
      modelFile: BUILD_CONFIG.WHISPER_MODEL_FILE,
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
