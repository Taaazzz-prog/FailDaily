#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend-api');
const frontendDir = path.join(rootDir, 'frontend');
const artifactsDir = path.join(rootDir, '.test-artifacts');
const reportPath = path.join(rootDir, 'FULL_TEST_REPORT.md');

function log(msg) { console.log(msg); }
function runStep(title, cmd, args = [], opts = {}) {
  log(`\n==> ${title}`);
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd || rootDir,
    encoding: 'utf-8',
    shell: true,
    env: { ...process.env, ...(opts.env || {}) }
  });
  const code = result.status ?? result.signal ?? 1;
  const ok = code === 0;
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch {}
  fs.writeFileSync(path.join(artifactsDir, `${safeTitle}.out.log`), result.stdout || '');
  fs.writeFileSync(path.join(artifactsDir, `${safeTitle}.err.log`), result.stderr || '');
  log(ok ? `✔ ${title} OK` : `✘ ${title} FAILED (code ${code})`);
  return { ok, code, title, stdout: result.stdout, stderr: result.stderr, cmd: [cmd, ...args].join(' ') };
}

function generateReport(steps, preflight) {
  const lines = [];
  const ts = new Date().toISOString();
  lines.push(`# Rapport de tests complet - FailDaily`);
  lines.push(`Date: ${ts}`);
  lines.push('');
  // Preflight section
  if (preflight) {
    lines.push('## Préflight (environnement)');
    lines.push('- OS: ' + [preflight.os.platform, preflight.os.release, preflight.os.arch].join(' '));
    lines.push('- CPU: ' + preflight.os.cpus + ' cores, RAM: ' + preflight.os.totalmemGb + ' GB');
    lines.push('- Node: ' + preflight.node.version + (preflight.node.npm ? (', npm: ' + preflight.node.npm) : ''));
    if (preflight.git) {
      lines.push('- Git HEAD: ' + (preflight.git.head || 'n/a'));
      if (preflight.git.dirty) lines.push('- Git dirty: ' + preflight.git.dirty);
    }
    lines.push('- Workspace: ' + preflight.workspace.root);
    lines.push('- Backend: ' + preflight.workspace.backend);
    lines.push('- Frontend: ' + preflight.workspace.frontend);
    lines.push('- DB: host=' + preflight.db.host + ', port=' + preflight.db.port + ', name=' + preflight.db.name + ', user=' + preflight.db.user + ', disabled=' + preflight.db.disabled);
    lines.push('- DB Reachable (TCP): ' + (preflight.db.tcpReachable ? 'oui' : 'non'));
    if (preflight.mysqlClient) {
      lines.push('- MySQL Client: ' + (preflight.mysqlClient.found ? 'oui' : 'non') + (preflight.mysqlClient.version ? (' (' + preflight.mysqlClient.version + ')') : ''));
      if (preflight.mysqlClient.binDir) lines.push('- MySQL Client bin: ' + preflight.mysqlClient.binDir);
    }
    if (preflight.chrome) {
      lines.push('- Chrome/Chromium présent: ' + (preflight.chrome.detected ? 'oui' : 'non'));
      if (preflight.chrome.path) lines.push('- Chrome path: ' + preflight.chrome.path);
      if (preflight.chrome.version) lines.push('- Chrome version: ' + preflight.chrome.version);
    }
    if (preflight.tools) {
      if (preflight.tools.jest) lines.push('- Jest: ' + preflight.tools.jest);
      if (preflight.tools.angular) lines.push('- Angular CLI: ' + preflight.tools.angular);
    }
    lines.push('');
  }
  const overallOk = steps.every(s => s.ok);
  lines.push(`Statut global: ${overallOk ? '✅ SUCCÈS' : '❌ ÉCHECS DÉTECTÉS'}`);
  lines.push('');
  lines.push('## Résumé par étape');
  steps.forEach(s => {
    lines.push(`- ${s.ok ? '✅' : '❌'} ${s.title}`);
  });
  lines.push('');
  lines.push('## Détails');
  steps.forEach(s => {
    lines.push(`### ${s.title}`);
    lines.push(`Commande:`);
    lines.push('');
    lines.push('    ' + s.cmd);
    lines.push('');
    lines.push(`Statut: ${s.ok ? 'OK' : 'FAILED'} (code ${s.code})`);
    const outFile = path.join('.test-artifacts', `${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.out.log`);
    const errFile = path.join('.test-artifacts', `${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.err.log`);
    lines.push(`Logs: ${outFile}, ${errFile}`);
    lines.push('');
  });
  fs.writeFileSync(reportPath, lines.join('\n'));
  return overallOk;
}

