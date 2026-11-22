/** Video 03 — Kenapa Mumi Mesir Bisa Awet Ribuan Tahun? (outfit arkeolog, gaya gurun & makam kuno) */
import React from "react";
import { interpolate } from "remotion";
import { Angka, Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "arkeolog";
const MUSIK_ID = "ludum-dare-28-07";
void OUTFIT; void MUSIK_ID;
// aset tambahan → benda: ["paru_paru", "organ_hati", "lambung"]

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;

// Tubuh dikeringkan: tetes air keluar dari sosok, tubuh menjadi kecokelatan
const Pengeringan: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const k = interpolate(f, [10, d - 20], [0, 1], cl);
  return (
    <Svg>
      <ellipse cx={540} cy={760} rx={330} ry={120} fill="#f5f5f4" opacity={0.9} />
      {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={240 + ((i * 53) % 600)} cy={700 + ((i * 37) % 120)} r={10} fill="#fafaf9" />)}
      <rect x={300} y={700} width={480} height={110} rx={55} fill={`rgb(${200 - k * 60},${160 - k * 70},${120 - k * 70})`} />
      <circle cx={260} cy={755} r={60} fill={`rgb(${200 - k * 60},${160 - k * 70},${120 - k * 70})`} />
      {Array.from({ length: 8 }).map((_, i) => {
        const y = 700 - ((f * 3 + i * 40) % 220);
        return <path key={`t${i}`} d={`M ${320 + i * 60} ${y} q -12 20 0 30 q 12 -10 0 -30`} fill="#38bdf8" opacity={(1 - k) * 0.9} />;
      })}
      <text x={540} y={940} textAnchor="middle" fill="#fde68a" fontSize={44} fontFamily="I">natron menyerap air</text>
    </Svg>
  );
};

// Membungkus dengan linen: garis kain melilit sedikit demi sedikit
const Membungkus: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const n = Math.floor(interpolate(f, [5, d - 10], [0, 16], cl));
  return (
    <Svg>
      <rect x={380} y={460} width={320} height={600} rx={150} fill="#a16207" />
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={370} y={470 + i * 36} width={340} height={34} rx={14} fill={i % 2 ? "#f5e6c8" : "#ead7b0"} transform={`rotate(${i % 2 ? 4 : -4} 540 ${485 + i * 36})`} stroke="#c8b08a" strokeWidth={2} />
      ))}
    </Svg>
  );
};

// Tiga syarat awet
const SyaratAwet: React.FC<{ at: number }> = ({ at }) => (
  <>
    {[["Tubuh kering", "#fbbf24"], ["Resin pelindung", "#f97316"], ["Udara gurun kering", "#facc15"], ["Makam tertutup rapat", "#fde68a"]].map(([x, c], i) => (
      <Kartu key={x} at={at + i * 16} x={110} y={470 + i * 112} warna={c} size={46}>✓ {x}</Kartu>
    ))}
  </>
);

