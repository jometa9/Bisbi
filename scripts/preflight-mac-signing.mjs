#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const errors = [];

const required = ['APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER', 'APPLE_TEAM_ID'];
for (const name of required) {
  if (!process.env[name]) errors.push(`missing env var ${name} (export it in ~/.zshrc)`);
}

if (process.env.APPLE_API_KEY) {
  const p8 = process.env.APPLE_API_KEY;
  if (!fs.existsSync(p8)) errors.push(`APPLE_API_KEY file not found at: ${p8}`);
}

try {
  const out = execSync('security find-identity -v -p codesigning', { encoding: 'utf8' });
  if (!/Developer ID Application/.test(out)) {
    errors.push('no "Developer ID Application" certificate found in the login keychain (import BisbiDeveloperID.p12)');
  }
} catch (err) {
  errors.push(`failed to query keychain: ${err.message}`);
}

if (errors.length > 0) {
  console.error('[preflight-mac-signing] Apple signing is not configured:');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nRefuse to package an unsigned/unnotarized build. Fix the above and retry.');
  process.exit(1);
}

console.log('[preflight-mac-signing] OK — signing identity present, notary credentials set.');
