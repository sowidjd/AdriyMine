// Merapikan kode secara offline dengan Prettier.
import { FriendlyError } from './runtime.js';

async function loadPrettier() {
  if (window.__prettier) return window.__prettier;
  const el = document.getElementById('lazy-prettier');
  if (!el) throw new Error('Perapih kode tidak ditemukan.');
  // eslint-disable-next-line no-new-func
  new Function(el.textContent)();
  return window.__prettier;
}

export async function formatFile(name, code) {
  const { prettier, plugins } = await loadPrettier();
  const parser = /\.css$/i.test(name) ? 'css' : /\.(jsx?|mjs|cjs)$/i.test(name) ? 'babel' : 'typescript';
  try {
    return await prettier.format(code, { parser, plugins, printWidth: 90, singleQuote: true, semi: true, trailingComma: 'all', jsxSingleQuote: false });
  } catch (e) {
    if (parser === 'babel') {
      try { return await prettier.format(code, { parser: 'typescript', plugins, printWidth: 90, singleQuote: true }); } catch { /* laporkan error pertama */ }
    }
    const loc = e.loc && e.loc.start;
    const msg = String(e.message || e).split('\n')[0].replace(/\s*\(\d+:\d+\)\s*$/, '');
    throw new FriendlyError(msg, { file: name, line: loc && loc.line, column: loc && loc.column, kind: 'syntax',
      hint: 'Kode ini belum bisa dirapikan karena ada bagian yang salah tulis. Tekan "Perbaiki dengan AI" atau periksa baris tersebut.' });
  }
}

export async function formatAll(files) {
  const out = [];
  for (const f of files) out.push({ ...f, code: f.code.trim() ? await formatFile(f.name, f.code) : f.code });
  return out;
}