try {
  require('dotenv').config({ path: path.join(backendDir, '.env') });
} catch {}

(function polyfills(){
  if (!fs.existsSync(artifactsDir)) try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch {}
})();

function cmdOk(cmd, args=[]) {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });
  return (r.status ?? 1) === 0;
}

function detectChromePath() {
  const candidates = [];
  const plat = process.platform;
  if (plat === 'win32') {
    candidates.push('"%ProgramFiles%/Google/Chrome/Application/chrome.exe"');
    candidates.push('"%ProgramFiles(x86)%/Google/Chrome/Application/chrome.exe"');
    candidates.push('chrome');
  } else if (plat === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
    candidates.push('google-chrome');
    candidates.push('chromium');
  } else {
    candidates.push('google-chrome-stable');
    candidates.push('google-chrome');
    candidates.push('chromium-browser');
    candidates.push('chromium');
  }
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf-8', shell: true });
    if ((r.status ?? 1) === 0) return c;
  }
  return null;
}

function findPlaywrightChromium() {
  // search in node_modules cache
  const base = path.join(rootDir, 'node_modules');
  const cacheDir = path.join(base, '.cache');
  function walk(dir) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const it of items) {
        const p = path.join(dir, it.name);
        if (it.isDirectory()) {
          const maybe = walk(p);
          if (maybe) return maybe;
        } else {
          const nm = it.name.toLowerCase();
          if (nm === 'chrome' || nm === 'chrome.exe' || nm === 'chromium' || nm === 'chromium.exe') {
            return p;
          }
        }
      }
    } catch {}
    return null;
  }
  const found = walk(cacheDir);
  return found;
}

function ensureChrome() {
  let chrome = detectChromePath();
  if (chrome) return { ok: true, chromeBin: chrome, installed: false };
  const plat = process.platform;
  // Try system installer
  if (plat === 'linux') {
    runStep('Install Chrome/Chromium (apt-get)', 'bash', ['-lc', 'sudo apt-get update && (sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium || true)']);
  } else if (plat === 'darwin') {
    runStep('Install Google Chrome (brew)', 'bash', ['-lc', 'which brew && (brew install --cask google-chrome || true) || true']);
  } else if (plat === 'win32') {
    runStep('Install Google Chrome (choco)', 'powershell', ['-NoProfile -Command', 'choco install googlechrome -y'], { cwd: rootDir });
  }
  chrome = detectChromePath();
  if (chrome) return { ok: true, chromeBin: chrome, installed: true };

  // Fallback: use Playwright chromium
  const inst = runStep('Install Playwright Chromium (fallback)', 'npx', ['-y', 'playwright@latest', 'install', 'chromium']);
  if (inst.ok) {
    const p = findPlaywrightChromium();
    if (p) return { ok: true, chromeBin: p, installed: true };
  }
  return { ok: false, chromeBin: null, installed: false };
}

(function ensureMonorepoDependencies(){
  // If node_modules not present, try install
  try {
    const nm = path.join(rootDir, 'node_modules');
    if (!fs.existsSync(nm)) {
      runStep('Install dependencies (npm ci)', 'npm', ['ci', '--include=dev']);
    }
  } catch {}
})();

