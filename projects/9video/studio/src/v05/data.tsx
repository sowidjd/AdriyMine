/** Video 05 — Kenapa Pesawat Tidak Terbang Lurus di Peta? (outfit travel, gaya jurnal perjalanan & peta) */
import React from "react";
import { interpolate } from "remotion";
import { Angka, Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "travel";
const MUSIK_ID = "ludum-dare-30-06";
void OUTFIT; void MUSIK_ID;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;
const CK = "#7c2d12";

// Pesawat kecil (ikon)
const Pesawat: React.FC<{ x: number; y: number; r: number; s?: number }> = ({ x, y, r, s = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
    <path d="M -34 0 L 30 -6 Q 44 0 30 6 Z" fill="#1d4ed8" />
    <path d="M 0 -4 L -14 -36 L -4 -36 L 14 -4 Z M 0 4 L -14 36 L -4 36 L 14 4 Z" fill="#2563eb" />
    <path d="M -30 -2 L -40 -16 L -34 -16 L -24 -2 Z M -30 2 L -40 16 L -34 16 L -24 2 Z" fill="#2563eb" />
  </g>
);

// Peta datar: garis lurus vs rute melengkung
const PetaRute: React.FC<{ f: number; lengkung: boolean }> = ({ f, lengkung }) => {
  const p = interpolate(f, [15, 90], [0, 1], cl);
  const A = { x: 170, y: 800 }, B = { x: 910, y: 800 }, C = { x: 540, y: 520 };
  const pt = (u: number) => lengkung
    ? { x: (1 - u) ** 2 * A.x + 2 * (1 - u) * u * C.x + u * u * B.x, y: (1 - u) ** 2 * A.y + 2 * (1 - u) * u * C.y + u * u * B.y }
    : { x: A.x + (B.x - A.x) * u, y: A.y };
  const q = pt(p), q2 = pt(Math.min(1, p + 0.01));
  const r = (Math.atan2(q2.y - q.y, q2.x - q.x) * 180) / Math.PI;
  return (
    <Svg>
      <rect x={80} y={470} width={920} height={500} rx={20} fill="rgba(255,250,235,.6)" stroke={CK} strokeWidth={4} />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#64748b" strokeWidth={5} strokeDasharray="14 12" opacity={lengkung ? 0.5 : 1} />
      {lengkung && <path d={`M ${A.x} ${A.y} Q ${C.x} ${C.y} ${B.x} ${B.y}`} fill="none" stroke="#dc2626" strokeWidth={7} strokeDasharray="16 12" />}
      <circle cx={A.x} cy={A.y} r={16} fill={CK} /><circle cx={B.x} cy={B.y} r={16} fill={CK} />
      <text x={A.x} y={A.y + 60} textAnchor="middle" fontSize={36} fill={CK} fontFamily="I">New York</text>
      <text x={B.x} y={B.y + 60} textAnchor="middle" fontSize={36} fill={CK} fontFamily="I">Tokyo</text>
      <Pesawat x={q.x} y={q.y} r={r} s={1.3} />
    </Svg>
  );
};

// Greenland vs Afrika: di peta mirip, aslinya jauh berbeda
const GreenlandAfrika: React.FC<{ f: number; asli: number }> = ({ f, asli }) => {
  const k = interpolate(f, [asli, asli + 40], [1, 0.27], cl);
  return (
    <Svg>
      <g transform={`translate(300,700) scale(${k})`}>
        <path d="M -150 -170 Q 40 -230 130 -120 Q 180 40 40 170 Q -110 200 -170 40 Z" fill="#e2e8f0" stroke="#475569" strokeWidth={6 / k} />
      </g>
      <text x={300} y={950} textAnchor="middle" fontSize={40} fill={CK} fontFamily="I">Greenland</text>
      <path d="M 640 520 Q 840 480 900 600 Q 960 700 860 820 Q 800 920 760 900 Q 700 820 650 760 Q 560 700 600 600 Z" fill="#a3e635" stroke="#3f6212" strokeWidth={6} />
      <text x={770} y={950} textAnchor="middle" fontSize={40} fill={CK} fontFamily="I">Afrika</text>
    </Svg>
  );
};

// Bola dunia + tali = lingkaran besar
const BolaTali: React.FC<{ f: number }> = ({ f }) => {
  const p = interpolate(f, [20, 80], [0, 1], cl);
  return (
    <Svg>
      <circle cx={540} cy={730} r={280} fill="#60a5fa" stroke="#1e3a8a" strokeWidth={6} />
      {[-60, -30, 0, 30, 60].map((l) => <ellipse key={l} cx={540} cy={730 + l * 3.5} rx={280 * Math.cos((l * Math.PI) / 180)} ry={22} fill="none" stroke="#bfdbfe" strokeWidth={2} />)}
      {[0, 45, 90, 135].map((m) => <ellipse key={m} cx={540} cy={730} rx={280 * Math.abs(Math.cos((m * Math.PI) / 180))} ry={280} fill="none" stroke="#bfdbfe" strokeWidth={2} />)}
      <path d="M 330 810 Q 540 440 760 780" fill="none" stroke="#fbbf24" strokeWidth={10} strokeDasharray="1000" strokeDashoffset={1000 * (1 - p)} strokeLinecap="round" />
      <circle cx={330} cy={810} r={16} fill="#dc2626" /><circle cx={760} cy={780} r={16} fill="#dc2626" />
    </Svg>
  );
};

// Jet stream: angin dari belakang mempercepat
const JetStream: React.FC<{ f: number }> = ({ f }) => (
  <Svg>
    {Array.from({ length: 7 }).map((_, i) => {
      const x = ((f * 9 + i * 170) % 1200) - 120;
      return <path key={i} d={`M ${x} ${560 + (i % 4) * 90} q 60 -20 120 0 t 120 0`} fill="none" stroke="#38bdf8" strokeWidth={6} opacity={0.7} strokeLinecap="round" />;
    })}
    <Pesawat x={300 + ((f * 4) % 500)} y={760} r={0} s={2.4} />
  </Svg>
);

export const DATA: DataVideo = {
  id: "v05",
  tema: { latar: "peta", utama: "#7c2d12", aksen: "#dc2626", teks: "#fff7ed", kartu: "rgba(124,45,18,.9)", garis: "#f59e0b", fontJudul: "permanent-marker", fontIsi: "patrick-hand", ukuranJudul: 88, hurufBesar: false, sorot: "#fde68a" },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Kok Melengkung?", sub: "Layar di kursi pesawat", tokoh: { pose: "dekat-02-2" }, isi: () => <Benda nama="pesawat" x={120} y={480} h={360} goyang putar={-15} /> },
    { k: [3, 4], judul: "Jalan Memutar?", tokoh: { pose: "dekat-05-4", sisi: "kiri" }, isi: (f) => <PetaRute f={f} lengkung /> },
    { k: [5, 6], judul: "Justru Sebaliknya", sub: "Sering kali jalur terpendek", tokoh: { pose: "dekat-03-2" }, isi: () => <Benda nama="kompas" x={140} y={480} h={400} goyang /> },
    { k: [7, 9], judul: "Masalahnya: Peta", sub: "Bola dijadikan datar", tokoh: { pose: "dekat-04-2", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Benda nama="bola_dunia" x={540} y={460} h={340} />
        <Benda nama="peta_dunia" x={480} y={760} h={240} at={t(9) - 10} />
      </>
    ) },
    { k: [10, 12], judul: "Peta Mercator", sub: "Dekat kutub jadi raksasa", isi: (f, d, t) => (
      <>
        <GreenlandAfrika f={f} asli={t(12)} />
        <Angka at={t(12) + 10} ke={14} akhiran="×" y={460 - 10} size={120} />
      </>
    ) },
    { k: [13, 13], judul: "Garis Lurus ≠ Terpendek", tokoh: { pose: "dekat-04-3" }, isi: (f) => <PetaRute f={f} lengkung={false} /> },
    { k: [14, 17], judul: "Bola Dunia + Tali", sub: "Tarik sekencang mungkin", isi: (f, d, t) => (
      <>
        <BolaTali f={f} />
        <Kartu at={t(17)} y={1000} tengah warna="#f59e0b">LINGKARAN BESAR</Kartu>
      </>
    ) },
    { k: [18, 19], judul: "Di Peta Datar", sub: "Terlihat melengkung", isi: (f, d, t) => (
      <>
        <PetaRute f={f} lengkung />
        <Kartu at={t(19)} y={1000} tengah size={40}>lewat dekat Alaska ✈</Kartu>
      </>
    ) },
    { k: [20, 20], judul: "Simpan Dulu", tokoh: { pose: "dekat-01-1" }, isi: () => <Benda nama="paspor" x={170} y={480} h={420} goyang /> },
    { k: [21, 24], judul: "Jet Stream", sub: "Angin kencang di ketinggian", tokoh: { pose: "dekat-02-3", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <JetStream f={f} />
        <Kartu at={t(23)} y={970} tengah size={40}>pergi & pulang bisa beda waktu</Kartu>
      </>
    ) },
    { k: [25, 26], judul: "Banyak Pertimbangan", tokoh: { pose: "dekat-02-2" }, isi: (f, d, t) => (
      <>
        {["Jalur udara", "Cuaca buruk", "Bandara cadangan", "Angin"].map((x, i) => <Kartu key={x} at={10 + i * 12} x={90} y={470 + i * 105} size={44}>✓ {x}</Kartu>)}
        {void t}
      </>
    ) },
    { k: [27, 28], judul: "Jalan Pintas", sub: "Di atas Bumi yang bulat", tokoh: { pose: "dekat-03-4", sisi: "kiri" }, isi: () => (
      <>
        <Benda nama="bola_dunia" x={560} y={470} h={360} goyang />
        <Benda nama="koper" x={640} y={840} h={200} at={12} />
      </>
    ) },
    { k: [29, 30], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "dekat-01-2" }, isi: () => <Benda nama="tiket" x={130} y={500} h={360} goyang putar={-10} /> },
  ],
  sfx: [
    [1, 0, "airplane-seatbelt-tone", 0.5],
    [1, 0.5, "jet-plane-hum-flying", 0.25],
    [3, 0.3, "ui_tanya_pop", 0.45],
    [5, 0.2, "sinematik_kejutan_tajam", 0.4],
    [7, 0, "paper-stationery-stationery-05", 0.5],
    [12, 0.3, "sinematik_hantaman_dramatis", 0.4],
    [14, 0, "transisi_whoosh", 0.4],
    [17, 0.2, "ui_ide_lonceng", 0.5],
    [19, 0, "low-airplane-flying-over", 0.3],
    [20, 0, "alat_stempel_hantaman", 0.5],
    [21, 0, "transition-windy-swoosh", 0.45],
    [27, 0, "melodic-airport-announcement-ding", 0.4],
    [29, 0, "landing-jet-flying-whoosh", 0.35],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["Pilotnya", "Nyasar?", "Bukan!"], sorot: [2], pose: "dekat-04-3", benda: ["pesawat", "bola_dunia"], label: "RAHASIA PENERBANGAN" },
};
