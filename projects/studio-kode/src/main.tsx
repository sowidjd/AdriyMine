/** Studio Kode: tempel kode Remotion → pratinjau → render MP4 langsung di browser (tanpa server). */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as JSXRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as Remotion from "remotion";
import { Player } from "@remotion/player";
import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";
import * as RemotionThree from "@remotion/three";
import * as THREE from "three";
import * as Fiber from "@react-three/fiber";
import { transform } from "sucrase";

const MODUL: Record<string, unknown> = {
  react: React, "react/jsx-runtime": JSXRuntime, "react-dom": ReactDOM,
  remotion: { ...Remotion, registerRoot: () => {} }, "@remotion/three": RemotionThree, three: THREE, "@react-three/fiber": Fiber,
};

const CONTOH = `import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Contoh: ganti seluruh isi kotak ini dengan kode Remotion kamu.
export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 10, fps, config: { damping: 12 } });
  const putar = interpolate(f, [0, 150], [0, 360]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1f3a5f, #0a0f17)", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360, height: 360, borderRadius: 40, background: "#f59e0b", transform: \`scale(\${s}) rotate(\${putar}deg)\`, boxShadow: "0 30px 80px rgba(245,158,11,.4)" }} />
      <div style={{ position: "absolute", bottom: 420, color: "white", fontSize: 90, fontWeight: 900, fontFamily: "Arial", opacity: s }}>Adriy Project</div>
    </AbsoluteFill>
  );
};

// Ukuran & durasi dibaca otomatis dari <Composition ...> bila ada:
// <Composition id="Video" component={Video} durationInFrames={150} fps={30} width={1080} height={1920} />
`;

type Atur = { durasi: number; fps: number; lebar: number; tinggi: number };
const angka = (kode: string, nama: string) => { const m = kode.match(new RegExp(nama + "\\s*=\\s*\\{\\s*(\\d+)\\s*\\}")); return m ? Number(m[1]) : null; };

