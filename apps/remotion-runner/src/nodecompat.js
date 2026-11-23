// "Node mini": modul bawaan Node.js yang dibuat ulang agar kode Remotion yang memakai
// fs, path, process, Buffer, events, util, dll. tetap berjalan di HP tanpa Node.js asli.
import pathMod from 'path-browserify';
import { Buffer } from 'buffer';
import * as eventsMod from 'events';
import * as utilMod from 'util';
import processMod from 'process/browser.js';
import * as streamMod from 'stream-browserify';
import * as sdMod from 'string_decoder';
import assertMod from 'assert';
import * as qsMod from 'querystring-es3';

export const NODE_COMPAT_VERSION = 'v22.0.0 (mode kompatibel Remotion Saku)';
const posix = pathMod.posix || pathMod;

// ---------- process ----------
export const processShim = (() => {
  const p = Object.assign(Object.create(null), processMod); // salinan: pustaka lain tidak ikut mengira ini Node
  p.env = { NODE_ENV: 'production', REMOTION_SAKU: '1' };
  p.nextTick = processMod.nextTick; p.on = processMod.on; p.off = processMod.off; p.emit = processMod.emit;
  p.version = 'v22.0.0';
  p.versions = { ...(p.versions || {}), node: '22.0.0', saku: '3' };
  p.platform = 'android';
  p.arch = 'arm64';
  p.argv = ['node', 'remotion-saku'];
  p.cwd = () => '/';
  p.exit = () => {};
  p.hrtime = p.hrtime || ((prev) => { const t = performance.now(); const s = Math.floor(t / 1000), ns = Math.floor((t % 1000) * 1e6); return prev ? [s - prev[0], ns - prev[1]] : [s, ns]; });
  if (p.hrtime && !p.hrtime.bigint) p.hrtime.bigint = () => BigInt(Math.floor(performance.now() * 1e6));
  p.memoryUsage = () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0 });
  p.uptime = () => performance.now() / 1000;
  return p;
})();

// ---------- sistem file virtual ----------
function nodeError(code, msg, path) { const e = new Error(`${code}: ${msg}, '${path}'`); e.code = code; e.path = path; return e; }

/**
 * Membuat modul fs dari file proyek (di /src) dan aset (di /public).
 * files: [{name, code}], assetBytes: {name: Uint8Array}
 */
