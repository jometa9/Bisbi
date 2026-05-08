import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';

const PORT_FILE = path.resolve(__dirname, '.bisbi-dev-port');

function silentObfuscate(code: string, options: Parameters<typeof JavaScriptObfuscator.obfuscate>[1]): string {
  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  try {
    return JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();
  } finally {
    console.log = origLog;
    console.info = origInfo;
    console.warn = origWarn;
  }
}

function obfuscateBuildPlugin(): PluginOption {
  return {
    name: 'bisbi-obfuscate',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type !== 'chunk') continue;
        if (!fileName.endsWith('.js')) continue;
        chunk.code = silentObfuscate(chunk.code, {
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: false,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          renameGlobals: false,
          selfDefending: false,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          stringArray: true,
          stringArrayCallsTransform: true,
          stringArrayCallsTransformThreshold: 0.5,
          stringArrayEncoding: ['base64'],
          stringArrayIndexShift: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayThreshold: 0.6,
          stringArrayWrappersCount: 1,
          stringArrayWrappersType: 'variable',
          target: 'browser',
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
        });
      }
    },
  };
}

function writeDevPortPlugin(): PluginOption {
  const cleanup = () => {
    try { fs.unlinkSync(PORT_FILE); } catch {}
  };
  return {
    name: 'bisbi-write-dev-port',
    apply: 'serve',
    configureServer(server) {
      // Delete any stale port file from a previous crashed/killed run
      // so dev-electron.js never reads a leftover port before Vite writes the new one.
      try { fs.unlinkSync(PORT_FILE); } catch {}

      const writePort = () => {
        const address = server.httpServer?.address();
        if (address && typeof address === 'object' && typeof address.port === 'number') {
          try {
            fs.writeFileSync(PORT_FILE, String(address.port), 'utf8');
          } catch {}
        }
      };
      server.httpServer?.once('listening', writePort);
      process.once('exit', cleanup);
      process.once('SIGINT', () => { cleanup(); process.exit(0); });
      process.once('SIGTERM', () => { cleanup(); process.exit(0); });
    },
  };
}

export default defineConfig({
  plugins: [react(), writeDevPortPlugin(), obfuscateBuildPlugin()],
  base: './',
  server: {
    port: 7775,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
