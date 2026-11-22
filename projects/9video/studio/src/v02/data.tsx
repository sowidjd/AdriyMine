/** Video 02 — Kenapa Ada Hewan yang Bisa Bercahaya di Laut Dalam? (outfit penyelam, gaya bawah laut) */
import React from "react";
import { interpolate } from "remotion";
import { Angka, Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "penyelam";
const MUSIK_ID = "ludum-dare-32-05";
void OUTFIT; void MUSIK_ID;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;

// Pengukur kedalaman
const Kedalaman: React.FC<{ f: number; t1: number; t2: number }> = ({ f, t1, t2 }) => {
  const y = interpolate(f, [0, t1, t1 + 30, t2, t2 + 30], [480, 480, 700, 700, 960], cl);
  return (
    <Svg>
      <rect x={430} y={470} width={30} height={520} rx={15} fill="url(#gDalam)" stroke="#bae6fd" strokeWidth={3} />
      <defs><linearGradient id="gDalam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="0.45" stopColor="#1e3a8a" /><stop offset="1" stopColor="#020617" /></linearGradient></defs>
      {[["0 m", 480], ["200 m", 700], ["1.000 m", 960]].map(([l, yy]) => (
        <g key={l as string}>
          <line x1={470} y1={yy as number} x2={520} y2={yy as number} stroke="#e0f2fe" strokeWidth={4} />
          <text x={535} y={(yy as number) + 14} fill="#e0f2fe" fontSize={40} fontFamily="I">{l}</text>
        </g>
      ))}
      <polygon points={`405,${y} 375,${y - 18} 375,${y + 18}`} fill="#fbbf24" />
      <text x={150} y={y + 14} fill="#fbbf24" fontSize={38} fontFamily="I">kita</text>
    </Svg>
  );
};

// Ikan sungut ganggang dengan umpan bercahaya
const SungutGanggang: React.FC<{ f: number }> = ({ f }) => {
  const kedip = 0.6 + 0.4 * Math.abs(Math.sin(f / 8));
  const mangsa = interpolate(f, [0, 120], [980, 700], cl);
  return (
    <Svg>
      <defs><radialGradient id="pendar"><stop offset="0" stopColor="#a7f3d0" /><stop offset="0.4" stopColor="#34d399" stopOpacity={0.7} /><stop offset="1" stopColor="#34d399" stopOpacity={0} /></radialGradient></defs>
      <path d="M 180 760 Q 300 600 470 700 Q 520 760 470 820 Q 300 920 180 760 Z" fill="#3f3f46" stroke="#18181b" strokeWidth={5} />
      <path d="M 180 760 L 110 700 L 120 830 Z" fill="#27272a" />
      <path d="M 440 740 L 500 760 L 440 790 Z" fill="#111" />
      {[0, 1, 2, 3].map((i) => <polygon key={i} points={`${450 + i * 8},748 ${454 + i * 8},770 ${458 + i * 8},748`} fill="#f4f4f5" />)}
      <circle cx={360} cy={730} r={14} fill="#fef08a" />
      <path d="M 390 670 Q 470 560 560 610" fill="none" stroke="#52525b" strokeWidth={6} />
      <circle cx={560} cy={615} r={80 * kedip} fill="url(#pendar)" />
      <circle cx={560} cy={615} r={16} fill="#d1fae5" />
      <g transform={`translate(${mangsa},640)`}>
        <ellipse rx={40} ry={18} fill="#93c5fd" /><polygon points="38,0 64,-16 64,16" fill="#93c5fd" /><circle cx={-22} cy={-4} r={4} fill="#111" />
      </g>
    </Svg>
  );
};

// Kamuflase cahaya perut: bayangan hilang saat lampu perut menyala
const Kamuflase: React.FC<{ f: number; nyala: number }> = ({ f, nyala }) => {
  const n = interpolate(f, [nyala, nyala + 25], [0, 1], cl);
  return (
    <Svg>
      <rect x={0} y={460} width={1080} height={600} fill="url(#atas)" opacity={0.5} />
      <defs><linearGradient id="atas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#0c4a6e" stopOpacity={0} /></linearGradient></defs>
      <g transform="translate(540,640)">
        <ellipse rx={200} ry={70} fill={`rgb(${15 + n * 110},${23 + n * 170},${42 + n * 200})`} />
        <polygon points="190,0 270,-60 270,60" fill={`rgb(${15 + n * 110},${23 + n * 170},${42 + n * 200})`} />
        {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={-150 + i * 38} cy={58} r={10} fill="#bae6fd" opacity={n} />)}
      </g>
      <text x={540} y={960} textAnchor="middle" fill="#fde68a" fontSize={40} fontFamily="I">dilihat dari bawah ↑</text>
    </Svg>
  );
};

