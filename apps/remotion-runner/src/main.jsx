import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
import { renderMediaOnWeb, canRenderMediaOnWeb } from '@remotion/web-renderer';
import { runProject, splitPasted, cleanText, FriendlyError, toFriendly } from './runtime.js';
import { SAMPLE_SINGLE, SAMPLE_MULTI } from './samples.js';

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
const IN_ARTIFACT = !!(window.claude && window.claude.use);

const DEFAULT_SETTINGS = { width: 1080, height: 1920, fps: 30, seconds: 10, override: false };
const PRESETS = [
  { label: 'TikTok / Reels 9:16', w: 1080, h: 1920 },
  { label: 'Persegi 1:1', w: 1080, h: 1080 },
  { label: 'YouTube 16:9', w: 1920, h: 1080 },
  { label: 'Potret 4:5', w: 1080, h: 1350 },
];

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
      if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error('no');
      const t = await navigator.clipboard.readText();
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

  const entry = result && result.entries[sel];
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
            <button className="btn" onClick={() => { if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; } setConfirmClear(false); setUndo(files); setFiles([{ name: 'Video.tsx', code: '' }]); setActive(0); setError(null); say('Kode dihapus.', 'undo'); setTimeout(() => taRef.current && taRef.current.focus(), 50); }}>
              <Icon n="trash" />{confirmClear ? 'Yakin? Tekan lagi' : 'Kosongkan'}
            </button>
            <details className="more">
              <summary className="btn"><Icon n="spark" />Contoh</summary>
              <div className="menu">
                <button onClick={(e) => { e.currentTarget.closest('details').open = false; replaceAll(SAMPLE_SINGLE, 'Contoh 1 file'); }}>Satu file (animasi teks)</button>
                <button onClick={(e) => { e.currentTarget.closest('details').open = false; replaceAll(SAMPLE_MULTI, 'Contoh banyak file'); }}>Banyak file + Composition</button>
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
              <p className="err-msg">{error.message}</p>
              {error.file && <p className="err-loc">{error.file}{error.line ? ` · baris ${error.line}` : ''}{error.column ? `, kolom ${error.column}` : ''}</p>}
              {error.hint && <p className="err-hint">{error.hint}</p>}
              {error.line && <button className="btn" onClick={() => jumpTo(error.line)}>Lihat baris {error.line}</button>}
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
              <Guard key={result.key + ':' + sel} onError={(e) => setPlayerError(toFriendly(e))}
                fallback={(err, reset) => <PlayerErrorCard err={toFriendly(err)} onRetry={reset} />}>
                <PlayerBox entry={entry} onError={setPlayerError} />
              </Guard>
              {playerError && <PlayerErrorCard err={playerError} onRetry={() => run()} />}
              <div className="meta-row">
                <span>{entry.id}</span>
                <span>{entry.width}×{entry.height}</span>
                <span>{+entry.fps.toFixed(2)} fps</span>
                <span>{fmtSec(entry.durationInFrames / entry.fps)}</span>
              </div>
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
            <ExportPanel entry={entry} say={say} />
          </Guard>
        </section>

        {/* ---------------- ASET & BANTUAN ---------------- */}
        <section hidden={tab !== 'aset'} className="pane">
          <AssetPanel assets={assets} setAssets={setAssets} say={say} />
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
        {[['kode', 'Kode', 'code'], ['putar', 'Putar', 'play'], ['video', 'Ekspor', 'film'], ['aset', 'Aset', 'box']].map(([k, l, ic]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}>
            <Icon n={ic} s={22} /><span>{l}</span>
            {k === 'kode' && error && <i className="badge" aria-label="ada error" />}
          </button>
        ))}
      </nav>
    </div>
  );
}

function PlayerErrorCard({ err, onRetry }) {
  return (
    <div className="card err" role="alert">
      <div className="err-head"><Icon n="alert" />Video error saat diputar</div>
      <p className="err-msg">{err.message}</p>
      {err.file && <p className="err-loc">{err.file}{err.line ? ` · baris ${err.line}` : ''}</p>}
      {err.hint && <p className="err-hint">{err.hint}</p>}
      <button className="btn" onClick={onRetry}>Coba lagi</button>
    </div>
  );
}

