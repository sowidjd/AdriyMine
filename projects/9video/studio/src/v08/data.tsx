/** Video 08 — Kenapa Kopi Bikin Melek? (outfit formal kantoran, gaya kafe hangat) */
import React from "react";
import { interpolate } from "remotion";
import { Angka, Benda, DataVideo, Kartu, cl } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "formal";
const MUSIK_ID = "interior-birdecorator-explore_silly";
void OUTFIT; void MUSIK_ID;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>{children}</svg>;

// Adenosin menumpuk sepanjang hari
const Tumpukan: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const p = interpolate(f, [10, d - 10], [0.05, 0.95], cl);
  return (
    <Svg>
      <rect x={390} y={470} width={300} height={520} rx={30} fill="rgba(255,255,255,.08)" stroke="#fcd34d" strokeWidth={5} />
      {Array.from({ length: Math.round(p * 24) }).map((_, i) => <circle key={i} cx={430 + (i % 4) * 72} cy={960 - Math.floor(i / 4) * 80} r={30} fill="#a78bfa" stroke="#4c1d95" strokeWidth={4} />)}
      <text x={540} y={1050} textAnchor="middle" fill="#fde68a" fontSize={40} fontFamily="I">adenosin menumpuk</text>
      <text x={250} y={560} textAnchor="middle" fill="#fde68a" fontSize={70}>☀</text>
      <text x={830} y={560} textAnchor="middle" fill="#c4b5fd" fontSize={70} opacity={p}>☾</text>
    </Svg>
  );
};

// Gembok (penerima) & kunci: adenosin / kafein
const Gembok: React.FC<{ x: number; y: number; isi?: "adenosin" | "kafein" | null; buka?: boolean }> = ({ x, y, isi, buka }) => (
  <g transform={`translate(${x},${y})`}>
    <path d={`M -45 -40 V ${buka ? -110 : -80} a 45 45 0 0 1 90 0 V -40`} fill="none" stroke="#e5e7eb" strokeWidth={14} />
    <rect x={-70} y={-45} width={140} height={120} rx={18} fill="#78716c" stroke="#e7e5e4" strokeWidth={5} />
    <rect x={-14} y={-10} width={28} height={50} rx={6} fill="#292524" />
    {isi && <circle cx={0} cy={110} r={34} fill={isi === "adenosin" ? "#a78bfa" : "#92400e"} stroke="#fff" strokeWidth={4} />}
    {isi && <text x={0} y={175} textAnchor="middle" fill="#fff" fontSize={28} fontFamily="I">{isi}</text>}
  </g>
);
const KunciGembok: React.FC<{ f: number; kafein: number }> = ({ f, kafein }) => {
  const k = f > kafein;
  return (
    <Svg>
      <Gembok x={300} y={640} isi={k ? "kafein" : "adenosin"} />
      <Gembok x={780} y={640} isi={k ? "kafein" : "adenosin"} />
      <text x={540} y={960} textAnchor="middle" fill={k ? "#fbbf24" : "#c4b5fd"} fontSize={44} fontFamily="I">{k ? "pesan kantuk tertahan" : "pesan: waktunya istirahat"}</text>
    </Svg>
  );
};

// Kurva kafein: naik lalu turun setengah dalam ±5 jam
const Kurva: React.FC<{ f: number }> = ({ f }) => {
  const p = interpolate(f, [10, 80], [0, 1], cl);
  return (
    <Svg>
      <line x1={140} y1={980} x2={960} y2={980} stroke="#fde68a" strokeWidth={4} />
      <line x1={140} y1={480} x2={140} y2={980} stroke="#fde68a" strokeWidth={4} />
      <path d="M 140 980 C 200 600, 260 520, 330 540 S 600 760, 940 900" fill="none" stroke="#f59e0b" strokeWidth={9} strokeDasharray="1400" strokeDashoffset={1400 * (1 - p)} />
      <line x1={330} y1={540} x2={330} y2={980} stroke="#fbbf24" strokeDasharray="8 8" strokeWidth={3} />
      <line x1={620} y1={760} x2={620} y2={980} stroke="#fbbf24" strokeDasharray="8 8" strokeWidth={3} />
      <text x={330} y={1030} textAnchor="middle" fill="#fde68a" fontSize={30} fontFamily="I">20–45 mnt</text>
      <text x={620} y={1030} textAnchor="middle" fill="#fde68a" fontSize={30} fontFamily="I">± 5 jam: separuh</text>
    </Svg>
  );
};

