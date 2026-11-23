// Mode toleran: kode dengan 1-2 kesalahan tetap menghasilkan animasi.
// - Salah tulis (sintaks): coba sisipkan tanda yang kurang, tutup kurung di akhir, atau lewati barisnya.
// - Nama tidak dikenal: diganti "kosong" (komponen tidak tampil, fungsi mengembalikan undefined).
// - Komponen yang error saat diputar: hanya komponen itu yang disembunyikan, sisanya tetap jalan.
// Semua tindakan dicatat sebagai "issue" agar pengguna tahu apa yang dilewati.
import * as React from 'react';
import * as JSXRuntime from 'react/jsx-runtime';
import { BUILTIN } from './modules.gen.js';
import { parse } from '@babel/parser';
import { compileFile, FriendlyError } from './runtime.js';

// ---------- Catatan masalah (bisa didengar oleh tampilan) ----------
const listeners = new Set();
let issues = [];
const seen = new Set();
export function resetIssues() { issues = []; seen.clear(); emit(); }
export function getIssues() { return issues; }
export function onIssues(fn) { listeners.add(fn); return () => listeners.delete(fn); }
let emitTimer = null;
function emit() {
  if (emitTimer) return;
  emitTimer = setTimeout(() => { emitTimer = null; listeners.forEach((fn) => { try { fn(issues); } catch { /* abaikan */ } }); }, 60);
}
export function report(issue) {
  const key = `${issue.kind}|${issue.file || ''}|${issue.line || ''}|${issue.name || ''}|${issue.message}`;
  if (seen.has(key)) return;
  seen.add(key);
  issues = [...issues, { id: issues.length + 1, ...issue }];
  emit();
}

// ---------- 1. Perbaikan sintaks otomatis ----------
const CLOSE = { '(': ')', '[': ']', '{': '}' };
function unclosed(code) {
  const stack = [];
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (c === '/' && code[i + 1] === '*') { i += 2; while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++; i++; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < code.length && code[i] !== q) { if (code[i] === '\\') i++; else if (code[i] === '\n' && q !== '`') break; i++; }
      continue;
    }
    if (CLOSE[c]) stack.push(c);
    else if (c === ')' || c === ']' || c === '}') { if (stack.length && CLOSE[stack[stack.length - 1]] === c) stack.pop(); }
  }
  return stack.reverse().map((c) => CLOSE[c]).join('');
}

// Babel menunjuk lokasi error dengan tepat (sucrase kadang menunjuk awal fungsi).
function locate(code) {
  try {
    const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: true, allowReturnOutsideFunction: true, allowImportExportEverywhere: true });
    const e = ast.errors && ast.errors[0];
    if (!e) return null;
    return { line: e.loc.line, column: e.loc.column, message: String(e.message).replace(/\s*\(\d+:\d+\)\s*$/, '') };
  } catch (e) {
    if (!e || !e.loc) return null;
    return { line: e.loc.line, column: e.loc.column, message: String(e.message).replace(/\s*\(\d+:\d+\)\s*$/, '') };
  }
}

function lineBalanced(t) {
  const s = t.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '').replace(/\/\/.*$/, '');
  let d = 0;
  for (const c of s) { if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; }
  const opens = (s.match(/<[A-Za-z][\w.]*(?=[\s>])/g) || []).length, closes = (s.match(/<\/[A-Za-z][\w.]*\s*>/g) || []).length, selfc = (s.match(/\/>/g) || []).length;
  return d === 0 && opens - selfc === closes;
}

const pos = (l) => (l ? l.line * 100000 + (l.column || 0) : 0);
const errAt = (name, src) => {
  try { compileFile(name, src); return null; } catch (e) {
    const b = locate(src);
    return b || (e instanceof FriendlyError && e.line ? { line: e.line, column: Math.max(0, (e.column || 1) - 1), message: e.message } : { line: 0, column: 0, message: String(e.message || e) });
  }
};

/**
 * Mengompilasi file; bila salah tulis, mencoba memperbaiki sampai berhasil.
 * Mengembalikan { compiled, code, repairs }. Melempar FriendlyError bila tetap gagal.
 */
