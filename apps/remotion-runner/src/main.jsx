import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
import { renderMediaOnWeb, canRenderMediaOnWeb, renderStillOnWeb } from '@remotion/web-renderer';
import { runProject, splitPasted, cleanText, FriendlyError, toFriendly, onIssues, getIssues } from './runtime.js';
import { compileTolerant, explain } from './tolerant.js';
import { SAMPLE_SINGLE, SAMPLE_MULTI, SAMPLE_3D, SAMPLE_SAINS } from './samples.js';
import { aiFixFile, providerStatus, getKeys, setKey, clearCooldowns, refreshCatalog } from './ai.js';
import { formatAll } from './format.js';
import * as Native from './native.js';
import { FormatPanel, applyFormat, DEFAULT_FORMAT, formatName } from './videoformat.jsx';

// ---------- Penyimpanan aman (tidak pernah membuat aplikasi gagal) ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
const idb = (() => {
  let dbp = null;
  const open = () => {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('remotion-saku', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('aset');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    }).catch(() => null);
    return dbp;
  };
  const tx = async (mode, fn) => {
    const db = await open(); if (!db) return null;
    return new Promise((res) => {
      try {
        const t = db.transaction('aset', mode); const st = t.objectStore('aset');
        const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => res(null);
      } catch { res(null); }
    });
  };
  return {
    put: (k, v) => tx('readwrite', (s) => s.put(v, k)),
    del: (k) => tx('readwrite', (s) => s.delete(k)),
    all: async () => {
      const db = await open(); if (!db) return [];
      return new Promise((res) => {
        try {
          const out = []; const c = db.transaction('aset').objectStore('aset').openCursor();
          c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); };
          c.onerror = () => res([]);
        } catch { res([]); }
      });
    },
  };
})();

const downloadsP = (typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function')
  ? Promise.resolve(window.claude.use('downloads')).catch(() => null)
  : Promise.resolve(null);
const IN_ARTIFACT = !!(window.claude && window.claude.use) && !Native.IS_ANDROID_APP;

const DEFAULT_SETTINGS = { width: 1080, height: 1920, fps: 30, seconds: 10, override: false };

const fmtBytes = (n) => (n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB');
const fmtSec = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m ? `${m} mnt ${s % 60} dtk` : `${s} dtk`; };

// ---------- Ikon kecil (SVG) ----------
const I = {
  code: <path d="M8 6 2 12l6 6M16 6l6 6-6 6" />,
  play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></>,
  paste: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  down: <path d="M12 4v12M6 10l6 6 6-6M5 20h14" />,
  share: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></>,
  wand: <><path d="m4 20 11-11M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.6 1.4L21 13l-1.4.6L19 15l-.6-1.4L17 13l1.4-.6z" /></>,
  brush: <><path d="M4 6h16M4 10h10M4 14h16M4 18h8" /></>,
  more: <><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></>,
};
const Icon = ({ n, s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[n]}</svg>
);

// ---------- Penahan error tampilan ----------
class Guard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { this.props.onError && this.props.onError(err); }
  render() {
    if (this.state.err) {
      return this.props.fallback ? this.props.fallback(this.state.err, () => this.setState({ err: null })) : (
        <div className="card err"><b>Ada yang tidak beres.</b><p>{String(this.state.err.message || this.state.err)}</p>
          <button className="btn" onClick={() => this.setState({ err: null })}>Coba lagi</button></div>
      );
    }
    return this.props.children;
  }
}

