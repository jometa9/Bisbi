import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const PORT_FILE = path.resolve(__dirname, '.bisbi-dev-port');

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
  plugins: [react(), writeDevPortPlugin()],
  base: './',
  server: {
    port: 7775,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