export function compileTolerant(name, code, { maxSteps = 14 } = {}) {
  let src = code;
  const repairs = [];
  let firstErr = null;
  for (let step = 0; step <= maxSteps; step++) {
    try {
      return { compiled: compileFile(name, src), code: src, repairs };
    } catch (e) { if (!firstErr) firstErr = e; }
    const loc = errAt(name, src);
    if (!loc || !loc.line) break;
    const lines = src.split('\n');
    const L = Math.min(loc.line, lines.length);
    const lineText = lines[L - 1] ?? '';
    const col = Math.min(lineText.length, Math.max(0, loc.column || 0));
    const withLine = (nl) => [...lines.slice(0, L - 1), nl, ...lines.slice(L)].join('\n');
    const options = [];
    const exp = /expected "(.{1,3})"/i.exec(loc.message);
    if (exp) options.push({ src: withLine(lineText.slice(0, col) + exp[1] + lineText.slice(col)), note: `menambahkan "${exp[1]}"` });
    const jsxTag = /closing tag for <([\w.]+)>/i.exec(loc.message);
    if (jsxTag) options.push({ src: withLine(lineText.slice(0, col) + `</${jsxTag[1]}>` + lineText.slice(col)), note: `menambahkan </${jsxTag[1]}>` });
    if (/Unterminated string/i.test(loc.message)) {
      const q = (lineText.slice(0, col + 1).match(/["']/g) || []).pop() || "'";
      options.push({ src: withLine(lineText + q), note: 'menutup tanda kutip' });
    }
    const tail = unclosed(src);
    if (tail && L >= lines.length - 2) options.push({ src: src.replace(/\s*$/, '\n' + tail.split('').join('\n') + '\n'), note: `menutup ${tail.length} kurung yang belum ditutup` });
    if (/Missing semicolon|expected ";"/i.test(loc.message) === false && /Unexpected token/i.test(loc.message) && col > 0) {
      // token berlebih: hapus satu karakter/token di posisi error
      const m = /^\S+/.exec(lineText.slice(col));
      if (m && m[0].length <= 3) options.push({ src: withLine(lineText.slice(0, col) + lineText.slice(col + m[0].length)), note: `menghapus "${m[0]}" yang berlebih` });
    }
    if (lineText.trim() && !/^\s*\/\/ \[dilewati\]/.test(lineText) && lineBalanced(lineText)) {
      options.push({ src: withLine('// [dilewati] ' + lineText), note: 'melewati baris ini' });
    }
    const before = pos(loc);
    let chosen = null;
    for (const o of options) { const e2 = errAt(name, o.src); if (!e2) { chosen = o; break; } }
    if (!chosen) for (const o of options) { const e2 = errAt(name, o.src); if (e2 && pos(e2) > before) { chosen = o; break; } }
    if (!chosen) break;
    repairs.push({ line: L, message: loc.message, action: chosen.note, text: lineText.trim().slice(0, 120) });
    src = chosen.src;
  }
  const b = locate(code);
  if (firstErr instanceof FriendlyError && b) { firstErr.line = b.line; firstErr.column = b.column + 1; firstErr.message = b.message; }
  throw firstErr instanceof FriendlyError ? firstErr : new FriendlyError(String(firstErr && firstErr.message || firstErr), { file: name, kind: 'syntax' });
}

/** Lewati satu baris (dipakai saat error terjadi ketika file dijalankan). */
export function skipLine(code, line) {
  const lines = code.split('\n');
  if (!line || line > lines.length) return null;
  const t = lines[line - 1];
  if (!t.trim() || /^\s*\/\/ \[dilewati\]/.test(t)) return null;
  lines[line - 1] = '// [dilewati] ' + t;
  return lines.join('\n');
}

// ---------- 2. Nama/paket tidak dikenal -> pengganti kosong ----------
const missingCache = new Map();
export function makeMissing(name) {
  if (missingCache.has(name)) return missingCache.get(name);
  const fn = function MissingComponent() { return null; };
  Object.defineProperty(fn, 'name', { value: name.replace(/[^\w$]/g, '_') || 'Missing' });
  fn.displayName = name;
  fn.__sakuMissing = true;
  const p = new Proxy(fn, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === Symbol.toPrimitive) return () => '';
      if (typeof k === 'symbol') return undefined;
      if (k === 'then') return undefined; // jangan dianggap Promise
      return makeMissing(`${name}.${k}`);
    },
    apply() { return undefined; },
    construct() { return {}; },
  });
  missingCache.set(name, p);
  return p;
}

export function missingModule(spec) {
  return new Proxy({ __esModule: true }, {
    get(t, k) {
      if (k === '__esModule') return true;
      if (typeof k === 'symbol' || k === 'then') return undefined;
      return makeMissing(k === 'default' ? spec : `${spec}.${k}`);
    },
    has() { return true; },
  });
}

