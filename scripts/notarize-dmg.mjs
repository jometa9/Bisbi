#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dmg = path.resolve('release/Bisbi-Setup.dmg');
if (!fs.existsSync(dmg)) {
  console.error(`[notarize-dmg] file not found: ${dmg}`);
  process.exit(1);
}

const { APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER } = process.env;
if (!APPLE_API_KEY || !APPLE_API_KEY_ID || !APPLE_API_ISSUER) {
  console.error(
    '[notarize-dmg] missing APPLE_API_KEY / APPLE_API_KEY_ID / APPLE_API_ISSUER env vars (export them in ~/.zshrc)'
  );
  process.exit(1);
}

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });

console.log(`[notarize-dmg] submitting ${path.basename(dmg)} to Apple notary service...`);
sh(
  `xcrun notarytool submit "${dmg}" --key "${APPLE_API_KEY}" --key-id ${APPLE_API_KEY_ID} --issuer ${APPLE_API_ISSUER} --wait`
);

console.log('[notarize-dmg] stapling notarization ticket to DMG...');
sh(`xcrun stapler staple "${dmg}"`);

console.log('[notarize-dmg] validating staple...');
sh(`xcrun stapler validate "${dmg}"`);

console.log('[notarize-dmg] done.');
