/**
 * MESIN VIDEO ADRIY PROJECT — dipakai bersama oleh 9 video.
 * Tiap video cukup menulis data (tema, adegan, sfx, musik, thumbnail) di src/vNN/data.tsx.
 * Tata letak tetap: judul y 230–420, isi y 450–1060, subtitle y 1085–1290, ADRIY di bawah.
 */
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { Latar, JenisLatar } from "./latar";

export const FPS = 30;
export const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export type Tema = {
  latar: JenisLatar;
  utama: string; // warna judul
  aksen: string; // warna sorotan
  teks: string; // warna teks isi
  kartu: string; // latar kartu/subtitle (rgba)
  garis: string; // warna garis kartu
  fontJudul: string; // nama file di public/font tanpa .woff2
  fontIsi: string;
  ukuranJudul?: number;
  sorot?: string; // warna kata aktif di subtitle (default: aksen)
  hurufBesar?: boolean;
};

export type Kal = { no: number; teks: string; mulai: number; durasi: number };
export type Timeline = { kalimat: Kal[]; total: number; sub?: Kal[] };
export type Isi = (f: number, d: number, t: (n: number) => number) => React.ReactNode;
export type Tokoh = { pose: string; sisi?: "kiri" | "kanan" };
export type Adegan = { k: [number, number]; judul?: string; sub?: string; tokoh?: Tokoh; isi?: Isi; latar?: Record<string, number | string | boolean> };
export type Sfx = [number, number, string, number]; // [kalimat, geser detik, nama, volume]
export type DataVideo = {
  id: string;
  tema: Tema;
  timeline: Timeline;
  pose: Record<string, [number, number]>; // ukuran asli tiap pose
  adegan: Adegan[];
  sfx: Sfx[];
  musik: { file: string; vol: number } | null;
  thumb: { baris: string[]; sorot: number[]; pose: string; benda?: string[]; label?: string; ukuran?: number; latar?: Record<string, number | string | boolean> };
};

// ─── Konteks data supaya komponen kecil tahu tema & folder aset ───
const Ctx = React.createContext<DataVideo | null>(null);
export const useData = () => React.useContext(Ctx)!;
export const aset = (id: string, p: string) => staticFile(`${id}/${p}`);

export const Fonts: React.FC<{ tema: Tema }> = ({ tema }) => (
  <style>{`
    @font-face { font-family: 'J'; src: url('${staticFile(`font/${tema.fontJudul}.woff2`)}') format('woff2'); }
    @font-face { font-family: 'I'; src: url('${staticFile(`font/${tema.fontIsi}.woff2`)}') format('woff2'); }
  `}</style>
);

export const usePop = (at: number, damping = 12) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping, stiffness: 120 } });
};

// ─── Judul adegan ───
export const Judul: React.FC<{ judul: string; sub?: string }> = ({ judul, sub }) => {
  const { tema } = useData();
  const p = usePop(0, 14);
  const p2 = usePop(8, 14);
  return (
    <div style={{ position: "absolute", top: 230, left: 50, right: 50, textAlign: "center", zIndex: 5 }}>
      <div
        style={{
          fontFamily: "J", fontSize: tema.ukuranJudul ?? 86, lineHeight: 1.05, color: tema.utama,
          textTransform: tema.hurufBesar === false ? "none" : "uppercase",
          textShadow: "0 6px 24px rgba(0,0,0,.45)", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
        }}
      >
        {judul}
      </div>
      {sub && (
        <div style={{ fontFamily: "I", fontSize: 42, color: tema.aksen, marginTop: 14, opacity: p2, transform: `translateY(${(1 - p2) * 20}px)` }}>{sub}</div>
      )}
    </div>
  );
};

