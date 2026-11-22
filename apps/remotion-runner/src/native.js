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
