/** Video 01 — Kenapa Bulan Selalu Menunjukkan Wajah yang Sama? (outfit angkasa, gaya luar angkasa) */
import React from "react";
import { interpolate } from "remotion";
import { Angka, Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "angkasa";
const MUSIK_ID = "ludum-dare-30-03";
void OUTFIT; void MUSIK_ID;

// Bulan bergambar (wajah tetap), bisa diputar
const Bulan: React.FC<{ x: number; y: number; r: number; putar?: number; panjang?: number; tanda?: boolean }> = ({ x, y, r, putar = 0, panjang = 1, tanda = true }) => (
  <g transform={`translate(${x},${y}) rotate(${putar}) scale(${panjang},${1 / Math.sqrt(panjang)})`}>
    <circle r={r} fill="url(#gBulan)" />
    <circle cx={-r * 0.3} cy={-r * 0.25} r={r * 0.22} fill="#9ca3af" opacity={0.7} />
    <circle cx={r * 0.25} cy={r * 0.1} r={r * 0.15} fill="#9ca3af" opacity={0.7} />
    <circle cx={-r * 0.05} cy={r * 0.4} r={r * 0.12} fill="#9ca3af" opacity={0.6} />
    {tanda && <circle cx={-r * 0.92} cy={0} r={r * 0.14} fill="#f43f5e" stroke="#fff" strokeWidth={3} />}
  </g>
);
const Defs = () => (
  <defs>
    <radialGradient id="gBulan" cx="35%" cy="30%"><stop offset="0" stopColor="#f8fafc" /><stop offset="0.6" stopColor="#cbd5e1" /><stop offset="1" stopColor="#64748b" /></radialGradient>
    <radialGradient id="gBumi" cx="35%" cy="30%"><stop offset="0" stopColor="#93c5fd" /><stop offset="0.5" stopColor="#2563eb" /><stop offset="1" stopColor="#1e3a8a" /></radialGradient>
    <marker id="ujung" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fbbf24" /></marker>
  </defs>
);

// Orbit: bulan mengelilingi bumi, tanda merah selalu menghadap bumi
const Orbit: React.FC<{ f: number; cy?: number }> = ({ f, cy = 720 }) => {
  const a = f / 40;
  const bx = 540 + Math.cos(a) * 330, by = cy + Math.sin(a) * 230;
  const sudut = (Math.atan2(cy - by, 540 - bx) * 180) / Math.PI + 180;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
      <Defs />
      <ellipse cx={540} cy={cy} rx={330} ry={230} fill="none" stroke="#93c5fd" strokeWidth={3} strokeDasharray="12 12" opacity={0.6} />
      <circle cx={540} cy={cy} r={95} fill="url(#gBumi)" />
      <line x1={540} y1={cy} x2={bx} y2={by} stroke="#fbbf24" strokeWidth={2} strokeDasharray="6 8" opacity={0.5} />
      <Bulan x={bx} y={by} r={60} putar={sudut} />
    </svg>
  );
};

// Analogi: orang berjalan mengelilingi meja sambil menghadap meja
const Meja: React.FC<{ f: number }> = ({ f }) => {
  const a = f / 35;
  const x = 540 + Math.cos(a) * 280, y = 740 + Math.sin(a) * 200;
  const s = (Math.atan2(740 - y, 540 - x) * 180) / Math.PI;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
      <ellipse cx={540} cy={740} rx={280} ry={200} fill="none" stroke="#c4b5fd" strokeWidth={3} strokeDasharray="10 12" />
      <ellipse cx={540} cy={740} rx={130} ry={90} fill="#92400e" stroke="#fbbf24" strokeWidth={5} />
      <g transform={`translate(${x},${y}) rotate(${s})`}>
        <circle r={46} fill="#f5d0a8" stroke="#1e293b" strokeWidth={4} />
        <circle cx={22} cy={-14} r={6} fill="#1e293b" />
        <circle cx={22} cy={14} r={6} fill="#1e293b" />
        <path d="M 30 -6 Q 40 0 30 6" stroke="#1e293b" strokeWidth={4} fill="none" />
      </g>
    </svg>
  );
};

// Gravitasi: tarikan sisi dekat lebih kuat → bulan memanjang
const Tarikan: React.FC<{ f: number; ulur: number }> = ({ f, ulur }) => {
  const pj = interpolate(f, [ulur, ulur + 40], [1, 1.35], cl);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
      <Defs />
      <circle cx={170} cy={760} r={130} fill="url(#gBumi)" />
      <Bulan x={720} y={760} r={110} panjang={pj} tanda={false} />
      <line x1={590} y1={700} x2={360} y2={700} stroke="#fbbf24" strokeWidth={14} markerEnd="url(#ujung)" />
      <line x1={880} y1={830} x2={760} y2={830} stroke="#fbbf24" strokeWidth={7} markerEnd="url(#ujung)" opacity={0.8} />
    </svg>
  );
};

