// Router AI gratis: mencari model gratis yang aktif secara online, memilih yang paling sering berhasil,
// dan pindah otomatis bila satu model sedang ramai, terlalu kecil untuk kode, atau kuotanya habis.
// AI hanya dipakai untuk MEMPERBAIKI kode (tombol "Perbaiki dengan AI").
import { compileFile } from './runtime.js';
import { parse } from '@babel/parser';
import * as Native from './native.js';

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } },
};

/**
 * keyless: bisa dipakai tanpa daftar. nativeOnly: hanya dari APK (layanan tidak mengizinkan halaman web).
 * Model awal hanyalah titik mulai; daftar lengkap dicari online (discover).
 */
export const PROVIDERS = [
  { id: 'claude', name: 'Claude (di claude.ai)', kind: 'sample', keyless: true, note: 'Otomatis bila aplikasi dibuka di claude.ai.' },
  {
    id: 'pollinations', name: 'Pollinations', keyless: true, url: 'https://text.pollinations.ai/openai', models: ['openai', 'openai-fast'], noMaxTokens: true,
    note: 'Gratis tanpa daftar.',
    discover: { url: 'https://text.pollinations.ai/models', pick: (j) => (Array.isArray(j) ? j : []).filter((m) => !m.tier || m.tier === 'anonymous').flatMap((m) => [m.name, ...(m.aliases || []).slice(0, 1)]) },
  },
  {
    id: 'kilo', name: 'Kilo Gateway (router gratis)', keyless: true, nativeOnly: true, url: 'https://ai-gateway.kilo.ai/api/v1/chat/completions', models: ['kilo-auto/free', 'openrouter/free'],
    note: 'Gratis tanpa daftar, memilih sendiri model gratis yang sedang aktif. Hanya di APK.',
    discover: { url: 'https://ai-gateway.kilo.ai/api/v1/models', pick: (j) => (j.data || []).map((m) => m.id).filter((id) => /:free$|^kilo-auto\/free$/.test(id)) },
  },
  {
    id: 'llm7', name: 'LLM7', keyless: true, url: 'https://api.llm7.io/v1/chat/completions', models: ['default', 'fast'],
    note: 'Gratis tanpa daftar, kuota per jam.',
  },
  {
    id: 'ovh', name: 'OVHcloud AI', keyless: true, url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    models: ['gpt-oss-120b', 'Meta-Llama-3_3-70B-Instruct', 'Qwen3.6-27B', 'Mistral-Small-3.2-24B-Instruct-2506', 'gpt-oss-20b'],
    note: 'Gratis tanpa daftar, 2 permintaan per menit untuk tiap model.',
    discover: { url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models', pick: (j) => (j.data || []).filter((m) => (m.context_length || 0) >= 16000).map((m) => m.id).filter((id) => !/embed|bge|tts|guard|vl|translate|summari|clef|omni|olala|whisper|asr|stt/i.test(id)) },
  },
  {
    id: 'openrouter', name: 'OpenRouter (model gratis)', url: 'https://openrouter.ai/api/v1/chat/completions', models: ['openrouter/free'], keyUrl: 'https://openrouter.ai/keys',
    note: 'Router model ":free". Daftar model gratis diperbarui harian dari internet.',
    discover: { url: 'https://raw.githubusercontent.com/ClawLabsAI/free-ai-models/main/data/models.json', pick: (j) => (j.models || []).map((m) => m.id).filter((id) => /:free$/.test(id)) },
  },
  { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', models: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct'], keyUrl: 'https://console.groq.com/keys', note: 'Sangat cepat, kuota gratis harian.',
    discover: { url: 'https://api.groq.com/openai/v1/models', auth: true, pick: (j) => (j.data || []).map((m) => m.id).filter((id) => !/whisper|tts|guard|playai|orpheus|compound|prompt-guard/i.test(id)) } },
  { id: 'gemini', name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', models: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'], keyUrl: 'https://aistudio.google.com/apikey', note: 'Kuota gratis harian dari Google AI Studio.' },
  { id: 'cerebras', name: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', models: ['gpt-oss-120b', 'qwen-3-235b-a22b-instruct-2507', 'llama-3.3-70b'], keyUrl: 'https://cloud.cerebras.ai', note: 'Kuota gratis harian.' },
  { id: 'hf', name: 'Hugging Face', url: 'https://router.huggingface.co/v1/chat/completions', models: ['openai/gpt-oss-120b', 'Qwen/Qwen3-Coder-30B-A3B-Instruct', 'deepseek-ai/DeepSeek-V3.1'], keyUrl: 'https://huggingface.co/settings/tokens', note: 'Kredit gratis bulanan.' },
  { id: 'pollinations-key', name: 'Pollinations (dengan kunci)', url: 'https://gen.pollinations.ai/v1/chat/completions', models: ['openai', 'openai-fast'], keyUrl: 'https://enter.pollinations.ai', note: 'Kunci gratis menaikkan batas Pollinations.' },
];