export function makeFs(files, assetBytes = {}) {
  const store = new Map(); // path absolut -> Uint8Array | string
  const enc = new TextEncoder();
  const put = (p, v) => store.set(posix.normalize('/' + p.replace(/^\/+/, '')), v);
  for (const f of files) { const n = f.name.replace(/^\.?\/+/, ''); put(n, f.code); if (!n.startsWith('src/')) put('src/' + n, f.code); }
  for (const [n, bytes] of Object.entries(assetBytes)) { put('public/' + n, bytes); put(n, bytes); }
  const norm = (p, from = '/src') => {
    if (typeof p !== 'string') p = String(p && p.href ? new URL(p.href).pathname : p);
    if (p.startsWith('file://')) p = p.slice(7);
    let abs = p.startsWith('/') ? p : posix.join(from, p);
    abs = posix.normalize(abs);
    if (store.has(abs)) return abs;
    const alt = [posix.join('/', p), posix.join('/public', p), posix.join('/src', p)].map((x) => posix.normalize(x)).find((x) => store.has(x));
    if (alt) return alt;
    const base = posix.basename(p);
    for (const k of store.keys()) if (posix.basename(k) === base) return k;
    return abs;
  };
  const isDir = (abs) => { const d = abs.endsWith('/') ? abs : abs + '/'; for (const k of store.keys()) if (k.startsWith(d)) return true; return abs === '/'; };
  const toBuf = (v) => (typeof v === 'string' ? Buffer.from(enc.encode(v)) : Buffer.from(v));
  const readFileSync = (p, opt) => {
    const abs = norm(p);
    if (!store.has(abs)) throw nodeError('ENOENT', 'no such file or directory, open', p);
    const v = store.get(abs);
    const encoding = typeof opt === 'string' ? opt : opt && opt.encoding;
    if (encoding) return typeof v === 'string' ? v : toBuf(v).toString(encoding);
    return toBuf(v);
  };
  const writeFileSync = (p, data) => { store.set(norm(p), typeof data === 'string' ? data : new Uint8Array(data)); };
  const existsSync = (p) => { const abs = norm(p); return store.has(abs) || isDir(abs); };
  const statSync = (p) => {
    const abs = norm(p);
    if (store.has(abs)) { const v = store.get(abs); const size = typeof v === 'string' ? enc.encode(v).length : v.length; return { size, isFile: () => true, isDirectory: () => false, mtimeMs: 0, mtime: new Date(0) }; }
    if (isDir(abs)) return { size: 0, isFile: () => false, isDirectory: () => true, mtimeMs: 0, mtime: new Date(0) };
    throw nodeError('ENOENT', 'no such file or directory, stat', p);
  };
  const readdirSync = (p, opt) => {
    const abs = norm(p, '/'); const d = abs.endsWith('/') ? abs : abs + '/';
    const names = new Set();
    for (const k of store.keys()) if (k.startsWith(d)) names.add(k.slice(d.length).split('/')[0]);
    if (!names.size && !isDir(abs)) throw nodeError('ENOENT', 'no such file or directory, scandir', p);
    const list = [...names].sort();
    return opt && opt.withFileTypes ? list.map((n) => ({ name: n, isFile: () => store.has(d + n), isDirectory: () => !store.has(d + n) })) : list;
  };
  const cbify = (fn) => (...args) => { const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null; let r, e = null; try { r = fn(...args); } catch (err) { e = err; } if (cb) setTimeout(() => cb(e, r), 0); };
  const promises = {
    readFile: async (...a) => readFileSync(...a), writeFile: async (...a) => writeFileSync(...a), readdir: async (...a) => readdirSync(...a),
    stat: async (...a) => statSync(...a), access: async (p) => { if (!existsSync(p)) throw nodeError('ENOENT', 'no such file or directory, access', p); }, mkdir: async () => undefined, rm: async () => undefined, unlink: async (p) => { store.delete(norm(p)); },
  };
  return {
    __esModule: true, readFileSync, writeFileSync, existsSync, statSync, lstatSync: statSync, readdirSync,
    mkdirSync: () => undefined, rmSync: () => undefined, unlinkSync: (p) => { store.delete(norm(p)); }, appendFileSync: (p, d) => { const a = norm(p); store.set(a, (store.has(a) ? readFileSync(a, 'utf8') : '') + String(d)); },
    readFile: cbify(readFileSync), writeFile: cbify(writeFileSync), readdir: cbify(readdirSync), stat: cbify(statSync), exists: (p, cb) => setTimeout(() => cb(existsSync(p)), 0),
    promises, constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 },
  };
}

// ---------- crypto dasar ----------
function sha256Bytes(bytes) {
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(bytes); m[l] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  const W = new Uint32Array(64);
  const r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) W[i] = (W[i - 16] + (r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3)) + W[i - 7] + (r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10))) >>> 0;
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  const out = new Uint8Array(32); const ov = new DataView(out.buffer); H.forEach((v, i) => ov.setUint32(i * 4, v)); return out;
}
const cryptoShim = {
  __esModule: true,
  randomUUID: () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); })),
  randomBytes: (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return Buffer.from(b); },
  randomInt: (a, b) => (b === undefined ? Math.floor(Math.random() * a) : a + Math.floor(Math.random() * (b - a))),
  createHash: (alg) => { const parts = []; const h = { update: (d, e) => { parts.push(typeof d === 'string' ? Buffer.from(d, e || 'utf8') : Buffer.from(d)); return h; }, digest: (e) => { const out = Buffer.from(sha256Bytes(Buffer.concat(parts))); const v = alg && !/256/.test(alg) ? out.subarray(0, /md5/i.test(alg) ? 16 : 20) : out; return e ? v.toString(e) : v; } }; return h; },
  webcrypto: globalThis.crypto,
};

// ---------- modul lain ----------
const osShim = { __esModule: true, platform: () => 'android', type: () => 'Linux', arch: () => 'arm64', release: () => '', EOL: '\n', tmpdir: () => '/tmp', homedir: () => '/home', hostname: () => 'android', cpus: () => Array.from({ length: (navigator.hardwareConcurrency || 4) }, () => ({ model: 'arm64', speed: 0 })), totalmem: () => (navigator.deviceMemory || 4) * 1e9, freemem: () => 1e9, endianness: () => 'LE', availableParallelism: () => navigator.hardwareConcurrency || 4 };
const urlShim = { __esModule: true, URL, URLSearchParams, fileURLToPath: (u) => decodeURIComponent(new URL(String(u), 'file:///').pathname), pathToFileURL: (p) => new URL('file://' + posix.resolve('/', String(p))), parse: (u) => new URL(u, 'http://x'), format: (u) => String(u) };
const timersShim = { __esModule: true, setTimeout, clearTimeout, setInterval, clearInterval, setImmediate: (fn, ...a) => setTimeout(fn, 0, ...a), clearImmediate: clearTimeout, promises: { setTimeout: (ms, v) => new Promise((r) => setTimeout(() => r(v), ms)) } };

