/**
 * TEMPLATE VIDEO ADRIY PROJECT — isi bagian bertanda ✏️ saja.
 *
 * Yang sudah otomatis: kanvas 1080×1920 30fps, waktu adegan mengikuti narasi (timeline.json),
 * subtitle kata-per-kata, ADRIY (PNG asli, masuk dengan pegas), narasi, musik + SFX.
 *
 * Aturan singkat (lengkapnya: projects/GAYA-VISUAL.md):
 * - Teks penting di x 60–927, y 212–1540. Judul ≥ 80px, isi ≥ 40px.
 * - Benda utama di y 300–1120. ADRIY di bawah kiri/kanan, tinggi ±520 (setengah badan) / ±560 (seluruh badan), supaya wajahnya tidak tertutup subtitle.
 * - Subtitle otomatis di y 1170–1330, jangan taruh teks/benda lain di situ (maks. y 1120).
 * - Waktu di dalam adegan pakai frame lokal: t(n) = frame mulai kalimat ke-n, d = panjang adegan.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  Adriy, Benda, C, FONT_JUDUL, FONT_TANGAN, Fonts, FPS, Judul, Kamera, Kertas, Label, Latar, Masuk, Muncul, PencilDefs,
  Subtitle, TOTAL_DETIK, fk,
} from "./lib";
import berkas from "./berkas.json";

const ada = (f: string) => (berkas as string[]).includes(f);

const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const DURASI = Math.ceil((TOTAL_DETIK + 1.8) * FPS);
type P = { d: number; t: (n: number) => number };

// ─────────────────────────────────────────────────────────────
// ✏️ 1. ADEGAN: tiap adegan = rentang nomor kalimat di naskah.txt
//    contoh [1, 1] = kalimat 1 saja, [3, 5] = kalimat 3 sampai 5.
// ─────────────────────────────────────────────────────────────

// Contoh adegan 1 — HOOK (latar pensil gelap, judul, ADRIY kaget)
const A1: React.FC<P> = ({ d }) => (
  <>
    <Kertas malam={0.6} />
    <Kamera d={d} dari={1} ke={1.1}>
      <Benda nama="termos" x={400} y={500} tinggi={500} goyang />
    </Kamera>
    <Judul at={10} top={240} warna="#ffd27a">JUDUL HOOK DI SINI?</Judul>
    <Adriy pose="setengah_kaget_tangan_terbuka" sisi="kiri" tinggi={520} at={6} />
  </>
);

// Contoh adegan 2 — PENJELASAN (latar terang, label muncul saat kalimat ke-3)
const A2: React.FC<P> = ({ t }) => (
  <>
    <Kertas />
    <Judul at={0} top={240}>KATA KUNCI</Judul>
    <Muncul at={10} style={{ left: 120, top: 520 }}>
      <div style={{ width: 840, height: 520, borderRadius: 40, background: "#fbf5e6", border: `6px solid ${C.pensil}` }} />
    </Muncul>
    <Label at={t(3)} x={160} y={1100} warna={C.biru}>← label muncul di kalimat 3</Label>
    <Adriy pose="jelaskan_tangan_terbuka" sisi="kanan" tinggi={560} at={4} />
  </>
);

// Contoh adegan 3 — CTA (latar gradien gelap, logo, gelap di akhir)
const A3: React.FC<P> = ({ d }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Latar titik />
      <Muncul at={6} style={{ top: 380, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 150, color: "#fff" }}>ADRIY PROJECT</div>
        <div style={{ fontFamily: FONT_TANGAN, fontSize: 60, color: C.amber }}>EXPLORE MORE, KNOW MORE.</div>
      </Muncul>
      <Adriy pose="setengah_jempol_senyum" sisi="kanan" tinggi={560} at={10} geserX={250} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [d - 24, d], [0, 1], cl) }} />
    </>
  );
};

// ✏️ Daftar adegan: [kalimat awal, kalimat akhir, komponen]. Harus urut & menutup semua kalimat.
const ADEGAN: [number, number, React.FC<P>][] = [
  [1, 1, A1],
  [2, 3, A2],
  [4, 5, A3],
];

// ✏️ 2. EFEK SUARA: [kalimat acuan, geser detik, nama file di projects/sfx-saya/normal tanpa .wav, volume]
const SFX: [number, number, string, number][] = [
  [1, 0.5, "tubuh_merinding_berkilau", 0.6],
  [2, 0.1, "transisi_whoosh", 0.5],
  [4, 0.3, "ui_ide_lonceng", 0.6],
];

// ✏️ 3. MUSIK: [file di public, mulai di kalimat ke-, volume]. Kosongkan [] kalau tanpa musik.
const MUSIK: [string, number, number][] = [
  ["musik1.ogg", 1, 0.14],
  // ["musik2.ogg", 4, 0.15],  // musik kedua mulai di kalimat 4 (crossfade otomatis)
];

// ─────────────────────────────────────────────────────────────
// Di bawah ini tidak perlu diubah.
// ─────────────────────────────────────────────────────────────
const mulai = (i: number) => (i === 0 ? 0 : fk(ADEGAN[i][0]) - 6);
const akhir = (i: number) => (i === ADEGAN.length - 1 ? DURASI : mulai(i + 1));

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: C.kertas, overflow: "hidden" }}>
    <Fonts />
    <PencilDefs />
    {ADEGAN.map(([, , S], i) => {
      const from = mulai(i), d = akhir(i) - from;
      return (
        <Sequence key={i} from={from} durationInFrames={d}>
          <Masuk d={d}><S d={d} t={(n) => fk(n) - from} /></Masuk>
        </Sequence>
      );
    })}
    <Subtitle />
    {ada("narasi.wav") && <Audio src={staticFile("narasi.wav")} />}
    {MUSIK.filter(([file]) => ada(file)).map(([file, k, v], i, M) => {
      const from = k === 1 ? 0 : fk(k);
      const to = i + 1 < M.length ? fk(M[i + 1][1]) + 30 : DURASI;
      const len = to - from;
      return (
        <Sequence key={file} from={from} durationInFrames={len}>
          <Audio src={staticFile(file)} loop volume={(x) => interpolate(x, [0, 25, len - 35, len], [0, v, v, 0], cl)} />
        </Sequence>
      );
    })}
    {SFX.filter(([, , file]) => ada(`${file}.wav`)).map(([k, g, file, v], i) => (
      <Sequence key={i} from={fk(k) + Math.round(g * FPS)} durationInFrames={FPS * 6}>
        <Audio src={staticFile(`${file}.wav`)} volume={v} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