export const getKeys = () => LS.get('rs.ai.keys', {});
export const setKey = (id, key) => { const k = getKeys(); if (key) k[id] = key.trim(); else delete k[id]; LS.set('rs.ai.keys', k); };

// ---------- Catatan kesehatan tiap model (router belajar dari pengalaman) ----------
const H = () => LS.get('rs.ai.health', {});
function setHealth(key, patch) { const h = H(); h[key] = { ...(h[key] || {}), ...patch }; LS.set('rs.ai.health', h); }
function cooling(key) { const x = H()[key]; return x && x.until && x.until > Date.now() ? x : null; }
function cool(key, ms, why) { setHealth(key, { until: Date.now() + ms, why, lastFail: Date.now(), fails: ((H()[key] || {}).fails || 0) + 1 }); }
function good(key) { setHealth(key, { until: 0, why: '', lastOk: Date.now(), oks: ((H()[key] || {}).oks || 0) + 1 }); }
function score(key) { const x = H()[key] || {}; return (x.lastOk || 0) / 1e9 + (x.oks || 0) * 2 - (x.fails || 0); }
export const clearCooldowns = () => { const h = H(); for (const k of Object.keys(h)) h[k].until = 0; LS.set('rs.ai.health', h); };

// ---------- Mencari model gratis secara online ----------
let catalogP = null;
export function refreshCatalog(force = false) {
  if (catalogP && !force) return catalogP;
  const cat = LS.get('rs.ai.catalog', { t: 0, models: {} });
  if (!force && cat.t > Date.now() - 6 * 3600e3) { catalogP = Promise.resolve(cat); return catalogP; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { catalogP = Promise.resolve(cat); return catalogP; }
  const keys = getKeys();
  catalogP = Promise.all(PROVIDERS.filter((p) => p.discover && (!p.nativeOnly || Native.IS_ANDROID_APP) && (!p.discover.auth || keys[p.id])).map(async (p) => {
    try {
      const r = await httpFetch(p.discover.url, { headers: p.discover.auth ? { Authorization: 'Bearer ' + keys[p.id] } : {}, timeout: 10000 });
      if (!r.ok) return;
      const list = p.discover.pick(JSON.parse(await r.text())).filter(Boolean);
      if (list.length) cat.models[p.id] = [...new Set(list)].slice(0, 12);
    } catch { /* tetap pakai daftar lama */ }
  })).then(() => { cat.t = Date.now(); LS.set('rs.ai.catalog', cat); return cat; });
  return catalogP;
}
const catalog = () => LS.get('rs.ai.catalog', { t: 0, models: {} });

// ---------- HTTP (di APK lewat Android agar tidak terhalang aturan CORS) ----------
async function httpFetch(url, { method = 'GET', headers = {}, body, timeout = 120000, signal } = {}) {
  if (Native.IS_ANDROID_APP && Native.nativeFetch) return Native.nativeFetch(url, { method, headers, body, timeout, signal });
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  if (signal) signal.addEventListener('abort', () => ac.abort(), { once: true });
  try { return await fetch(url, { method, headers, body, signal: ac.signal }); } finally { clearTimeout(t); }
}

let sampleP = null;
function claudeSample() {
  if (!(window.claude && typeof window.claude.use === 'function') || Native.IS_ANDROID_APP) return Promise.resolve(null);
  if (!sampleP) sampleP = Promise.resolve(window.claude.use('sample')).catch(() => null);
  return sampleP;
}

/** Status tiap penyedia untuk tampilan. */
export async function providerStatus() {
  const keys = getKeys();
  const hasClaude = !!(await Promise.race([claudeSample(), new Promise((r) => setTimeout(() => r(null), 1500))]));
  const cat = catalog();
  return PROVIDERS.map((p) => {
    let state = 'siap';
    if (p.kind === 'sample') state = hasClaude ? 'siap' : 'tidak tersedia';
    else if (p.nativeOnly && !Native.IS_ANDROID_APP) state = 'hanya di APK';
    else if (!p.keyless && !keys[p.id]) state = 'butuh kunci';
    const c = cooling(p.id);
    if (c && state === 'siap') state = `${c.why} s/d ${new Date(c.until).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const models = [...new Set([...(p.models || []), ...(cat.models[p.id] || [])])];
    return { ...p, state, hasKey: !!keys[p.id], modelCount: models.length };
  });
}

// ---------- Membaca jawaban/eror penyedia dengan benar ----------
class AIFail extends Error { constructor(why, scope, ms, extra = {}) { super(why); this.why = why; this.scope = scope; this.ms = ms; Object.assign(this, extra); } }

function classify(status, text, headers) {
  let j = null; try { j = JSON.parse(text); } catch { /* bukan JSON */ }
  const msg = String((j && (j.error && (j.error.message || j.error) || j.message)) || text || '').slice(0, 300);
  const ra = Number(headers && headers.get && headers.get('retry-after')) || (j && j.error && Number(j.error.retry_after)) || 0;
  const quotaWords = /quota|daily|per day|allowance|credit|balance|exceeded your|insufficient|billing|subscription/i;
  const rateWords = /rate.?limit|too many|per minute|rpm|slow down|busy|queue|capacity|overload/i;
  if (status === 401 || status === 403) return new AIFail(/cookie|api key|unauthorized|token|auth/i.test(msg) ? 'perlu kunci' : 'ditolak', 'provider', 6 * 3600e3, { detail: msg });
  if (status === 402) return new AIFail('perlu saldo', 'provider', 6 * 3600e3, { detail: msg });
  if (status === 429) {
    if (quotaWords.test(msg) && !rateWords.test(msg)) return new AIFail('kuota habis', 'provider', Math.max(30 * 60e3, ra * 1000), { detail: msg });
    return new AIFail('sedang ramai', 'model', Math.max(20e3, Math.min(ra || 45, 600) * 1000), { detail: msg, retryAfter: ra });
  }
  if ((status === 400 || status === 413 || status === 422) && /context|too long|too large|maximum|max_tokens|token|length|payload/i.test(msg)) return new AIFail('kode terlalu panjang untuk model ini', 'model', 10 * 60e3, { detail: msg, tooLong: true });
  if (status === 404 || ((status === 400 || status === 422) && /model/i.test(msg))) return new AIFail('model tidak tersedia', 'model', 24 * 3600e3, { detail: msg });
  if (status >= 500) return new AIFail('server sedang gangguan', 'model', 2 * 60e3, { detail: msg });
  return new AIFail(`gagal (kode ${status})`, 'model', 60e3, { detail: msg });
}

async function callModel(p, model, key, messages, { signal, maxTokens }) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = 'Bearer ' + key;
  if (p.id === 'openrouter' || p.id === 'kilo') headers['X-Title'] = 'Remotion Saku';
  const body = { model, messages, temperature: 0.1 };
  if (!p.noMaxTokens) body.max_tokens = maxTokens;
  let r;
  try {
    r = await httpFetch(p.url, { method: 'POST', headers, body: JSON.stringify(body), signal, timeout: 150000 });
  } catch (e) {
    if (signal && signal.aborted) throw e;
    throw new AIFail('tidak menjawab (jaringan/waktu habis)', 'model', 30e3);
  }
  const text = await r.text();
  if (!r.ok) throw classify(r.status, text, r.headers);
  let j = null; try { j = JSON.parse(text); } catch { /* kadang teks biasa */ }
  const c = j && j.choices && j.choices[0];
  const content = c && c.message ? (c.message.content || '') : (j ? '' : text);
  if (!String(content).trim()) {
    throw new AIFail(c && c.finish_reason === 'length' ? 'jawaban terpotong (model kehabisan ruang)' : 'jawaban kosong', 'model', 60e3);
  }
  return String(content);
}

/**
 * Bertanya ke AI gratis. Mencoba model satu per satu sampai ada yang menjawab.
 * onAttempt({provider, model, ok, why}) dipanggil untuk setiap percobaan (ditampilkan ke pengguna).
 */
export async function askAI(messages, { onStatus = () => {}, onAttempt = () => {}, signal, exclude = new Set(), maxTokens = 6000, budget = 14 } = {}) {
  const keys = getKeys();
  onStatus('Mencari model AI gratis yang aktif…');
  await Promise.race([refreshCatalog(), new Promise((r) => setTimeout(r, 4000))]);
  const cat = catalog();
  const usable = (p) => p.kind !== 'sample' && (!p.nativeOnly || Native.IS_ANDROID_APP) && (p.keyless || keys[p.id]) && !exclude.has(p.id);
  const keyed = PROVIDERS.filter((p) => !p.keyless && usable(p));
  const free = PROVIDERS.filter((p) => p.keyless && usable(p)).sort((a, b) => score(b.id) - score(a.id));
  const queue = [];
  for (const p of [...keyed, ...free]) {
    const models = [...new Set([...(p.models || []), ...(cat.models[p.id] || [])])].sort((a, b) => score(`${p.id}|${b}`) - score(`${p.id}|${a}`));
    queue.push({ p, models });
  }
  const tried = [];
  // Claude (bila dibuka di claude.ai) dicoba paling awal.
  if (!exclude.has('claude')) {
    const sample = await Promise.race([claudeSample(), new Promise((r) => setTimeout(() => r(null), 2500))]);
    if (sample) {
      onStatus('Bertanya ke Claude…');
      try {
        const sys = messages.find((m) => m.role === 'system');
        const r = await sample(messages.filter((m) => m.role !== 'system').map((m, i) => (i === 0 && sys ? { role: 'user', content: sys.content + '\n\n' + m.content } : m)), { modelTier: 'default', cache: false, signal });
        onAttempt({ provider: 'Claude', model: '', ok: true });
        return { text: r.text, provider: 'Claude', providerId: 'claude', model: 'Claude', tried };
      } catch (e) {
        const why = e && e.code === 'rate_limited' ? 'sedang ramai' : (e && (e.message || e.code)) || 'gagal';
        tried.push({ provider: 'Claude', model: '', why }); onAttempt({ provider: 'Claude', model: '', ok: false, why });
      }
    }
  }
  let calls = 0;
  for (const { p, models } of queue) {
    if (cooling(p.id)) { const c = cooling(p.id); tried.push({ provider: p.name, model: '', why: `${c.why} (dilewati)` }); continue; }
    for (const model of models.slice(0, 6)) {
      if (signal && signal.aborted) throw new Error('Dibatalkan.');
      if (calls >= budget) break;
      const mk = `${p.id}|${model}`;
      if (cooling(mk)) continue;
      calls++;
      onStatus(`Bertanya ke ${p.name} · ${model}…`);
      const t0 = Date.now();
      try {
        let text;
        try { text = await callModel(p, model, keys[p.id], messages, { signal, maxTokens }); } catch (e) {
          // Ramai sebentar: tunggu sesuai permintaan server lalu coba sekali lagi.
          if (e instanceof AIFail && e.why === 'sedang ramai' && e.retryAfter && e.retryAfter <= 12) {
            onStatus(`${p.name} sedang ramai, menunggu ${e.retryAfter} detik…`);
            await new Promise((r) => setTimeout(r, e.retryAfter * 1000 + 300));
            text = await callModel(p, model, keys[p.id], messages, { signal, maxTokens });
          } else throw e;
        }
        good(mk); good(p.id);
        onAttempt({ provider: p.name, model, ok: true, ms: Date.now() - t0 });
        return { text, provider: p.name, providerId: p.id, model, tried };
      } catch (e) {
        if (signal && signal.aborted) throw new Error('Dibatalkan.');
        const f = e instanceof AIFail ? e : new AIFail(String(e && e.message || e), 'model', 30e3);
        tried.push({ provider: p.name, model, why: f.why });
        onAttempt({ provider: p.name, model, ok: false, why: f.why });
        if (f.scope === 'provider') { cool(p.id, f.ms, f.why); break; }
        if (f.ms) cool(mk, f.ms, f.why);
      }
    }
  }
  const err = new Error(navigator.onLine === false ? 'HP sedang tidak terhubung ke internet.' : 'Belum ada AI gratis yang bisa menjawab saat ini.');
  err.tried = tried;
  throw err;
}

// ---------- Memperbaiki kode tanpa meringkas ----------
const PLACEHOLDER = /(\/\/|\/\*|\{\/\*)\s*(\.\.\.|…)|\b(rest of (the )?(code|file)|remaining code|unchanged|same as (before|above)|existing code|sisanya|kode lainnya|tetap sama|tidak berubah|dan seterusnya)\b/i;

function stripThinking(t) { return String(t).replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*<think>[\s\S]*$/i, ''); }
const stripNum = (l) => l.replace(/^\s{0,3}\d{1,6}\s?[|:]\s?/, '');

/** Format GANTI a-b ... SELESAI / SISIP n ... SELESAI */
export function parsePatches(text) {
  const t = stripThinking(text).replace(/```[a-z]*\n?/gi, '');
  const lines = t.split('\n');
  const out = [];
  let cur = null;
  for (const raw of lines) {
    const head = /^\s*\**\s*(GANTI|REPLACE|SISIP|INSERT)\s+(?:baris\s+)?(\d+)\s*(?:[-–]\s*(\d+))?\s*:?\**\s*$/i.exec(raw);
    if (head) {
      if (cur) out.push(cur);
      const ins = /SISIP|INSERT/i.test(head[1]);
      cur = { start: Number(head[2]), end: ins ? Number(head[2]) : Number(head[3] || head[2]), insert: ins, lines: [] };
      continue;
    }
    if (/^\s*\**\s*(SELESAI|END|DONE)\s*\**\s*$/i.test(raw)) { if (cur) { out.push(cur); cur = null; } continue; }
    if (cur) cur.lines.push(stripNum(raw));
  }
  if (cur) out.push(cur);
  return out.map((p) => { while (p.lines.length && !p.lines[p.lines.length - 1].trim()) p.lines.pop(); return p; });
}

export function applyPatches(code, patches) {
  const lines = code.split('\n');
  const sorted = [...patches].sort((a, b) => b.start - a.start);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].end >= sorted[i - 1].start && !sorted[i - 1].insert) return null; // tumpang tindih
  for (const p of sorted) {
    if (p.start < 1 || p.start > lines.length + 1 || p.end < p.start - 1 || p.end > lines.length) return null;
    if (PLACEHOLDER.test(p.lines.join('\n')) && !PLACEHOLDER.test(lines.slice(p.start - 1, p.end).join('\n'))) return null;
    if (p.insert) lines.splice(p.start, 0, ...p.lines);
    else lines.splice(p.start - 1, p.end - p.start + 1, ...p.lines);
  }
  return lines.join('\n');
}

