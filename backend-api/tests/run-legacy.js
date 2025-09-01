#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsRoot = __dirname;
const series = [
  '1_database/1.1_connection-test.js',
  '1_database/1.2_structure-test.js',
  '2_auth/2.1_registration-complete-test.js',
  '2_auth/2.1_registration-test-simple.js',
  '2_auth/2.1_registration-test.js',
  '2_auth/2.2_login-test.js',
  '2_auth/2.3_jwt-verification-test.js',
  '2_auth/2.4_unauthorized-access-test.js',
  '2_auth/2.5_public-vs-protected-test.js',
  '2_auth/2.6_profile-endpoints-test.js',
  '2_auth/2.7_upload-avatar-endpoint-test.js',
  '3_fails/3.0_upload-image-endpoint-test.js',
  '3_fails/3.1_fail-creation-test.js',
  '3_fails/3.2_fail-retrieval-test.js',
  '3_fails/3.3_comments-basic-test.js',
  '3_fails/3.4_comments-like-report-test.js',
  '4_integration/4.1_complete-integration-test.js'
];

const TIMEOUT_MS = Number(process.env.LEGACY_TEST_TIMEOUT || 60000);

function runOne(file) {
  return new Promise((resolve) => {
    const full = path.join(testsRoot, file);
    if (!fs.existsSync(full)) return resolve({ file, skipped: true, code: 0, reason: 'missing' });
    console.log(`\n▶ ${file}`);
    const child = spawn(process.execPath, [full], {
      cwd: testsRoot,
      stdio: ['ignore', 'inherit', 'inherit']
    });
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      console.error(`⏰ Timeout ${TIMEOUT_MS}ms on ${file}, killing...`);
      try { child.kill('SIGKILL'); } catch {}
      done = true;
      resolve({ file, code: 124, timeout: true });
    }, TIMEOUT_MS);
    child.on('exit', (code) => {
      if (done) return;
      clearTimeout(t);
      done = true;
      if (code === 0) console.log(`✅ ${file}`); else console.error(`❌ ${file} (code ${code})`);
      resolve({ file, code });
    });
  });
}

(async () => {
  const results = [];
  for (const f of series) {
    // skip files not present
    const full = path.join(testsRoot, f);
    if (!fs.existsSync(full)) continue;
    // eslint-disable-next-line no-await-in-loop
    const r = await runOne(f);
    results.push(r);
    if (r.code !== 0) {
      console.error(`\n⛔ Tests interrompus à ${f}.`);
      break;
    }
  }
  const failed = results.filter(r => r.code !== 0);
  if (failed.length) {
    console.error('\nRésumé:');
    results.forEach(r => console.log(` - ${r.code === 0 ? 'OK' : 'KO'} ${r.file}`));
    process.exit(1);
  } else {
    console.log('\nRésumé:');
    results.forEach(r => console.log(` - OK ${r.file}`));
    process.exit(0);
  }
})();