// Bulan berputar cepat lalu melambat (rem)
const Rem: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const kec = interpolate(f, [0, d * 0.8], [14, 0], cl);
  const putar = (f * kec) / 2;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
      <Defs />
      <Bulan x={540} y={720} r={190} putar={putar} panjang={1.12} />
      <path d="M 300 470 A 300 300 0 0 1 780 470" fill="none" stroke="#fbbf24" strokeWidth={8} markerEnd="url(#ujung)" opacity={interpolate(kec, [0, 14], [0.2, 1])} />
    </svg>
  );
};

// Pluto & Charon saling menatap
const PlutoCharon: React.FC<{ f: number }> = ({ f }) => {
  const a = f / 30;
  const p = { x: 540 + Math.cos(a) * 90, y: 720 + Math.sin(a) * 50 };
  const c = { x: 540 - Math.cos(a) * 230, y: 720 - Math.sin(a) * 150 };
  const s = (Math.atan2(c.y - p.y, c.x - p.x) * 180) / Math.PI;
  const Mata = ({ x, y, r, rot, warna }: { x: number; y: number; r: number; rot: number; warna: string }) => (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <circle r={r} fill={warna} />
      <circle cx={r * 0.5} cy={-r * 0.3} r={r * 0.16} fill="#fff" /><circle cx={r * 0.58} cy={-r * 0.3} r={r * 0.08} fill="#111" />
      <circle cx={r * 0.5} cy={r * 0.3} r={r * 0.16} fill="#fff" /><circle cx={r * 0.58} cy={r * 0.3} r={r * 0.08} fill="#111" />
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
      <Mata x={p.x} y={p.y} r={100} rot={s} warna="#d6b48a" />
      <Mata x={c.x} y={c.y} r={60} rot={s + 180} warna="#9ca3af" />
    </svg>
  );
};

// Sisi jauh juga terkena cahaya matahari
const SisiJauh: React.FC<{ f: number }> = ({ f }) => {
  const a = f / 30;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
      <defs>
        <linearGradient id="terang" x1={`${50 + Math.cos(a) * 50}%`} y1="50%" x2={`${50 - Math.cos(a) * 50}%`} y2="50%">
          <stop offset="0.48" stopColor="#e2e8f0" /><stop offset="0.52" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <circle cx={540} cy={760} r={210} fill="url(#terang)" stroke="#94a3b8" strokeWidth={3} />
    </svg>
  );
};