// ─── Kartu teks yang muncul (at = frame lokal) ───
export const Kartu: React.FC<{ at: number; x?: number; y: number; w?: number; children: React.ReactNode; warna?: string; size?: number; tengah?: boolean }> = ({
  at, x, y, w, children, warna, size = 46, tengah,
}) => {
  const { tema } = useData();
  const p = usePop(at, 13);
  const kiri = tengah ? undefined : x ?? 90;
  return (
    <div
      style={{
        position: "absolute", top: y, left: tengah ? 0 : kiri, right: tengah ? 0 : undefined,
        display: "flex", justifyContent: tengah ? "center" : "flex-start", opacity: Math.min(1, p * 1.4),
        transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`, zIndex: 6,
      }}
    >
      <div
        style={{
          width: w, padding: "14px 30px", borderRadius: 22, background: tema.kartu, border: `4px solid ${warna ?? tema.garis}`,
          color: tema.teks, fontFamily: "I", fontSize: size, lineHeight: 1.2, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.3)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Angka besar yang menghitung naik ───
export const Angka: React.FC<{ at: number; dari?: number; ke: number; y: number; akhiran?: string; awalan?: string; size?: number; durasi?: number; desimal?: number; tahun?: boolean }> = ({
  at, dari = 0, ke, y, akhiran = "", awalan = "", size = 150, durasi = 30, desimal = 0, tahun,
}) => {
  const { tema } = useData();
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + durasi], [dari, ke], cl);
  const p = usePop(at, 10);
  const s = v.toFixed(desimal).replace(".", ",");
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", fontFamily: "J", fontSize: size, color: tema.aksen, opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})`, textShadow: "0 8px 30px rgba(0,0,0,.45)", zIndex: 6 }}>
      {awalan}
      {tahun ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
      {akhiran}
    </div>
  );
};

// ─── Gambar benda dari katalog (public/benda/<nama>.png) ───
export const Benda: React.FC<{ nama: string; x: number; y: number; h: number; at?: number; goyang?: boolean; putar?: number; redup?: number; balik?: boolean }> = ({
  nama, x, y, h, at = 0, goyang, putar = 0, redup = 1, balik,
}) => {
  const f = useCurrentFrame();
  const p = usePop(at, 12);
  const g = goyang ? Math.sin((f - at) / 14) * 10 : 0;
  return (
    <Img
      src={staticFile(`benda/${nama}.png`)}
      style={{
        position: "absolute", left: x, top: y, height: h, width: "auto", opacity: Math.min(1, p * 1.4) * redup, zIndex: 4,
        transform: `translateY(${(1 - p) * 40 + g}px) scale(${(0.7 + 0.3 * p) * (balik ? -1 : 1)}, ${0.7 + 0.3 * p}) rotate(${putar + (goyang ? Math.sin((f - at) / 20) * 3 : 0)}deg)`,
        filter: "drop-shadow(0 16px 26px rgba(0,0,0,.35))",
      }}
    />
  );
};

// ─── ADRIY: pose dada (lebar) ditampilkan utuh, pose badan penuh dipotong setengah badan ───
export const TokohAdriy: React.FC<Tokoh & { at?: number; besar?: number }> = ({ pose, sisi = "kanan", at = 0, besar = 1 }) => {
  const { id, pose: ukuran } = useData();
  const f = useCurrentFrame();
  const p = usePop(at, 14);
  const [w, h] = ukuran[pose] ?? [500, 600];
  const rasio = h / w;
  let tinggi: number, bawah: number;
  if (rasio < 1.6) {
    // dada/setengah badan: tinggi maks 680, lebar maks 760
    tinggi = Math.min(680, 760 * rasio) * besar;
    bawah = 0;
  } else {
    // badan penuh → tampilkan bagian atas saja (seperti setengah badan)
    tinggi = 1150 * besar;
    bawah = -tinggi * 0.42;
  }
  const bob = Math.sin((f - at) / 18) * 6;
  const sq = interpolate(p, [0, 0.6, 1], [0.85, 1.04, 1]);
  return (
    <Img
      src={aset(id, `pose/${pose}.png`)}
      style={{
        position: "absolute", bottom: bawah, height: tinggi, width: "auto", [sisi === "kiri" ? "left" : "right"]: -10, zIndex: 3,
        transformOrigin: "bottom center", transform: `translateY(${(1 - p) * 260 + bob}px) scale(${sq})`, opacity: Math.min(1, p * 2),
        filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))",
      }}
    />
  );
};