/** Fungsi Node yang memang tidak mungkin di HP (proses lain, server, jaringan mentah). */
function nodeOnly(mod, explainFn) {
  return new Proxy({ __esModule: true }, {
    get(t, k) {
      if (k === '__esModule') return true;
      if (typeof k === 'symbol' || k === 'then') return undefined;
      const f = function () { throw new Error(explainFn(String(k))); };
      return f;
    },
  });
}
const needRealNode = (mod) => (fn) => `"${mod}.${fn}" butuh Node.js asli. Jalankan bagian ini di komputer atau lewat Termux (tab Lainnya → Node.js).`;

// Paket Remotion khusus Node: konfigurasi diabaikan dengan aman, perender diarahkan ke tab Ekspor.
const configProxy = new Proxy({}, { get: (t, k) => (typeof k === 'symbol' ? undefined : () => configProxy) });
const remotionNodeOnly = (mod) => nodeOnly(mod, (fn) => `"${fn}" dari ${mod} adalah alat render di komputer. Di Remotion Saku, pakai tab Ekspor untuk membuat video.`);

export function makeNodeModules({ files, assetBytes }) {
  const fs = makeFs(files, assetBytes);
  const mods = {
    fs, 'fs/promises': { __esModule: true, ...fs.promises, default: fs.promises },
    path: { __esModule: true, ...posix, default: posix, posix }, 'path/posix': { __esModule: true, ...posix, default: posix },
    buffer: { __esModule: true, Buffer, default: { Buffer } },
    events: { __esModule: true, ...eventsMod, default: eventsMod.default || eventsMod.EventEmitter || eventsMod },
    util: { __esModule: true, ...utilMod, TextEncoder, TextDecoder, default: utilMod },
    process: { __esModule: true, ...processShim, default: processShim },
    stream: { __esModule: true, ...streamMod, default: streamMod.default || streamMod },
    string_decoder: { __esModule: true, ...sdMod, default: sdMod },
    assert: { __esModule: true, ...assertMod, default: assertMod, strict: assertMod.strict || assertMod },
    querystring: { __esModule: true, ...qsMod, default: qsMod },
    url: urlShim, os: osShim, crypto: cryptoShim, timers: timersShim, 'timers/promises': { __esModule: true, ...timersShim.promises, default: timersShim.promises },
    child_process: nodeOnly('child_process', needRealNode('child_process')), http: nodeOnly('http', needRealNode('http')), https: nodeOnly('https', needRealNode('https')),
    net: nodeOnly('net', needRealNode('net')), tls: nodeOnly('tls', needRealNode('tls')), zlib: nodeOnly('zlib', needRealNode('zlib')), worker_threads: nodeOnly('worker_threads', needRealNode('worker_threads')),
    cluster: nodeOnly('cluster', needRealNode('cluster')), dns: nodeOnly('dns', needRealNode('dns')), readline: nodeOnly('readline', needRealNode('readline')), v8: nodeOnly('v8', needRealNode('v8')), vm: nodeOnly('vm', needRealNode('vm')),
    '@remotion/cli/config': { __esModule: true, Config: configProxy, default: configProxy },
    '@remotion/cli': remotionNodeOnly('@remotion/cli'), '@remotion/renderer': remotionNodeOnly('@remotion/renderer'), '@remotion/bundler': remotionNodeOnly('@remotion/bundler'),
    '@remotion/lambda': remotionNodeOnly('@remotion/lambda'), '@remotion/cloudrun': remotionNodeOnly('@remotion/cloudrun'),
  };
  // Impor default (import fs from 'fs') = seluruh modul, seperti di Node.js.
  for (const m of Object.values(mods)) { if (m && typeof m === 'object' && !('default' in m)) { try { m.default = m; } catch { /* proxy */ } } }
  return mods;
}

/** 'node:fs' -> 'fs', 'fs/promises' tetap. */
export const nodeName = (spec) => spec.replace(/^node:/, '');
export const NODE_GLOBALS = { process: processShim, Buffer, global: globalThis, setImmediate: timersShim.setImmediate, clearImmediate: clearTimeout, __dirname: '/src', __filename: '/src/index.tsx' };