/** Format lama SEARCH/REPLACE sebagai cadangan. */
function parseSearchReplace(text) {
  const re = /<{5,}\s*SEARCH\s*\n([\s\S]*?)\n?={5,}\s*\n([\s\S]*?)\n?>{5,}\s*REPLACE/g;
  return [...stripThinking(text).matchAll(re)].map((m) => ({ search: m[1], replace: m[2] }));
}
function applySearchReplace(code, edits) {
  let out = code;
  for (const { search, replace } of edits) {
    if (PLACEHOLDER.test(replace) && !PLACEHOLDER.test(search)) return null;
    if (search && out.includes(search)) { out = out.replace(search, () => replace); continue; }
    const lines = out.split('\n');
    const s = search.split('\n').map((l) => l.trim()).filter((l, i, a) => l || (i > 0 && i < a.length - 1));
    if (!s.length) return null;
    let at = -1;
    for (let i = 0; i + s.length <= lines.length && at < 0; i++) { let ok = true; for (let j = 0; j < s.length; j++) if (lines[i + j].trim() !== s[j]) { ok = false; break; } if (ok) at = i; }
    if (at < 0) return null;
    lines.splice(at, s.length, ...replace.split('\n'));
    out = lines.join('\n');
  }
  return out;
}

function fullFileCandidate(text, original) {
  const blocks = [...stripThinking(text).matchAll(/```[^\n`]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (!blocks.length) return null;
  const c = blocks.sort((a, b) => b.length - a.length)[0];
  if (PLACEHOLDER.test(c) && !PLACEHOLDER.test(original)) return null;
  // Anti-meringkas: hampir semua baris asli harus tetap ada.
  const orig = original.split('\n').map((l) => l.trim()).filter((l) => l.length > 3);
  const have = new Set(c.split('\n').map((l) => l.trim()));
  const kept = orig.filter((l) => have.has(l)).length;
  if (orig.length > 8 && kept / orig.length < 0.8) return null;
  return c;
}

function syntaxProblem(name, code) {
  try { compileFile(name, code); } catch (e) { return `${e.message}${e.line ? ` (baris ${e.line})` : ''}`; }
  try {
    const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: true });
    if (ast.errors && ast.errors.length) { const e = ast.errors[0]; return `${e.message}`; }
  } catch (e) { return e.message; }
  return null;
}

