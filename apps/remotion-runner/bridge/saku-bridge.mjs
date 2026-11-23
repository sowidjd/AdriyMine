// Remotion Saku — Jembatan Node.js (jalankan di Termux: node saku-bridge.mjs)
// Menghubungkan aplikasi Remotion Saku dengan Node.js asli di HP:
//  - memasang paket npm apa pun (npm + esbuild sungguhan) agar bisa di-import di kode Remotion,
//  - menjalankan skrip Node.js dari tab Lainnya → Node.js.
// Hanya menerima sambungan dari HP ini sendiri (127.0.0.1) dan wajib memakai kode sambung.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const PORT = Number(process.env.SAKU_PORT || 3737);
const HOME = process.env.SAKU_HOME || path.join(os.homedir(), '.saku-bridge');
const TOOLS = path.join(HOME, 'tools');
const PKGS = path.join(HOME, 'pkgs');
const ESBUILD_VERSION = '0.25.12';
const VERSION = '1.0.0';
fs.mkdirSync(TOOLS, { recursive: true });
fs.mkdirSync(PKGS, { recursive: true });
for (const d of [TOOLS, PKGS]) if (!fs.existsSync(path.join(d, 'package.json'))) fs.writeFileSync(path.join(d, 'package.json'), '{"name":"saku","private":true}');

const tokenFile = path.join(HOME, 'kode-sambung.txt');
const TOKEN = process.env.SAKU_TOKEN || (fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8').trim() : String(crypto.randomInt(100000, 999999)));
fs.writeFileSync(tokenFile, TOKEN);

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (cmd, args, opts = {}) => new Promise((resolve, reject) => {
  execFile(cmd, args, { maxBuffer: 20e6, timeout: 600000, ...opts }, (err, stdout, stderr) => (err ? reject(new Error((stderr || err.message).toString().slice(-800))) : resolve(stdout.toString())));
});
let npmVersion = '?';
run(npmCmd, ['--version']).then((v) => { npmVersion = v.trim(); }).catch(() => {});

let esbuildP = null;
function getEsbuild() {
  if (esbuildP) return esbuildP;
  esbuildP = (async () => {
    const req = createRequire(path.join(TOOLS, 'package.json'));
    try { return req('esbuild'); } catch { /* belum terpasang */ }
    console.log('Memasang esbuild (sekali saja)…');
    await run(npmCmd, ['install', '--prefix', TOOLS, '--no-audit', '--no-fund', '--loglevel=error', `esbuild@${ESBUILD_VERSION}`]);
    return req('esbuild');
  })();
  esbuildP.catch(() => { esbuildP = null; });
  return esbuildP;
}

const SPEC = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(\/[\w.@/-]+)?$/i;
const pkgName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const cache = new Map();

async function bundle(spec, externals) {
  if (!SPEC.test(spec) || spec.includes('..')) throw new Error('Nama paket tidak sah');
  const key = spec + '|' + externals.length;
  if (cache.has(key)) return cache.get(key);
  const name = pkgName(spec);
  const pj = path.join(PKGS, 'node_modules', name, 'package.json');
  if (!fs.existsSync(pj)) {
    console.log(`npm install ${name} …`);
    await run(npmCmd, ['install', '--prefix', PKGS, '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error', name]);
  }
  const esbuild = await getEsbuild();
  const wild = ['react/*', 'react-dom/*', 'remotion/*', '@remotion/*', 'three/*', '@react-three/*', 'zod/*'];
  const r = await esbuild.build({
    stdin: { contents: `module.exports = require(${JSON.stringify(spec)});`, resolveDir: PKGS, loader: 'js' },
    bundle: true, format: 'cjs', platform: 'browser', write: false, minify: true, logLevel: 'silent',
    external: [...new Set([...externals, ...wild])], define: { 'process.env.NODE_ENV': '"production"' },
    mainFields: ['browser', 'module', 'main'], target: 'es2020',
  });
  let version = '';
  try { version = JSON.parse(fs.readFileSync(pj, 'utf8')).version; } catch { /* abaikan */ }
  const out = { code: r.outputFiles[0].text, version, name };
  cache.set(key, out);
  return out;
}

function runScript(code, timeoutMs = 60000) {
  return new Promise((resolve) => {
    const file = path.join(HOME, `skrip-${Date.now()}.mjs`);
    fs.writeFileSync(file, code);
    const ch = spawn(process.execPath, [file], { cwd: HOME, env: process.env });
    let out = '', err = '';
    const t = setTimeout(() => { ch.kill('SIGKILL'); err += '\n[dihentikan: lebih dari 60 detik]'; }, timeoutMs);
    ch.stdout.on('data', (d) => { if (out.length < 200000) out += d; });
    ch.stderr.on('data', (d) => { if (err.length < 200000) err += d; });
    ch.on('close', (codeExit) => { clearTimeout(t); fs.rm(file, () => {}); resolve({ exitCode: codeExit, stdout: out, stderr: err }); });
  });
}

const send = (res, status, obj) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-saku-token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Private-Network': 'true',
  });
  res.end(JSON.stringify(obj));
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const authed = req.headers['x-saku-token'] === TOKEN;
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/status') {
    return send(res, 200, authed
      ? { app: 'saku-bridge', bridge: VERSION, paired: true, node: process.version, npm: npmVersion, platform: process.platform, arch: process.arch, termux: !!process.env.TERMUX_VERSION }
      : { app: 'saku-bridge', bridge: VERSION, paired: false });
  }
  if (!authed) return send(res, 401, { error: 'Kode sambung salah. Lihat kode di layar Termux.' });
  let body = '';
  req.on('data', (d) => { body += d; if (body.length > 2e6) req.destroy(); });
  req.on('end', async () => {
    let data = {};
    try { data = body ? JSON.parse(body) : {}; } catch { return send(res, 400, { error: 'Data tidak sah' }); }
    try {
      if (url.pathname === '/bundle' && req.method === 'POST') return send(res, 200, await bundle(String(data.spec || ''), Array.isArray(data.externals) ? data.externals.slice(0, 1000) : []));
      if (url.pathname === '/run' && req.method === 'POST') return send(res, 200, await runScript(String(data.code || '')));
      return send(res, 404, { error: 'Tidak dikenal' });
    } catch (e) { return send(res, 500, { error: e.message }); }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  Remotion Saku — Jembatan Node.js ' + VERSION);
  console.log('  Node.js ' + process.version + ' siap di http://127.0.0.1:' + PORT);
  console.log('');
  console.log('  KODE SAMBUNG:  ' + TOKEN);
  console.log('  Masukkan kode ini di Remotion Saku → tab Lainnya → Node.js.');
  console.log('  Biarkan Termux tetap terbuka selama dipakai (Ctrl+C untuk berhenti).');
  console.log('');
  getEsbuild().then(() => console.log('  esbuild siap.')).catch((e) => console.log('  esbuild belum terpasang: ' + e.message));
});
server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} sudah dipakai — jembatan mungkin sudah berjalan.` : e.message); process.exit(1); });