function detectMysqlClient() {
  // Try direct availability
  if (cmdOk('mysql', ['--version'])) return { ok: true, binDir: null };
  // Windows try where
  const plat = process.platform;
  if (plat === 'win32') {
    const w = spawnSync('where', ['mysql'], { encoding: 'utf-8', shell: true });
    if ((w.status ?? 1) === 0 && /mysql\.exe/i.test(w.stdout || '')) return { ok: true, binDir: path.dirname((w.stdout||'').split(/\r?\n/)[0]) };
    // Try common Wamp paths
    const guesses = ['C:/wamp64/bin/mysql', 'D:/wamp64/bin/mysql', 'C:/wamp/bin/mysql', 'D:/wamp/bin/mysql'];
    for (const g of guesses) {
      try {
        const versions = fs.readdirSync(g, { withFileTypes: true }).filter(d => d.isDirectory());
        for (const v of versions) {
          const candidate = path.join(g, v.name, 'bin');
          const exe = path.join(candidate, 'mysql.exe');
          if (fs.existsSync(exe)) return { ok: true, binDir: candidate };
        }
      } catch {}
    }
  }
  return { ok: false, binDir: null };
}

function ensureMysqlClient() {
  let det = detectMysqlClient();
  if (det.ok) return det;
  const plat = process.platform;
  if (plat === 'linux') {
    runStep('Install mysql-client (apt-get)', 'bash', ['-lc', 'sudo apt-get update && sudo apt-get install -y mysql-client || true']);
  } else if (plat === 'darwin') {
    runStep('Install mysql-client (brew)', 'bash', ['-lc', 'which brew && brew install mysql-client || true']);
  } else if (plat === 'win32') {
    runStep('Install mysql-client (choco)', 'powershell', ['-NoProfile -Command', 'choco install mysql -y'], { cwd: rootDir });
  }
  det = detectMysqlClient();
  return det;
}