export const DATA: DataVideo = {
  id: "v03",
  tema: { latar: "gurun", utama: "#fff7e0", aksen: "#fbbf24", teks: "#fff7ed", kartu: "rgba(66,32,6,.85)", garis: "#d97706", fontJudul: "cinzel", fontIsi: "lora", ukuranJudul: 84 },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "3.000 Tahun", sub: "Tubuh tetap utuh", latar: { makam: true }, tokoh: { pose: "wajah_kaget_benarkan_kacamata" }, isi: () => <Benda nama="mumi" x={130} y={450} h={600} /> },
    { k: [3, 4], judul: "Mumi Mesir", sub: "Bukan sihir, tapi sains", tokoh: { pose: "setengah_rentang_tangan", sisi: "kiri" }, isi: () => <Benda nama="piramida" x={430} y={470} h={430} /> },
    { k: [5, 8], judul: "Kenapa Membusuk?", sub: "Bakteri butuh air", latar: { makam: true }, tokoh: { pose: "wajah_mikir_dagu" }, isi: (f, d, t) => (
      <>
        <Benda nama="bakteri" x={120} y={470} h={280} goyang at={t(7)} />
        <Benda nama="tetes_air" x={420} y={540} h={200} at={t(7) + 10} />
        <Kartu at={t(8)} y={860} tengah warna="#22c55e">Tanpa air → bakteri tidak bisa bekerja</Kartu>
      </>
    ) },
    { k: [9, 11], judul: "Belajar dari Gurun", sub: "Awet secara alami", tokoh: { pose: "jongkok_lihat_jejak", sisi: "kiri" }, isi: () => <Benda nama="unta" x={560} y={560} h={360} at={10} /> },
    { k: [12, 14], judul: "Langkah 1", sub: "Organ dikeluarkan", latar: { makam: true }, tokoh: { pose: "wajah_catat_pulpen" }, isi: (f, d, t) => (
      <>
        {["paru_paru", "organ_hati", "lambung"].map((b, i) => <Benda key={b} nama={b} x={80 + i * 210} y={500 + (i % 2) * 60} h={200} at={t(13) + i * 10} />)}
        <Kartu at={t(14)} x={90} y={860} warna="#ef4444" size={42}>Jantung tetap di dalam ❤</Kartu>
      </>
    ) },
    { k: [15, 17], judul: "Langkah 2", sub: "Dikeringkan dengan natron", latar: { makam: true }, isi: (f, d, t) => (
      <>
        <Pengeringan f={f} d={d} />
        <Angka at={t(17)} ke={40} akhiran=" hari" y={450} size={100} />
      </>
    ) },
    { k: [18, 18], judul: "Simpan Dulu", tokoh: { pose: "setengah_jempol_tangan_pinggang" }, isi: () => <Benda nama="gulungan_kertas" x={140} y={480} h={420} goyang /> },
    { k: [19, 20], judul: "Minyak & Resin", sub: "Pelindung dari lembap", latar: { makam: true }, tokoh: { pose: "wajah_ide_telunjuk", sisi: "kiri" }, isi: () => (
      <>
        <Benda nama="botol_minyak_zaitun" x={560} y={470} h={330} />
        <Benda nama="obor" x={830} y={520} h={300} at={10} />
      </>
    ) },
    { k: [21, 22], judul: "Langkah 3", sub: "Dibungkus kain linen", latar: { makam: true }, isi: (f, d) => <Membungkus f={f} d={d} /> },
    { k: [23, 23], judul: "Catatan Herodotus", sub: "Sejarawan Yunani", tokoh: { pose: "wajah_kaca_pembesar" }, isi: () => <Angka at={20} ke={70} akhiran=" hari" y={560} size={160} /> },
    { k: [24, 26], judul: "Rahasia Awet", latar: { makam: true }, tokoh: { pose: "setengah_tunjuk_kamera", sisi: "kiri" }, isi: (f, d, t) => <SyaratAwet at={t(25) - 30} /> },
    { k: [27, 28], judul: "Dipindai", sub: "Tanpa membuka kain", latar: { makam: true }, tokoh: { pose: "wajah_semangat_dua_kepal" }, isi: (f) => (
      <>
        <Benda nama="mumi" x={170} y={460} h={600} />
        <div style={{ position: "absolute", left: 140, top: 470 + ((f * 6) % 560), width: 420, height: 10, background: "#22d3ee", boxShadow: "0 0 30px #22d3ee", zIndex: 6 }} />
      </>
    ) },
    { k: [29, 29], judul: "Catatan Kehidupan", sub: "Dari masa lalu", tokoh: { pose: "wajah_ulur_tangan_senyum", sisi: "kiri" }, isi: () => <Benda nama="koin_kuno" x={580} y={500} h={300} goyang /> },
    { k: [30, 31], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "setengah_ok_kedip" }, isi: () => <Benda nama="piramida" x={60} y={500} h={380} /> },
  ],
  sfx: [
    [1, 0, "desert-ambience", 0.3],
    [1, 0.3, "sinematik_hantaman_dramatis", 0.4],
    [3, 0, "arabian-mystery-harp-notification", 0.4],
    [6, 0.2, "ui_tanya_pop", 0.45],
    [8, 0.3, "ui_ide_lonceng", 0.5],
    [9, 0, "sand-in-the-desert", 0.35],
    [12, 0, "sfx100v2-stones-01", 0.45],
    [15, 0, "sinematik_hantaman_dramatis", 0.4],
    [16, 0.3, "sand-in-the-desert", 0.3],
    [19, 0, "transisi_whoosh", 0.4],
    [21, 0.2, "cloth-cloth-01", 0.5],
    [23, 0.2, "paper-01", 0.5],
    [24, 0, "sfx100v2-stones-02", 0.4],
    [27, 0.4, "sains_sinar_x_pindai", 0.45],
    [30, 0, "arabian-mystery-harp-notification", 0.35],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["3.000 Tahun", "Nggak", "Membusuk?"], sorot: [2], pose: "wajah_kaget_benarkan_kacamata", benda: ["mumi"], label: "RAHASIA MESIR KUNO", latar: { makam: true } },
};
