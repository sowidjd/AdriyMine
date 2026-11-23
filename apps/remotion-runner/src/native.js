// Jembatan ke aplikasi Android (APK). Di browser biasa semua fungsi ini diam saja.
const A = typeof window !== 'undefined' ? window.SakuAndroid : undefined;
export const IS_ANDROID_APP = !!A;

export function readClipboardNative() {
  try { return A && A.readClipboard ? A.readClipboard() : null; } catch { return null; }
}

export function keepScreenOn(on) { try { A && A.keepScreenOn && A.keepScreenOn(!!on); } catch { /* abaikan */ } }

export function openUrl(url) {
  try { if (A && A.openUrl) { A.openUrl(url); return true; } } catch { /* abaikan */ }
  return false;
}

/** Simpan Blob ke folder Movies/Download HP lewat potongan base64. Mengembalikan lokasi file. */
export async function saveBlobNative(blob, filename, onProgress) {
  if (!A || !A.beginFile) throw new Error('Bukan aplikasi Android');
  const id = A.beginFile(filename, blob.type || 'video/mp4');
  if (!id) throw new Error('Gagal membuat file');
  const CH = 768 * 1024; // kelipatan 3 agar base64 tiap potongan utuh
  for (let off = 0; off < blob.size; off += CH) {
    const buf = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    if (!A.appendChunk(id, btoa(bin))) throw new Error('Gagal menulis file');
    onProgress && onProgress(Math.min(1, (off + CH) / blob.size));
  }
  const where = A.finishFile(id);
  if (!where || where.startsWith('ERROR')) throw new Error(where || 'Gagal menyimpan');
  return where;
}

export function shareNative(id) { try { return A && A.shareLast ? A.shareLast() : false; } catch { return false; } }

export function takeSharedText() { try { return A && A.takeSharedText ? A.takeSharedText() : null; } catch { return null; } }

// ---------- HTTP lewat Android (bebas aturan CORS) ----------
const pendingHttp = new Map();
let httpSeq = 0;
if (typeof window !== 'undefined') {
  window.__sakuHttpDone = (id, status, headersJson, body, err) => {
    const p = pendingHttp.get(id);
    if (!p) return;
    pendingHttp.delete(id);
    if (!status) { p.reject(new Error(err || 'Jaringan gagal')); return; }
    let h = {};
    try { h = JSON.parse(headersJson || '{}'); } catch { h = {}; }
    p.resolve({ ok: status >= 200 && status < 300, status, headers: { get: (k) => h[String(k).toLowerCase()] ?? null }, text: async () => body || '', json: async () => JSON.parse(body || 'null') });
  };
}
export const nativeFetch = A && A.httpRequest ? (url, { method = 'GET', headers = {}, body = '', timeout = 120000, signal } = {}) => new Promise((resolve, reject) => {
  const id = 'h' + (++httpSeq);
  pendingHttp.set(id, { resolve, reject });
  if (signal) signal.addEventListener('abort', () => { if (pendingHttp.delete(id)) reject(new Error('Dibatalkan')); }, { once: true });
  try { A.httpRequest(id, method, url, JSON.stringify(headers || {}), body || '', timeout); } catch (e) { pendingHttp.delete(id); reject(e); }
}) : null;

export function writeClipboardNative(text) { try { if (A && A.writeClipboard) { A.writeClipboard(text); return true; } } catch { /* abaikan */ } return false; }
export function openAppNative(pkg) { try { return !!(A && A.openApp && A.openApp(pkg)); } catch { return false; } }