const SYSTEM = `Kamu ahli Remotion 4 (video dengan React + TypeScript) yang berjalan di browser.
Tugas: perbaiki kesalahan yang disebutkan agar kode bisa diputar. Pertahankan desain, teks, warna, durasi, dan animasi.
Paket yang boleh: react, remotion, @remotion/* (transitions, shapes, paths, noise, three, media, fonts, google-fonts, lottie, gif, captions, effects, layout-utils, animation-utils, media-utils, motion-blur), @saku/3d (Canvas3D, Studio, Effects, Cutaway, Label3D, CameraPath, OrbitCamera, Turntable, Model), three, @react-three/fiber, @react-three/drei, zod.
FORMAT JAWABAN (wajib): hanya blok perbaikan berikut, tanpa penjelasan panjang.
GANTI <baris-awal>-<baris-akhir>
<baris kode pengganti, TANPA nomor baris>
SELESAI
- Nomor baris mengacu pada kode bernomor yang diberikan.
- Untuk menambah baris baru setelah baris N tanpa menghapus apa pun: SISIP <N> ... SELESAI
- Untuk menghapus baris: GANTI a-b lalu langsung SELESAI.
- Ganti sesedikit mungkin baris. JANGAN menulis ulang seluruh file, JANGAN meringkas, JANGAN memakai "..." atau komentar "sisanya sama".
- Setelah semua blok, tulis satu kalimat bahasa Indonesia tentang apa yang diperbaiki.`;