// ---------- Editor kode dengan nomor baris ----------
function CodeEditor({ value, onChange, onSmartPaste, taRef, wrap }) {
  const gutter = useRef(null);
  const lines = useMemo(() => {
    const n = (value.match(/\n/g) || []).length + 1;
    let s = ''; for (let i = 1; i <= n; i++) s += i + '\n';
    return s;
  }, [value]);
  const sync = () => { if (gutter.current && taRef.current) gutter.current.scrollTop = taRef.current.scrollTop; };
  return (
    <div className={'editor' + (wrap ? ' wrap' : '')}>
      {!wrap && <pre className="gutter" ref={gutter} aria-hidden="true">{lines}</pre>}
      <textarea
        id="kode"
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={sync}
        onPaste={(e) => {
          const t = e.clipboardData && e.clipboardData.getData('text');
          if (!t) return;
          const ta = e.currentTarget;
          const all = ta.value.trim() === '' || (ta.selectionStart === 0 && ta.selectionEnd === ta.value.length);
          if (all && onSmartPaste(t)) e.preventDefault();
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        wrap={wrap ? 'soft' : 'off'}
        placeholder={'Tempel kode Remotion di sini…\n\nBisa satu file atau banyak file sekaligus.\nTandai tiap file dengan baris seperti:\n// src/Root.tsx'}
        aria-label="Kode Remotion"
      />
    </div>
  );
}

// ---------- Aplikasi ----------
function App() {
  const [files, setFiles] = useState(() => {
    const f = LS.get('rs.files', null);
    return Array.isArray(f) && f.length && f.every((x) => x && typeof x.name === 'string' && typeof x.code === 'string') ? f : [{ name: 'Video.tsx', code: SAMPLE_SINGLE }];
  });
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState('kode');
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...LS.get('rs.settings', {}) }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // {entries, warnings, key}
  const [sel, setSel] = useState(0);
  const [toast, setToast] = useState(null);
  const [undo, setUndo] = useState(null);
  const [assets, setAssets] = useState({}); // name -> {url, size, type}
  const [wrap, setWrap] = useState(() => LS.get('rs.wrap', false));
  const [confirmClear, setConfirmClear] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [ai, setAi] = useState(null); // {busy, status, error, tried}
  const [format, setFormat] = useState(() => ({ ...DEFAULT_FORMAT, ...LS.get('rs.format', {}) }));
  const [issues, setIssues] = useState([]);
  useEffect(() => onIssues(setIssues), []);
  useEffect(() => { LS.set('rs.format', format); }, [format]);
  const aiAbort = useRef(null);
  const taRef = useRef(null);
  const toastT = useRef(null);

  const say = useCallback((msg, action) => {
    clearTimeout(toastT.current);
    setToast({ msg, action });
    toastT.current = setTimeout(() => setToast(null), action ? 7000 : 3200);
  }, []);

  // Simpan otomatis
  useEffect(() => { const t = setTimeout(() => { if (!LS.set('rs.files', files)) { /* penyimpanan penuh/terblokir */ } }, 400); return () => clearTimeout(t); }, [files]);
  useEffect(() => { LS.set('rs.settings', settings); }, [settings]);
  useEffect(() => { LS.set('rs.wrap', wrap); }, [wrap]);
  useEffect(() => { if (active >= files.length) setActive(Math.max(0, files.length - 1)); }, [files, active]);

  // Aset dari penyimpanan
  useEffect(() => {
    idb.all().then((rows) => {
      if (!rows || !rows.length) return;
      const o = {};
      for (const [k, v] of rows) { try { o[k] = { url: URL.createObjectURL(v), size: v.size, type: v.type }; } catch { /* lewati */ } }
      setAssets((a) => ({ ...o, ...a }));
    });
  }, []);

  // Tangkap error tak terduga agar tidak layar putih
  useEffect(() => {
    const onErr = (e) => {
      const err = e.reason || e.error || e;
      const msg = (err && err.message) || String(err && err.type || err);
      if (/ResizeObserver loop/.test(msg)) return;
      say('Peringatan: ' + msg.slice(0, 160));
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onErr);
    return () => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr); };
  }, [say]);

  const run = useCallback(async (fs = files, st = settings) => {
    setBusy(true); setError(null); setPlayerError(null);
    LS.set('rs.running', Date.now());
    await new Promise((r) => setTimeout(r, 30)); // beri waktu tampilan "memproses"
    try {
      const assetUrls = Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, v.url]));
      const r = await runProject(fs, { assets: assetUrls, settings: st });
      setResult({ ...r, key: Date.now() });
      setSel((s) => (s < r.entries.length ? s : 0));
      setTab('putar');
    } catch (e) {
      const fe = e instanceof FriendlyError ? e : toFriendly(e);
      setError(fe);
      setTab('kode');
      if (fe.file) { const i = fs.findIndex((f) => f.name === fe.file); if (i >= 0) setActive(i); }
    } finally {
      LS.set('rs.running', 0);
      setBusy(false);
    }
  }, [files, settings, assets]);

  // Jalankan otomatis saat dibuka, kecuali sesi lalu macet di tengah jalan.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return; booted.current = true;
    const last = LS.get('rs.running', 0);
    if (last) { LS.set('rs.running', 0); say('Kode terakhir membuat aplikasi macet, jadi tidak dijalankan otomatis. Periksa kodenya lalu tekan Jalankan.'); return; }
    run();
  }, [run, say]);

  const replaceAll = (text, label) => {
    const parts = splitPasted(text, files[active]?.name || 'Video.tsx');
    if (!parts.length || !parts.some((p) => p.code.trim())) return false;
    setUndo(files);
    setFiles(parts); setActive(0); setError(null);
    say(parts.length > 1 ? `${label || 'Ditempel'}: ${parts.length} file terdeteksi.` : `${label || 'Ditempel'}: ${parts[0].code.split('\n').length} baris.`, 'undo');
    return true;
  };
  // Teks/kode yang dibagikan dari aplikasi lain (APK Android)
  const replaceAllRef = useRef(null);
  replaceAllRef.current = replaceAll;
  useEffect(() => {
    const handle = () => { const t = Native.takeSharedText(); if (t && t.trim()) { replaceAllRef.current(t, 'Kode diterima'); setTab('kode'); } };
    window.__sakuIncoming = handle;
    handle();
    return () => { if (window.__sakuIncoming === handle) delete window.__sakuIncoming; };
  }, []);

  const smartPaste = (t) => {
    const cleaned = cleanText(t);
    const parts = splitPasted(cleaned, files[active]?.name || 'Video.tsx');
    if (parts.length > 1 || /^\s*```/m.test(cleaned) || files.length > 1) { return replaceAll(cleaned); }
    // Satu file: ganti isi file aktif saja
    setUndo(files);
    setFiles((fs) => fs.map((f, i) => (i === active ? { ...f, code: parts[0].code } : f)));
    setError(null);
    say(`Ditempel: ${parts[0].code.split('\n').length} baris.`, 'undo');
    return true;
  };

  const pasteButton = async () => {
    try {
      let t = Native.readClipboardNative();
      if (t == null) {
        if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error('no');
        t = await navigator.clipboard.readText();
      }
      if (!t || !t.trim()) throw new Error('kosong');
      replaceAll(t);
    } catch {
      // Browser menolak membaca clipboard: kosongkan kolom lalu minta tempel manual.
      setUndo(files);
      setFiles([{ name: files[active]?.name || 'Video.tsx', code: '' }]); setActive(0);
      setTimeout(() => taRef.current && taRef.current.focus(), 50);
      say('Kolom sudah dikosongkan. Tekan lama di kolom kode, lalu pilih "Tempel".', 'undo');
    }
  };

  const updateCode = (v) => setFiles((fs) => fs.map((f, i) => (i === active ? { ...f, code: v } : f)));
  const addFile = () => {
    let n = 2; while (files.some((f) => f.name === `File${n}.tsx`)) n++;
    setFiles([...files, { name: `File${n}.tsx`, code: '' }]); setActive(files.length);
  };
  const renameFile = (i, name) => {
    name = name.trim().replace(/^\.?\//, '');
    if (!name) return;
    if (!/\.\w+$/.test(name)) name += '.tsx';
    if (files.some((f, j) => j !== i && f.name.toLowerCase() === name.toLowerCase())) { say('Nama file sudah dipakai.'); return; }
    setFiles(files.map((f, j) => (j === i ? { ...f, name } : f)));
  };
  const removeFile = (i) => {
    setUndo(files);
    const next = files.filter((_, j) => j !== i);
    setFiles(next.length ? next : [{ name: 'Video.tsx', code: '' }]);
    setActive(Math.max(0, i - 1));
    say('File dihapus.', 'undo');
  };
  const doUndo = () => { if (undo) { setFiles(undo); setActive(0); setUndo(null); setToast(null); } };

  const tidy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let src = files;
      let fixedCount = 0;
      let out;
      try { out = await formatAll(src); } catch (e1) {
        // Ada salah tulis: perbaiki otomatis dulu (tanpa AI), lalu rapikan.
        src = files.map((f) => {
          if (/\.css$/i.test(f.name) || !f.code.trim()) return f;
          try { const r = compileTolerant(f.name, f.code); fixedCount += r.repairs.length; return { ...f, code: r.code }; } catch { return f; }
        });
        out = await formatAll(src);
      }
      const changed = out.some((f, i) => f.code !== files[i].code);
      if (changed) { setUndo(files); setFiles(out); say(fixedCount ? `Dirapikan, ${fixedCount} salah tulis diperbaiki otomatis (baris yang dilewati diberi tanda // [dilewati]).` : 'Kode sudah dirapikan.', 'undo'); } else say('Kode sudah rapi.');
      setError(null);
    } catch (e) {
      const fe = e instanceof FriendlyError ? e : toFriendly(e);
      setError(fe);
      if (fe.file) { const i = files.findIndex((f) => f.name === fe.file); if (i >= 0) setActive(i); }
    } finally { setBusy(false); }
  };

  const fixWithAI = async (err, issueList) => {
    if (ai && ai.busy) return;
    const ac = new AbortController(); aiAbort.current = ac;
    const log = [];
    setAi({ busy: true, status: 'Menyiapkan…', log: [] });
    const onStatus = (st) => setAi((a) => (a && a.busy ? { ...a, status: st } : a));
    const onAttempt = (at) => { log.push(at); setAi((a) => (a && a.busy ? { ...a, log: [...log] } : a)); };
    const probs = (issueList && issueList.length ? issueList : [err]).filter(Boolean).map((x) => ({ file: x.file, line: x.line, message: x.message, name: x.name }));
    const mainFile = (files.find((f) => !/\.css$/i.test(f.name) && f.code.trim()) || files[0]).name;
    const byFile = new Map();
    for (const p of probs) { const f = p.file && files.some((ff) => ff.name === p.file) ? p.file : mainFile; if (!byFile.has(f)) byFile.set(f, []); byFile.get(f).push(p); }
    const next = files.map((f) => ({ ...f }));
    const done = [];
    try {
      for (const [fname, list] of byFile) {
        const idx = next.findIndex((f) => f.name === fname);
        const r = await aiFixFile({ file: next[idx], problems: list.slice(0, 8), otherFiles: next.filter((f, i) => i !== idx && !/\.css$/i.test(f.name)), onStatus, onAttempt, signal: ac.signal });
        next[idx] = { ...next[idx], code: r.code };
        done.push(r);
      }
      setUndo(files);
      setFiles(next);
      setAi(null); setError(null); setPlayerError(null);
      const r0 = done[done.length - 1];
      say(`Diperbaiki oleh ${r0.provider}${r0.model && r0.model !== r0.provider ? ' · ' + r0.model : ''}. ${r0.note || ''}`.trim(), 'undo');
      await run(next, settings);
    } catch (e) {
      if (ac.signal.aborted) { setAi(null); return; }
      setAi({ busy: false, error: e.message, log, tried: e.tried || [] });
    } finally { aiAbort.current = null; }
  };

  // Cari model AI gratis yang aktif di latar belakang (bila online).
  useEffect(() => { const t = setTimeout(() => { refreshCatalog().catch(() => {}); }, 4000); return () => clearTimeout(t); }, []);

  const jumpTo = (line) => {
    const ta = taRef.current; if (!ta || !line) return;
    const v = ta.value; let pos = 0;
    for (let i = 1; i < line && pos !== -1; i++) pos = v.indexOf('\n', pos) + 1;
    const end = v.indexOf('\n', pos);
    ta.focus();
    try { ta.setSelectionRange(pos, end === -1 ? v.length : end); } catch { /* abaikan */ }
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    ta.scrollTop = Math.max(0, (line - 4) * lh);
  };

  const baseEntry = result && result.entries[sel];
  const entry = useMemo(() => applyFormat(baseEntry, format), [baseEntry, format]);
  const totalLines = files.reduce((n, f) => n + f.code.split('\n').length, 0);

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><span className="dot" aria-hidden="true" />Remotion Saku</div>
        <div className="top-meta">{files.length} file · {totalLines.toLocaleString('id-ID')} baris</div>
      </header>

      <main className="body">
        {/* ---------------- KODE ---------------- */}
        <section hidden={tab !== 'kode'} className="pane pane-code">
          <div className="toolbar">
            <button className="btn primary-soft" onClick={pasteButton}><Icon n="paste" />Tempel</button>
            <button className="btn" onClick={tidy} disabled={busy}><Icon n="brush" />Rapikan</button>
            <button className="btn" onClick={() => { if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; } setConfirmClear(false); setUndo(files); setFiles([{ name: 'Video.tsx', code: '' }]); setActive(0); setError(null); say('Kode dihapus.', 'undo'); setTimeout(() => taRef.current && taRef.current.focus(), 50); }}>
              <Icon n="trash" />{confirmClear ? 'Yakin? Tekan lagi' : 'Kosongkan'}
            </button>
            <details className="more">
              <summary className="btn"><Icon n="spark" />Contoh</summary>
              <div className="menu">
                <button onClick={(e) => { e.currentTarget.closest('details').open = false; replaceAll(SAMPLE_SINGLE, 'Contoh 1 file'); }}>Satu file (animasi teks)</button>
                <button onClick={(e) => { e.currentTarget.closest('details').open = false; replaceAll(SAMPLE_MULTI, 'Contoh banyak file'); }}>Banyak file + Composition</button>
                <button onClick={(e) => { e.currentTarget.closest('details').open = false; replaceAll(SAMPLE_3D, 'Contoh 3D'); }}>3D (Three.js)</button>
                <button onClick={(e) => { e.currentTarget.closest('details').open = false; replaceAll(SAMPLE_SAINS, 'Contoh 3D sains'); }}>3D sains: penampang Bumi</button>
              </div>
            </details>
          </div>

          <div className="files" role="tablist" aria-label="File">
            {files.map((f, i) => (
              <div key={i} className={'chip' + (i === active ? ' on' : '')}>
                <button role="tab" aria-selected={i === active} onClick={() => setActive(i)}>{f.name}</button>
                {i === active && files.length > 1 && <button className="chip-x" aria-label={`Hapus ${f.name}`} onClick={() => removeFile(i)}><Icon n="x" s={14} /></button>}
              </div>
            ))}
            <button className="chip add" onClick={addFile}><Icon n="plus" s={16} />File</button>
          </div>
          {files[active] && (
            <div className="filebar">
              <label htmlFor="namafile">Nama</label>
              <input id="namafile" key={active + files[active].name} defaultValue={files[active].name} onBlur={(e) => renameFile(active, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} spellCheck={false} autoCapitalize="off" />
              <label className="tog"><input id="bungkus" type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />Bungkus baris</label>
            </div>
          )}

          {error && (
            <div className="card err" role="alert">
              <div className="err-head"><Icon n="alert" />{error.kind === 'syntax' ? 'Kode belum bisa dibaca' : error.kind === 'empty' ? 'Belum ada kode' : 'Kode berhenti dengan error'}</div>
              <p className="err-msg">{explain(error.message)}</p>
              {explain(error.message) !== error.message && <p className="muted small">{error.message}</p>}
              {error.file && <p className="err-loc">{error.file}{error.line ? ` · baris ${error.line}` : ''}{error.column ? `, kolom ${error.column}` : ''}</p>}
              {error.hint && <p className="err-hint">{error.hint}</p>}
              <div className="row">
                {error.line && <button className="btn" onClick={() => jumpTo(error.line)}>Lihat baris {error.line}</button>}
                {error.kind !== 'empty' && <button className="btn ai" onClick={() => fixWithAI(error)} disabled={ai && ai.busy}><Icon n="wand" />Perbaiki dengan AI</button>}
              </div>
              <AiBox ai={ai} onCancel={() => aiAbort.current && aiAbort.current.abort()} onClose={() => setAi(null)} />
            </div>
          )}

          <CodeEditor value={files[active]?.code ?? ''} onChange={updateCode} onSmartPaste={smartPaste} taRef={taRef} wrap={wrap} />
        </section>

        {/* ---------------- PUTAR ---------------- */}
        <section hidden={tab !== 'putar'} className="pane">
          {!result && !busy && <div className="empty"><p>Belum ada video. Tempel kode di tab Kode lalu tekan <b>Jalankan</b>.</p></div>}
          {result && entry && (
            <>
              {result.entries.length > 1 && (
                <div className="field">
                  <label htmlFor="pilihvideo">Pilih video ({result.entries.length})</label>
                  <select id="pilihvideo" value={sel} onChange={(e) => { setSel(Number(e.target.value)); setPlayerError(null); }}>
                    {result.entries.map((en, i) => <option key={i} value={i}>{en.id}</option>)}
                  </select>
                </div>
              )}
              <FormatPanel base={baseEntry} format={format} setFormat={setFormat} out={entry} />
              <Guard key={result.key + ':' + sel} onError={(e) => setPlayerError(toFriendly(e))}
                fallback={(err, reset) => <PlayerErrorCard err={toFriendly(err)} onRetry={reset} onAI={() => fixWithAI(toFriendly(err))} ai={ai} onCancelAI={() => aiAbort.current && aiAbort.current.abort()} onCloseAI={() => setAi(null)} />}>
                <PlayerBox entry={entry} onError={setPlayerError} />
              </Guard>
              {playerError && <PlayerErrorCard err={playerError} onRetry={() => run()} onAI={() => fixWithAI(playerError)} ai={ai} onCancelAI={() => aiAbort.current && aiAbort.current.abort()} onCloseAI={() => setAi(null)} />}
              <div className="meta-row">
                <span>{entry.id}</span>
                <span>{entry.width}×{entry.height}</span>
                <span>{+entry.fps.toFixed(2)} fps</span>
                <span>{fmtSec(entry.durationInFrames / entry.fps)}</span>
              </div>
              <IssuesCard issues={issues} files={files} ai={ai}
                onShow={(it) => { const i = files.findIndex((f) => f.name === it.file); if (i >= 0) setActive(i); setTab('kode'); setTimeout(() => jumpTo(it.line), 80); }}
                onFix={() => fixWithAI(null, issues)}
                onCancelAI={() => aiAbort.current && aiAbort.current.abort()} onCloseAI={() => setAi(null)} />
              {result.warnings.length > 0 && (
                <div className="card warn">{result.warnings.map((w, i) => <p key={i}>{w}</p>)}</div>
              )}
            </>
          )}
          <SettingsPanel settings={settings} setSettings={setSettings} fromComposition={!!entry?.fromComposition} onApply={(st) => run(files, st)} />
        </section>

        {/* ---------------- EKSPOR ---------------- */}
        <section hidden={tab !== 'video'} className="pane">
          <Guard>
            <ExportPanel entry={entry} say={say} files={files} formatText={formatName(format)} onChangeFormat={() => setTab('putar')} />
          </Guard>
        </section>

        {/* ---------------- ASET & BANTUAN ---------------- */}
        <section hidden={tab !== 'aset'} className="pane">
          <AssetPanel assets={assets} setAssets={setAssets} say={say} />
          <AiPanel say={say} />
          <Help />
        </section>
      </main>

      <button className={'run' + (busy ? ' busy' : '')} onClick={() => run()} disabled={busy} aria-label="Jalankan kode">
        {busy ? <span className="spin" aria-hidden="true" /> : <Icon n="play" s={22} />}
        <span>{busy ? 'Memproses…' : 'Jalankan'}</span>
      </button>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.msg}</span>
          {toast.action === 'undo' && undo && <button onClick={doUndo}><Icon n="undo" s={16} />Batalkan</button>}
        </div>
      )}

      <nav className="tabs" aria-label="Menu">
        {[['kode', 'Kode', 'code'], ['putar', 'Putar', 'play'], ['video', 'Ekspor', 'film'], ['aset', 'Lainnya', 'more']].map(([k, l, ic]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}>
            <Icon n={ic} s={22} /><span>{l}</span>
            {k === 'kode' && error && <i className="badge" aria-label="ada error" />}
            {k === 'putar' && issues.length > 0 && <i className="badge warnb" aria-label={`${issues.length} bagian dilewati`} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

const KIND_LABEL = { syntax: 'Salah tulis', file: 'File dilewati', module: 'Error saat dijalankan', 'missing-name': 'Nama tidak dikenal', 'missing-file': 'File tidak ada', package: 'Paket tidak ada', render: 'Komponen error' };

function IssuesCard({ issues, ai, onShow, onFix, onCancelAI, onCloseAI }) {
  if (!issues.length) return null;
  return (
    <div className="card issues" role="status">
      <div className="err-head warnh"><Icon n="alert" />Video tetap diputar, {issues.length} bagian kode dilewati</div>
      <ul>
        {issues.slice(0, 12).map((it) => (
          <li key={it.id}>
            <span className="tag">{KIND_LABEL[it.kind] || 'Masalah'}</span>
            <div className="iss-body">
              <b>{it.file ? it.file : ''}{it.line ? ` · baris ${it.line}` : ''}{it.name && it.kind !== 'missing-name' ? ` · ${it.name}` : ''}</b>
              <span>{explain(it.message)}</span>
              <span className="muted small">Tindakan: {it.action}{it.text ? ` — "${it.text}"` : ''}</span>
            </div>
            {it.file && it.line && <button className="link" onClick={() => onShow(it)}>Lihat</button>}
          </li>
        ))}
      </ul>
      {issues.length > 12 && <p className="muted small">…dan {issues.length - 12} lainnya.</p>}
      <button className="btn ai wide" onClick={onFix} disabled={ai && ai.busy}><Icon n="wand" />Perbaiki semuanya dengan AI</button>
      <AiBox ai={ai} onCancel={onCancelAI} onClose={onCloseAI} />
    </div>
  );
}

function AttemptList({ items }) {
  if (!items || !items.length) return null;
  return (
    <ul className="attempts">
      {items.slice(-10).map((t, i) => (
        <li key={i} className={t.ok ? 'ok' : 'no'}>
          <span className="dotk" aria-hidden="true" />
          <span><b>{t.provider}</b>{t.model ? ` · ${t.model}` : ''}</span>
          <span className="why">{t.ok ? 'menjawab' : t.why}</span>
        </li>
      ))}
    </ul>
  );
}

function AiBox({ ai, onCancel, onClose }) {
  if (!ai) return null;
  if (ai.busy) return (
    <div className="aibox" role="status">
      <div className="aibox-row"><span className="spin dark" aria-hidden="true" /><span>{ai.status}</span><button className="link" onClick={onCancel}>Batal</button></div>
      <AttemptList items={ai.log} />
    </div>
  );
  const all = [...(ai.tried || [])];
  const reasons = all.map((t) => t.why || '');
  const tip = reasons.some((r) => /ramai/.test(r)) ? 'Beberapa model sedang ramai. Tunggu sekitar 1 menit lalu tekan lagi; aplikasi akan memilih model lain.'
    : reasons.some((r) => /kuota|saldo/.test(r)) ? 'Kuota gratis beberapa layanan sudah habis untuk sementara. Tambahkan kunci gratis (OpenRouter, Groq, Gemini) di tab Lainnya sebagai cadangan.'
    : reasons.some((r) => /panjang/.test(r)) ? 'Kodenya terlalu panjang untuk model gratis yang tersedia. Coba perbaiki satu file saja atau tambahkan kunci Gemini (konteks besar).'
    : /internet/.test(ai.error) ? 'Sambungkan HP ke internet lalu coba lagi.'
    : 'Coba lagi sebentar lagi. Video tetap bisa diputar karena bagian yang salah dilewati otomatis.';
  return (
    <div className="aibox fail" role="alert">
      <b>{ai.error}</b>
      <AttemptList items={all.length ? all : ai.log} />
      <p>{tip}</p>
      <button className="link" onClick={onClose}>Tutup</button>
    </div>
  );
}

function PlayerErrorCard({ err, onRetry, onAI, ai, onCancelAI, onCloseAI }) {
  return (
    <div className="card err" role="alert">
      <div className="err-head"><Icon n="alert" />Video error saat diputar</div>
      <p className="err-msg">{err.message}</p>
      {err.file && <p className="err-loc">{err.file}{err.line ? ` · baris ${err.line}` : ''}</p>}
      {err.hint && <p className="err-hint">{err.hint}</p>}
      <div className="row">
        <button className="btn" onClick={onRetry}>Coba lagi</button>
        {onAI && <button className="btn ai" onClick={onAI} disabled={ai && ai.busy}><Icon n="wand" />Perbaiki dengan AI</button>}
      </div>
      <AiBox ai={ai} onCancel={onCancelAI} onClose={onCloseAI} />
    </div>
  );
}

function PlayerBox({ entry, onError }) {
  const ref = useRef(null);
  useEffect(() => {
    const p = ref.current; if (!p) return;
    const h = (e) => { const er = e.detail && e.detail.error ? e.detail.error : e; onError(toFriendly(er, (String(er && er.stack || '').match(/rr-file:\/*([^:]+):/) || [])[1])); };
    try { p.addEventListener('error', h); } catch { /* abaikan */ }
    return () => { try { p.removeEventListener('error', h); } catch { /* abaikan */ } };
  }, [onError, entry]);
  const ratio = entry.width / entry.height;
  return (
    <div className="stage" style={{ width: `min(100%, calc(var(--stage-h) * ${ratio}))`, aspectRatio: `${entry.width} / ${entry.height}` }}>
      <Player
        ref={ref}
        component={entry.component}
        inputProps={entry.props}
        durationInFrames={entry.durationInFrames}
        fps={entry.fps}
        compositionWidth={entry.width}
        compositionHeight={entry.height}
        controls
        loop
        clickToPlay
        doubleClickToFullscreen
        allowFullscreen
        showVolumeControls
        spaceKeyToPlayOrPause
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
        errorFallback={({ error }) => (
          (() => { const fe = toFriendly(error, (String(error && error.stack || '').match(/rr-file:\/*([^:]+):/) || [])[1]); return (
            <div className="player-err"><b>Video error</b><span>{fe.message}</span>
              {fe.file && <small>{fe.file}{fe.line ? ` · baris ${fe.line}` : ''}</small>}
              {fe.hint && <small>{fe.hint}</small>}</div>); })()
        )}
      />
    </div>
  );
}

function SettingsPanel({ settings, setSettings, fromComposition, onApply }) {
  const [s, setS] = useState(settings);
  useEffect(() => setS(settings), [settings]);
  const set = (k, v) => setS((o) => ({ ...o, [k]: v }));
  const apply = () => {
    const clean = {
      ...settings,
      fps: Math.min(120, Math.max(1, Number(s.fps) || 30)),
      seconds: Math.min(4 * 3600, Math.max(0.1, Number(s.minutes || 0) * 60 + Number(s.secs || 0) || Number(s.seconds) || 10)),
      override: !!s.override,
    };
    setSettings(clean); onApply(clean);
  };
  const mins = s.minutes ?? Math.floor(Number(s.seconds) / 60);
  const secs = s.secs ?? Math.round((Number(s.seconds) % 60) * 10) / 10;
  return (
    <details className="card settings">
      <summary>Durasi & FPS</summary>
      <p className="muted">{fromComposition ? 'Kode Anda sudah punya <Composition>, jadi durasi dan FPS diambil dari kode. Centang "Paksa" untuk memakai nilai di bawah.' : 'Kode tanpa <Composition> memakai durasi dan FPS ini (maksimal 4 jam).'}</p>
      <div className="grid3">
        <div className="field"><label htmlFor="durasi-menit">Menit</label><input id="durasi-menit" inputMode="numeric" value={mins} onChange={(e) => setS((o) => ({ ...o, minutes: e.target.value, secs: o.secs ?? secs }))} /></div>
        <div className="field"><label htmlFor="durasi-detik">Detik</label><input id="durasi-detik" inputMode="decimal" value={secs} onChange={(e) => setS((o) => ({ ...o, secs: e.target.value, minutes: o.minutes ?? mins }))} /></div>
        <div className="field"><label htmlFor="fps">FPS</label>
          <select id="fps" value={String(s.fps)} onChange={(e) => set('fps', Number(e.target.value))}>{[24, 25, 30, 50, 60].map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
      </div>
      <label className="tog"><input id="paksa" type="checkbox" checked={!!s.override} onChange={(e) => set('override', e.target.checked)} />Paksa pakai durasi & FPS ini</label>
      <button className="btn wide" onClick={apply}>Terapkan & putar ulang</button>
    </details>
  );
}

const RISKY = [
  [/conic-gradient/, 'conic-gradient'],
  [/backdrop-?[fF]ilter/, 'backdrop-filter (efek blur kaca)'],
  [/mix-?[bB]lend-?[mM]ode/, 'mix-blend-mode'],
  [/<iframe/i, 'iframe'],
  [/repeating-(linear|radial)-gradient/, 'repeating-gradient'],
];

function compositionOf(entry) {
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  return {
    id: entry.id.replace(/[^\w-]/g, '-') || 'Video', component: entry.component,
    width: even(entry.width), height: even(entry.height), fps: entry.fps, durationInFrames: entry.durationInFrames, defaultProps: entry.props,
  };
}

function StillCheck({ entry }) {
  const [frame, setFrame] = useState(() => Math.floor(entry.durationInFrames / 2));
  const [st, setSt] = useState({ phase: 'idle' });
  const urlRef = useRef(null);
  useEffect(() => { setFrame(Math.floor(entry.durationInFrames / 2)); setSt({ phase: 'idle' }); }, [entry]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  const check = async () => {
    setSt({ phase: 'busy' });
    try {
      const r = await renderStillOnWeb({ composition: compositionOf(entry), inputProps: entry.props, frame: Math.min(entry.durationInFrames - 1, Math.max(0, frame)), scale: Math.min(1, 720 / Math.max(entry.width, entry.height)), licenseKey: 'free-license', isProduction: false, logLevel: 'error', delayRenderTimeoutInMilliseconds: 60000 });
      const b = await r.blob({ format: 'jpeg', quality: 0.9 });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
      setSt({ phase: 'done', url: urlRef.current });
    } catch (e) { setSt({ phase: 'error', msg: e.message }); }
  };
  return (
    <details className="card help">
      <summary>Cek cuplikan hasil (1 frame)</summary>
      <p className="muted">Menggambar satu frame persis seperti nanti di file video. Bandingkan dengan pratinjau di tab Putar sebelum membuat video panjang.</p>
      <div className="field"><label htmlFor="frame-cek">Frame ke-{frame} dari {entry.durationInFrames - 1}</label>
        <input id="frame-cek" type="range" min="0" max={Math.max(0, entry.durationInFrames - 1)} value={frame} onChange={(e) => setFrame(Number(e.target.value))} /></div>
      <button className="btn wide" onClick={check} disabled={st.phase === 'busy'}>{st.phase === 'busy' ? 'Menggambar…' : 'Lihat cuplikan'}</button>
      {st.phase === 'done' && <img className="still" src={st.url} alt={`Cuplikan frame ${frame}`} style={{ aspectRatio: `${entry.width} / ${entry.height}` }} />}
      {st.phase === 'error' && <p className="err-msg">{st.msg}</p>}
    </details>
  );
}

const QUALITY_BPP = { medium: 0.06, high: 0.1, 'very-high': 0.16 };
const fileBase = (entry) => entry.id.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'video';
const fmtClock = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), d = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(d).padStart(2, '0'); };

async function saveBlob(blob, filename, say, onProgress) {
  if (Native.IS_ANDROID_APP) {
    const where = await Native.saveBlobNative(blob, filename, onProgress);
    say('Tersimpan di ' + where);
    return true;
  }
  const dl = await downloadsP;
  if (dl) {
    try { await dl.save({ filename, data: blob }); say('Video disimpan.'); return true; } catch (e) {
      if (e && e.code === 'declined') { say('Penyimpanan dibatalkan.'); return false; }
      if (e && e.code === 'rate_limited') { say('Tunggu sebentar, lalu tekan Simpan lagi.'); return false; }
    }
  }
  if (!IN_ARTIFACT) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    say('Video diunduh.'); return true;
  }
  say('Penyimpanan tidak tersedia di tampilan ini. Tekan lama video lalu pilih Simpan/Unduh.');
  return false;
}

/** Layar pratinjau hasil: tonton file video yang sudah jadi sebelum disimpan. */
function ResultSheet({ item, entry, onClose, onDiscard, say }) {
  const [saving, setSaving] = useState(null);
  const vref = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!item) return null;
  const canShare = !IN_ARTIFACT && !Native.IS_ANDROID_APP && navigator.canShare && (() => { try { return navigator.canShare({ files: [new File([item.blob], item.name, { type: item.blob.type })] }); } catch { return false; } })();
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Pratinjau hasil video">
      <div className="sheet-top">
        <button className="icon-btn" onClick={onClose} aria-label="Tutup pratinjau"><Icon n="x" /></button>
        <div className="sheet-title"><b>Pratinjau hasil</b><span>{item.name}</span></div>
      </div>
      <div className="sheet-stage">
        <video ref={vref} src={item.url} controls playsInline autoPlay muted loop style={{ aspectRatio: `${item.w} / ${item.h}` }} />
      </div>
      <div className="sheet-info">
        <span>{item.w}×{item.h}</span><span>{fmtClock(item.seconds)}</span><span>{fmtBytes(item.size)}</span><span>{item.ext.toUpperCase()}</span>
        {item.part && <span>Bagian {item.part}</span>}
      </div>
      <p className="muted small sheet-note">Ini file video yang sebenarnya. Suara mati otomatis saat dibuka; ketuk ikon suara untuk mendengar.</p>
      <div className="sheet-actions">
        <button className="btn primary" disabled={saving != null} onClick={async () => { setSaving(0); try { await saveBlob(item.blob, item.name, say, setSaving); } catch (e) { say('Gagal menyimpan: ' + e.message); } finally { setSaving(null); } }}>
          <Icon n="down" />{saving != null ? `Menyimpan ${Math.round(saving * 100)}%` : 'Simpan ke HP'}
        </button>
        {canShare && <button className="btn" onClick={async () => { try { await navigator.share({ files: [new File([item.blob], item.name, { type: item.blob.type })], title: entry.id }); } catch { /* batal */ } }}><Icon n="share" />Bagikan</button>}
        {Native.IS_ANDROID_APP && <button className="btn" onClick={() => { if (!Native.shareNative()) say('Simpan dulu, lalu tekan Bagikan.'); }}><Icon n="share" />Bagikan</button>}
        <button className="btn" onClick={onDiscard}><Icon n="trash" />Buang</button>
      </div>
    </div>
  );
}

function ExportPanel({ entry, say, files = [], formatText, onChangeFormat }) {
  const [fmt, setFmt] = useState('mp4');
  const [quality, setQuality] = useState('high');
  const [scale, setScale] = useState(1);
  const [partMin, setPartMin] = useState(0); // 0 = utuh
  const [state, setState] = useState({ phase: 'idle' });
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(null);
  const [target, setTarget] = useState(null); // 'web-fs' | 'arraybuffer'
  const abortRef = useRef(null);

  useEffect(() => () => { items.forEach((it) => URL.revokeObjectURL(it.url)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let alive = true;
    if (!entry) return undefined;
    canRenderMediaOnWeb({ container: 'mp4', videoCodec: 'h264', width: 640, height: 360 }).then((r) => { if (alive) setTarget(r.resolvedOutputTarget); }).catch(() => {});
    return () => { alive = false; };
  }, [entry]);

  if (!entry) return <div className="empty"><p>Jalankan kode dulu. Setelah video tampil di tab Putar, Anda bisa membuat file video di sini.</p></div>;

  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  const outW = even(entry.width * scale), outH = even(entry.height * scale);
  const seconds = entry.durationInFrames / entry.fps;
  const allCode = files.map((f) => f.code).join('\n');
  const risky = RISKY.filter(([re]) => re.test(allCode)).map(([, n]) => n);
  const estBytes = (outW * outH * entry.fps * (QUALITY_BPP[quality] || 0.1) * seconds) / 8;
  const partFrames = partMin ? Math.round(partMin * 60 * entry.fps) : entry.durationInFrames;
  const ranges = [];
  for (let a = 0; a < entry.durationInFrames; a += partFrames) ranges.push([a, Math.min(entry.durationInFrames, a + partFrames) - 1]);
  const memoryRisk = target === 'arraybuffer' && estBytes / ranges.length > 600e6;

  const start = async () => {
    setState({ phase: 'check' });
    let wake = null;
    try { wake = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch { wake = null; }
    Native.keepScreenOn(true);
    const ac = new AbortController(); abortRef.current = ac;
    try {
      const plan = [fmt === 'mp4' ? ['mp4', 'h264'] : ['webm', 'vp8'], fmt === 'mp4' ? ['webm', 'vp8'] : ['mp4', 'h264'], ['webm', 'vp9']];
      let chosen = null, issues = [];
      for (const [container, videoCodec] of plan) {
        try {
          const r = await canRenderMediaOnWeb({ container, videoCodec, width: outW, height: outH, videoBitrate: quality });
          if (r.canRender) { chosen = { container, videoCodec: r.resolvedVideoCodec || videoCodec }; break; }
          issues = r.issues;
        } catch (e) { issues = [{ message: e.message }]; }
      }
      if (!chosen) throw new Error('Browser ini belum bisa membuat file video (' + (issues.map((i) => i.message).join('; ') || 'WebCodecs tidak ada') + '). Coba Chrome versi terbaru.');
      const comp = compositionOf(entry);
      const t0 = Date.now();
      const total = entry.durationInFrames;
      let done = 0;
      const made = [];
      for (let i = 0; i < ranges.length; i++) {
        const [a, b] = ranges[i];
        const n = b - a + 1;
        setState({ phase: 'render', p: done / total, part: i + 1, parts: ranges.length, t0 });
        const res = await renderMediaOnWeb({
          composition: comp, inputProps: entry.props,
          container: chosen.container, videoCodec: chosen.videoCodec, videoBitrate: quality,
          scale: outW / comp.width, signal: ac.signal,
          frameRange: ranges.length > 1 ? [a, b] : null,
          licenseKey: 'free-license', isProduction: false, logLevel: 'error', delayRenderTimeoutInMilliseconds: 120000,
          onProgress: (pr) => setState((s) => (s.phase === 'render' ? { ...s, p: (done + (pr.progress || 0) * n) / total, frames: done + (pr.renderedFrames || 0) } : s)),
        });
        const blob = await res.getBlob();
        done += n;
        const suffix = ranges.length > 1 ? `-bagian-${String(i + 1).padStart(2, '0')}` : '';
        const item = { id: Date.now() + i, url: URL.createObjectURL(blob), blob, size: blob.size, ext: chosen.container, w: outW, h: outH, seconds: n / entry.fps, part: ranges.length > 1 ? `${i + 1}/${ranges.length} (${fmtClock(a / entry.fps)}–${fmtClock((b + 1) / entry.fps)})` : null, name: `${fileBase(entry)}${suffix}.${chosen.container}` };
        made.push(item);
        setItems((list) => [...list, item]);
        // Video panjang di APK: tiap bagian langsung disimpan agar aman bila aplikasi tertutup.
        if (ranges.length > 1 && Native.IS_ANDROID_APP) { try { await saveBlob(blob, item.name, () => {}); item.saved = true; } catch { /* tetap ada di daftar */ } }
      }
      setState({ phase: 'done', took: (Date.now() - t0) / 1000 });
      if (made.length === 1) setOpen(made[0]);
    } catch (e) {
      if (ac.signal.aborted) setState({ phase: 'idle' });
      else setState({ phase: 'error', msg: (e && e.message) || String(e) });
    } finally {
      abortRef.current = null;
      try { wake && wake.release(); } catch { /* abaikan */ }
      Native.keepScreenOn(false);
    }
  };

  const discard = (it) => { URL.revokeObjectURL(it.url); setItems((l) => l.filter((x) => x !== it)); setOpen(null); };
  const rendering = state.phase === 'render' || state.phase === 'check';
  const elapsed = state.t0 ? (Date.now() - state.t0) / 1000 : 0;
  const eta = state.p > 0.01 ? elapsed / state.p - elapsed : 0;
  return (
    <div className="stack">
      <div className="card">
        <h2>Buat file video</h2>
        <p className="muted">{entry.id} · {formatText} · {outW}×{outH} · {+entry.fps.toFixed(2)} fps · {fmtClock(seconds)} ({entry.durationInFrames.toLocaleString('id-ID')} frame)</p>
        <button className="link left" onClick={onChangeFormat}>Ubah rasio (TikTok, YouTube, Reels…)</button>
        <div className="field"><span className="lbl">Format file</span>
          <div className="seg">{[['mp4', 'MP4'], ['webm', 'WebM']].map(([k, l]) => <button key={k} className={fmt === k ? 'on' : ''} onClick={() => setFmt(k)} disabled={rendering}>{l}</button>)}</div></div>
        <div className="field"><span className="lbl">Kualitas</span>
          <div className="seg">{[['medium', 'Sedang'], ['high', 'Tinggi'], ['very-high', 'Maks']].map(([k, l]) => <button key={k} className={quality === k ? 'on' : ''} onClick={() => setQuality(k)} disabled={rendering}>{l}</button>)}</div></div>
        <div className="field"><span className="lbl">Ukuran render</span>
          <div className="seg">{[[1, '100%'], [0.75, '75%'], [0.5, '50% (cepat)']].map(([k, l]) => <button key={k} className={scale === k ? 'on' : ''} onClick={() => setScale(k)} disabled={rendering}>{l}</button>)}</div></div>
        {seconds > 120 && (
          <div className="field"><span className="lbl">Video panjang: bagi menjadi beberapa file</span>
            <div className="seg">{[[0, 'Utuh'], [5, '5 mnt'], [10, '10 mnt'], [15, '15 mnt']].map(([k, l]) => <button key={k} className={partMin === k ? 'on' : ''} onClick={() => setPartMin(k)} disabled={rendering}>{l}</button>)}</div>
            <span className="muted small">{partMin ? `${ranges.length} file berurutan. Jika terhenti, bagian yang sudah jadi tetap aman.` : 'Satu file utuh.'} Perkiraan ukuran total ± {fmtBytes(estBytes)}.</span>
          </div>
        )}
        {memoryRisk && <div className="card warn inner"><p>Browser ini menyimpan hasil di memori. Untuk video sepanjang ini, pilih "bagi menjadi beberapa file" agar HP tidak kehabisan memori.</p></div>}
        {!rendering && <button className="btn primary wide" onClick={start}><Icon n="film" />{ranges.length > 1 ? `Buat ${ranges.length} file video` : 'Buat video'}</button>}
        {rendering && (
          <div className="prog">
            <div className="bar"><i style={{ width: `${Math.round((state.p || 0) * 1000) / 10}%` }} /></div>
            <div className="prog-row"><span>{state.phase === 'check' ? 'Memeriksa browser…' : `${(Math.round((state.p || 0) * 1000) / 10).toFixed(1)}%${state.parts > 1 ? ` · bagian ${state.part}/${state.parts}` : ''}${state.frames ? ` · frame ${state.frames.toLocaleString('id-ID')}` : ''}`}</span>
              {eta > 1 && <span>sisa ± {fmtSec(eta)}</span>}</div>
            <p className="muted">Biarkan layar tetap menyala dan jangan pindah aplikasi sampai selesai.</p>
            <button className="btn wide" onClick={() => abortRef.current && abortRef.current.abort()}><Icon n="x" />Batalkan</button>
          </div>
        )}
        {state.phase === 'error' && (
          <div className="card err inner" role="alert">
            <div className="err-head"><Icon n="alert" />Video gagal dibuat</div>
            <p className="err-msg">{state.msg}</p>
            <p className="err-hint">Pratinjau tetap bisa dipakai. Coba ukuran render 50%, format lain, atau bagi video panjang menjadi beberapa file.</p>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="card">
          <h2>Hasil ({items.length})</h2>
          <p className="muted small">Tonton pratinjau dulu sebelum menyimpan.</p>
          <ul className="results">
            {items.map((it) => (
              <li key={it.id}>
                <button className="res-thumb" onClick={() => setOpen(it)} aria-label={`Pratinjau ${it.name}`}>
                  <video src={it.url + '#t=0.1'} muted playsInline preload="metadata" /><span className="play"><Icon n="play" s={18} /></span>
                </button>
                <div className="a-info"><b>{it.name}</b><span>{fmtClock(it.seconds)} · {fmtBytes(it.size)}{it.saved ? ' · tersimpan' : ''}</span></div>
                <button className="btn" onClick={() => setOpen(it)}>Pratinjau</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {risky.length > 0 && <div className="card warn"><p>Kode memakai {risky.join(', ')}. Efek ini bisa tampil berbeda di file video. Cek dulu dengan cuplikan di bawah.</p></div>}
      <StillCheck entry={entry} />
      <p className="muted small">Pembuatan video berjalan di HP Anda sendiri (tanpa server). Hasil paling stabil di Chrome Android versi terbaru dan aplikasi APK.</p>
      <ResultSheet item={open} entry={entry} onClose={() => setOpen(null)} onDiscard={() => discard(open)} say={say} />
    </div>
  );
}

function AssetPanel({ assets, setAssets, say }) {
  const add = async (list) => {
    const next = { ...assets };
    for (const f of list) {
      const name = f.name.replace(/\s+/g, '-');
      if (next[name]) try { URL.revokeObjectURL(next[name].url); } catch { /* abaikan */ }
      next[name] = { url: URL.createObjectURL(f), size: f.size, type: f.type };
      idb.put(name, f);
    }
    setAssets(next);
    say(`${list.length} aset ditambahkan. Tekan Jalankan agar dipakai.`);
  };
  const del = (name) => {
    const next = { ...assets }; try { URL.revokeObjectURL(next[name].url); } catch { /* abaikan */ }
    delete next[name]; setAssets(next); idb.del(name);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); say('Disalin: ' + text); } catch { say(text); }
  };
  const names = Object.keys(assets);
  return (
    <div className="card">
      <h2>Aset (gambar, suara, video)</h2>
      <p className="muted">Kode yang memakai <code>staticFile("nama.png")</code> akan mengambil file dari sini. Nama file harus sama persis.</p>
      <label className="btn wide upload" htmlFor="unggah"><Icon n="plus" />Unggah file</label>
      <input id="unggah" type="file" multiple accept="image/*,video/*,audio/*,.json,.ttf,.otf,.woff,.woff2,.gif,.svg" hidden onChange={(e) => { const l = [...(e.target.files || [])]; e.target.value = ''; if (l.length) add(l); }} />
      {names.length > 0 && (
        <ul className="assets">
          {names.map((n) => (
            <li key={n}>
              {assets[n].type.startsWith('image/') ? <img src={assets[n].url} alt="" /> : <span className="ph">{(n.split('.').pop() || '').toUpperCase()}</span>}
              <div className="a-info"><b>{n}</b><span>{fmtBytes(assets[n].size)}</span></div>
              <button className="icon-btn" aria-label={`Salin staticFile untuk ${n}`} onClick={() => copy(`staticFile("${n}")`)}><Icon n="copy" s={18} /></button>
              <button className="icon-btn" aria-label={`Hapus ${n}`} onClick={() => del(n)}><Icon n="trash" s={18} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AiPanel({ say }) {
  const [list, setList] = useState(null);
  const [keys, setKeys] = useState(() => getKeys());
  const refresh = useCallback(() => { providerStatus().then(setList).catch(() => setList([])); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const save = (id, v) => { setKey(id, v); setKeys(getKeys()); refresh(); say(v ? 'Kunci disimpan di HP ini.' : 'Kunci dihapus.'); };
  return (
    <details className="card help" onToggle={(e) => { if (e.currentTarget.open) refresh(); }}>
      <summary>AI gratis untuk memperbaiki kode</summary>
      <p className="muted">AI hanya dipakai saat Anda menekan <b>Perbaiki dengan AI</b>. Router otomatis mencari model gratis yang sedang aktif di internet, mendahulukan yang paling sering berhasil, dan pindah sendiri bila satu model ramai atau kuotanya habis. Tanpa daftar sudah bisa (Pollinations, LLM7, OVHcloud; Kilo di APK). Kunci gratis di bawah opsional untuk cadangan tambahan.</p>
      <button className="btn wide" onClick={async () => { say('Mencari model gratis…'); await refreshCatalog(true).catch(() => {}); refresh(); say('Daftar model gratis diperbarui.'); }}>Cari model gratis sekarang</button>
      <ul className="prov">
        {(list || []).filter((p) => !(p.kind === 'sample' && p.state !== 'siap')).map((p) => (
          <li key={p.id}>
            <div className="prov-head"><b>{p.name}</b><span className={'st ' + (p.state === 'siap' ? 'ok' : /butuh kunci|hanya di APK|tidak tersedia/.test(p.state) ? 'idle' : 'bad')}>{p.state}</span></div>
            {p.modelCount > 0 && p.kind !== 'sample' && <span className="muted small">{p.modelCount} model</span>}
            <span className="muted small">{p.note}</span>
            {!p.keyless && (
              <div className="keyrow">
                <input id={'key-' + p.id} type="password" autoComplete="off" placeholder={p.hasKey ? 'Kunci tersimpan' : 'Tempel kunci gratis'} defaultValue="" onBlur={(e) => { if (e.target.value.trim()) { save(p.id, e.target.value); e.target.value = ''; } }} />
                {keys[p.id] && <button className="link" onClick={() => save(p.id, '')}>Hapus</button>}
              </div>
            )}
            {!p.keyless && <span className="muted small">Ambil kunci gratis: <a href={p.keyUrl} target="_blank" rel="noreferrer" onClick={(e) => { if (Native.openUrl(p.keyUrl)) e.preventDefault(); }}>{p.keyUrl.replace('https://', '')}</a></span>}
          </li>
        ))}
      </ul>
      <button className="btn wide" onClick={() => { clearCooldowns(); refresh(); say('Status kuota diatur ulang.'); }}>Coba semua penyedia lagi</button>
    </details>
  );
}

function Help() {
  return (
    <details className="card help">
      <summary>Cara pakai & paket yang didukung</summary>
      <ol>
        <li>Salin kode Remotion (dari ChatGPT, Claude, GitHub, dll.).</li>
        <li>Buka tab <b>Kode</b>, tekan <b>Tempel</b> (atau tekan lama di kolom lalu Tempel).</li>
        <li>Tekan <b>Jalankan</b>. Video tampil di tab <b>Putar</b>.</li>
        <li>Tab <b>Ekspor</b> membuat file MP4 untuk diunggah ke TikTok.</li>
        <li>Kode berantakan? Tekan <b>Rapikan</b>. Ada kesalahan? Video <b>tetap diputar</b>: baris salah tulis dilewati, nama yang tidak dikenal dikosongkan, komponen yang error disembunyikan. Daftar bagian yang dilewati muncul di tab Putar, lengkap dengan tombol <b>Perbaiki semuanya dengan AI</b> (gratis).</li>
      </ol>
      <h3>Banyak file sekaligus</h3>
      <p>Tempel saja semuanya. Aplikasi memisahkan file otomatis bila tiap file diawali baris seperti <code>// src/Root.tsx</code>, atau bila kode berupa beberapa blok <code>```tsx</code>. Import seperti <code>./Judul</code> otomatis tersambung.</p>
      <h3>Yang dikenali</h3>
      <p><code>&lt;Composition&gt;</code>, <code>registerRoot</code>, <code>calculateMetadata</code>, <code>defaultProps</code>, atau cukup komponen yang di-export. TypeScript dan JSX langsung jalan.</p>
      <h3>3D gaya video sains</h3>
      <p>Pakai <code>import {'{'} Canvas3D, Studio, Effects, Cutaway, Label3D, CameraPath, OrbitCamera, Turntable, Model {'}'} from '@saku/3d'</code>.</p>
      <ul className="tight">
        <li><code>&lt;Canvas3D&gt;</code>: kanvas 3D seukuran video, jamnya mengikuti frame (useFrame ikut sinkron).</li>
        <li><code>&lt;Studio /&gt;</code>: lampu studio, pantulan lingkungan, bayangan lembut di lantai.</li>
        <li><code>&lt;Effects bloom ao dof vignette /&gt;</code>: cahaya berpendar, bayangan sudut, fokus kamera.</li>
        <li><code>&lt;Cutaway progress axis="z"&gt;</code>: membelah objek, permukaan potong diberi warna (<code>userData={'{{'} capColor {'}}'}</code>).</li>
        <li><code>&lt;Label3D position offset&gt;Teks&lt;/Label3D&gt;</code>: label dengan garis penunjuk.</li>
        <li><code>&lt;CameraPath points /&gt;</code>, <code>&lt;OrbitCamera /&gt;</code>, <code>&lt;Turntable /&gt;</code>: gerak kamera/objek.</li>
        <li><code>&lt;Model src={'{'}staticFile('jantung.glb'){'}'} /&gt;</code>: model 3D dari tab Lainnya → Aset.</li>
      </ul>
      <p>Lihat contoh lengkap di <b>Contoh → 3D sains: penampang Bumi</b>. Kode yang memakai <code>ThreeCanvas</code> atau <code>Canvas</code> biasa juga otomatis memakai kanvas ini.</p>
      <h3>Video panjang</h3>
      <p>Durasi bisa sampai 4 jam. Di tab Ekspor, video di atas 2 menit bisa dibagi menjadi file per 5/10/15 menit agar aman di HP.</p>
      <h3>Paket bawaan</h3>
      <p className="pk">3D: @remotion/three (ThreeCanvas), three, @react-three/fiber, @react-three/drei. Lainnya: remotion, @remotion/player, transitions (fade, slide, wipe, flip, iris, dll.), shapes, paths, noise, motion-blur, layout-utils, animation-utils, media-utils, media, fonts, google-fonts, captions, gif, lottie, light-leaks, starburst, rounded-text-box, effects, zod, react.</p>
      <p>Paket lain dicoba diambil dari internet secara otomatis. Fungsi Remotion/React yang lupa di-import (mis. useCurrentFrame, interpolate, useState) otomatis tersedia.</p>
    </details>
  );
}

// ---------- Mulai ----------
window.__saku = { compileTolerant, getIssues }; // untuk uji otomatis & diagnosis
const rootEl = document.getElementById('root');
createRoot(rootEl).render(<Guard fallback={(err) => (
  <div className="fatal"><h1>Aplikasi perlu dimuat ulang</h1><p>{String(err && err.message)}</p><p>Kode Anda tetap tersimpan.</p>
    <button className="btn primary" onClick={() => { LS.set('rs.running', 0); location.reload(); }}>Muat ulang</button></div>
)}><App /></Guard>);