/** Lingkup "with": nama bawaan Remotion/React + nama tidak dikenal menjadi pengganti kosong. */
export function makeScope(globals, file) {
  return new Proxy(globals, {
    has(t, k) {
      if (typeof k !== 'string') return false;
      if (k === 'require' || k === 'module' || k === 'exports' || k === '__g' || k === 'arguments') return false;
      if (k in t) return true;
      if (k in globalThis) return false;
      return true; // nama tidak dikenal: tangani di get()
    },
    get(t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (typeof k !== 'string') return undefined;
      report({ kind: 'missing-name', file, name: k, message: `"${k}" belum dibuat atau belum di-import`, action: 'diganti kosong (tidak tampil)' });
      return makeMissing(k);
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

// ---------- 3. Pelindung per komponen ----------
let libSet = null;
function libraryFunctions() {
  if (libSet) return libSet;
  libSet = new WeakSet();
  const add = (v, depth) => {
    if (!v || (typeof v !== 'function' && typeof v !== 'object')) return;
    if (libSet.has(v)) return;
    libSet.add(v);
    if (depth > 0) {
      let keys = [];
      try { keys = Object.keys(v); } catch { keys = []; }
      for (const k of keys.slice(0, 400)) { let x; try { x = v[k]; } catch { x = null; } if (typeof x === 'function' || (x && typeof x === 'object' && x.$$typeof)) add(x, depth - 1); }
    }
  };
  for (const m of Object.values(BUILTIN)) {
    for (const k of Object.keys(m)) { let v; try { v = m[k]; } catch { v = null; } add(v, 1); }
  }
  return libSet;
}
export function markLibrary(obj) { const s = libraryFunctions(); for (const v of Object.values(obj)) if (typeof v === 'function') s.add(v); }

class SafeBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) {
    const stack = String(err && err.stack || '');
    const m = stack.match(/rr-file:\/*([^:]+):(\d+)/);
    report({ kind: 'render', name: this.props.name, file: m ? m[1] : undefined, line: m ? Math.max(1, Number(m[2]) - 2) : undefined, message: String(err && err.message || err), action: `komponen <${this.props.name}> disembunyikan` });
  }
  componentDidUpdate(prev) { if (this.state.err && prev.children !== this.props.children) this.setState({ err: null }); } // coba lagi di frame berikutnya
  render() { return this.state.err ? null : this.props.children; }
}

const safeCache = new WeakMap();
function safeType(T) {
  if (typeof T !== 'function' || T.__sakuMissing || (T.prototype && T.prototype.isReactComponent)) return T;
  if (libraryFunctions().has(T)) return T;
  if (safeCache.has(T)) return safeCache.get(T);
  const name = T.displayName || T.name || 'Komponen';
  const S = function SafeComponent(props) { return React.createElement(SafeBoundary, { name }, React.createElement(T, props)); };
  S.displayName = name;
  try { Object.assign(S, T); } catch { /* statis opsional */ }
  safeCache.set(T, S);
  libraryFunctions().add(S);
  return S;
}

/** jsx-runtime untuk kode pengguna: setiap komponen buatan pengguna dibungkus pelindung. */
export const safeJsxRuntime = {
  __esModule: true,
  Fragment: JSXRuntime.Fragment,
  jsx: (type, props, key) => JSXRuntime.jsx(safeType(type), props, key),
  jsxs: (type, props, key) => JSXRuntime.jsxs(safeType(type), props, key),
  jsxDEV: (type, props, key) => JSXRuntime.jsx(safeType(type), props, key),
};

// ---------- Pesan error dalam bahasa Indonesia ----------
const EXPLAIN = [
  [/Unexpected token, expected "(.+?)"/i, (m) => `Kurang tanda ${m[1]} di sini`],
  [/Missing semicolon/i, () => 'Kurang titik koma (;) atau ada kata yang tidak pada tempatnya'],
  [/Unexpected token/i, () => 'Ada tanda atau kata yang tidak pada tempatnya'],
  [/Unterminated string/i, () => 'Tanda kutip belum ditutup'],
  [/Unterminated template/i, () => 'Tanda ` (backtick) belum ditutup'],
  [/Unterminated JSX contents/i, () => 'Tag JSX belum ditutup'],
  [/closing tag for <([\w.]+)>/i, (m) => `Tag <${m[1]}> belum ditutup dengan </${m[1]}>`],
  [/Unexpected end of input|Unexpected EOF/i, () => 'Kode berhenti di tengah (mungkin tidak tersalin sampai habis)'],
  [/Identifier '(.+?)' has already been declared/i, (m) => `Nama "${m[1]}" dibuat dua kali`],
  [/(\S+) is not defined/i, (m) => `"${m[1]}" belum dibuat atau belum di-import`],
  [/Cannot read properties of (undefined|null) \(reading '(.+?)'\)/i, (m) => `Data kosong (${m[1]}) saat membaca "${m[2]}"`],
  [/(\S+) is not a function/i, (m) => `"${m[1]}" bukan fungsi`],
  [/inputRange must be (strictly )?monotonically/i, () => 'Angka inputRange pada interpolate() harus naik berurutan'],
  [/outputRange must|inputRange and outputRange/i, () => 'Jumlah angka inputRange dan outputRange pada interpolate() harus sama'],
  [/JSON/i, () => 'Format JSON salah'],
  [/Objects are not valid as a React child/i, () => 'Ada objek yang langsung ditampilkan di JSX'],
  [/Maximum update depth|Too many re-renders/i, () => 'Komponen memperbarui dirinya tanpa henti'],
];
export function explain(msg) {
  const s = String(msg || '');
  for (const [re, fn] of EXPLAIN) { const m = re.exec(s); if (m) return fn(m); }
  return s;
}