function numbered(lines, from, to) {
  const out = [];
  for (let i = from; i <= to; i++) out.push(`${i}| ${lines[i - 1]}`);
  return out.join('\n');
}

function excerpt(code, problemLines) {
  const lines = code.split('\n');
  if (lines.length <= 400) return numbered(lines, 1, lines.length);
  const keep = new Set();
  for (let i = 1; i <= Math.min(30, lines.length); i++) keep.add(i);
  for (const L of problemLines.length ? problemLines : [1]) for (let i = Math.max(1, L - 45); i <= Math.min(lines.length, L + 45); i++) keep.add(i);
  const nums = [...keep].sort((a, b) => a - b);
  const parts = [];
  let prev = 0;
  for (const n of nums) { if (n !== prev + 1 && prev) parts.push(`(baris ${prev + 1}–${n - 1} tidak ditampilkan, JANGAN diubah)`); parts.push(`${n}| ${lines[n - 1]}`); prev = n; }
  if (prev < lines.length) parts.push(`(baris ${prev + 1}–${lines.length} tidak ditampilkan, JANGAN diubah)`);
  return parts.join('\n');
}

/**
 * Memperbaiki satu file berdasarkan daftar masalah [{line, message}].
 * Mengembalikan { code, provider, model, note }.
 */