function kompilasi(kodeAsli: string): { komp: React.ComponentType | null; galat: string | null; nama: string } {
  // buang pagar markdown ``` yang sering ikut tersalin dari chat
  const kode = kodeAsli.replace(/^\s*```[a-zA-Z]*\s*$/gm, "")
  // tanda panah/perbandingan yang diubah jadi simbol oleh aplikasi catatan/chat (⇒ ≥ ≤ ≠), spasi tak terlihat
    .replace(/⇒/g, "=>").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/≠/g, "!=").replace(/\u00a0/g, " ").replace(/[\u200b-\u200d\ufeff]/g, "");
  try {
    const js = transform(kode, { transforms: ["typescript", "jsx", "imports"], jsxRuntime: "automatic", production: true }).code;
    const module = { exports: {} as Record<string, unknown> };
    const req = (n: string) => { if (n in MODUL) return MODUL[n]; if (/^@fontsource\//.test(n) || /\.css$/.test(n)) return {}; throw new Error(`Paket "${n}" belum didukung. Yang bisa dipakai: ${Object.keys(MODUL).join(", ")}`); };
    new Function("require", "module", "exports", js)(req, module, module.exports);
    const ex = module.exports;
    const fungsi = Object.entries(ex).filter(([k, v]) => typeof v === "function" && /^[A-Z]/.test(k) && k !== "Root");
    const pilih = (typeof ex.default === "function" && ex.default !== ex.Root ? ["default", ex.default] : null) as [string, unknown] | null;
    const dariComp = kode.match(/component=\{\s*([A-Za-z0-9_]+)\s*\}/)?.[1];
    const hasil = (dariComp && typeof ex[dariComp] === "function" ? [dariComp, ex[dariComp]] : null) ?? pilih ?? fungsi[0];
    if (!hasil) return { komp: null, galat: "Tidak ada komponen yang di-export. Tambahkan 'export' di depan komponen video, mis. export const Video = () => ...", nama: "" };
    return { komp: hasil[1] as React.ComponentType, galat: null, nama: hasil[0] };
  } catch (e) {
    const pesan = String((e as Error).message || e);
    const m = pesan.match(/\((\d+):(\d+)\)/);
    if (!m) return { komp: null, galat: pesan, nama: "" };
    const n = Number(m[1]), c = Number(m[2]); const baris = kode.split("\n");
    const cuplik = [n - 1, n, n + 1].filter((i) => i >= 1 && i <= baris.length).map((i) => `${String(i).padStart(4)} | ${baris[i - 1]}` + (i === n ? `\n     | ${" ".repeat(Math.max(0, c - 1))}^` : "")).join("\n");
    return { komp: null, galat: `Kode tidak bisa dibaca di baris ${n}, kolom ${c}:\n${cuplik}\n\n(${pesan})\nBiasanya: kode terpotong saat disalin, ada teks biasa di luar komentar, atau kurung/kurawal tidak lengkap.`, nama: "" };
  }
}

class Pengaman extends React.Component<{ children: React.ReactNode; kunci: string }, { galat: string | null }> {
  state = { galat: null as string | null };
  static getDerivedStateFromError(e: Error) { return { galat: e.message }; }
  componentDidUpdate(p: { kunci: string }) { if (p.kunci !== this.props.kunci && this.state.galat) this.setState({ galat: null }); }
  render() { return this.state.galat ? <div className="galat">Kode error saat diputar: {this.state.galat}</div> : this.props.children; }
}

const simpan = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* boleh gagal */ } };
const baca = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

function App() {
  const [kode, setKode] = useState(() => baca("kode") || CONTOH);
  const [aktif, setAktif] = useState(kode);
  const [atur, setAtur] = useState<Atur>({ durasi: 150, fps: 30, lebar: 1080, tinggi: 1920 });
  const [status, setStatus] = useState<string>("");
  const [persen, setPersen] = useState<number | null>(null);
  const [hasilUrl, setHasilUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const batal = useRef<AbortController | null>(null);
  const { komp, galat, nama } = useMemo(() => kompilasi(aktif), [aktif]);

  const jalankan = useCallback(() => {
    simpan("kode", kode);
    const d = angka(kode, "durationInFrames"), fps = angka(kode, "fps"), w = angka(kode, "width"), h = angka(kode, "height");
    setAtur((a) => ({ durasi: d ?? a.durasi, fps: fps ?? a.fps, lebar: w ?? a.lebar, tinggi: h ?? a.tinggi }));
    setAktif(kode); setStatus("");
  }, [kode]);
  useEffect(() => { jalankan(); }, []); // eslint-disable-line

  const render = async () => {
    if (!komp) return;
    setHasilUrl(null); blobRef.current = null;
    const composition = { id: "Video", component: komp, durationInFrames: atur.durasi, fps: atur.fps, width: atur.lebar, height: atur.tinggi };
    try {
      const cek = await canRenderMediaOnWeb({ container: "mp4", videoCodec: "h264", width: atur.lebar, height: atur.tinggi } as never);
      if (cek && (cek as { canRender?: boolean }).canRender === false) {
        setStatus("Browser ini belum bisa merender MP4: " + ((cek as { issues?: { message: string }[] }).issues?.map((i) => i.message).join("; ") || "coba Chrome terbaru")); return;
      }
    } catch { /* lanjut saja */ }
    batal.current = new AbortController(); setPersen(0); setStatus("Merender…");
    try {
      const r = await renderMediaOnWeb({ composition, container: "mp4", videoCodec: "h264", signal: batal.current.signal,
        onProgress: (p) => setPersen(Math.round(p.progress * 100)) } as never);
      const blob = await r.getBlob(); blobRef.current = blob;
      setHasilUrl(URL.createObjectURL(blob)); setStatus(`Selesai · ${(blob.size / 1e6).toFixed(1)} MB`);
    } catch (e) { setStatus(batal.current?.signal.aborted ? "Dibatalkan." : "Render gagal: " + String((e as Error).message || e)); }
    setPersen(null);
  };

  const unduh = async () => {
    const blob = blobRef.current; if (!blob) return;
    const claude = (window as unknown as { claude?: { use: (n: string) => Promise<{ save: (r: { filename: string; data: Blob }) => Promise<unknown> } | null> } }).claude;
    const dl = claude ? await claude.use("downloads").catch(() => null) : null;
    if (!dl) { setStatus("Unduhan tidak tersedia di tampilan ini. Tahan lama video di atas lalu pilih Simpan/Unduh."); return; }
    try { await dl.save({ filename: `video-${Date.now()}.mp4`, data: blob }); setStatus("Video dikirim ke unduhan."); }
    catch (e) { const c = (e as { code?: string }).code; setStatus(c === "declined" ? "Unduhan dibatalkan." : "Tidak bisa mengunduh di sini (" + c + ")."); }
  };

  const ubah = (k: keyof Atur) => (e: React.ChangeEvent<HTMLInputElement>) => setAtur({ ...atur, [k]: Math.max(1, Number(e.target.value) || 1) });
  return (
    <main>
      <header><h1>Studio Kode</h1><p>Tempel kode Remotion, putar pratinjau, lalu render jadi MP4 langsung di HP. Tanpa server, tanpa suara.</p></header>
      <section className="panel">
        <label htmlFor="kode">Kode Remotion (.tsx)</label>
        <textarea id="kode" spellCheck={false} value={kode} onChange={(e) => setKode(e.target.value)} />
        <div className="tombol"><button onClick={jalankan}>▶ Jalankan</button><button className="kedua" onClick={() => setKode("")}>Kosongkan</button><button className="kedua" onClick={() => setKode(CONTOH)}>Contoh</button></div>
        <div className="atur">
          <label>Durasi (frame)<input id="durasi" type="number" value={atur.durasi} onChange={ubah("durasi")} /></label>
          <label>FPS<input id="fps" type="number" value={atur.fps} onChange={ubah("fps")} /></label>
          <label>Lebar<input id="lebar" type="number" value={atur.lebar} onChange={ubah("lebar")} /></label>
          <label>Tinggi<input id="tinggi" type="number" value={atur.tinggi} onChange={ubah("tinggi")} /></label>
        </div>
        <p className="kecil">{(atur.durasi / atur.fps).toFixed(1)} detik · {atur.lebar}×{atur.tinggi}{nama ? ` · komponen: ${nama}` : ""}</p>
      </section>
      <section className="panel">
        {galat ? <div className="galat">{galat}</div> : komp ? (
          <Pengaman kunci={aktif}>
            <div className="layar" style={{ aspectRatio: `${atur.lebar} / ${atur.tinggi}` }}>
              <Player component={komp} durationInFrames={atur.durasi} fps={atur.fps} compositionWidth={atur.lebar} compositionHeight={atur.tinggi} controls loop style={{ width: "100%", height: "100%" }} />
            </div>
          </Pengaman>) : null}
        <div className="tombol">
          <button disabled={!komp || persen !== null} onClick={render}>⬇ Render MP4</button>
          {persen !== null && <button className="kedua" onClick={() => batal.current?.abort()}>Batal</button>}
        </div>
        {persen !== null && <div className="bar"><i style={{ width: `${persen}%` }} /></div>}
        {status && <p className="kecil" role="status">{status}{persen !== null ? ` ${persen}%` : ""}</p>}
        {hasilUrl && <><video src={hasilUrl} controls playsInline className="hasil" /><button onClick={unduh}>Simpan MP4</button></>}
      </section>
      <p className="kecil">Paket yang bisa di-import: react, remotion, @remotion/three, three, @react-three/fiber. File dari staticFile() belum didukung. Render memakai prosesor HP, jadi video panjang atau 3D berat butuh waktu.</p>
    </main>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
