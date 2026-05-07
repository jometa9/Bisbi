#!/usr/bin/env node
// Local release script. Two modes:
//   node scripts/release.mjs patch|minor|major   → bump version, tag, build, create release
//   node scripts/release.mjs add                 → build current platform, upload to existing release
//
// No tokens in the repo. Uses `gh` CLI (Keychain-stored creds).
// Builds only for the host OS — run on each platform you want to ship.

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = join(ROOT, 'package.json');
const RELEASE_DIR = join(ROOT, 'release');
const RELEASES_REPO = 'jometa9/bisbi-releases';

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
if (!auth.ok || !auth.stderr.includes('Logged in')) log.fail('gh not authenticated. Run: gh auth login');
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