// Warna cahaya yang menembus air
const Spektrum: React.FC<{ f: number }> = ({ f }) => {
  const w = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6"];
  const jauh = [90, 160, 260, 420, 560];
  return (
    <Svg>
      {w.map((c, i) => {
        const h = interpolate(f, [10 + i * 6, 60 + i * 6], [0, jauh[i]], cl);
        return (
          <g key={c}>
            <rect x={200 + i * 140} y={540} width={90} height={h * 0.85} rx={14} fill={c} opacity={0.85} />
            <circle cx={245 + i * 140} cy={540 + h * 0.85} r={20} fill={c} />
          </g>
        );
      })}
      <text x={540} y={505} textAnchor="middle" fill="#e0f2fe" fontSize={36} fontFamily="I">semakin panjang = semakin dalam menembus air</text>
    </Svg>
  );
};

// Titik cahaya berkedip
const Pendar: React.FC<{ f: number; n?: number; y?: number }> = ({ f, n = 1, y = 640 }) => (
  <Svg>
    {Array.from({ length: n }).map((_, i) => {
      const x = n === 1 ? 540 : 160 + ((i * 197) % 760), yy = n === 1 ? y : 480 + ((i * 131) % 520);
      const k = 0.4 + 0.6 * Math.abs(Math.sin(f / 10 + i));
      return <circle key={i} cx={x} cy={yy} r={(n === 1 ? 70 : 22) * k} fill={i % 3 ? "#38bdf8" : "#6ee7b7"} opacity={0.85} style={{ filter: "blur(2px)" }} />;
    })}
  </Svg>
);

