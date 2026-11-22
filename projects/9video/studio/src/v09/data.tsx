/** Video 09 — Kenapa Bau Hujan Terasa Khas? (outfit penjelajah alam, gaya hutan hujan) */
import React from "react";
import { interpolate } from "remotion";
import { Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "arkeolog";
const MUSIK_ID = "ludum-dare-30-05";
void OUTFIT; void MUSIK_ID;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;

// Lapisan tanah dengan bakteri
const Tanah: React.FC<{ f: number }> = ({ f }) => (
  <Svg>
    <rect x={90} y={560} width={900} height={440} rx={26} fill="#5b3a1e" />
    <rect x={90} y={560} width={900} height={60} rx={20} fill="#3f6212" />
    {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={130 + ((i * 89) % 820)} cy={660 + ((i * 53) % 310)} r={6 + (i % 4) * 3} fill="#7c5a3a" />)}
    {Array.from({ length: 9 }).map((_, i) => (
      <g key={`b${i}`} transform={`translate(${170 + ((i * 113) % 740)},${700 + ((i * 71) % 250)}) rotate(${(f * 2 + i * 40) % 360})`}>
        <rect x={-26} y={-9} width={52} height={18} rx={9} fill="#a3e635" />
        <path d="M 26 0 q 14 -10 28 0" stroke="#a3e635" strokeWidth={3} fill="none" />
      </g>
    ))}
  </Svg>
);

// Tetes hujan → gelembung → butiran aroma terbang
const Tetes: React.FC<{ f: number }> = ({ f }) => {
  const siklus = f % 70;
  const yT = interpolate(siklus, [0, 20], [470, 820], cl);
  const g = interpolate(siklus, [22, 40], [0, 1], cl);
  return (
    <Svg>
      <rect x={90} y={850} width={900} height={170} rx={20} fill="#6b4423" />
      {siklus < 21 && <path d={`M 540 ${yT - 40} q -26 46 0 60 q 26 -14 0 -60`} fill="#93c5fd" />}
      {siklus >= 21 && siklus < 44 && Array.from({ length: 5 }).map((_, i) => <circle key={i} cx={470 + i * 35} cy={840 - g * 70 - (i % 2) * 20} r={10 + g * 6} fill="none" stroke="#bfdbfe" strokeWidth={3} />)}
      {siklus >= 38 && Array.from({ length: 14 }).map((_, i) => {
        const u = (siklus - 38) / 32;
        return <circle key={`a${i}`} cx={540 + Math.cos(i) * u * 320} cy={800 - u * 280 - (i % 3) * 30} r={5} fill="#fde68a" opacity={1 - u} />;
      })}
    </Svg>
  );
};

