/** Video 06 — Kenapa Kita Cepat Lupa Mimpi? (outfit santai, gaya malam & mimpi) */
import React from "react";
import { interpolate } from "remotion";
import { Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "santai";
const MUSIK_ID = "ludum-dare-38-05";
void OUTFIT; void MUSIK_ID;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;

// Grafik tahap tidur, REM disorot
const Hipnogram: React.FC<{ f: number }> = ({ f }) => {
  const tingkat = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 0, 1, 2, 1, 0];
  const p = interpolate(f, [10, 80], [0, 1], cl);
  const pts = tingkat.map((l, i) => `${170 + i * 54},${520 + l * 120}`).join(" ");
  return (
    <Svg>
      {["REM", "Ringan", "Sedang", "Dalam"].map((l, i) => <text key={l} x={155} y={530 + i * 120} textAnchor="end" fill="#e9d5ff" fontSize={30} fontFamily="I">{l}</text>)}
      {[0, 6, 11, 15].map((i) => <rect key={i} x={170 + i * 54 - 22} y={490} width={44} height={60} rx={10} fill="#f472b6" opacity={0.55 * p} />)}
      <polyline points={pts} fill="none" stroke="#fde68a" strokeWidth={7} strokeDasharray="2400" strokeDashoffset={2400 * (1 - p)} strokeLinejoin="round" />
      <text x={540} y={1010} textAnchor="middle" fill="#fbcfe8" fontSize={38} fontFamily="I">mimpi paling jelas di tahap REM</text>
    </Svg>
  );
};

// Tombol simpan yang tidak ditekan
const Rekam: React.FC<{ f: number }> = ({ f }) => {
  const k = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <Svg>
      <rect x={190} y={500} width={700} height={400} rx={40} fill="rgba(30,16,72,.8)" stroke="#c4b5fd" strokeWidth={5} />
      <polygon points="470,620 470,780 610,700" fill="#e9d5ff" opacity={0.8} />
      <circle cx={820} cy={560} r={22} fill="#ef4444" opacity={k} />
      <text x={760} y={570} textAnchor="end" fill="#fca5a5" fontSize={34} fontFamily="I">REC</text>
      <rect x={300} y={930} width={480} height={90} rx={45} fill="#475569" />
      <text x={540} y={990} textAnchor="middle" fill="#cbd5e1" fontSize={42} fontFamily="I">SIMPAN ✗</text>
    </Svg>
  );
};

// Meter noradrenalin: tinggi saat bangun, sangat rendah saat tidur
const Meter: React.FC<{ f: number }> = ({ f }) => {
  const v = interpolate(f, [10, 50], [0.9, 0.08], cl);
  return (
    <Svg>
      <rect x={260} y={560} width={560} height={70} rx={35} fill="rgba(255,255,255,.15)" stroke="#e9d5ff" strokeWidth={4} />
      <rect x={264} y={564} width={552 * v} height={62} rx={31} fill="#f59e0b" />
      <text x={540} y={700} textAnchor="middle" fill="#fde68a" fontSize={44} fontFamily="I">NORADRENALIN</text>
      <text x={540} y={760} textAnchor="middle" fill="#e9d5ff" fontSize={34} fontFamily="I">fokus & menyimpan ingatan baru</text>
    </Svg>
  );
};

// Jurnal mimpi: tulisan muncul baris per baris
const Jurnal: React.FC<{ f: number }> = ({ f }) => (
  <Svg>
    <rect x={200} y={480} width={680} height={520} rx={24} fill="#fef3c7" stroke="#92400e" strokeWidth={6} />
    <text x={540} y={560} textAnchor="middle" fill="#92400e" fontSize={46} fontFamily="J">Jurnal Mimpi</text>
    {Array.from({ length: 5 }).map((_, i) => {
      const w = interpolate(f, [20 + i * 18, 40 + i * 18], [0, 520 - (i % 2) * 120], cl);
      return <rect key={i} x={270} y={620 + i * 70} width={w} height={14} rx={7} fill="#7c3aed" opacity={0.7} />;
    })}
  </Svg>
);

