// AI gratis untuk MEMPERBAIKI kode yang error. Mencoba penyedia satu per satu:
// kalau kuota habis / gagal, otomatis pindah ke penyedia atau model berikutnya.
import { compileFile } from './runtime.js';

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } },
};

/** Daftar penyedia. keyless = gratis tanpa daftar. Sisanya gratis tapi perlu kunci (daftar gratis). */
export const PROVIDERS = [
  { id: 'claude', name: 'Claude (di claude.ai)', kind: 'sample', keyless: true, note: 'Otomatis bila aplikasi dibuka di claude.ai.' },
  { id: 'pollinations', name: 'Pollinations', url: 'https://text.pollinations.ai/openai', models: ['openai', 'openai-fast'], keyless: true, note: 'Gratis tanpa daftar.' },
  { id: 'pollinations-gen', name: 'Pollinations Gen', url: 'https://gen.pollinations.ai/v1/chat/completions', models: ['openai'], keyless: true, note: 'Gratis tanpa daftar (jalur cadangan).' },
  { id: 'llm7', name: 'LLM7', url: 'https://api.llm7.io/v1/chat/completions', models: ['default', 'fast'], keyless: true, note: 'Gratis tanpa daftar, kuota harian.' },
  { id: 'openrouter', name: 'OpenRouter (model gratis)', url: 'https://openrouter.ai/api/v1/chat/completions', modelsUrl: 'https://openrouter.ai/api/v1/models', models: ['openrouter/free'], keyUrl: 'https://openrouter.ai/keys', note: 'Router: memilih sendiri model ":free" yang sedang tersedia.' },
  { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', modelsUrl: 'https://api.groq.com/openai/v1/models', models: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct'], keyUrl: 'https://console.groq.com/keys', note: 'Sangat cepat, kuota gratis harian.' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/models', models: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'], keyUrl: 'https://aistudio.google.com/apikey', note: 'Kuota gratis harian dari Google AI Studio.' },
  { id: 'cerebras', name: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', modelsUrl: 'https://api.cerebras.ai/v1/models', models: ['gpt-oss-120b', 'qwen-3-235b-a22b-instruct-2507', 'llama-3.3-70b'], keyUrl: 'https://cloud.cerebras.ai', note: 'Kuota gratis harian.' },
  { id: 'hf', name: 'Hugging Face', url: 'https://router.huggingface.co/v1/chat/completions', modelsUrl: null, models: ['openai/gpt-oss-120b', 'Qwen/Qwen3-Coder-30B-A3B-Instruct', 'deepseek-ai/DeepSeek-V3.1'], keyUrl: 'https://huggingface.co/settings/tokens', note: 'Kredit gratis bulanan.' },
];

export const getKeys = () => LS.get('rs.ai.keys', {});
export const setKey = (id, key) => { const k = getKeys(); if (key) k[id] = key.trim(); else delete k[id]; LS.set('rs.ai.keys', k); };
const getCool = () => LS.get('rs.ai.cool', {});
const setCool = (id, ms, why) => { const c = getCool(); c[id] = { until: Date.now() + ms, why }; LS.set('rs.ai.cool', c); };
export const clearCooldowns = () => LS.set('rs.ai.cool', {});

let sampleP = null;
function claudeSample() {
  if (!(window.claude && typeof window.claude.use === 'function')) return Promise.resolve(null);
  if (!sampleP) sampleP = Promise.resolve(window.claude.use('sample')).catch(() => null);
  return sampleP;
}

/** Status tiap penyedia untuk ditampilkan. */
export async function providerStatus() {
  const keys = getKeys(); const cool = getCool(); const now = Date.now();
  const hasClaude = !!(await Promise.race([claudeSample(), new Promise((r) => setTimeout(() => r(null), 1500))]));
  return PROVIDERS.map((p) => {
    let state = 'siap';
    if (p.kind === 'sample') state = hasClaude ? 'siap' : 'tidak tersedia';
    else if (!p.keyless && !keys[p.id]) state = 'butuh kunci';
    const c = cool[p.id];
    if (c && c.until > now && state === 'siap') state = c.why === 'key' ? 'kunci ditolak' : `istirahat s/d ${new Date(c.until).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    return { ...p, state, hasKey: !!keys[p.id] };
  });
}

async function discoverModels(p, key) {
  if (!p.modelsUrl || !key) return [];
  const cacheKey = 'rs.ai.models.' + p.id;
  const cached = LS.get(cacheKey, null);
  if (cached && cached.t > Date.now() - 86400000) return cached.list;
  try {
    const r = await fetchT(p.modelsUrl, { headers: { Authorization: 'Bearer ' + key } }, 15000);
    if (!r.ok) return [];
    const j = await r.json();
    let ids = (j.data || j.models || []).map((m) => m.id || m.name).filter(Boolean).map((s) => s.replace(/^models\//, ''));
    if (p.id === 'openrouter') ids = ids.filter((i) => i.endsWith(':free'));
    ids = ids.filter((i) => !/whisper|tts|guard|embed|vision-only|audio|image|moderation|orpheus|playai|compound/i.test(i));
    const rank = (i) => (/coder|gpt-oss-120b|qwen3|kimi|deepseek|llama-3\.3-70b|gemini.*(flash|pro)|nemotron.*(super|ultra)|gemma-4-31b/i.test(i) ? 0 : 1);
    ids.sort((a, b) => rank(a) - rank(b));
    const list = ids.slice(0, 6);
    LS.set(cacheKey, { t: Date.now(), list });
    return list;
  } catch { return []; }
}

function fetchT(url, opts, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  const outer = opts.signal;
  if (outer) outer.addEventListener('abort', () => ac.abort(), { once: true });
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(t));
}

class SkipError extends Error { constructor(msg, cool, why) { super(msg); this.cool = cool; this.why = why; } }

async function callOpenAI(p, model, key, messages, signal) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = 'Bearer ' + key;
  if (p.id === 'openrouter') { headers['X-Title'] = 'Remotion Saku'; }
  const body = { model, messages, temperature: 0.2 };
  if (p.id !== 'pollinations' && p.id !== 'pollinations-gen') body.max_tokens = 16000;
  let r;
  try {
    r = await fetchT(p.url, { method: 'POST', headers, body: JSON.stringify(body), signal }, 150000);
  } catch (e) {
    if (signal && signal.aborted) throw e;
    throw new SkipError('tidak menjawab (waktu habis/jaringan)', 2 * 60000);
  }
  const text = await r.text();
  let j = null; try { j = JSON.parse(text); } catch { /* bukan JSON */ }
  if (!r.ok) {
    const msg = (j && (j.error && (j.error.message || j.error) || j.message)) || text.slice(0, 160);
    if (r.status === 401 || r.status === 403) throw new SkipError('kunci ditolak: ' + msg, 30 * 60000, 'key');
    if (r.status === 429 || r.status === 402 || /quota|limit|credit|insufficient/i.test(String(msg))) {
      const ra = Number(r.headers.get('retry-after')) || (j && j.error && Number(j.error.retry_after)) || 0;
      throw new SkipError('kuota gratis habis', Math.min(24 * 3600e3, Math.max(5 * 60e3, ra * 1000)));
    }
    if (r.status === 404 || r.status === 400) throw new SkipError('model tidak tersedia: ' + String(msg).slice(0, 100), 0, 'model');
    throw new SkipError(`error ${r.status}`, 60000);
  }
  const c = j && j.choices && j.choices[0];
  const content = c && c.message && (c.message.content || c.message.reasoning_content) || (typeof j === 'string' ? j : '');
  if (!content || !String(content).trim()) throw new SkipError('jawaban kosong', 0, 'model');
  return String(content);
}

/** Kirim pesan ke penyedia gratis pertama yang berhasil. onStatus(teks) untuk tampilan. */
export async function askAI(messages, { onStatus = () => {}, signal, validate, exclude = new Set() } = {}) {
  const keys = getKeys(); const cool = getCool(); const now = Date.now();
  const tried = [];
  // Urutan: Claude (bila ada) → penyedia ber-kunci milik pengguna → penyedia tanpa kunci.
  const order = [
    ...PROVIDERS.filter((p) => p.kind === 'sample'),
    ...PROVIDERS.filter((p) => !p.keyless && keys[p.id]),
    ...PROVIDERS.filter((p) => p.keyless && p.kind !== 'sample'),
  ];
  for (const p of order) {
    if (signal && signal.aborted) throw new Error('Dibatalkan.');
    if (exclude.has(p.id)) continue;
    const c = cool[p.id];
    if (c && c.until > now) { tried.push(`${p.name}: masih istirahat`); continue; }
    if (p.kind === 'sample') {
      const sample = await Promise.race([claudeSample(), new Promise((r) => setTimeout(() => r(null), 2500))]);
      if (!sample) continue;
      onStatus(`Bertanya ke ${p.name}…`);
      try {
        const r = await sample(messages.filter((m) => m.role !== 'system').map((m, i) => (i === 0 ? { role: 'user', content: messages.find((x) => x.role === 'system').content + '\n\n' + m.content } : m)), { modelTier: 'default', cache: false, signal });
        const out = { text: r.text, provider: p.name, providerId: p.id, model: 'Claude' };
        if (!validate || validate(out.text)) return out;
        tried.push(`${p.name}: jawaban tidak valid`);
      } catch (e) {
        tried.push(`${p.name}: ${e && (e.message || e.code) || 'gagal'}`);
        if (e && e.code === 'rate_limited') setCool(p.id, 10 * 60000);
      }
      continue;
    }
    const key = keys[p.id];
    const models = [...p.models, ...(await discoverModels(p, key))].filter((m, i, a) => a.indexOf(m) === i).slice(0, 4);
    for (const model of models) {
      onStatus(`Bertanya ke ${p.name} (${model})…`);
      try {
        const text = await callOpenAI(p, model, key, messages, signal);
        if (validate && !validate(text)) { tried.push(`${p.name}/${model}: jawaban tidak valid`); continue; }
        return { text, provider: p.name, providerId: p.id, model };
      } catch (e) {
        if (signal && signal.aborted) throw new Error('Dibatalkan.');
        tried.push(`${p.name}/${model}: ${e.message}`);
        if (e instanceof SkipError && e.why === 'model') continue; // coba model lain di penyedia sama
        if (e instanceof SkipError && e.cool) setCool(p.id, e.cool, e.why);
        break; // pindah penyedia
      }
    }
  }
  const err = new Error('Semua AI gratis sedang tidak bisa dipakai.');
  err.tried = tried;
  throw err;
}

// ---------- Memperbaiki kode ----------

function stripThinking(t) { return t.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*<think>[\s\S]*$/i, ''); }

export function extractCode(text) {
  const t = stripThinking(text);
  const blocks = [...t.matchAll(/```[^\n`]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length) return blocks.sort((a, b) => b.length - a.length)[0];
  if (/\b(import|export)\b/.test(t)) return t.trim() + '\n';
  return null;
}

export function parseEdits(text) {
  const t = stripThinking(text);
  const re = /<{5,}\s*SEARCH\s*\n([\s\S]*?)\n?={5,}\s*\n([\s\S]*?)\n?>{5,}\s*REPLACE/g;
  return [...t.matchAll(re)].map((m) => ({ search: m[1], replace: m[2] }));
}

export function applyEdits(code, edits) {
  let out = code;
  for (const { search, replace } of edits) {
    if (search && out.includes(search)) { out = out.replace(search, () => replace); continue; }
    // Cocokkan per baris dengan mengabaikan spasi di awal/akhir baris
    const lines = out.split('\n');
    const s = search.split('\n').map((l) => l.trim());
    while (s.length && !s[s.length - 1]) s.pop();
    while (s.length && !s[0]) s.shift();
    if (!s.length) return null;
    let at = -1;
    for (let i = 0; i + s.length <= lines.length && at < 0; i++) {
      let ok = true;
      for (let j = 0; j < s.length; j++) if (lines[i + j].trim() !== s[j]) { ok = false; break; }
      if (ok) at = i;
    }
    if (at < 0) return null;
    lines.splice(at, s.length, ...replace.split('\n'));
    out = lines.join('\n');
  }
  return out;
}

const SYSTEM = `Kamu ahli Remotion 4 (video dengan React + TypeScript) yang berjalan di browser.
Tugas: perbaiki kode agar bisa dikompilasi dan diputar tanpa error.
Aturan:
- Pertahankan desain, teks, warna, durasi, dan animasi. Ubah hanya bagian yang perlu.
- Paket yang boleh dipakai: react, remotion, @remotion/* (transitions, shapes, paths, noise, three, media, fonts, google-fonts, lottie, gif, captions, light-leaks, starburst, effects, layout-utils, animation-utils, media-utils, motion-blur, zod-types), three, @react-three/fiber, @react-three/drei, zod. Jangan menambah paket lain.
- Untuk 3D gunakan <ThreeCanvas> dari @remotion/three (bukan <Canvas> dari fiber) dan animasikan dengan useCurrentFrame(), bukan useFrame().
- Jangan pakai Math.random() untuk animasi; pakai random('seed') dari remotion.
- File lain di proyek boleh di-import dengan './NamaFile'.`;

/**
 * Minta AI memperbaiki satu file. Mengembalikan {files, provider, model, note}.
 * files: daftar file baru (sudah lolos kompilasi).
 */
export async function aiFix({ files, error, onStatus, signal }) {
  let idx = files.findIndex((f) => f.name === error.file);
  if (idx < 0) idx = files.findIndex((f) => !/\.css$/i.test(f.name) && f.code.trim());
  if (idx < 0) throw new Error('Tidak ada kode untuk diperbaiki.');
  const target = files[idx];
  const lines = target.code.split('\n');
  const full = lines.length <= 350;
  const others = files.filter((_, i) => i !== idx).map((f) => {
    const ex = [...f.code.matchAll(/export\s+(?:default\s+)?(?:const|function|class|let)?\s*([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
    return `- ${f.name} (export: ${ex.slice(0, 12).join(', ') || '-'})`;
  }).join('\n');
  const loc = error.line ? `${target.name} baris ${error.line}` : target.name;
  const around = error.line ? lines.slice(Math.max(0, error.line - 4), error.line + 3).map((l, i) => `${Math.max(1, error.line - 3) + i}: ${l}`).join('\n') : '';
  let codeForPrompt = target.code;
  if (!full && target.code.length > 60000 && error.line) {
    const a = Math.max(0, error.line - 150), b = Math.min(lines.length, error.line + 150);
    codeForPrompt = lines.slice(0, Math.min(40, a)).join('\n') + '\n// ...\n' + lines.slice(a, b).join('\n') + '\n// ...';
  }
  const ask = full
    ? 'Kirim ULANG SELURUH isi file yang sudah diperbaiki dalam SATU blok ```tsx. Setelah blok kode, tulis satu kalimat singkat bahasa Indonesia tentang apa yang diperbaiki.'
    : 'File ini panjang. JANGAN kirim ulang seluruh file. Kirim hanya blok perubahan dengan format persis:\n<<<<<<< SEARCH\n(baris asli, disalin persis)\n=======\n(baris pengganti)\n>>>>>>> REPLACE\nBoleh lebih dari satu blok. Setelahnya tulis satu kalimat singkat bahasa Indonesia tentang apa yang diperbaiki.';
  let lastErr = '';
  const attempts = [];
  const exclude = new Set();
  const fails = {};
  for (let attempt = 0; attempt < 4; attempt++) {
    const user = `Error: ${error.message}\nLokasi: ${loc}\n${around ? 'Sekitar baris error:\n' + around + '\n' : ''}${lastErr ? '\nPercobaan sebelumnya masih error: ' + lastErr + '\n' : ''}${others ? '\nFile lain di proyek:\n' + others + '\n' : ''}\nIsi file ${target.name}:\n\`\`\`tsx\n${codeForPrompt}\n\`\`\`\n\n${ask}`;
    const messages = [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }];
    let res;
    try { res = await askAI(messages, { onStatus, signal, exclude }); } catch (e) { attempts.push(...(e.tried || [e.message])); break; }
    let candidate = null;
    if (full) candidate = extractCode(res.text);
    else { const ed = parseEdits(res.text); candidate = ed.length ? applyEdits(target.code, ed) : extractCode(res.text); }
    let bad = '';
    if (!candidate || candidate.trim().length < 10) bad = 'jawaban tanpa kode';
    else if (candidate.length < target.code.length * 0.35) bad = 'kode terpotong';
    else { try { compileFile(target.name, candidate); } catch (e) { bad = 'masih error'; lastErr = e.message + (e.line ? ` (baris ${e.line})` : ''); } }
    if (!bad) {
      const note = stripThinking(res.text).replace(/```[\s\S]*?```/g, '').replace(/<{5,}[\s\S]*?>{5,}\s*REPLACE/g, '').trim().split('\n').filter(Boolean).pop() || '';
      return { files: files.map((f, i) => (i === idx ? { ...f, code: candidate } : f)), provider: res.provider, model: res.model, note: note.slice(0, 240) };
    }
    attempts.push(`${res.provider}/${res.model}: ${bad}`);
    fails[res.providerId] = (fails[res.providerId] || 0) + 1;
    if (fails[res.providerId] >= 2 || bad !== 'masih error') exclude.add(res.providerId);
    onStatus(`Hasil ${res.provider} ${bad}, mencoba lagi…`);
  }
  const e = new Error('AI belum berhasil memperbaiki kode ini.');
  e.tried = attempts;
  throw e;
}