function PlayerBox({ entry, onError }) {
  const ref = useRef(null);
  useEffect(() => {
    const p = ref.current; if (!p) return;
    const h = (e) => onError(toFriendly(e.detail && e.detail.error ? e.detail.error : e));
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
      width: Math.min(7680, Math.max(16, Math.round(Number(s.width) || 1080))),
      height: Math.min(7680, Math.max(16, Math.round(Number(s.height) || 1920))),
      fps: Math.min(120, Math.max(1, Number(s.fps) || 30)),
      seconds: Math.min(3600, Math.max(0.1, Number(s.seconds) || 10)),
      override: !!s.override,
    };
    setSettings(clean); onApply(clean);
  };
  return (
    <details className="card settings" open={!fromComposition}>
      <summary>Ukuran & durasi</summary>
      <p className="muted">{fromComposition ? 'Kode Anda sudah punya <Composition>, jadi ukurannya dipakai dari kode. Centang "Paksa" untuk memakai pengaturan di bawah.' : 'Kode tanpa <Composition> memakai pengaturan ini.'}</p>
      <div className="presets">
        {PRESETS.map((p) => (
          <button key={p.label} className={'pill' + (Number(s.width) === p.w && Number(s.height) === p.h ? ' on' : '')} onClick={() => setS((o) => ({ ...o, width: p.w, height: p.h }))}>{p.label}</button>
        ))}
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="lebar">Lebar (px)</label><input id="lebar" inputMode="numeric" value={s.width} onChange={(e) => set('width', e.target.value)} /></div>
        <div className="field"><label htmlFor="tinggi">Tinggi (px)</label><input id="tinggi" inputMode="numeric" value={s.height} onChange={(e) => set('height', e.target.value)} /></div>
        <div className="field"><label htmlFor="fps">FPS</label>
          <select id="fps" value={String(s.fps)} onChange={(e) => set('fps', Number(e.target.value))}>{[24, 25, 30, 50, 60].map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
        <div className="field"><label htmlFor="durasi">Durasi (detik)</label><input id="durasi" inputMode="decimal" value={s.seconds} onChange={(e) => set('seconds', e.target.value)} /></div>
      </div>
      <label className="tog"><input id="paksa" type="checkbox" checked={!!s.override} onChange={(e) => set('override', e.target.checked)} />Paksa pakai pengaturan ini</label>
      <button className="btn wide" onClick={apply}>Terapkan & putar ulang</button>
    </details>
  );
}

function ExportPanel({ entry, say }) {
  const [fmt, setFmt] = useState('mp4');
  const [quality, setQuality] = useState('high');
  const [scale, setScale] = useState(1);
  const [state, setState] = useState({ phase: 'idle' }); // idle|check|render|done|error
  const abortRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  if (!entry) return <div className="empty"><p>Jalankan kode dulu. Setelah video tampil di tab Putar, Anda bisa membuat file video di sini.</p></div>;

  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  const outW = even(entry.width * scale), outH = even(entry.height * scale);

  const start = async () => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    setState({ phase: 'check' });
    let wake = null;
    try { wake = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch { wake = null; }
    try {
      const plan = [fmt === 'mp4' ? ['mp4', 'h264'] : ['webm', 'vp8'], fmt === 'mp4' ? ['webm', 'vp8'] : ['mp4', 'h264'], ['webm', 'vp9']];
      let chosen = null, issues = [];
      for (const [container, videoCodec] of plan) {
        try {
          const r = await canRenderMediaOnWeb({ container, videoCodec, width: outW, height: outH, videoBitrate: quality });
          if (r.canRender) { chosen = { container, videoCodec: r.resolvedVideoCodec || videoCodec, audioCodec: r.resolvedAudioCodec }; break; }
          issues = r.issues;
        } catch (e) { issues = [{ message: e.message }]; }
      }
      if (!chosen) throw new Error('Browser ini belum bisa membuat file video (' + (issues.map((i) => i.message).join('; ') || 'WebCodecs tidak ada') + '). Coba Chrome versi terbaru.');
      const even2 = (n) => Math.max(2, Math.round(n / 2) * 2);
      const ac = new AbortController(); abortRef.current = ac;
      const t0 = Date.now();
      setState({ phase: 'render', p: 0, container: chosen.container });
      const res = await renderMediaOnWeb({
        composition: {
          id: entry.id.replace(/[^\w-]/g, '-') || 'Video',
          component: entry.component,
          width: even2(entry.width), height: even2(entry.height),
          fps: entry.fps, durationInFrames: entry.durationInFrames,
          defaultProps: entry.props,
        },
        inputProps: entry.props,
        container: chosen.container,
        videoCodec: chosen.videoCodec,
        videoBitrate: quality,
        scale: outW / even2(entry.width),
        signal: ac.signal,
        licenseKey: 'free-license',
        isProduction: false,
        logLevel: 'error',
        delayRenderTimeoutInMilliseconds: 60000,
        onProgress: (pr) => setState((s) => (s.phase === 'render' ? { ...s, p: pr.progress || 0, frames: pr.renderedFrames, eta: pr.renderEstimatedTime } : s)),
      });
      const blob = await res.getBlob();
      const url = URL.createObjectURL(blob); urlRef.current = url;
      setState({ phase: 'done', url, blob, size: blob.size, ext: chosen.container, took: (Date.now() - t0) / 1000 });
    } catch (e) {
      if (abortRef.current && abortRef.current.signal.aborted) setState({ phase: 'idle' });
      else setState({ phase: 'error', msg: (e && e.message) || String(e) });
    } finally {
      abortRef.current = null;
      try { wake && wake.release(); } catch { /* abaikan */ }
    }
  };

  const fileName = () => `${entry.id.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'video'}.${state.ext}`;
  const save = async () => {
    const dl = await downloadsP;
    if (dl) {
      try { await dl.save({ filename: fileName(), data: state.blob }); say('Video disimpan.'); return; } catch (e) {
        if (e && e.code === 'declined') { say('Penyimpanan dibatalkan.'); return; }
        if (e && e.code === 'rate_limited') { say('Tunggu sebentar, lalu tekan Simpan lagi.'); return; }
      }
    }
    if (!IN_ARTIFACT) {
      const a = document.createElement('a'); a.href = state.url; a.download = fileName();
      document.body.appendChild(a); a.click(); a.remove(); say('Video diunduh.'); return;
    }
    say('Penyimpanan tidak tersedia di tampilan ini. Tekan lama video di atas lalu pilih Simpan/Unduh.');
  };
  const canShare = !IN_ARTIFACT && state.blob && navigator.canShare && (() => { try { return navigator.canShare({ files: [new File([state.blob], fileName(), { type: state.blob.type })] }); } catch { return false; } })();
  const share = async () => {
    try { await navigator.share({ files: [new File([state.blob], fileName(), { type: state.blob.type })], title: entry.id }); } catch { /* dibatalkan */ }
  };

  const rendering = state.phase === 'render' || state.phase === 'check';
  return (
    <div className="stack">
      <div className="card">
        <h2>Buat file video</h2>
        <p className="muted">{entry.id} · {outW}×{outH} · {+entry.fps.toFixed(2)} fps · {fmtSec(entry.durationInFrames / entry.fps)} ({entry.durationInFrames} frame)</p>
        <div className="field"><span className="lbl">Format</span>
          <div className="seg">{[['mp4', 'MP4 (TikTok)'], ['webm', 'WebM']].map(([k, l]) => <button key={k} className={fmt === k ? 'on' : ''} onClick={() => setFmt(k)} disabled={rendering}>{l}</button>)}</div></div>
        <div className="field"><span className="lbl">Kualitas</span>
          <div className="seg">{[['medium', 'Sedang'], ['high', 'Tinggi'], ['very-high', 'Maks']].map(([k, l]) => <button key={k} className={quality === k ? 'on' : ''} onClick={() => setQuality(k)} disabled={rendering}>{l}</button>)}</div></div>
        <div className="field"><span className="lbl">Resolusi</span>
          <div className="seg">{[[1, '100%'], [0.75, '75%'], [0.5, '50% (cepat)']].map(([k, l]) => <button key={k} className={scale === k ? 'on' : ''} onClick={() => setScale(k)} disabled={rendering}>{l}</button>)}</div></div>
        {!rendering && <button className="btn primary wide" onClick={start}><Icon n="film" />Buat video</button>}
        {rendering && (
          <div className="prog">
            <div className="bar"><i style={{ width: `${Math.round((state.p || 0) * 100)}%` }} /></div>
            <div className="prog-row"><span>{state.phase === 'check' ? 'Memeriksa browser…' : `${Math.round((state.p || 0) * 100)}%${state.frames ? ` · frame ${state.frames}/${entry.durationInFrames}` : ''}`}</span>
              {state.eta > 0 && <span>sisa ± {fmtSec(state.eta / 1000)}</span>}</div>
            <p className="muted">Biarkan layar tetap menyala dan jangan pindah aplikasi sampai selesai.</p>
            <button className="btn wide" onClick={() => abortRef.current && abortRef.current.abort()}><Icon n="x" />Batalkan</button>
          </div>
        )}
        {state.phase === 'error' && (
          <div className="card err inner" role="alert">
            <div className="err-head"><Icon n="alert" />Video gagal dibuat</div>
            <p className="err-msg">{state.msg}</p>
            <p className="err-hint">Pratinjau tetap bisa dipakai. Coba resolusi 50% atau format lain. Efek CSS tertentu (filter rumit, video dari situs lain) belum bisa direkam di browser.</p>
          </div>
        )}
      </div>
      {state.phase === 'done' && (
        <div className="card">
          <h2>Video siap</h2>
          <video className="result" src={state.url} controls playsInline />
          <p className="muted">{fileName()} · {fmtBytes(state.size)} · dibuat dalam {fmtSec(state.took)}</p>
          <div className="row">
            <button className="btn primary" onClick={save}><Icon n="down" />Simpan ke HP</button>
            {canShare && <button className="btn" onClick={share}><Icon n="share" />Bagikan</button>}
          </div>
        </div>
      )}
      <p className="muted small">Pembuatan video berjalan di HP Anda sendiri (tanpa server). Hasil paling stabil di Chrome Android versi terbaru. Video panjang butuh waktu lebih lama.</p>
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

function Help() {
  return (
    <details className="card help">
      <summary>Cara pakai & paket yang didukung</summary>
      <ol>
        <li>Salin kode Remotion (dari ChatGPT, Claude, GitHub, dll.).</li>
        <li>Buka tab <b>Kode</b>, tekan <b>Tempel</b> (atau tekan lama di kolom lalu Tempel).</li>
        <li>Tekan <b>Jalankan</b>. Video tampil di tab <b>Putar</b>.</li>
        <li>Tab <b>Ekspor</b> membuat file MP4 untuk diunggah ke TikTok.</li>
      </ol>
      <h3>Banyak file sekaligus</h3>
      <p>Tempel saja semuanya. Aplikasi memisahkan file otomatis bila tiap file diawali baris seperti <code>// src/Root.tsx</code>, atau bila kode berupa beberapa blok <code>```tsx</code>. Import seperti <code>./Judul</code> otomatis tersambung.</p>
      <h3>Yang dikenali</h3>
      <p><code>&lt;Composition&gt;</code>, <code>registerRoot</code>, <code>calculateMetadata</code>, <code>defaultProps</code>, atau cukup komponen yang di-export. TypeScript dan JSX langsung jalan.</p>
      <h3>Paket bawaan</h3>
      <p className="pk">remotion, @remotion/player, transitions (fade, slide, wipe, flip, iris, dll.), shapes, paths, noise, motion-blur, layout-utils, animation-utils, media-utils, media, fonts, google-fonts, captions, gif, lottie, light-leaks, starburst, rounded-text-box, effects, zod, react.</p>
      <p>Paket lain dicoba diambil dari internet secara otomatis.</p>
    </details>
  );
}

// ---------- Mulai ----------
const rootEl = document.getElementById('root');
createRoot(rootEl).render(<Guard fallback={(err) => (
  <div className="fatal"><h1>Aplikasi perlu dimuat ulang</h1><p>{String(err && err.message)}</p><p>Kode Anda tetap tersimpan.</p>
    <button className="btn primary" onClick={() => { LS.set('rs.running', 0); location.reload(); }}>Muat ulang</button></div>
)}><App /></Guard>);
