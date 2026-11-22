// Mesin penjalan: memecah kode tempelan, mengompilasi TSX/JSX, menjalankan modul,
// lalu menemukan <Composition> atau komponen video yang bisa diputar.
import * as React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as RemotionReal from 'remotion';
import { transform } from 'sucrase';
import { BUILTIN } from './modules.gen.js';

export const CODE_EXT = /\.(tsx|ts|jsx|js|mjs|cjs)$/i;
const FILE_TOKEN = /((?:[\w@.-]+\/)*[\w@.-]+\.(?:tsx|ts|jsx|js|mjs|css))/i;

// ---------- 1. Memecah teks tempelan menjadi beberapa file ----------

const CODE_LANGS = new Set(['', 'tsx', 'ts', 'jsx', 'js', 'javascript', 'typescript', 'react', 'css', 'mjs']);

export function cleanText(t) {
  return String(t ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ') // spasi tak-putus dari chat/WhatsApp
    .replace(/[​‌‍﻿]/g, '') // karakter tak terlihat
    .replace(/[‘’](?=[^\n]*\bfrom\b)/g, "'");
}

function looksLikeCode(s) {
  return /\b(import|export|const|function|return)\b/.test(s);
}

/** Mengubah tempelan menjadi daftar file {name, code}. */
export function splitPasted(raw, fallbackName = 'Video.tsx') {
  const text = cleanText(raw);
  // a) Blok markdown ```...``` (hasil salin dari ChatGPT/Claude)
  if (/^\s*```/m.test(text)) {
    const re = /^[ \t]*```([^\n`]*)\n([\s\S]*?)^[ \t]*```[ \t]*$/gm;
    const files = [];
    let m, last = 0;
    while ((m = re.exec(text))) {
      const info = m[1].trim();
      const lang = info.split(/[\s{:]/)[0].toLowerCase();
      const body = m[2].replace(/\s+$/, '') + '\n';
      const before = text.slice(last, m.index).trim().split('\n').slice(-3).join('\n');
      last = re.lastIndex;
      if (!CODE_LANGS.has(lang) && !FILE_TOKEN.test(info)) continue;
      if (!looksLikeCode(body) && lang !== 'css') continue;
      let name = (info.match(FILE_TOKEN) || [])[1] || (before.match(new RegExp(FILE_TOKEN.source + '(?![\\s\\S]*' + FILE_TOKEN.source + ')', 'i')) || [])[1];
      const first = body.split('\n')[0];
      if (!name && /^\s*(\/\/|\/\*)/.test(first)) name = (first.match(FILE_TOKEN) || [])[1];
      files.push({ name: name || '', code: body, lang });
    }
    if (files.length) return nameFiles(files, fallbackName);
  }
  // b) Komentar penanda file, mis. "// src/Root.tsx" atau "// File: Judul.tsx"
  const lines = text.split('\n');
  const marker = /^\s*(?:\/\/+|\/\*+|#+)\s*(?:(?:file|filename|nama file|berkas)\s*[:=-]?\s*)?[`*=\-\s]*((?:[\w@.-]+\/)*[\w@.-]+\.(?:tsx|ts|jsx|js|mjs|css))[`*=\-\s]*(?:\*+\/)?\s*$/i;
  const parts = [];
  let cur = { name: '', lines: [] };
  for (const line of lines) {
    const mm = line.match(marker);
    if (mm) {
      if (cur.lines.join('\n').trim()) parts.push(cur);
      cur = { name: mm[1], lines: [] };
    } else cur.lines.push(line);
  }
  if (cur.lines.join('\n').trim() || cur.name) parts.push(cur);
  if (parts.length > 1 || (parts.length === 1 && parts[0].name)) {
    return nameFiles(parts.map((p) => ({ name: p.name, code: p.lines.join('\n').replace(/^\n+/, '') })), fallbackName);
  }
  return [{ name: fallbackName, code: text }];
}

function nameFiles(files, fallbackName) {
  const used = new Set();
  return files.map((f, i) => {
    let name = (f.name || '').replace(/^\.?\//, '');
    if (!name) name = i === 0 ? fallbackName : (f.lang === 'css' ? `gaya${i + 1}.css` : `File${i + 1}.tsx`);
    let n = name, k = 2;
    while (used.has(n.toLowerCase())) n = name.replace(/(\.\w+)$/, `-${k++}$1`);
    used.add(n.toLowerCase());
    return { name: n, code: f.code };
  });
}

// ---------- 2. Kesalahan yang ramah ----------

export class FriendlyError extends Error {
  constructor(message, { file, line, column, hint, kind } = {}) {
    super(message);
    this.file = file; this.line = line; this.column = column; this.hint = hint; this.kind = kind;
  }
}

function hintFor(msg) {
  const m = String(msg);
  if (/is not defined/.test(m)) {
    const name = (m.match(/(\w+) is not defined/) || [])[1];
    return `"${name}" belum di-import atau salah ketik. Contoh: import { ${name} } from 'remotion';`;
  }
  if (/Unexpected token|Unterminated|expected/i.test(m)) return 'Biasanya ada kurung, kurung kurawal, atau tanda kutip yang belum ditutup. Pastikan semua kode ikut tersalin sampai baris terakhir.';
  if (/is not a function/.test(m)) return 'Nama fungsi salah atau di-import dari paket yang keliru.';
  if (/Cannot read properties of (undefined|null)/.test(m)) return 'Ada data yang kosong. Periksa props/defaultProps komponen.';
  if (/Objects are not valid as a React child/.test(m)) return 'Ada objek yang langsung ditampilkan di JSX. Tampilkan propertinya, mis. {data.judul}.';
  if (/Invalid hook call|Rendered more hooks|Rendered fewer hooks/.test(m)) return 'Hook (useCurrentFrame, useState, dll.) hanya boleh dipanggil di bagian atas komponen, bukan di dalam if/loop.';
  return '';
}

function lineFromStack(err, file) {
  const s = String(err && err.stack || '');
  const esc = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = s.match(new RegExp('rr-file:/*' + esc + ':(\\d+):(\\d+)'));
  if (!m) return {};
  return { line: Math.max(1, Number(m[1]) - FN_HEADER_LINES), column: Number(m[2]) };
}

export function toFriendly(err, file) {
  if (err instanceof FriendlyError) return err;
  const msg = err && err.message ? err.message : String(err);
  const loc = file ? lineFromStack(err, file) : {};
  return new FriendlyError(msg, { file, ...loc, hint: hintFor(msg), kind: 'runtime' });
}

// ---------- 3. Kompilasi ----------

export function compileFile(name, code) {
  const isTs = /\.(tsx?|mts|cts)$/i.test(name) || !/\.(jsx?|mjs|cjs)$/i.test(name);
  const transforms = isTs ? ['typescript', 'jsx', 'imports'] : ['jsx', 'imports'];
  try {
    return transform(code, {
      transforms,
      jsxRuntime: 'automatic',
      production: true,
      filePath: name,
    }).code;
  } catch (e) {
    if (!isTs) {
      // JS yang sebenarnya berisi TypeScript: coba sekali lagi dengan mode TS.
      try { return transform(code, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', production: true, filePath: name + '.tsx' }).code; } catch { /* laporkan error pertama */ }
    }
    const m = String(e.message).match(/\((\d+):(\d+)\)/);
    const message = String(e.message).replace(/\s*\(\d+:\d+\)\s*$/, '').replace(/^Error transforming [^:]+:\s*/, '');
    const bal = bracketHint(code);
    throw new FriendlyError(message, {
      file: name, line: m ? Number(m[1]) : undefined, column: m ? Number(m[2]) + 1 : undefined,
      hint: bal || hintFor(message), kind: 'syntax',
    });
  }
}

// Hitung kurung yang tidak seimbang (mengabaikan string & komentar) untuk petunjuk yang lebih jelas.
function bracketHint(code) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const names = { '(': 'kurung (', '[': 'kurung siku [', '{': 'kurung kurawal {' };
  const stack = [];
  let line = 1;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '\n') { line++; continue; }
    if (c === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; line++; continue; }
    if (c === '/' && code[i + 1] === '*') { i += 2; while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) { if (code[i] === '\n') line++; i++; } i++; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < code.length && code[i] !== q) { if (code[i] === '\\') i++; else if (code[i] === '\n') { line++; if (q !== '`') break; } i++; }
      continue;
    }
    if (pairs[c]) stack.push({ c, line });
    else if (c === ')' || c === ']' || c === '}') {
      const top = stack[stack.length - 1];
      if (!top || pairs[top.c] !== c) return `Ada tanda "${c}" berlebih atau salah pasangan di sekitar baris ${line}.`;
      stack.pop();
    }
  }
  if (stack.length) {
    const t = stack[stack.length - 1];
    return `Ada ${names[t.c]} yang dibuka di baris ${t.line} tetapi belum ditutup. Mungkin kode tidak tersalin sampai habis.`;
  }
  return '';
}

// ---------- 4. Font Google tanpa paket besar ----------

const loadedFontLinks = new Set();
function googleFontModule(slug) {
  const family = slug
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2');
  const fontFamily = `'${family}', sans-serif`;
  const loadFont = (style, opts = {}) => {
    const weights = (opts && opts.weights) || ['300', '400', '500', '600', '700', '800', '900'];
    const italic = style === 'italic';
    for (const w of weights) {
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${italic ? 'ital,wght@1,' : 'wght@'}${w}&display=block`;
      if (loadedFontLinks.has(href)) continue;
      loadedFontLinks.add(href);
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href; l.onerror = () => l.remove();
      document.head.appendChild(l);
    }
    const waitUntilDone = () => Promise.race([
      document.fonts ? document.fonts.load(`700 40px '${family}'`).then(() => document.fonts.ready) : Promise.resolve(),
      new Promise((r) => setTimeout(r, 4000)),
    ]).then(() => undefined).catch(() => undefined);
    return { fontFamily, fonts: {}, unicodeRanges: {}, waitUntilDone };
  };
  return { __esModule: true, fontFamily, loadFont, getInfo: () => ({ fontFamily: family, importName: slug, fonts: {} }), default: { fontFamily, loadFont } };
}

// ---------- 5. Nama yang otomatis tersedia walau lupa di-import ----------

const REACT_NAMES = ['useState', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef', 'useContext', 'useReducer', 'useId',
  'createContext', 'Fragment', 'forwardRef', 'memo', 'Suspense', 'lazy', 'createElement', 'cloneElement', 'Children', 'useImperativeHandle', 'useTransition', 'useDeferredValue'];
const EXTRA = [
  ['@remotion/transitions', ['TransitionSeries', 'linearTiming', 'springTiming']],
  ['@remotion/transitions/fade', ['fade']], ['@remotion/transitions/slide', ['slide']], ['@remotion/transitions/wipe', ['wipe']],
  ['@remotion/transitions/flip', ['flip']], ['@remotion/transitions/clock-wipe', ['clockWipe']], ['@remotion/transitions/iris', ['iris']],
  ['zod', ['z']],
];
function makeGlobals(remotionShim) {
  const g = Object.create(null);
  const put = (k, v) => { if (v === undefined || k === 'default' || k === '__esModule') return; if (k in window) return; g[k] = v; };
  for (const [pkg, names] of EXTRA) { const m = BUILTIN[pkg]; if (m) for (const n of names) put(n, m[n]); }
  if (BUILTIN['@saku/3d']) put('ThreeCanvas', BUILTIN['@saku/3d'].SakuThreeCanvas);
  for (const n of REACT_NAMES) put(n, React[n]);
  for (const [k, v] of Object.entries(remotionShim)) put(k, v);
  g.React = React; // "React is not defined" pada kode JSX lama
  return g;
}

// ---------- 6. Menjalankan proyek ----------

const FN_HEADER_LINES = 2; // baris tambahan dari new Function di Chrome/Safari
const cdnCache = new Map();

function normPath(p) {
  const out = [];
  for (const seg of p.replace(/\\/g, '/').split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop(); else out.push(seg);
  }
  return out.join('/');
}
const stripExt = (p) => p.replace(/\.(tsx|ts|jsx|js|mjs|cjs|css)$/i, '');
const baseName = (p) => p.split('/').pop();

function resolveLocal(files, fromName, spec) {
  const dir = fromName.split('/').slice(0, -1).join('/');
  const target = normPath((dir ? dir + '/' : '') + spec);
  const names = files.map((f) => f.name);
  const norm = (n) => normPath(n).replace(/^src\//, '');
  const t2 = target.replace(/^src\//, '');
  const exts = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
  for (const e of exts) {
    const hit = names.find((n) => norm(n) === t2 + e || normPath(n) === target + e);
    if (hit) return hit;
  }
  // Longgar: cocokkan nama file saja (mis. folder berbeda saat ditempel)
  const want = stripExt(baseName(target)).toLowerCase();
  const loose = names.filter((n) => stripExt(baseName(n)).toLowerCase() === want);
  if (loose.length >= 1) return loose[0];
  if (want === 'index') return null;
  return null;
}

function asModule(m) {
  if (m && m.__esModule) return m;
  const o = { __esModule: true };
  if (m && typeof m === 'object') Object.assign(o, m);
  o.default = m && 'default' in m ? m.default : m;
  return o;
}

const builtinCache = new Map();
/** 'three/examples/jsm/x/Y.js' dan 'three/addons/x/Y' -> kunci yang sama */
export function normalizeSpec(spec) {
  const m = /^three\/(?:examples\/jsm|addons)\/(.+?)(?:\.js)?$/.exec(spec);
  return m ? 'three/addons/' + m[1] : spec;
}
function builtin(spec) {
  spec = normalizeSpec(spec);
  if (builtinCache.has(spec)) return builtinCache.get(spec);
  const m = BUILTIN[spec];
  if (!m) return null;
  // Paket ESM berbentuk namespace: default = isi default atau seluruh namespace.
  const o = { __esModule: true, ...m };
  if (!('default' in m)) o.default = m;
  // Kanvas 3D diganti versi yang jamnya terkunci ke frame video (pratinjau = hasil ekspor).
  const saku = BUILTIN['@saku/3d'];
  if (saku && spec === '@remotion/three') o.ThreeCanvas = saku.SakuThreeCanvas;
  if (saku && spec === '@react-three/fiber') o.Canvas = saku.SakuThreeCanvas;
  builtinCache.set(spec, o);
  return o;
}

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm|mov|mp3|wav|m4a|aac|ogg|json|ttf|otf|woff2?)$/i;

async function fetchCdnModule(spec) {
  if (cdnCache.has(spec)) return cdnCache.get(spec);
  const url = `https://cdn.jsdelivr.net/npm/${spec}/+esm`;
  const p = Promise.race([
    import(/* @vite-ignore */ url),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000)),
  ]);
  cdnCache.set(spec, p);
  try { return await p; } catch (e) { cdnCache.delete(spec); throw e; }
}

/**
 * Menjalankan semua file. Mengembalikan { entries, warnings }.
 * entries: daftar video yang bisa diputar.
 */
export async function runProject(files, { assets = {}, settings }) {
  const warnings = [];
  const codeFiles = files.filter((f) => !/\.css$/i.test(f.name));
  const cssFiles = files.filter((f) => /\.css$/i.test(f.name));
  if (!codeFiles.some((f) => f.code.trim())) throw new FriendlyError('Kode masih kosong.', { hint: 'Tempel kode Remotion Anda di kolom kode, lalu tekan Jalankan.', kind: 'empty' });

  // Gaya CSS
  document.querySelectorAll('style[data-user-css]').forEach((s) => s.remove());
  for (const f of cssFiles) {
    const s = document.createElement('style');
    s.setAttribute('data-user-css', f.name);
    s.textContent = f.code;
    document.head.appendChild(s);
  }

  // Kompilasi semua file dulu supaya error sintaks langsung ketahuan.
  const compiled = {};
  for (const f of codeFiles) compiled[f.name] = compileFile(f.name, f.code);

  // Paket di luar daftar bawaan: coba ambil dari CDN.
  const external = {};
  const reqRe = /require\((['"])([^'"]+)\1\)/g;
  const bare = new Set();
  for (const code of Object.values(compiled)) {
    let m;
    while ((m = reqRe.exec(code))) {
      const s = m[2];
      if (s.startsWith('.') || s.startsWith('/')) continue;
      if (BUILTIN[normalizeSpec(s)] || s.startsWith('@remotion/google-fonts') || /\.css$/i.test(s)) continue;
      bare.add(s);
    }
  }
  for (const s of bare) {
    try {
      external[s] = asModule(await fetchCdnModule(s));
      warnings.push(`Paket "${s}" diambil dari internet (bukan bawaan). Bila tampil aneh, ganti dengan paket Remotion bawaan.`);
    } catch {
      throw new FriendlyError(`Paket "${s}" tidak tersedia.`, {
        hint: 'Paket ini tidak termasuk bawaan dan gagal diambil dari internet. Periksa sambungan internet, atau hapus import paket itu.', kind: 'package',
      });
    }
  }

  // Remotion versi khusus: menangkap <Composition>, registerRoot, staticFile.
  const captured = { roots: [], comps: [] };
  const assetUrl = (name) => {
    const clean = String(name).replace(/^\.?\/+/, '').replace(/^public\//, '');
    const hit = assets[clean] || assets[decodeURIComponent(clean)] || Object.entries(assets).find(([k]) => baseName(k).toLowerCase() === baseName(clean).toLowerCase())?.[1];
    if (hit) return hit;
    if (!warnings.some((w) => w.includes(clean))) warnings.push(`Aset "${clean}" belum diunggah. Unggah di tab Aset agar staticFile("${clean}") tampil.`);
    return '/' + clean;
  };
  const Composition = (props) => { captured.comps.push({ ...props, isStill: false }); return null; };
  const Still = (props) => { captured.comps.push({ ...props, isStill: true, durationInFrames: 1, fps: props.fps || 30 }); return null; };
  const Folder = ({ children }) => React.createElement(React.Fragment, null, children);
  const remotionShim = {
    ...builtin('remotion'),
    Composition, Still, Folder,
    registerRoot: (c) => { captured.roots.push(c); },
    staticFile: (p) => assetUrl(p),
    getStaticFiles: () => Object.keys(assets).map((n) => ({ name: n, src: assets[n], sizeInBytes: 0, lastModified: 0 })),
    getRemotionEnvironment: () => ({ isStudio: false, isRendering: false, isPlayer: true, isReadOnlyStudio: false, isClientSideRendering: false }),
  };
  const globals = makeGlobals(remotionShim);

  const cache = new Map();
  const loading = [];
  const requireFrom = (fromName) => (spec) => {
    if (spec === 'remotion') return remotionShim;
    const b = builtin(spec);
    if (b) return b;
    if (spec.startsWith('@remotion/google-fonts')) return googleFontModule(spec.split('/')[2] || 'Inter');
    if (external[spec]) return external[spec];
    if (spec.startsWith('.') || spec.startsWith('/')) {
      const target = resolveLocal(files, fromName, spec);
      if (target && /\.css$/i.test(target)) return {};
      if (target) return load(target);
      if (IMG_EXT.test(spec)) return { __esModule: true, default: assetUrl(baseName(spec)) };
      if (/\.css$/i.test(spec)) { warnings.push(`File gaya "${spec}" tidak ada, dilewati.`); return {}; }
      throw new FriendlyError(`File "${spec}" yang di-import oleh ${fromName} tidak ditemukan.`, {
        file: fromName, hint: `Tambahkan file itu lewat tombol "+ File" (beri nama ${baseName(spec)}.tsx), atau tempel semua file sekaligus dengan penanda // NamaFile.tsx di atas tiap file.`, kind: 'missing-file',
      });
    }
    if (/\.css$/i.test(spec)) return {};
    throw new FriendlyError(`Paket "${spec}" tidak tersedia.`, { file: fromName, kind: 'package' });
  };
  function load(name) {
    if (cache.has(name)) return cache.get(name).exports;
    const module = { exports: {} };
    cache.set(name, module);
    loading.push(name);
    try {
      // eslint-disable-next-line no-new-func
      // "with" menyediakan fungsi Remotion/React yang lupa di-import. Nama yang
      // dideklarasikan sendiri oleh kode tetap menang. Ditulis di baris yang sama
      // agar nomor baris error tetap tepat.
      const fn = new Function('require', 'module', 'exports', '__g', 'with(__g){(function(){' + compiled[name] + `\n}).call(this)}\n//# sourceURL=rr-file:///${name}`);
      fn.call(undefined, requireFrom(name), module, module.exports, globals);
    } catch (e) {
      cache.delete(name);
      throw e instanceof FriendlyError ? e : toFriendly(e, name);
    } finally { loading.pop(); }
    return module.exports;
  }

  const allExports = {};
  for (const f of codeFiles) allExports[f.name] = load(f.name);

  // Cari root: registerRoot() atau file yang memakai <Composition>.
  let rootCandidates = [...captured.roots];
  if (!rootCandidates.length) {
    for (const f of codeFiles) {
      if (!/<\s*(Composition|Still)\b/.test(f.code)) continue;
      for (const [k, v] of Object.entries(allExports[f.name] || {})) {
        if (k === '__esModule') continue;
        if (isComponent(v)) rootCandidates.push(v);
      }
    }
  }
  const comps = [];
  for (const Root of rootCandidates) {
    captured.comps = [];
    const div = document.createElement('div');
    const root = createRoot(div);
    try {
      flushSync(() => root.render(React.createElement(Root)));
    } catch (e) {
      warnings.push('Root gagal dibaca: ' + (e && e.message));
    }
    try { root.unmount(); } catch { /* abaikan */ }
    comps.push(...captured.comps);
    if (comps.length) break;
  }

  const entries = [];
  for (const c of comps) {
    let component = c.component;
    if (!component && c.lazyComponent) {
      try { const m = await c.lazyComponent(); component = m && (m.default || m); } catch (e) { throw toFriendly(e); }
    }
    if (!isComponent(component)) { warnings.push(`Composition "${c.id}" tidak punya component yang valid, dilewati.`); continue; }
    let meta = {
      width: c.width, height: c.height, fps: c.fps, durationInFrames: c.durationInFrames,
      props: { ...(c.defaultProps || {}) },
    };
    if (typeof c.calculateMetadata === 'function') {
      try {
        const r = await Promise.race([
          Promise.resolve(c.calculateMetadata({ defaultProps: meta.props, props: meta.props, abortSignal: new AbortController().signal, compositionId: c.id, isRendering: false })),
          new Promise((_, rej) => setTimeout(() => rej(new Error('calculateMetadata terlalu lama (>15 detik)')), 15000)),
        ]);
        if (r) meta = { ...meta, ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null)), props: r.props || meta.props };
      } catch (e) { warnings.push(`calculateMetadata "${c.id}" gagal: ${e.message}. Memakai nilai bawaan.`); }
    }
    entries.push(fixMeta({ id: String(c.id || `Video${entries.length + 1}`), component, isStill: c.isStill, fromComposition: true, ...meta }, settings, warnings));
  }

  if (!entries.length) {
    // Tanpa <Composition>: pakai komponen yang di-export.
    const order = [...codeFiles].sort((a, b) => score(b) - score(a));
    const seen = new Set();
    for (const f of order) {
      const ex = allExports[f.name] || {};
      const keys = Object.keys(ex).filter((k) => k !== '__esModule');
      keys.sort((a, b) => (b === 'default') - (a === 'default'));
      for (const k of keys) {
        const v = ex[k];
        if (!isComponent(v) || seen.has(v)) continue;
        if (k !== 'default' && !/^[A-Z]/.test(k)) continue;
        if (/Root$/i.test(k) && /<\s*Composition/.test(f.code)) continue;
        seen.add(v);
        const local = {
          width: num(ex.width ?? ex.WIDTH), height: num(ex.height ?? ex.HEIGHT),
          fps: num(ex.fps ?? ex.FPS), durationInFrames: num(ex.durationInFrames ?? ex.DURATION ?? ex.DURATION_IN_FRAMES),
        };
        const label = k === 'default' ? (v.displayName || v.name || stripExt(baseName(f.name))) : k;
        entries.push(fixMeta({ id: label, component: v, fromComposition: false, props: {}, ...local }, settings, warnings));
      }
    }
  }

  if (!entries.length) {
    throw new FriendlyError('Tidak ada komponen video yang ditemukan.', {
      hint: 'Pastikan komponen di-export, contoh: export const VideoSaya = () => { ... } atau export default function Video() { ... }. Bisa juga memakai <Composition> di file Root.',
      kind: 'no-entry',
    });
  }
  return { entries, warnings };
}

function score(f) {
  let s = 0;
  if (/export\s+default/.test(f.code)) s += 2;
  if (/useCurrentFrame|AbsoluteFill|Sequence|interpolate/.test(f.code)) s += 3;
  if (/(Video|Main|Composition|Scene|App|MyComp)/i.test(f.name)) s += 1;
  return s;
}

function num(v) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : undefined; }

function fixMeta(e, settings, warnings) {
  const pick = (v, d) => (num(v) ? num(v) : d);
  const o = !!settings.override;
  const out = { ...e };
  out.width = Math.round(o ? settings.width : pick(e.width, settings.width));
  out.height = Math.round(o ? settings.height : pick(e.height, settings.height));
  out.fps = Math.min(120, o ? settings.fps : pick(e.fps, settings.fps));
  const dflt = Math.round(settings.seconds * out.fps);
  out.durationInFrames = Math.max(1, Math.round(o ? dflt : pick(e.durationInFrames, dflt)));
  if (out.width > 7680 || out.height > 7680) {
    warnings.push('Ukuran video terlalu besar, dikecilkan ke batas 4K.');
    const k = 3840 / Math.max(out.width, out.height);
    out.width = Math.round(out.width * k); out.height = Math.round(out.height * k);
  }
  out.props = out.props || {};
  return out;
}

export function isComponent(v) {
  if (typeof v === 'function') return true;
  return !!(v && typeof v === 'object' && v.$$typeof && (v.render || v.type || v._payload || v.$$typeof === Symbol.for('react.lazy')));
}

export const Remotion = RemotionReal;
