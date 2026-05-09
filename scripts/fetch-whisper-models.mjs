#!/usr/bin/env node
// Descarga los modelos whisper bundleados en resources/whisper/ si no están
// presentes. Se corre antes del build para no commitear binarios pesados.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const destDir = path.join(projectRoot, 'resources', 'whisper');

// El nombre de archivo de destino (bsb-XXX.dat) lo decide buildConfig.ts; la
// URL apunta al ggml original en Hugging Face. Si cambia el modelo, hay que
// actualizar tanto la URL como el size esperado.
const MODELS = [
  {
    file: 'bsb-001.dat',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
    expectedSize: 60_409_487, // ~57 MB
  },
  {
    file: 'bsb-002.dat',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin',
    expectedSize: 574_041_195, // ~547 MB
  },
];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function download(model) {
  const dest = path.join(destDir, model.file);
  if (fs.existsSync(dest)) {
    const size = (await fsp.stat(dest)).size;
    // Tolerancia de 1MB por si la versión del modelo cambia ligeramente; si
    // el tamaño es totalmente distinto re-descargamos.
    if (Math.abs(size - model.expectedSize) < 1_000_000) {
      console.log(`[models] ${model.file}: ya presente (${formatBytes(size)})`);
      return;
    }
    console.log(
      `[models] ${model.file}: tamaño inesperado (${formatBytes(size)} vs ${formatBytes(model.expectedSize)}), re-descargando`
    );
  }

  console.log(`[models] ${model.file}: descargando desde ${model.url}`);
  const res = await fetch(model.url);
  if (!res.ok || !res.body) {
    throw new Error(`fetch ${model.url} → ${res.status} ${res.statusText}`);
  }

  const total = Number(res.headers.get('content-length')) || model.expectedSize;
  const tmp = `${dest}.part`;
  const out = fs.createWriteStream(tmp);
  let received = 0;
  let lastLog = 0;
  for await (const chunk of res.body) {
    out.write(chunk);
    received += chunk.length;
    const now = Date.now();
    if (now - lastLog > 500) {
      const pct = total ? ((received / total) * 100).toFixed(1) : '?';
      process.stdout.write(
        `\r[models] ${model.file}: ${formatBytes(received)} / ${formatBytes(total)} (${pct}%)`
      );
      lastLog = now;
    }
  }
  out.end();
  await new Promise((resolve, reject) => {
    out.on('finish', resolve);
    out.on('error', reject);
  });
  process.stdout.write('\n');
  await fsp.rename(tmp, dest);
  console.log(`[models] ${model.file}: listo (${formatBytes(received)})`);
}

async function main() {
  await fsp.mkdir(destDir, { recursive: true });
  for (const model of MODELS) {
    await download(model);
  }
}

main().catch((err) => {
  console.error('[models] error:', err.message || err);
  process.exit(1);
});
