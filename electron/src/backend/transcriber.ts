import { app } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { BUILD_CONFIG, WHISPER_MODELS } from '../buildConfig';
import type { Precision } from './types';

export interface TranscribeOptions {
  language: string; // 'auto' or ISO code (e.g. 'es', 'en')
  precision: Precision;
  threads?: number;
  suppressNonSpeech?: boolean;
  vocabulary?: string;
}

export interface TranscribeOutput {
  text: string;
  language: string | null;
  durationMs: number;
  audioDurationMs: number;
  modelFile: string;
}

export function modelFileForPrecision(precision: Precision): string {
  return WHISPER_MODELS[precision] ?? WHISPER_MODELS[BUILD_CONFIG.DEFAULT_PRECISION];
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

export function whisperModelPath(precision: Precision = BUILD_CONFIG.DEFAULT_PRECISION): string {
  return path.join(resourceRoot(), modelFileForPrecision(precision));
}

export interface ResourceCheck {
  ok: boolean;
  binaryPath: string;
  modelPath: string;
  missing: string[];
}

export function checkResources(precision: Precision = BUILD_CONFIG.DEFAULT_PRECISION): ResourceCheck {
  const binaryPath = whisperBinaryPath();
  const modelPath = whisperModelPath(precision);
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

const LANGUAGE_PROMPTS: Record<string, string> = {
  es: 'Buenos días. Esta es una transcripción en español con puntuación correcta y mayúsculas apropiadas.',
  en: 'Hello. This is a transcription with correct punctuation and proper capitalization.',
  pt: 'Bom dia. Esta é uma transcrição com pontuação correta e maiúsculas adequadas.',
  fr: 'Bonjour. Ceci est une transcription avec une ponctuation correcte et des majuscules appropriées.',
  it: 'Buongiorno. Questa è una trascrizione con punteggiatura corretta e maiuscole appropriate.',
  de: 'Guten Tag. Dies ist eine Transkription mit korrekter Zeichensetzung.',
  zh: '你好。这是一段具有正确标点符号的转录。',
  hi: 'नमस्ते। यह सही विराम चिह्न के साथ एक प्रतिलेख है।',
  ar: 'مرحبا. هذا نص مكتوب بعلامات ترقيم صحيحة.',
};

function defaultPrompt(language: string): string {
  return LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS['en'];
}

export async function transcribePcm(
  pcm: Buffer,
  sampleRate: number,
  channels: number,
  opts: TranscribeOptions
): Promise<TranscribeOutput> {
  const check = checkResources(opts.precision);
  if (!check.ok) {
    throw new Error(
      `Falta el binario o el modelo de whisper.cpp.\n` +
        `Esperados:\n  - ${check.binaryPath}\n  - ${check.modelPath}\n` +
        `Ver README para descargarlos.`
    );
  }

  const wavPath = writeWavFile(pcm, sampleRate, channels);
  const startedAt = Date.now();
  // 16-bit PCM ⇒ 2 bytes per sample per channel. This is the *spoken* duration
  // of the clip, distinct from durationMs below which times the whisper run.
  const bytesPerFrame = 2 * Math.max(1, channels);
  const audioDurationMs = Math.round((pcm.length / (sampleRate * bytesPerFrame)) * 1000);

  try {
    const args = [
      '-m', check.modelPath,
      '-f', wavPath,
      '-l', opts.language || 'auto',
      '-otxt',
      '-nt', // no timestamps in the txt output
      '-t', String(opts.threads ?? Math.max(2, Math.floor(os.cpus().length / 2))),
    ];
    args.push('--temperature', '0.0');
    args.push('--no-speech-thold', '0.4');
    if (opts.suppressNonSpeech) {
      args.push('--suppress-nst');
    }
    const prompt = opts.vocabulary?.trim() || defaultPrompt(opts.language);
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
      modelFile: modelFileForPrecision(opts.precision),
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
      // whisper-cli skips writing the .txt file when no speech is detected
      // (e.g. the user tapped the hotkey without speaking). Treat that as
      // an empty transcript instead of crashing.
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