export const DATA: DataVideo = {
  id: "v06",
  tema: { latar: "mimpi", utama: "#fdf4ff", aksen: "#f9a8d4", teks: "#fdf4ff", kartu: "rgba(46,16,101,.82)", garis: "#c084fc", fontJudul: "pacifico", fontIsi: "quicksand", ukuranJudul: 88, hurufBesar: false },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Mimpinya Hilang!", sub: "Beberapa menit setelah bangun", tokoh: { pose: "dekat-01-3" }, isi: () => <Benda nama="jam_weker" x={130} y={480} h={360} goyang /> },
    { k: [3, 5], judul: "Setiap Malam", sub: "Tapi cepat lenyap", tokoh: { pose: "dekat-05-2", sisi: "kiri" }, isi: () => <Benda nama="kasur" x={470} y={560} h={330} /> },
    { k: [6, 9], judul: "Tahap Tidur", isi: (f) => <Hipnogram f={f} /> },
    { k: [10, 11], judul: "Ada yang Berbeda", tokoh: { pose: "dekat-10-1" }, isi: () => <Benda nama="otak" x={150} y={470} h={420} goyang /> },
    { k: [11, 11], judul: "Hampir Habis", isi: (f) => <Meter f={f} /> },
    { k: [12, 12], judul: "Tanpa Tombol Simpan", isi: (f) => <Rekam f={f} /> },
    { k: [13, 14], judul: "Hipokampus", sub: "Diduga paling lambat bangun", tokoh: { pose: "dekat-11-3", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Benda nama="otak" x={560} y={470} h={380} />
        <Kartu at={t(14)} x={560} y={880} size={38} warna="#fbbf24">belum siap menyimpan</Kartu>
      </>
    ) },
    { k: [15, 17], judul: "Lupa yang Disengaja?", sub: "Penelitian pada tikus", tokoh: { pose: "dekat-04-2" }, isi: (f, d, t) => (
      <>
        <Benda nama="tikus_di_balok" x={120} y={500} h={300} />
        <Kartu at={t(17)} x={90} y={860} size={40} warna="#fbbf24">⚠ masih diteliti</Kartu>
      </>
    ) },
    { k: [18, 18], judul: "Bagikan ke Temanmu", tokoh: { pose: "dekat-06-1" }, isi: () => <Benda nama="ponsel" x={160} y={480} h={440} goyang /> },
    { k: [19, 21], judul: "Kadang Ingat Jelas", sub: "Kenapa?", tokoh: { pose: "dekat-07-2", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Kartu at={t(20)} x={520} y={500} size={40}>bangun di tengah mimpi</Kartu>
        <Kartu at={t(21)} x={520} y={620} size={40} warna="#f472b6">mimpi emosional</Kartu>
        <Kartu at={t(21) + 15} x={520} y={740} size={40} warna="#f472b6">mimpi aneh</Kartu>
      </>
    ) },
    { k: [22, 25], judul: "Tips Ingat Mimpi", tokoh: { pose: "dekat-05-1" }, isi: (f, d, t) => (
      <>
        {f < t(24) ? <Kartu at={t(23)} x={90} y={520} size={44}>Diam dulu, jangan buka ponsel</Kartu> : <Jurnal f={f - t(24)} />}
      </>
    ) },
    { k: [26, 27], judul: "Bukan Tidak Penting", sub: "Otak sedang mode lain", tokoh: { pose: "dekat-06-3", sisi: "kiri" }, isi: () => <Benda nama="bulan_purnama" x={580} y={480} h={360} goyang /> },
    { k: [28, 29], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "dekat-08-1" }, isi: () => <Benda nama="selimut_bayi" x={120} y={520} h={300} /> },
  ],
  sfx: [
    [1, 0, "alat_alarm_pagi", 0.4],
    [2, 0, "sinematik_kejutan_tajam", 0.35],
    [3, 0, "suasana_malam_sepi", 0.3],
    [6, 0, "baby-toy-music-box-lullaby", 0.22],
    [10, 0.3, "ui_tanya_pop", 0.45],
    [12, 0.3, "ui_salah_buzzer", 0.35],
    [13, 0, "sleep-breathing", 0.3],
    [15, 0.3, "tubuh_merinding_berkilau", 0.4],
    [19, 0.2, "ui_ide_lonceng", 0.45],
    [24, 0.3, "paper-stationery-stationery-10", 0.5],
    [28, 0, "happy-bells-notification", 0.35],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["Mimpimu", "Dihapus", "Otakmu?"], sorot: [1], pose: "dekat-11-2", benda: ["bulan_purnama", "otak"], label: "MISTERI TIDUR" },
};