export const DATA: DataVideo = {
  id: "v01",
  tema: { latar: "angkasa", utama: "#e0e7ff", aksen: "#38bdf8", teks: "#e0f2fe", kartu: "rgba(15,23,62,.82)", garis: "#38bdf8", fontJudul: "orbitron", fontIsi: "exo-2", ukuranJudul: 74 },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Wajah yang Sama", sub: "Setiap malam", tokoh: { pose: "wajah_takjub" }, isi: () => <Benda nama="bulan_purnama" x={180} y={460} h={560} goyang /> },
    { k: [3, 3], judul: "Dari Mana Saja", sub: "Polanya tidak berubah", tokoh: { pose: "teleskop", sisi: "kiri" }, isi: (f) => (
      <>
        <Benda nama="bumi" x={230} y={480} h={420} />
        {["Indonesia", "Jepang", "Kutub"].map((n, i) => <Kartu key={n} at={20 + i * 18} x={700} y={500 + i * 120} size={36}>{n} ✓</Kartu>)}
        {void f}
      </>
    ) },
    { k: [4, 5], judul: "Tidak Berputar?", tokoh: { pose: "wajah_kaget" }, isi: (f, d, t) => (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}><Defs /><Bulan x={540} y={720} r={190} putar={f > t(5) ? (f - t(5)) * 3 : 0} /></svg>
        <Kartu at={t(5)} y={960} tengah warna="#22c55e">Sebenarnya bulan BERPUTAR</Kartu>
      </>
    ) },
    { k: [6, 8], judul: "Dua Waktu Sama", sub: "Sekitar 27 hari", isi: (f, d, t) => (
      <>
        <Orbit f={f} cy={680} />
        <Kartu at={t(6)} x={70} y={930} size={36}>Mengelilingi Bumi ≈ 27 hari</Kartu>
        <Kartu at={t(7)} x={70} y={1005} size={36} warna="#fbbf24">Berputar sekali ≈ 27 hari</Kartu>
      </>
    ) },
    { k: [9, 10], judul: "Coba Bayangkan", sub: "Berjalan mengelilingi meja", tokoh: { pose: "sajikan_kiri_tunjuk", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Meja f={f} />
        <Kartu at={t(10)} y={980} tengah>Tetap berputar satu kali</Kartu>
      </>
    ) },
    { k: [11, 11], judul: "Namanya", tokoh: { pose: "wajah_fokus" }, isi: () => (
      <>
        <Kartu at={10} y={560} tengah size={64} warna="#fbbf24">PENGUNCIAN PASANG SURUT</Kartu>
        <Kartu at={30} y={720} tengah size={40}>tidal locking</Kartu>
      </>
    ) },
    { k: [12, 15], judul: "Tarikan Gravitasi", sub: "Sisi dekat ditarik lebih kuat", isi: (f, d, t) => (
      <>
        <Tarikan f={f} ulur={t(15)} />
        <Kartu at={t(14)} x={330} y={530} size={34} warna="#fbbf24">lebih kuat</Kartu>
        <Kartu at={t(14) + 12} x={740} y={930} size={30}>lebih lemah</Kartu>
      </>
    ) },
    { k: [16, 18], judul: "Rem Alami", sub: "Pelan tapi tidak berhenti", tokoh: { pose: "cek_jam_tangan" }, isi: (f, d, t) => (
      <>
        <Rem f={f} d={d} />
        <Kartu at={t(18)} y={990} tengah warna="#fbbf24">Jutaan tahun → TERKUNCI</Kartu>
      </>
    ) },
    { k: [19, 19], judul: "Simpan Dulu", tokoh: { pose: "berdiri_jempol" }, isi: () => <Benda nama="peta_bintang" x={170} y={470} h={480} goyang /> },
    { k: [20, 22], judul: "Kejutan Kecil", sub: "Bulan seperti mengangguk", tokoh: { pose: "wajah_kaget", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}><Defs /><Bulan x={600 + Math.sin(f / 14) * 25} y={640} r={150} putar={Math.sin(f / 14) * 10} tanda={false} /></svg>
        <Angka at={t(21)} ke={59} akhiran="%" y={830} size={170} />
      </>
    ) },
    { k: [23, 25], judul: "Sisi Gelap?", sub: "Tetap terkena cahaya matahari", tokoh: { pose: "wajah_netral" }, isi: (f, d, t) => (
      <>
        <Benda nama="matahari" x={40} y={440} h={230} />
        <SisiJauh f={f} />
        <Kartu at={t(25)} y={1000} tengah warna="#fbbf24">Siang & malam, sama seperti sisi depan</Kartu>
      </>
    ) },
    { k: [26, 26], judul: "Foto Pertama", sub: "Wahana Luna 3", isi: () => (
      <>
        <Benda nama="satelit" x={190} y={480} h={360} goyang />
        <Angka at={15} dari={1900} ke={1959} y={860} size={160} tahun />
      </>
    ) },
    { k: [27, 29], judul: "Bukan Satu-satunya", sub: "Pluto & Charon saling menatap", tokoh: { pose: "pegang_planet", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <div style={{ opacity: interpolate(f, [t(29) - 10, t(29) + 10], [1, 0], cl) }}>
          <Benda nama="jupiter" x={130} y={480} h={330} />
          <Benda nama="saturnus" x={560} y={560} h={300} at={12} />
        </div>
        <div style={{ opacity: interpolate(f, [t(29) - 10, t(29) + 10], [0, 1], cl) }}><PlutoCharon f={f} /></div>
      </>
    ) },
    { k: [30, 31], judul: "Wajah yang Sama", sub: "Sejak nenek moyang kita", tokoh: { pose: "wajah_takjub" }, latar: { bumi: true }, isi: () => <Benda nama="bulan_purnama" x={200} y={450} h={480} goyang /> },
    { k: [32, 33], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "lompat_hore", sisi: "kiri" }, isi: () => <Benda nama="roket" x={640} y={470} h={480} goyang putar={20} /> },
  ],
  sfx: [
    [1, 0, "suasana_ruang_angkasa", 0.35],
    [4, 0, "transisi_whoosh", 0.45],
    [6, 0.2, "teknologi_radar_ping", 0.4],
    [11, 0.3, "ui_ide_lonceng", 0.55],
    [16, 0, "sinematik_putaran_bumi", 0.4],
    [18, 1.5, "sinematik_hantaman_dramatis", 0.45],
    [20, 0, "sinematik_kejutan_tajam", 0.45],
    [26, 0.4, "alat_kamera_rana_blitz", 0.55],
    [29, 0.5, "tubuh_merinding_berkilau", 0.45],
    [32, 0, "ui_hadiah_naik_level", 0.4],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["Bulan", "Nggak Pernah", "Balik Badan?"], sorot: [2], pose: "wajah_kaget", benda: ["bulan_purnama"], label: "FAKTA LUAR ANGKASA" },
};
