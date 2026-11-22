// Rasio & resolusi video untuk tiap platform, plus cara menyesuaikan isi video.
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';

export const FORMATS = [
  { id: 'asli', label: 'Asli', sub: 'dari kode', r: null },
  { id: 'tiktok', label: 'TikTok', sub: '9:16', r: [9, 16] },
  { id: 'reels', label: 'Reels', sub: '9:16', r: [9, 16] },
  { id: 'shorts', label: 'Shorts', sub: '9:16', r: [9, 16] },
  { id: 'youtube', label: 'YouTube', sub: '16:9', r: [16, 9] },
  { id: 'ig11', label: 'Feed IG', sub: '1:1', r: [1, 1] },
  { id: 'ig45', label: 'Feed IG', sub: '4:5', r: [4, 5] },
  { id: 'wide', label: 'Sinema', sub: '21:9', r: [21, 9] },
  { id: 'kustom', label: 'Kustom', sub: 'bebas', r: 'custom' },
];
export const RESOLUTIONS = [[720, '720p'], [1080, '1080p'], [1440, '2K'], [2160, '4K']];
export const MODES = [
  ['fit', 'Pas', 'Seluruh video terlihat, sisa ruang diberi warna latar.'],
  ['fill', 'Penuhi', 'Layar terisi penuh, tepi video terpotong.'],
  ['canvas', 'Ubah kanvas', 'Ukuran kanvas diganti; cocok untuk kode yang memakai useVideoConfig().'],
];
export const DEFAULT_FORMAT = { preset: 'asli', res: 1080, mode: 'fit', bg: '#000000', cw: 1080, ch: 1920 };

const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const clampDim = (n) => Math.min(7680, Math.max(64, Number(n) || 1080));

export function targetSize(format) {
  const f = FORMATS.find((x) => x.id === format.preset) || FORMATS[0];
  if (!f.r) return null;
  if (f.r === 'custom') return [even(clampDim(format.cw)), even(clampDim(format.ch))];
  const [a, b] = f.r;
  const s = Number(format.res) || 1080;
  return a <= b ? [even(s), even((s * b) / a)] : [even((s * a) / b), even(s)];
}

const cache = new WeakMap();
function wrap(C, ow, oh, mode, bg) {
  const key = `${ow}x${oh}:${mode}:${bg}`;
  let m = cache.get(C);
  if (!m) { m = new Map(); cache.set(C, m); }
  if (m.has(key)) return m.get(key);
  const Wrapped = (props) => {
    const { width, height } = useVideoConfig();
    const k = mode === 'fill' ? Math.max(width / ow, height / oh) : Math.min(width / ow, height / oh);
    return (
      <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: (width - ow * k) / 2, top: (height - oh * k) / 2, width: ow, height: oh, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden' }}>
          <Sequence width={ow} height={oh} name="Video asli">
            <C {...props} />
          </Sequence>
        </div>
      </AbsoluteFill>
    );
  };
  Wrapped.displayName = 'Format(' + (C.displayName || C.name || 'Video') + ')';
  m.set(key, Wrapped);
  return Wrapped;
}

/** Menghasilkan entri video baru sesuai format yang dipilih. */
export function applyFormat(entry, format) {
  if (!entry) return entry;
  const t = targetSize(format);
  if (!t) return entry;
  const [w, h] = t;
  if (w === entry.width && h === entry.height) return { ...entry, formatLabel: format.preset };
  if (format.mode === 'canvas') return { ...entry, width: w, height: h, formatLabel: format.preset };
  return { ...entry, width: w, height: h, component: wrap(entry.component, entry.width, entry.height, format.mode, format.bg), formatLabel: format.preset };
}

export function formatName(format) {
  const f = FORMATS.find((x) => x.id === format.preset) || FORMATS[0];
  return f.r ? `${f.label} ${f.sub}` : 'Asli';
}

/** Panel pemilih format di tab Putar. */
export function FormatPanel({ base, format, setFormat, out }) {
  const set = (k, v) => setFormat({ ...format, [k]: v });
  const f = FORMATS.find((x) => x.id === format.preset) || FORMATS[0];
  return (
    <div className="card fmt">
      <div className="fmt-head"><h2>Format video</h2>{out && <span className="muted small">Hasil: {out.width}×{out.height}</span>}</div>
      <div className="fmt-row" role="radiogroup" aria-label="Platform">
        {FORMATS.map((x) => (
          <button key={x.id} role="radio" aria-checked={format.preset === x.id} className={'fmt-chip' + (format.preset === x.id ? ' on' : '')} onClick={() => set('preset', x.id)}>
            <RatioIcon r={x.r === 'custom' ? [format.cw, format.ch] : x.r || (base ? [base.width, base.height] : [9, 16])} />
            <b>{x.label}</b><span>{x.id === 'asli' && base ? `${base.width}×${base.height}` : x.sub}</span>
          </button>
        ))}
      </div>
      {f.r === 'custom' && (
        <div className="grid2">
          <div className="field"><label htmlFor="kustom-w">Lebar (px)</label><input id="kustom-w" inputMode="numeric" value={format.cw} onChange={(e) => set('cw', e.target.value)} /></div>
          <div className="field"><label htmlFor="kustom-h">Tinggi (px)</label><input id="kustom-h" inputMode="numeric" value={format.ch} onChange={(e) => set('ch', e.target.value)} /></div>
        </div>
      )}
      {f.r && f.r !== 'custom' && (
        <div className="field"><span className="lbl">Resolusi</span>
          <div className="seg">{RESOLUTIONS.map(([v, l]) => <button key={v} className={Number(format.res) === v ? 'on' : ''} onClick={() => set('res', v)}>{l}</button>)}</div></div>
      )}
      {f.r && (
        <div className="field"><span className="lbl">Cara menyesuaikan</span>
          <div className="seg">{MODES.map(([k, l]) => <button key={k} className={format.mode === k ? 'on' : ''} onClick={() => set('mode', k)}>{l}</button>)}</div>
          <span className="muted small">{(MODES.find((m) => m[0] === format.mode) || MODES[0])[2]}</span>
        </div>
      )}
      {f.r && format.mode === 'fit' && (
        <div className="field"><span className="lbl">Warna latar</span>
          <div className="swatches">
            {['#000000', '#ffffff', '#0e1116', '#1d3557', '#2a9d8f', '#e9c46a'].map((c) => (
              <button key={c} className={'sw' + (format.bg === c ? ' on' : '')} style={{ background: c }} aria-label={`Latar ${c}`} onClick={() => set('bg', c)} />
            ))}
            <input id="warna-latar" type="color" value={format.bg} onChange={(e) => set('bg', e.target.value)} aria-label="Warna latar lain" />
          </div>
        </div>
      )}
    </div>
  );
}

function RatioIcon({ r }) {
  const [a, b] = r;
  const k = 22 / Math.max(a, b);
  return <i className="ratio" style={{ width: Math.max(8, a * k), height: Math.max(8, b * k) }} aria-hidden="true" />;
}