(async () => {
  const steps = [];
  // Preflight collect
  const preflight = { os: {}, node: {}, git: {}, workspace: {}, db: {}, mysqlClient: {}, chrome: {}, tools: {} };
  preflight.os = {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpus: os.cpus()?.length || 0,
    totalmemGb: Math.round((os.totalmem() / (1024*1024*1024))*10)/10
  };
  preflight.node = {
    version: process.version,
    npm: (spawnSync('npm', ['-v'], { encoding: 'utf-8', shell: true }).stdout || '').trim()
  };
  const gitHead = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf-8', shell: true });
  preflight.git.head = (gitHead.status === 0 ? gitHead.stdout : '').trim();
  const gitDirty = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf-8', shell: true });
  preflight.git.dirty = (gitDirty.status === 0 ? (gitDirty.stdout || '').trim().split(/\r?\n/).filter(Boolean).length : 0);
  preflight.workspace = { root: rootDir, backend: backendDir, frontend: frontendDir };
  preflight.db = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || '3306',
    name: process.env.DB_NAME || 'faildaily',
    user: process.env.DB_USER || 'root',
    disabled: String(process.env.DB_DISABLED || '').toLowerCase()
  };
  // TCP reachability test
  preflight.db.tcpReachable = await new Promise(resolve => {
    try {
      const sock = net.createConnection({ host: preflight.db.host, port: Number(preflight.db.port) }, () => { sock.end(); resolve(true); });
      sock.on('error', () => resolve(false));
      setTimeout(() => { try { sock.destroy(); } catch{} resolve(false); }, 2000);
    } catch { resolve(false); }
  });
  // Detect tools versions
  preflight.tools.jest = (spawnSync('npx', ['-y', 'jest', '--version'], { encoding: 'utf-8', shell: true }).stdout || '').trim();
  preflight.tools.angular = (spawnSync('npx', ['-y', '@angular/cli', 'version', '--no-interactive'], { encoding: 'utf-8', shell: true }).stdout || '').split('\n')[0];
  // Chrome detection (no install here)
  const detectedChrome = detectChromePath();
  preflight.chrome.detected = !!detectedChrome;
  preflight.chrome.path = detectedChrome;
  if (detectedChrome) {
    const v = spawnSync(detectedChrome, ['--version'], { encoding: 'utf-8', shell: true });
    preflight.chrome.version = (v.status === 0 ? (v.stdout || '').trim() : '');
  }
  // MySQL client detection
  const mysqlDetectOnly = (function(){
    const det = { found: false, binDir: null, version: null };
    const w = spawnSync('where', ['mysql'], { encoding: 'utf-8', shell: true });
    if ((w.status ?? 1) === 0) {
      det.found = true;
      const first = (w.stdout||'').split(/\r?\n/)[0];
      det.binDir = first ? path.dirname(first) : null;
    }
    const ver = spawnSync('mysql', ['--version'], { encoding: 'utf-8', shell: true });
    det.version = (ver.status === 0 ? (ver.stdout||'').trim() : '');
    return det;
  })();
  preflight.mysqlClient = mysqlDetectOnly;

  steps.push(runStep('Lint backend', 'npm', ['run', '-w', 'backend-api', 'lint']));
  steps.push(runStep('Lint frontend', 'npm', ['run', '-w', 'frontend', 'lint']));
  steps.push(runStep('Build frontend', 'npm', ['run', '-w', 'frontend', 'build']));

  const mysqlClient = ensureMysqlClient();
  if (mysqlClient.ok) {
    const extraPath = mysqlClient.binDir ? (process.platform === 'win32' ? `${mysqlClient.binDir};${process.env.PATH}` : `${mysqlClient.binDir}:${process.env.PATH}`) : process.env.PATH;
    steps.push(runStep('Import database (faildaily.sql)', 'npm', ['run', '-w', 'backend-api', 'db:import'], {
      env: {
        NODE_ENV: 'test',
        PATH: extraPath,
        DB_DISABLED: 'false',
        DB_HOST: process.env.DB_HOST || '127.0.0.1',
        DB_PORT: process.env.DB_PORT || '3306',
        DB_USER: process.env.DB_USER || 'root',
        DB_PASSWORD: process.env.DB_PASSWORD || '',
        DB_NAME: process.env.DB_NAME || 'faildaily',
      }
    }));
  } else {
    steps.push({ ok: true, code: 0, title: 'Import database (skipped - mysql client not found, DB assumed present)', cmd: 'skip db:import', stdout: '', stderr: '' });
  }

  steps.push(runStep('Backend smoke (/health)', 'npm', ['run', '-w', 'backend-api', 'test:smoke'], {
    env: { NODE_ENV: 'test', DB_DISABLED: 'false', JWT_SECRET: process.env.JWT_SECRET || 'testsecret' }
  }));

  steps.push(runStep('Backend tests (Jest)', 'npm', ['run', '-w', 'backend-api', 'test'], {
    env: { NODE_ENV: 'test', DB_DISABLED: 'false', JWT_SECRET: process.env.JWT_SECRET || 'testsecret' }
  }));

  steps.push(runStep('Backend E2E journey (Jest)', 'npm', ['run', '-w', 'backend-api', 'test:e2e'], {
    env: { NODE_ENV: 'test', DB_DISABLED: 'false', JWT_SECRET: process.env.JWT_SECRET || 'testsecret' }
  }));

  steps.push(runStep('Backend legacy tests (sequential)', 'npm', ['run', '-w', 'backend-api', 'test:legacy'], {
    env: { NODE_ENV: 'test', DB_DISABLED: 'false', JWT_SECRET: process.env.JWT_SECRET || 'testsecret', LEGACY_TEST_TIMEOUT: '90000' }
  }));

  const chromeEnsured = ensureChrome();
  if (!chromeEnsured.ok) {
    steps.push({ ok: false, code: 1, title: 'Ensure Chrome/Chromium', cmd: 'install chrome', stdout: '', stderr: 'Unable to install Chrome/Chromium' });
  }
  const feEnv = { NODE_ENV: 'test', CHROME_BIN: chromeEnsured.chromeBin || process.env.CHROME_BIN || '' };
  steps.push(runStep('Frontend tests (Karma)', 'npm', ['run', '-w', 'frontend', 'test', '--', '--watch=false', '--browsers=ChromeHeadless'], { env: feEnv }));

  const ok = generateReport(steps, preflight);
  log(`\nRapport généré: ${reportPath}`);
  process.exit(ok ? 0 : 1);
})();
