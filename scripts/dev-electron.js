#!/usr/bin/env node
// Waits for Vite to publish the dev port (.bisbi-dev-port at repo root),
// confirms the port is reachable, then compiles + launches Electron with
// BISBI_FRONTEND_PORT pointing at whatever port Vite actually picked.

const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PORT_FILE = path.join(REPO_ROOT, '.bisbi-dev-port');
const POLL_MS = 200;
const TIMEOUT_MS = 60_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPortReachable(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ host: 'localhost', port });
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      try { sock.destroy(); } catch {}
      resolve(ok);
    };
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
    sock.setTimeout(1000, () => done(false));
  });
}

async function waitForVitePort() {
  const start = Date.now();
  let lastPort = null;
  while (Date.now() - start < TIMEOUT_MS) {
    if (fs.existsSync(PORT_FILE)) {
      const raw = fs.readFileSync(PORT_FILE, 'utf8').trim();
      const port = Number(raw);
      if (Number.isFinite(port) && port > 0) {
        lastPort = port;
        if (await checkPortReachable(port)) return port;
      }
    }
    await sleep(POLL_MS);
  }
  throw new Error(
    `Timed out waiting for Vite dev server. Last port seen: ${lastPort ?? 'none'}`
  );
}

function runTsc() {
  return new Promise((resolve, reject) => {
    const tscPath = require.resolve('typescript/bin/tsc');
    const child = spawn(process.execPath, [tscPath, '-p', 'electron/tsconfig.json'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tsc exited with code ${code}`));
    });
  });
}

function runElectron(port) {
  const electronBin = require('electron');
  const child = spawn(electronBin, ['electron/dist/main.js'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env, BISBI_FRONTEND_PORT: String(port) },
  });
  child.once('exit', (code) => process.exit(code ?? 0));
  const forward = (sig) => () => { try { child.kill(sig); } catch {} };
  process.on('SIGINT', forward('SIGINT'));
  process.on('SIGTERM', forward('SIGTERM'));
}

(async () => {
  try {
    const port = await waitForVitePort();
    console.log(`[dev-electron] Vite reachable on port ${port}`);
    await runTsc();
    runElectron(port);
  } catch (err) {
    console.error('[dev-electron]', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