export const DATA: DataVideo = {
  id: "v02",
  tema: { latar: "laut", utama: "#e0f2fe", aksen: "#5eead4", teks: "#f0f9ff", kartu: "rgba(3,37,65,.82)", garis: "#2dd4bf", fontJudul: "fredoka", fontIsi: "nunito", ukuranJudul: 92 },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 1], judul: "Gelap Gulita", latar: { dalam: 0.95 }, tokoh: { pose: "wajah_kaget_regulator" } },
    { k: [2, 4], judul: "Cahaya Biru?", sub: "Ternyata seekor hewan", latar: { dalam: 0.9, cahaya: 1 }, tokoh: { pose: "wajah_takjub_berbinar", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Pendar f={f} y={620} />
        {f > t(4) && <Benda nama="ubur_ubur_biru" x={560} y={470} h={430} at={t(4)} goyang />}
      </>
    ) },
    { k: [5, 7], judul: "Mulai dari Atas", sub: "Permukaan laut", latar: { dalam: 0.05 }, tokoh: { pose: "ok_senter" }, isi: () => (
      <>
        <Benda nama="matahari" x={120} y={440} h={260} />
        <Benda nama="ombak" x={300} y={700} h={300} at={10} />
      </>
    ) },
    { k: [8, 10], judul: "Semakin Dalam", sub: "Cahaya semakin hilang", latar: { dalam: 0.6 }, tokoh: { pose: "cek_manometer", sisi: "kiri" }, isi: (f, d, t) => <Kedalaman f={f} t1={t(9)} t2={t(10)} /> },
    { k: [11, 12], judul: "Bioluminesensi", sub: "Membuat cahaya sendiri", latar: { dalam: 0.9, cahaya: 1 }, tokoh: { pose: "wajah_takjub_mulut_terbuka" }, isi: () => <Benda nama="ubur_ubur_biru" x={150} y={460} h={500} goyang /> },
    { k: [13, 15], judul: "Reaksi Kimia", sub: "Di dalam tubuh hewan", latar: { dalam: 0.85 }, isi: (f, d, t) => (
      <>
        <Kartu at={10} y={500} tengah size={50}>LUCIFERIN + OKSIGEN</Kartu>
        <Kartu at={t(14) + 20} y={610} tengah size={40} warna="#a78bfa">dibantu enzim LUCIFERASE</Kartu>
        <Kartu at={t(15)} y={740} tengah size={60} warna="#fbbf24">= CAHAYA ✨</Kartu>
        <Kartu at={t(15) + 30} y={880} tengah size={42}>hampir tanpa panas → "cahaya dingin"</Kartu>
      </>
    ) },
    { k: [16, 17], judul: "Sebagian Besar", sub: "Penelitian di Monterey", latar: { dalam: 0.9, cahaya: 1 }, tokoh: { pose: "wajah_kaget_regulator", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Angka at={t(17)} ke={75} akhiran="%" y={520} size={190} />
        <Kartu at={t(17) + 20} y={760} tengah size={44}>± 3 dari 4 hewan yang teramati</Kartu>
      </>
    ) },
    { k: [18, 19], judul: "Untuk Apa?", sub: "Tebak dulu di komentar", latar: { dalam: 0.9 }, tokoh: { pose: "wajah_ok_senyum_regulator" }, isi: () => (
      <>
        {["1. ???", "2. ???", "3. ???", "4. ???"].map((x, i) => <Kartu key={x} at={10 + i * 8} x={110} y={480 + i * 110} size={46}>{x}</Kartu>)}
      </>
    ) },
    { k: [20, 21], judul: "1. Berburu", sub: "Ikan sungut ganggang", latar: { dalam: 1 }, isi: (f) => <SungutGanggang f={f} /> },
    { k: [22, 24], judul: "2. Bersembunyi", sub: "Lampu di perut", latar: { dalam: 0.7 }, isi: (f, d, t) => <Kamuflase f={f} nyala={t(23) + 15} /> },
    { k: [25, 26], judul: "3. Mengelabui", sub: "Semburan bercahaya", latar: { dalam: 0.95, cahaya: 1 }, tokoh: { pose: "wajah_tertawa_lepas" }, isi: (f, d, t) => (
      <>
        <Benda nama="udang" x={540} y={520} h={300} at={0} balik />
        <div style={{ opacity: interpolate(f, [t(26) - 20, t(26)], [0, 1], cl) }}><Pendar f={f} n={14} /></div>
      </>
    ) },
    { k: [27, 27], judul: "4. Berkomunikasi", sub: "Dan mencari pasangan", latar: { dalam: 0.85, cahaya: 1 }, tokoh: { pose: "foto_kamera_lampu", sisi: "kiri" }, isi: () => (
      <>
        <Benda nama="cumi_cumi_ungu" x={560} y={460} h={360} goyang />
        <Benda nama="nudibranch_warna_warni" x={520} y={830} h={190} at={12} />
      </>
    ) },
    { k: [28, 30], judul: "Kenapa Biru?", sub: "Merah cepat diserap air", latar: { dalam: 0.6 }, isi: (f) => <Spektrum f={f} /> },
    { k: [31, 31], judul: "Lampu yang Hidup", latar: { dalam: 1, cahaya: 1 }, tokoh: { pose: "wajah_takjub_berbinar" }, isi: (f) => <Pendar f={f} n={18} /> },
    { k: [32, 33], judul: "Adriy Project", sub: "Explore More, Know More.", latar: { dalam: 0.3 }, tokoh: { pose: "tutup_dua_jempol", sisi: "kiri" }, isi: () => <Benda nama="kapal_selam" x={330} y={480} h={300} goyang /> },
  ],
  sfx: [
    [1, 0, "laut_bawah_air_dalam", 0.4],
    [2, 0.5, "tubuh_merinding_berkilau", 0.45],
    [5, 0, "laut_gelembung_naik", 0.4],
    [8, 0, "teknologi_radar_ping", 0.35],
    [12, 0.2, "ui_ide_lonceng", 0.5],
    [16, 0.3, "sinematik_kejutan_tajam", 0.4],
    [20, 0, "transisi_whoosh", 0.4],
    [21, 1.2, "tubuh_gelembung_pop", 0.5],
    [22, 0, "transisi_whoosh", 0.4],
    [25, 0, "transisi_whoosh", 0.4],
    [26, 0.6, "laut_semburan_air", 0.4],
    [27, 0, "transisi_whoosh", 0.4],
    [31, 0, "tubuh_merinding_berkilau", 0.45],
    [32, 0, "laut_gelembung_naik", 0.35],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["Laut Dalam", "Penuh", "Lampu Hidup"], sorot: [2], pose: "wajah_takjub_mulut_terbuka", benda: ["ubur_ubur_biru"], label: "MISTERI LAUT", latar: { dalam: 0.95, cahaya: 1 } },
};