export const DATA: DataVideo = {
  id: "v08",
  tema: { latar: "kafe", utama: "#fef3c7", aksen: "#fbbf24", teks: "#fff7ed", kartu: "rgba(41,22,12,.86)", garis: "#d97706", fontJudul: "playfair-display", fontIsi: "nunito", ukuranJudul: 84, hurufBesar: false },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Langsung Melek", sub: "Secangkir kopi", tokoh: { pose: "setengah_ok_kedip" }, isi: () => <Benda nama="kopi" x={120} y={480} h={400} goyang /> },
    { k: [3, 5], judul: "Tambah Tenaga?", sub: "Ternyata tidak", tokoh: { pose: "setengah_stop_tangan", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Benda nama="baterai" x={600} y={490} h={300} redup={f > t(4) ? 0.35 : 1} />
        <Kartu at={t(5)} x={520} y={860} size={46} warna="#fbbf24">Kopi menipu otak</Kartu>
      </>
    ) },
    { k: [6, 8], judul: "Kenalan: Adenosin", sub: "Sisa aktivitas otak", isi: (f, d) => <Tumpukan f={f} d={d} /> },
    { k: [9, 11], judul: "Kunci & Gembok", sub: "Pesan: waktunya istirahat", tokoh: { pose: "setengah_pijat_hidung_lelah" }, isi: (f) => <KunciGembok f={f} kafein={999999} /> },
    { k: [12, 16], judul: "Masuklah Kafein", sub: "Bentuknya mirip", isi: (f, d, t) => (
      <>
        <KunciGembok f={f} kafein={t(14)} />
        <Kartu at={t(16)} y={1000 - 10} tengah size={38} warna="#f59e0b">kantuknya ada, pesannya tidak sampai</Kartu>
      </>
    ) },
    { k: [17, 17], judul: "Berapa Gelas?", sub: "Tulis di komentar", tokoh: { pose: "setengah_tunjuk_dua_jari", sisi: "kiri" }, isi: () => <Benda nama="mug_hitam" x={600} y={500} h={330} goyang /> },
    { k: [18, 20], judul: "Kapan Terasa?", isi: (f) => <Kurva f={f} /> },
    { k: [21, 23], judul: "Kantuk Datang Lagi", sub: "Adenosin menempel sekaligus", tokoh: { pose: "setengah_kaget_dua_tangan" }, isi: () => <Benda nama="kasur" x={100} y={540} h={300} /> },
    { k: [24, 25], judul: "Toleransi", sub: "Otak menambah gembok", tokoh: { pose: "setengah_garuk_kepala", sisi: "kiri" }, isi: (f) => (
      <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 4 }}>
        {Array.from({ length: Math.min(6, 2 + Math.floor(f / 25)) }).map((_, i) => <Gembok key={i} x={560 + (i % 3) * 170} y={560 + Math.floor(i / 3) * 260} />)}
      </svg>
    ) },
    { k: [26, 27], judul: "Batas Aman", sub: "Orang dewasa sehat", tokoh: { pose: "setengah_tunjuk_kamera_serius" }, isi: (f, d, t) => (
      <>
        <Angka at={10} ke={400} akhiran=" mg" y={480} size={150} />
        <Kartu at={25} x={90} y={700} size={44}>± 3–4 cangkir kopi / hari</Kartu>
        <Kartu at={t(27)} x={90} y={820} size={36} warna="#f97316">punya kondisi kesehatan? tanya nakes</Kartu>
      </>
    ) },
    { k: [28, 29], judul: "Menunda Lelah", sub: "Bukan energi baru", tokoh: { pose: "setengah_berdoa_tutup_mata", sisi: "kiri" }, isi: () => <Benda nama="jam_dinding" x={600} y={490} h={330} /> },
    { k: [30, 31], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "setengah_tertawa_pegang_dada" }, isi: () => <Benda nama="dripper_kopi" x={120} y={480} h={380} /> },
  ],
  sfx: [
    [1, 0, "pouring-water-to-mug", 0.45],
    [2, 0.3, "drink-drink-02", 0.5],
    [4, 0, "wrong-answer-fail-notification", 0.3],
    [6, 0, "transisi_whoosh", 0.4],
    [11, 0, "male-sleepy-yawning", 0.4],
    [14, 0.3, "keys-locks-door-key-lock-door-05", 0.5],
    [16, 0.3, "ui_ide_lonceng", 0.45],
    [18, 0, "tick-tock-clock-timer", 0.3],
    [22, 0.2, "male-tired-yawn", 0.35],
    [26, 0, "ui_peringatan_bel", 0.35],
    [30, 0, "drink-drink-04", 0.45],
  ],
  musik: { file: "musik.ogg", vol: 0.1 },
  thumb: { baris: ["Kopi", "Menipu", "Otakmu"], sorot: [1], pose: "setengah_ide_telunjuk_kaget", benda: ["kopi"], label: "SAINS PAGI HARI" },
};