export const DATA: DataVideo = {
  id: "v09",
  tema: { latar: "hujan", utama: "#ecfccb", aksen: "#a3e635", teks: "#f7fee7", kartu: "rgba(20,38,28,.86)", garis: "#84cc16", fontJudul: "bree-serif", fontIsi: "nunito", ukuranJudul: 90 },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Bau Hujan Pertama", sub: "Kenapa menenangkan?", tokoh: { pose: "setengah_namaste_menunduk" }, isi: () => <Benda nama="hujan" x={120} y={470} h={420} /> },
    { k: [3, 5], judul: "Petrikor", sub: "Nama sejak 1964", tokoh: { pose: "wajah_catat_pulpen", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Kartu at={t(5)} x={520} y={500} size={44}>petra = batu</Kartu>
        <Kartu at={t(5) + 25} x={520} y={620} size={40} warna="#facc15">ichor = cairan para dewa</Kartu>
      </>
    ) },
    { k: [6, 7], judul: "Dari Mana?", sub: "Makhluk yang sangat kecil", tokoh: { pose: "wajah_teropong_kaget" }, isi: () => <Benda nama="kaca_pembesar" x={140} y={480} h={380} goyang /> },
    { k: [8, 10], judul: "Streptomyces", sub: "Bakteri di tanah", isi: (f, d, t) => (
      <>
        <Tanah f={f} />
        <Kartu at={t(9)} y={460} tengah size={50} warna="#facc15">menghasilkan GEOSMIN</Kartu>
      </>
    ) },
    { k: [11, 11], judul: "Terbang ke Hidung?", tokoh: { pose: "wajah_ragu_tangan_terbuka", sisi: "kiri" }, isi: () => <Benda nama="awan" x={520} y={490} h={300} goyang /> },
    { k: [12, 15], judul: "Kamera Super Cepat", sub: "Penelitian MIT", isi: (f) => <Tetes f={f} /> },
    { k: [16, 16], judul: "Hujan Pelan", sub: "Paling banyak aroma", tokoh: { pose: "setengah_rentang_tangan_santai" }, isi: () => <Benda nama="payung" x={130} y={490} h={380} goyang /> },
    { k: [17, 18], judul: "Tebak Dulu", sub: "Kenapa hidung peka?", tokoh: { pose: "wajah_kedip_tunjuk_dua_jari", sisi: "kiri" }, isi: () => <Benda nama="daun" x={500} y={500} h={300} goyang /> },
    { k: [19, 20], judul: "Sangat Peka", sub: "Bagian per triliun", tokoh: { pose: "wajah_sorak_kepal" }, isi: () => (
      <>
        <Kartu at={15} y={520} tengah size={66} warna="#facc15">1 : 1.000.000.000.000</Kartu>
        <Kartu at={45} x={90} y={760} size={44} warna="#a3e635">lebih peka dari banyak bau lain</Kartu>
      </>
    ) },
    { k: [21, 22], judul: "Mencari Air?", sub: "Dugaan ilmuwan", tokoh: { pose: "jalan_tongkat_trekking", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Benda nama="tetes_air" x={620} y={500} h={260} goyang />
        <Kartu at={t(22)} x={520} y={860} size={40} warna="#facc15">⚠ belum terbukti</Kartu>
      </>
    ) },
    { k: [23, 24], judul: "Sebelum Badai", sub: "Bau ozon dari petir", latar: { petir: true }, tokoh: { pose: "wajah_menggigil_peluk_diri" }, isi: () => <Benda nama="petir" x={140} y={470} h={430} /> },
    { k: [25, 25], judul: "Rasa Tanah", sub: "Bit & ikan air tawar", tokoh: { pose: "wajah_lap_keringat", sisi: "kiri" }, isi: () => <Benda nama="ikan_kerapu" x={440} y={520} h={240} /> },
    { k: [26, 27], judul: "Kerja Jutaan Bakteri", sub: "Dibantu tetes hujan", tokoh: { pose: "duduk_meditasi" }, isi: () => <Benda nama="pohon" x={100} y={460} h={440} /> },
    { k: [28, 29], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "setengah_lambai_senyum", sisi: "kiri" }, isi: () => <Benda nama="pelangi" x={520} y={480} h={300} /> },
  ],
  sfx: [
    [1, 0, "light-rain-atmosphere", 0.3],
    [3, 0.3, "paper-stationery-stationery-08", 0.45],
    [6, 0.2, "ui_tanya_pop", 0.45],
    [8, 0, "rustle-rustle05", 0.45],
    [9, 0.3, "ui_ide_lonceng", 0.5],
    [12, 0.3, "alat_kamera_rana_blitz", 0.5],
    [13, 0.5, "heavy-rain-drops", 0.3],
    [14, 0.3, "tubuh_gelembung_pop", 0.5],
    [19, 0.3, "sinematik_kejutan_tajam", 0.35],
    [23, 0, "thunder-rumble-and-light-rain", 0.4],
    [26, 0, "forest-birds-singing", 0.25],
    [28, 0, "ui_hadiah_naik_level", 0.35],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["Bau Hujan", "Itu", "Bakteri!"], sorot: [2], pose: "wajah_teropong_kaget", benda: ["hujan", "daun"], label: "FAKTA ALAM", latar: { petir: false } },
};
