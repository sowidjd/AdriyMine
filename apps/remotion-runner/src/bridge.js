// Penghubung ke Node.js asli (Termux) lewat jembatan saku-bridge di http://127.0.0.1:3737
import * as Native from './native.js';

const BASE = 'http://127.0.0.1:3737';
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } },
};
export const getBridgeToken = () => LS.get('rs.node.token', '');
export const setBridgeToken = (t) => { LS.set('rs.node.token', String(t || '').replace(/\D/g, '').slice(0, 6)); cached = null; };

async function call(path, { method = 'GET', body, timeout = 3000 } = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-saku-token': getBridgeToken() };
  const payload = body ? JSON.stringify(body) : undefined;
  let r;
  if (Native.nativeFetch) r = await Native.nativeFetch(BASE + path, { method, headers, body: payload, timeout });
  else {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeout);
    try { r = await fetch(BASE + path, { method, headers, body: payload, signal: ac.signal }); } finally { clearTimeout(t); }
  }
  const text = await r.text();
  let j = null; try { j = JSON.parse(text); } catch { j = null; }
  if (!r.ok) throw new Error((j && j.error) || `kode ${r.status}`);
  return j;
}

let cached = null;
/** { reachable, paired, node, npm, ... } — tidak pernah melempar error. */
export async function bridgeStatus(force = false) {
  if (!force && cached && cached.t > Date.now() - 20000) return cached.v;
  let v;
  try { v = { reachable: true, ...(await call('/status', { timeout: 1500 })) }; } catch { v = { reachable: false, paired: false }; }
  cached = { t: Date.now(), v };
  return v;
}
export async function bridgeReady() { const s = await bridgeStatus(); return !!(s.reachable && s.paired); }
export const bridgeBundle = (spec, externals) => call('/bundle', { method: 'POST', body: { spec, externals }, timeout: 300000 });
export const bridgeRun = (code) => call('/run', { method: 'POST', body: { code }, timeout: 90000 });
