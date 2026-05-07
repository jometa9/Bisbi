#!/usr/bin/env node
// Local release script. Two modes:
//   node scripts/release.mjs patch|minor|major   → sync models, bump version, build host OS, tag, push, create release
//   node scripts/release.mjs add                 → build current platform, upload to existing release
//
// On bump mode the pushed tag triggers `.github/workflows/release.yml`, which
// builds Linux + Windows in CI and uploads them to the same release.
//
// No tokens in the repo. Uses `gh` CLI (Keychain-stored creds).

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = join(ROOT, 'package.json');
const RELEASE_DIR = join(ROOT, 'release');
const RELEASES_REPO = 'jometa9/bisbi-releases';
const MODELS_REPO = 'jometa9/Bisbi';
const MODELS_RELEASE = 'whisper-models';
const MODELS_DIR = join(ROOT, 'resources/whisper');

const COLOR = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', reset: '\x1b[0m' };
const log = {
  step: (m) => console.log(`\n${COLOR.cyan}${COLOR.bold}▸ ${m}${COLOR.reset}`),
  ok: (m) => console.log(`${COLOR.green}✓${COLOR.reset} ${m}`),
  warn: (m) => console.log(`${COLOR.yellow}⚠ ${m}${COLOR.reset}`),
  fail: (m) => { console.error(`${COLOR.red}✗ ${m}${COLOR.reset}`); process.exit(1); },
};

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', cwd: ROOT, encoding: 'utf8', ...opts });
}
function tryRun(cmd) {
  const r = spawnSync(cmd, { shell: true, cwd: ROOT, encoding: 'utf8' });
  return { ok: r.status === 0, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

const MODE = process.argv[2];
const VALID_BUMPS = ['patch', 'minor', 'major'];
if (!MODE || (MODE !== 'add' && !VALID_BUMPS.includes(MODE))) {
  log.fail(`Usage: node scripts/release.mjs <patch|minor|major|add>`);
}

// ───────── Pre-flight checks (both modes) ─────────

log.step('Pre-flight checks');

if (!tryRun('gh --version').ok) log.fail('gh CLI not found. Install: brew install gh');
const auth = tryRun('gh auth status');
if (!auth.ok || !`${auth.stdout}\n${auth.stderr}`.includes('Logged in')) log.fail('gh not authenticated. Run: gh auth login');
log.ok('gh CLI authenticated');

const branch = run('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
if (MODE !== 'add' && branch !== 'main') log.fail(`Must be on 'main' to bump. Current branch: ${branch}`);
log.ok(`Branch: ${branch}`);

const dirty = run('git status --porcelain', { silent: true }).trim();
if (dirty) log.fail(`Working tree not clean:\n${dirty}`);
log.ok('Working tree clean');

log.step('Type-checking');
run('npm run typecheck');
log.ok('Type-check passed');

// ───────── Sync whisper models to private release ─────────

if (MODE !== 'add') {
  syncModels();
}

function syncModels() {
  log.step(`Syncing whisper models to ${MODELS_REPO} (${MODELS_RELEASE})`);

  if (!existsSync(MODELS_DIR)) log.fail(`Models dir not found: ${MODELS_DIR}`);
  const localFiles = readdirSync(MODELS_DIR)
    .filter((f) => f.endsWith('.dat'))
    .map((f) => {
      const path = join(MODELS_DIR, f);
      const size = statSync(path).size;
      const sha256 = createHash('sha256').update(readFileSync(path)).digest('hex');
      return { name: f, path, size, sha256 };
    });

  if (!localFiles.length) log.fail(`No .dat models found in ${MODELS_DIR}`);
  console.log(`    Local: ${localFiles.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(', ')}`);

  const view = tryRun(`gh release view ${MODELS_RELEASE} --repo ${MODELS_REPO} --json assets`);

  if (!view.ok) {
    log.warn(`Release "${MODELS_RELEASE}" does not exist — creating it`);
    const fileArgs = localFiles.map((f) => `"${f.path}"`).join(' ');
    run(
      `gh release create ${MODELS_RELEASE} --repo ${MODELS_REPO} --title "Whisper models" --notes "Internal — synced by release.mjs" --prerelease ${fileArgs}`,
    );
    log.ok(`Created ${MODELS_RELEASE} with ${localFiles.length} model(s)`);
    return;
  }

  const remoteAssets = (JSON.parse(view.stdout).assets || []);
  const remoteByName = Object.fromEntries(remoteAssets.map((a) => [a.name, a]));
  const toUpload = [];

  for (const f of localFiles) {
    const remote = remoteByName[f.name];
    if (!remote) {
      toUpload.push({ ...f, reason: 'missing on remote' });
      continue;
    }
    const remoteSha = (remote.digest || '').replace(/^sha256:/, '');
    if (remoteSha && remoteSha !== f.sha256) {
      toUpload.push({ ...f, reason: 'sha256 mismatch' });
    } else if (!remoteSha && remote.size !== f.size) {
      toUpload.push({ ...f, reason: 'size mismatch' });
    }
  }

  if (!toUpload.length) {
    log.ok(`All ${localFiles.length} model(s) already in sync`);
    return;
  }

  log.step(`Uploading ${toUpload.length} model(s) (this can take a while)`);
  for (const f of toUpload) console.log(`    ${f.name} — ${f.reason}`);
  const fileArgs = toUpload.map((f) => `"${f.path}"`).join(' ');
  run(`gh release upload ${MODELS_RELEASE} --repo ${MODELS_REPO} --clobber ${fileArgs}`);
  log.ok('Models synced');
}

// ───────── Determine version ─────────

let pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
let version = pkg.version;

if (MODE !== 'add') {
  log.step(`Bumping version (${MODE})`);
  // --no-git-tag-version: we tag manually after the build succeeds, so a failed
  // build doesn't leave a dangling tag.
  run(`npm version ${MODE} --no-git-tag-version`);
  pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
  version = pkg.version;
  log.ok(`New version: ${version}`);
} else {
  log.ok(`Using existing version: ${version}`);
  const releaseExists = tryRun(`gh release view v${version} --repo ${RELEASES_REPO}`).ok;
  if (!releaseExists) log.fail(`Release v${version} does not exist in ${RELEASES_REPO}. Run a bump first.`);
}

const tag = `v${version}`;

// ───────── Build for current platform ─────────

const PLATFORM = process.platform; // 'darwin' | 'win32'
const ARCH = process.arch; // 'arm64' | 'x64'
const BUILDER_FLAG = { darwin: '--mac', win32: '--win' }[PLATFORM];
if (!BUILDER_FLAG) log.fail(`Unsupported platform: ${PLATFORM}. Only macOS and Windows are supported.`);

log.step(`Building for ${PLATFORM}/${ARCH}`);
run(`npm run build`);
run(`npx electron-builder ${BUILDER_FLAG} --${ARCH}`);
log.ok('Build finished');

// ───────── Collect artifacts ─────────

if (!existsSync(RELEASE_DIR)) log.fail(`Release dir not found: ${RELEASE_DIR}`);

// electron-updater needs the YML metadata files alongside the installers.
// Anything not in this set (e.g. unpacked dirs, .DS_Store) is skipped.
const KEEP_EXT = /\.(dmg|zip|exe|yml|blockmap)$/i;
const PLATFORM_YML = { darwin: 'latest-mac.yml', win32: 'latest.yml' }[PLATFORM];

const allFiles = readdirSync(RELEASE_DIR);
const artifacts = allFiles
  .filter((f) => KEEP_EXT.test(f))
  .filter((f) => f.includes(version) || f === PLATFORM_YML)
  .map((f) => join(RELEASE_DIR, f));

if (!artifacts.length) log.fail('No artifacts found in release/');
if (!artifacts.some((f) => f.endsWith(PLATFORM_YML))) {
  log.fail(`Missing ${PLATFORM_YML} — auto-update will not work without it. Check electron-builder publish config.`);
}

log.ok(`Artifacts (${artifacts.length}):`);
for (const f of artifacts) console.log(`    ${f.replace(ROOT + '/', '')}`);

// ───────── Commit + tag + push (bump mode only) ─────────

if (MODE !== 'add') {
  log.step('Committing version bump');
  run(`git add package.json package-lock.json 2>/dev/null || git add package.json`);
  run(`git commit -m "chore: release ${tag}"`);
  run(`git tag ${tag}`);
  run(`git push origin main --follow-tags`);
  log.ok(`Pushed ${tag} to origin/main`);
}

// ───────── Create or update GitHub release ─────────

const fileArgs = artifacts.map((f) => `"${f}"`).join(' ');

if (MODE !== 'add') {
  log.step(`Creating release ${tag} in ${RELEASES_REPO}`);
  run(`gh release create ${tag} --repo ${RELEASES_REPO} --title "${tag}" --generate-notes ${fileArgs}`);
  log.ok(`Release ${tag} created`);
} else {
  log.step(`Uploading artifacts to existing release ${tag}`);
  run(`gh release upload ${tag} --repo ${RELEASES_REPO} --clobber ${fileArgs}`);
  log.ok(`Artifacts uploaded to ${tag}`);
}

// ───────── Summary ─────────

const url = `https://github.com/${RELEASES_REPO}/releases/tag/${tag}`;
console.log(`\n${COLOR.green}${COLOR.bold}✓ Done${COLOR.reset}`);
console.log(`  Release: ${url}`);
console.log(`  Platform shipped: ${PLATFORM}`);
if (MODE !== 'add') {
  console.log(`\n${COLOR.yellow}Next:${COLOR.reset} to ship other platforms, run on each machine:`);
  console.log(`  ${COLOR.bold}node scripts/release.mjs add${COLOR.reset}`);
}