export async function aiFixFile({ file, problems, otherFiles = [], onStatus, onAttempt, signal }) {
  const name = file.name;
  let code = file.code;
  const lines = code.split('\n');
  // Masalah tanpa nomor baris: cari baris yang menyebut namanya.
  const problemLines = problems.map((p) => {
    if (p.line) return p.line;
    const nm = (p.name || (/"([\w$.]+)"/.exec(p.message) || [])[1] || '').split('.')[0];
    if (!nm) return 0;
    const i = lines.findIndex((l) => new RegExp(`\\b${nm.replace(/[$]/g, '\\$')}\\b`).test(l));
    return i >= 0 ? i + 1 : 0;
  }).filter(Boolean);
  const others = otherFiles.map((f) => {
    const ex = [...f.code.matchAll(/export\s+(?:default\s+)?(?:const|function|class|let)?\s*([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
    return `- ${f.name} (export: ${ex.slice(0, 12).join(', ') || '-'})`;
  }).join('\n');
  const exclude = new Set();
  const fails = {};
  const attempts = [];
  let feedback = '';
  for (let round = 0; round < 4; round++) {
    const list = problems.map((p) => `- ${p.line ? `baris ${p.line}: ` : ''}${p.message}`).join('\n');
    const user = `File: ${name} (${lines.length} baris)\nMasalah yang harus diperbaiki:\n${list}\n${feedback ? '\nPerbaikan sebelumnya belum berhasil: ' + feedback + '\n' : ''}${others ? '\nFile lain di proyek:\n' + others + '\n' : ''}\nKode bernomor:\n${excerpt(code, problemLines)}\n\nKirim blok GANTI/SISIP sekarang.`;
    let res;
    try {
      res = await askAI([{ role: 'system', content: SYSTEM }, { role: 'user', content: user }], { onStatus, onAttempt, signal, exclude, maxTokens: 6000 });
    } catch (e) { (e.tried || []).forEach((t) => attempts.push(t)); if (!attempts.length) attempts.push({ provider: '-', model: '', why: e.message }); const err = new Error(e.message); err.tried = attempts; throw err; }
    res.tried.forEach((t) => attempts.push(t));
    let candidate = null;
    const patches = parsePatches(res.text);
    if (patches.length) candidate = applyPatches(code, patches);
    if (!candidate) { const sr = parseSearchReplace(res.text); if (sr.length) candidate = applySearchReplace(code, sr); }
    if (!candidate && lines.length <= 200) candidate = fullFileCandidate(res.text, code);
    let bad = '';
    if (!candidate) bad = patches.length ? 'blok perbaikan tidak cocok dengan kode' : 'jawaban tidak berisi perbaikan';
    else if (candidate === code) bad = 'tidak ada yang diubah';
    else { const sp = syntaxProblem(name, candidate); if (sp) { bad = 'hasilnya masih salah tulis'; feedback = sp; } }
    if (!bad) {
      const note = stripThinking(res.text).replace(/(GANTI|SISIP)[\s\S]*?SELESAI/gi, '').replace(/```[\s\S]*?```/g, '').trim().split('\n').filter((l) => l.trim()).pop() || '';
      return { code: candidate, provider: res.provider, model: res.model, note: note.slice(0, 200), tried: attempts };
    }
    attempts.push({ provider: res.provider, model: res.model, why: bad });
    onAttempt && onAttempt({ provider: res.provider, model: res.model, ok: false, why: bad });
    fails[res.providerId] = (fails[res.providerId] || 0) + 1;
    if (fails[res.providerId] >= 2) exclude.add(res.providerId);
    if (bad !== 'hasilnya masih salah tulis') feedback = `jawaban sebelumnya ${bad}; ikuti FORMAT JAWABAN dengan tepat.`;
    onStatus && onStatus(`Jawaban ${res.provider} ${bad}, mencoba lagi…`);
  }
  const e = new Error('AI belum berhasil memperbaiki kode ini.');
  e.tried = attempts;
  throw e;
}
