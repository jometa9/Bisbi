#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const releaseDir = path.resolve('release');
if (!fs.existsSync(releaseDir)) {
  console.error(`[notarize-dmg] release directory not found: ${releaseDir}`);
  process.exit(1);
}

const dmgs = fs
  .readdirSync(releaseDir)
  .filter((f) => f.endsWith('.dmg'))
  .map((f) => path.join(releaseDir, f));
if (dmgs.length === 0) {
  console.error(`[notarize-dmg] no .dmg files found in ${releaseDir}`);
  process.exit(1);
}

const { APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER } = process.env;
if (!APPLE_API_KEY || !APPLE_API_KEY_ID || !APPLE_API_ISSUER) {
  console.error(
    '[notarize-dmg] missing APPLE_API_KEY / APPLE_API_KEY_ID / APPLE_API_ISSUER env vars'
  );
  process.exit(1);
}

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });

for (const dmg of dmgs) {
  console.log(`[notarize-dmg] submitting ${path.basename(dmg)} to Apple notary service...`);
  sh(
    `xcrun notarytool submit "${dmg}" --key "${APPLE_API_KEY}" --key-id ${APPLE_API_KEY_ID} --issuer ${APPLE_API_ISSUER} --wait`
  );

  console.log(`[notarize-dmg] stapling notarization ticket to ${path.basename(dmg)}...`);
  sh(`xcrun stapler staple "${dmg}"`);

  console.log(`[notarize-dmg] validating staple for ${path.basename(dmg)}...`);
  sh(`xcrun stapler validate "${dmg}"`);
}

console.log('[notarize-dmg] done.');
