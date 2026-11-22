/** Video 04 — Kenapa Es Mengapung? (outfit lab, gaya blueprint laboratorium) */
import React from "react";
import { interpolate } from "remotion";
import { Angka, Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "lab";
const MUSIK_ID = "ludum-dare-32-04";
void OUTFIT; void MUSIK_ID;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;

// Gelas: es mengapung (kiri) vs padatan lain tenggelam (kanan)
const DuaGelas: React.FC<{ f: number; banding: boolean }> = ({ f, banding }) => {
  const gelas = (x: number, isi: React.ReactNode, label: string) => (
    <g>
      <path d={`M ${x} 520 L ${x + 30} 1000 L ${x + 270} 1000 L ${x + 300} 520`} fill="rgba(186,230,253,.12)" stroke="#bae6fd" strokeWidth={6} />
      <rect x={x + 12} y={640} width={276} height={355} fill="rgba(56,189,248,.35)" />
      {isi}
      <text x={x + 150} y={1050} textAnchor="middle" fill="#e0f2fe" fontSize={38} fontFamily="I">{label}</text>
    </g>
  );
  const turun = interpolate(f, [20, 70], [560, 900], cl);
  const naik = 610 + Math.sin(f / 15) * 6;
  return (
    <Svg>
      {gelas(banding ? 90 : 390, <rect x={(banding ? 90 : 390) + 90} y={naik} width={120} height={110} rx={16} fill="rgba(240,249,255,.9)" stroke="#7dd3fc" strokeWidth={4} />, "air → es")}
      {banding && gelas(690, <rect x={780} y={turun} width={120} height={90} rx={12} fill="#f59e0b" stroke="#92400e" strokeWidth={4} />, "lilin cair → padat")}
    </Svg>
  );
};

// Molekul air bentuk V
const MolekulAir: React.FC<{ x: number; y: number; s?: number; r?: number }> = ({ x, y, s = 1, r = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
    <line x1={0} y1={0} x2={-70} y2={55} stroke="#e2e8f0" strokeWidth={10} />
    <line x1={0} y1={0} x2={70} y2={55} stroke="#e2e8f0" strokeWidth={10} />
    <circle r={48} fill="#ef4444" stroke="#7f1d1d" strokeWidth={4} />
    <circle cx={-70} cy={55} r={30} fill="#f8fafc" stroke="#64748b" strokeWidth={4} />
    <circle cx={70} cy={55} r={30} fill="#f8fafc" stroke="#64748b" strokeWidth={4} />
  </g>
);

// Cair (acak & rapat) → es (segi enam, renggang)
const Kisi: React.FC<{ f: number; beku: number }> = ({ f, beku }) => {
  const b = interpolate(f, [beku, beku + 45], [0, 1], cl);
  const titik = Array.from({ length: 18 }).map((_, i) => {
    const cair = { x: 300 + ((i * 97) % 480) + Math.sin(f / 6 + i) * 18, y: 560 + ((i * 61) % 380) + Math.cos(f / 7 + i) * 18 };
    const ring = Math.floor(i / 6), k = i % 6;
    const cx = 400 + (ring % 2) * 200 + (ring === 2 ? 200 : 0), cy = 620 + ring * 170;
    const es = { x: cx + Math.cos((k * Math.PI) / 3) * 110 + (ring === 1 ? 200 : 0), y: cy + Math.sin((k * Math.PI) / 3) * 95 };
    return { x: cair.x + (es.x - cair.x) * b, y: cair.y + (es.y - cair.y) * b, r: Math.sin(f / 10 + i) * 40 * (1 - b) };
  });
  return (
    <Svg>
      {b > 0.6 && titik.map((p, i) => i % 6 !== 5 ? <line key={`l${i}`} x1={p.x} y1={p.y} x2={titik[i + 1].x} y2={titik[i + 1].y} stroke="#38bdf8" strokeWidth={4} strokeDasharray="8 8" opacity={(b - 0.6) * 2.5} /> : null)}
      {titik.map((p, i) => <MolekulAir key={i} x={p.x} y={p.y} s={0.42} r={p.r} />)}
    </Svg>
  );
};

// Danau membeku dari atas
const Danau: React.FC<{ f: number }> = ({ f }) => (
  <Svg>
    <rect x={90} y={500} width={900} height={500} rx={30} fill="#0c4a6e" />
    <rect x={90} y={800} width={900} height={200} rx={20} fill="#075985" />
    <rect x={90} y={500} width={900} height={interpolate(f, [10, 60], [0, 80], cl)} rx={20} fill="#e0f2fe" />
    <text x={540} y={960} textAnchor="middle" fill="#bae6fd" fontSize={38} fontFamily="I">air ± 4°C di dasar</text>
    <g transform={`translate(${300 + Math.sin(f / 30) * 200},700)`}><ellipse rx={60} ry={24} fill="#fbbf24" /><polygon points="56,0 90,-20 90,20" fill="#fbbf24" /><circle cx={-32} cy={-6} r={6} fill="#111" /></g>
  </Svg>
);

// Gunung es: ±90% di bawah permukaan
const GunungEs: React.FC<{ f: number }> = ({ f }) => (
  <Svg>
    <rect x={0} y={600} width={1080} height={480} fill="rgba(14,116,144,.45)" />
    <line x1={0} y1={600} x2={1080} y2={600} stroke="#a5f3fc" strokeWidth={4} />
    <g transform={`translate(0,${Math.sin(f / 20) * 6})`}>
      <polygon points="470,480 560,450 640,600 420,600" fill="#f0f9ff" />
      <polygon points="420,600 640,600 760,820 690,1040 360,1050 280,820" fill="rgba(224,242,254,.75)" />
    </g>
  </Svg>
);

export const DATA: DataVideo = {
  id: "v04",
  tema: { latar: "lab", utama: "#e0f2fe", aksen: "#22d3ee", teks: "#f0f9ff", kartu: "rgba(8,30,55,.85)", garis: "#22d3ee", fontJudul: "space-grotesk", fontIsi: "space-grotesk", ukuranJudul: 84 },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Coba Lihat", sub: "Es batu di gelas", tokoh: { pose: "setengah_semangat_kedip" }, isi: (f) => <DuaGelas f={f} banding={false} /> },
    { k: [3, 4], judul: "Keanehan Besar", sub: "Di dunia kimia", tokoh: { pose: "setengah_kaget_tangan_terbuka", sisi: "kiri" }, isi: () => <Benda nama="es_batu" x={560} y={500} h={360} goyang /> },
    { k: [5, 8], judul: "Padat = Tenggelam", sub: "Hampir semua zat", isi: (f, d, t) => (
      <>
        <DuaGelas f={f} banding />
        <Kartu at={t(8)} y={460 - 20} tengah warna="#f59e0b" size={40}>Tapi air justru kebalikannya!</Kartu>
      </>
    ) },
    { k: [9, 11], judul: "Air Mengembang", sub: "Saat membeku", tokoh: { pose: "setengah_eureka_kepal" }, isi: (f, d, t) => (
      <>
        <Angka at={10} ke={9} awalan="+" akhiran="%" y={480} size={190} />
        <Kartu at={t(10)} x={90} y={760} size={42}>Volume ↑, berat tetap</Kartu>
        <Kartu at={t(11)} x={90} y={860} size={42} warna="#22c55e">Lebih ringan → mengapung</Kartu>
      </>
    ) },
    { k: [12, 14], judul: "H₂O", sub: "Satu oksigen, dua hidrogen", tokoh: { pose: "pegang_molekul", sisi: "kiri" }, isi: (f) => (
      <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}><MolekulAir x={700} y={650} s={2.2} r={Math.sin(f / 20) * 10} /></svg>
    ) },
    { k: [15, 16], judul: "Ikatan Hidrogen", sub: "Saat cair: rapat & acak", isi: (f) => <Kisi f={f} beku={99999} /> },
    { k: [17, 19], judul: "Saat Membeku", sub: "Tersusun segi enam", isi: (f, d, t) => (
      <>
        <Kisi f={f} beku={t(18) - 20} />
        <Kartu at={t(19)} y={990} tengah warna="#facc15" size={40}>banyak ruang kosong = lebih renggang</Kartu>
      </>
    ) },
    { k: [20, 20], judul: "Kirim ke Temanmu", tokoh: { pose: "setengah_jempol_senyum" }, isi: () => <Benda nama="ponsel" x={160} y={480} h={460} goyang /> },
    { k: [21, 25], judul: "Penyelamat Kehidupan", sub: "Danau membeku dari atas", tokoh: { pose: "setengah_tenang_tangan_dada", sisi: "kiri" }, isi: (f) => <Danau f={f} /> },
    { k: [26, 26], judul: "Seandainya...", sub: "Es tenggelam", tokoh: { pose: "setengah_pusing_swirl" }, isi: () => <Benda nama="salju" x={140} y={480} h={420} /> },
    { k: [27, 28], judul: "Sisi Lain", sub: "Pipa bisa pecah", tokoh: { pose: "mundur_kaget_asap", sisi: "kiri" }, isi: () => <Benda nama="selang" x={560} y={500} h={380} goyang /> },
    { k: [29, 29], judul: "Gunung Es", isi: (f) => (
      <>
        <GunungEs f={f} />
        <Kartu at={25} x={560} y={930} size={46} warna="#22d3ee">± 90% di bawah</Kartu>
      </>
    ) },
    { k: [30, 30], judul: "Es Batu di Gelasmu", sub: "Pelajaran besar", tokoh: { pose: "setengah_mikir_gir" }, isi: () => <Benda nama="gelas_air" x={170} y={480} h={460} /> },
    { k: [31, 32], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "lompat_gembira", sisi: "kiri" }, isi: () => <Benda nama="labu_kimia" x={620} y={480} h={420} goyang /> },
  ],
  sfx: [
    [1, 0.4, "plop-01", 0.55],
    [1, 0.9, "glass-02", 0.45],
    [3, 0.4, "sinematik_kejutan_tajam", 0.4],
    [6, 0.5, "sfx100v2-items-01", 0.4],
    [9, 0, "transisi_whoosh", 0.4],
    [11, 0.4, "ui_ide_lonceng", 0.5],
    [12, 0, "ui_tanya_pop", 0.45],
    [17, 0.3, "arctic-winds", 0.3],
    [19, 0.2, "ui_ide_lonceng", 0.45],
    [22, 0, "blizzard-cold-winds", 0.25],
    [25, 0, "fish-moving-in-water", 0.4],
    [28, 0, "sfx100v2-metal-hit-01", 0.4],
    [29, 0, "sea-water-splash", 0.35],
    [31, 0, "correct-answer-tone", 0.4],
  ],
  musik: { file: "musik.ogg", vol: 0.09 },
  thumb: { baris: ["Es Itu", "Aneh!", "Kenapa Ngapung?"], sorot: [1], pose: "setengah_kaget_dua_tangan", benda: ["es_batu", "gelas_air"], label: "SAINS SEHARI-HARI" },
};
