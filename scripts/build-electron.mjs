#!/usr/bin/env node
import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'electron', 'src');
const outDir = path.join(projectRoot, 'electron', 'dist');

const ENTRY_POINTS = [
  { in: 'main.ts', out: 'main.js', obfuscate: true },
  { in: 'preload.ts', out: 'preload.js', obfuscate: true },
  { in: 'afterPack.ts', out: 'afterPack.js', obfuscate: false },
];

const NATIVE_OR_RUNTIME_EXTERNAL = [
  'electron',
  'electron-updater',
  'better-sqlite3',
  'uiohook-napi',
  'rcedit',
];

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.6,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  target: 'node',
};

async function bundleEntry(entry) {
  const outFile = path.join(outDir, entry.out);
  await build({
    entryPoints: [path.join(srcDir, entry.in)],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    sourcemap: false,
    minify: false, // obfuscator does the minify-equivalent work
    legalComments: 'none',
    keepNames: false,
    treeShaking: true,
    external: NATIVE_OR_RUNTIME_EXTERNAL,
    logLevel: 'warning',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
  return outFile;
}

function runObfuscatorSilently(code) {
  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  try {
    return JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS).getObfuscatedCode();
  } finally {
    console.log = origLog;
    console.info = origInfo;
    console.warn = origWarn;
  }
}

async function obfuscateFile(file) {
  const code = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, runObfuscatorSilently(code), 'utf8');
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const start = Date.now();
  for (const entry of ENTRY_POINTS) {
    const outFile = await bundleEntry(entry);
    const sizeBundle = (await fs.stat(outFile)).size;
    if (entry.obfuscate) {
      await obfuscateFile(outFile);
      const sizeOb = (await fs.stat(outFile)).size;
      console.log(
        `[build] ${entry.out}: bundled ${(sizeBundle / 1024).toFixed(1)}KB → obfuscated ${(sizeOb / 1024).toFixed(1)}KB`
      );
    } else {
      console.log(`[build] ${entry.out}: bundled ${(sizeBundle / 1024).toFixed(1)}KB (not obfuscated)`);
    }
  }
  console.log(`[build] electron build complete in ${Date.now() - start}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