// ─── Subtitle kata per kata ───
const Subtitle: React.FC = () => {
  const { tema, timeline } = useData();
  const f = useCurrentFrame();
  const t = f / FPS;
  const SUB = timeline.sub ?? timeline.kalimat;
  const k = SUB.find((x) => t >= x.mulai - 0.05 && t < x.mulai + x.durasi + 0.3);
  if (!k) return null;
  const kata = k.teks.split(" ");
  const pot: string[][] = [];
  for (let i = 0; i < kata.length; i += 8) pot.push(kata.slice(i, i + 8));
  if (pot.length > 1 && pot[pot.length - 1].length < 3) {
    const a = pot.pop()!;
    pot[pot.length - 1].push(...a);
  }
  const berat = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").length + 2;
  const tot = kata.reduce((s, w) => s + berat(w), 0);
  const prog = Math.max(0, Math.min(0.999, (t - k.mulai) / k.durasi));
  let acc = 0, idx = 0;
  for (let i = 0; i < kata.length; i++) {
    acc += berat(kata[i]) / tot;
    idx = i;
    if (prog < acc) break;
  }
  let mulaiPot = 0, pIdx = 0;
  for (let i = 0; i < pot.length; i++) {
    if (idx < mulaiPot + pot[i].length) { pIdx = i; break; }
    mulaiPot += pot[i].length;
  }
  return (
    <div style={{ position: "absolute", left: 55, right: 55, top: 1085, display: "flex", justifyContent: "center", zIndex: 20 }}>
      <div style={{ background: tema.kartu, border: `3px solid ${tema.garis}`, borderRadius: 26, padding: "16px 28px", fontFamily: "I", fontSize: 44, lineHeight: 1.3, color: "#fff", textAlign: "center", boxShadow: "0 8px 22px rgba(0,0,0,.35)" }}>
        {pot[pIdx].map((w, i) => {
          const g = mulaiPot + i;
          const aktif = g === idx;
          return (
            <span key={i} style={{ color: aktif ? tema.sorot ?? tema.aksen : g < idx ? "#fff" : "rgba(255,255,255,.72)", display: "inline-block", transform: aktif ? "scale(1.08)" : undefined, margin: "0 7px" }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Masuk: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, d - 6, d], [0, 1, 1, 0.5], cl);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Lokal: React.FC<{ d: number; t: (n: number) => number; a: Adegan }> = ({ d, t, a }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Latar jenis={useData().tema.latar} opsi={a.latar} />
      {a.isi?.(f, d, t)}
      {a.judul && <Judul judul={a.judul} sub={a.sub} />}
      {a.tokoh && <TokohAdriy {...a.tokoh} at={4} />}
    </>
  );
};

export const durasiVideo = (d: DataVideo) => Math.ceil((d.timeline.total + 1.5) * FPS);

export const VideoMesin: React.FC<{ data: DataVideo }> = ({ data }) => {
  const f = useCurrentFrame();
  const fk = (n: number) => Math.round(data.timeline.kalimat[n - 1].mulai * FPS);
  const DUR = durasiVideo(data);
  const A = data.adegan;
  const mulai = (i: number) => (i === 0 ? 0 : fk(A[i].k[0]) - 6);
  const akhir = (i: number) => (i === A.length - 1 ? DUR : mulai(i + 1));
  const { musik } = data;
  return (
    <Ctx.Provider value={data}>
      <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
        <Fonts tema={data.tema} />
        {A.map((a, i) => {
          const from = mulai(i), d = akhir(i) - from;
          return (
            <Sequence key={i} from={from} durationInFrames={d}>
              <Masuk d={d}>
                <Lokal d={d} t={(n) => fk(n) - from} a={a} />
              </Masuk>
            </Sequence>
          );
        })}
        <div style={{ position: "absolute", top: 120, left: 60, fontFamily: "I", fontSize: 30, letterSpacing: 5, color: data.tema.aksen, opacity: 0.9, zIndex: 30 }}>ADRIY PROJECT</div>
        <Subtitle />
        <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [DUR - 25, DUR], [0, 1], cl), zIndex: 40 }} />
        <Audio src={aset(data.id, "narasi.wav")} />
        {musik && (
          <Audio src={aset(data.id, musik.file)} loop volume={(x) => interpolate(x, [0, 25, DUR - 45, DUR], [0, musik.vol, musik.vol, 0], cl)} />
        )}
        {data.sfx.map(([k, g, nama, v], i) => (
          <Sequence key={i} from={Math.max(0, fk(k) + Math.round(g * FPS))} durationInFrames={FPS * 8}>
            <Audio src={aset(data.id, `sfx/${nama}.wav`)} volume={v} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </Ctx.Provider>
  );
};

// ─── THUMBNAIL (sampul TikTok 1080×1920) ───
export const ThumbMesin: React.FC<{ data: DataVideo }> = ({ data }) => {
  const { tema, thumb, id } = data;
  const [w, h] = data.pose[thumb.pose] ?? [500, 600];
  const rasio = h / w;
  const tinggi = rasio < 1.6 ? Math.min(1050, 1080 * rasio) : 1750;
  const bawah = rasio < 1.6 ? 0 : -tinggi * 0.4;
  return (
    <Ctx.Provider value={data}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Fonts tema={tema} />
        <Latar jenis={tema.latar} opsi={{ ...(thumb.latar ?? {}), diam: true }} />
        {(thumb.benda ?? []).map((b, i) => (
          <Img key={b} src={staticFile(`benda/${b}.png`)} style={{ position: "absolute", height: i === 0 ? 560 : 360, top: i === 0 ? 700 : 1020, left: i === 0 ? 40 : 600, transform: `rotate(${i === 0 ? -8 : 10}deg)`, filter: "drop-shadow(0 20px 30px rgba(0,0,0,.5))" }} />
        ))}
        <Img src={aset(id, `pose/${thumb.pose}.png`)} style={{ position: "absolute", bottom: bawah, right: -40, height: tinggi, width: "auto", filter: "drop-shadow(0 20px 40px rgba(0,0,0,.6))" }} />
        <div style={{ position: "absolute", top: 210, left: 50, right: 50 }}>
          {thumb.baris.map((b, i) => (
            <div key={i} style={{ fontFamily: "J", fontSize: (b.length > 10 ? 120 : 150) * (thumb.ukuran ?? 1), lineHeight: 1.02, textTransform: "uppercase", color: thumb.sorot.includes(i) ? tema.aksen : "#fff", WebkitTextStroke: "6px rgba(0,0,0,.85)", paintOrder: "stroke", textShadow: "0 10px 0 rgba(0,0,0,.55), 0 0 40px rgba(0,0,0,.5)", transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
              {b}
            </div>
          ))}
        </div>
        {thumb.label && (
          <div style={{ position: "absolute", top: 120, left: 50, padding: "10px 26px", borderRadius: 14, background: tema.aksen, color: "#111", fontFamily: "I", fontSize: 40, fontWeight: 800 }}>{thumb.label}</div>
        )}
        <div style={{ position: "absolute", bottom: 60, left: 50, padding: "10px 22px", borderRadius: 14, background: "rgba(0,0,0,.6)", color: "#fff", fontFamily: "I", fontSize: 34, letterSpacing: 4 }}>ADRIY PROJECT</div>
      </AbsoluteFill>
    </Ctx.Provider>
  );
};
