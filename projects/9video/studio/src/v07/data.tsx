/** Video 07 — Kenapa Harga Selalu Berakhiran 99? (outfit formal, gaya toko & label harga) */
import React from "react";
import { interpolate } from "remotion";
import { Benda, DataVideo, Kartu, cl, useData } from "../mesin/inti";
import timeline from "./timeline.json";
import pose from "./pose.json";

const OUTFIT = "formal";
const MUSIK_ID = "ludum-dare-38-01";
void OUTFIT; void MUSIK_ID;

// Label harga besar; digit pertama bisa disorot
const Label: React.FC<{ x: number; y: number; harga: string; coret?: boolean; sorot?: number; s?: number; miring?: number }> = ({ x, y, harga, sorot = 0, s = 1, miring = -6, coret }) => {
  const { tema } = useData();
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${miring}deg) scale(${s})`, transformOrigin: "left top", zIndex: 5 }}>
      <div style={{ position: "relative", background: "#facc15", border: "6px solid #111", borderRadius: "20px 60px 60px 20px", padding: "20px 70px 20px 40px", boxShadow: "0 14px 0 rgba(0,0,0,.25)" }}>
        <div style={{ position: "absolute", right: 22, top: "50%", width: 26, height: 26, marginTop: -13, borderRadius: "50%", background: "#fff7e6", border: "5px solid #111" }} />
        <span style={{ fontFamily: "J", fontSize: 40, color: "#111" }}>Rp </span>
        {harga.split("").map((c, i) => (
          <span key={i} style={{ fontFamily: "J", fontSize: i === 0 ? 120 + sorot * 60 : 120, color: i === 0 && sorot > 0 ? tema.aksen : "#111", textDecoration: coret ? "line-through" : undefined }}>{c}</span>
        ))}
      </div>
    </div>
  );
};

// Mata membaca dari kiri ke kanan
const Baca: React.FC<{ f: number }> = ({ f }) => {
  const x = interpolate(f, [10, 60], [150, 820], cl);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 6 }}>
      <line x1={150} y1={480} x2={x} y2={480} stroke="#dc2626" strokeWidth={10} strokeLinecap="round" />
      <polygon points={`${x + 30},480 ${x},460 ${x},500`} fill="#dc2626" />
    </svg>
  );
};

export const DATA: DataVideo = {
  id: "v07",
  tema: { latar: "toko", utama: "#b91c1c", aksen: "#dc2626", teks: "#fff", kartu: "rgba(17,17,17,.88)", garis: "#facc15", fontJudul: "bebas-neue", fontIsi: "barlow", ukuranJudul: 120, sorot: "#facc15" },
  timeline,
  pose: pose as unknown as Record<string, [number, number]>,
  adegan: [
    { k: [1, 2], judul: "Kenapa 99?", tokoh: { pose: "setengah_tunjuk_pelipis" }, isi: () => <Label x={90} y={540} harga="99.900" /> },
    { k: [3, 6], judul: "Hampir Semua Toko", sub: "Kebetulan?", tokoh: { pose: "setengah_curiga_silang_tangan", sisi: "kiri" }, isi: () => (
      <>
        <Label x={470} y={470} harga="49.900" s={0.6} miring={6} />
        <Label x={420} y={650} harga="99.000" s={0.6} miring={-4} />
        <Label x={460} y={830} harga="1.999.000" s={0.5} miring={5} />
      </>
    ) },
    { k: [7, 8], judul: "Harga Psikologis", tokoh: { pose: "setengah_jari_menyatu_serius" }, isi: () => <Benda nama="label_harga" x={140} y={480} h={420} goyang /> },
    { k: [9, 11], judul: "Dibaca dari Kiri", sub: "Angka pertama paling diingat", isi: (f, d, t) => (
      <>
        <Baca f={f} />
        <Label x={120} y={560} harga="49.900" sorot={interpolate(f, [t(10), t(10) + 15], [0, 1], cl)} />
        <Kartu at={t(11)} y={900} tengah warna="#facc15" size={44}>terasa "empat puluh ribuan"</Kartu>
      </>
    ) },
    { k: [12, 13], judul: "Efek Digit Kiri", sub: "Penelitian di Amerika", tokoh: { pose: "setengah_ide_telunjuk_kaget", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Kartu at={10} x={520} y={500} size={64} warna="#22c55e">$2,99</Kartu>
        <Kartu at={t(13)} x={520} y={640} size={40}>terasa jauh lebih murah dari</Kartu>
        <Kartu at={t(13) + 15} x={520} y={740} size={64} warna="#dc2626">$3,00</Kartu>
      </>
    ) },
    { k: [14, 15], judul: "Sinyal Diskon", sub: "Angka 9 = hemat", tokoh: { pose: "setengah_semangat_kepal" }, isi: () => (
      <>
        <Benda nama="keranjang_belanja" x={120} y={500} h={360} />
        <Benda nama="tas_belanja" x={400} y={560} h={300} at={12} />
      </>
    ) },
    { k: [16, 16], judul: "Bagikan Video Ini", tokoh: { pose: "setengah_jempol_senyum", sisi: "kiri" }, isi: () => <Benda nama="ponsel" x={600} y={480} h={440} goyang /> },
    { k: [17, 19], judul: "Barang Mewah", sub: "Justru angka bulat", tokoh: { pose: "setengah_benarkan_kacamata" }, isi: () => (
      <>
        <Benda nama="berlian" x={110} y={480} h={260} goyang />
        <Label x={90} y={790} harga="5.000.000" s={0.62} miring={0} />
      </>
    ) },
    { k: [20, 21], judul: "Bulat vs Ganjil", tokoh: { pose: "setengah_mikir_dagu", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Kartu at={10} x={520} y={500} size={42} warna="#facc15">Bulat → keputusan perasaan</Kartu>
        <Kartu at={t(21)} x={520} y={640} size={42}>…99 → keputusan hitung harga</Kartu>
      </>
    ) },
    { k: [22, 23], judul: "Cerita Populer", sub: "Kasir & kembalian", tokoh: { pose: "setengah_bingung_tangan_terbuka" }, isi: (f, d, t) => (
      <>
        <Benda nama="mesin_kasir" x={120} y={480} h={330} />
        <Kartu at={t(23)} x={90} y={860} size={40} warna="#f59e0b">⚠ belum tentu benar</Kartu>
      </>
    ) },
    { k: [24, 27], judul: "Biar Tidak Terjebak", sub: "Bulatkan ke atas", tokoh: { pose: "setengah_tunjuk_kamera_serius", sisi: "kiri" }, isi: (f, d, t) => (
      <>
        <Label x={480} y={480} harga="49.900" s={0.55} coret={f > t(26)} />
        {f > t(26) && <Label x={480} y={640} harga="50.000" s={0.55} miring={4} />}
        <Benda nama="kalkulator" x={600} y={830} h={200} at={t(25)} />
      </>
    ) },
    { k: [28, 28], judul: "Pesan untuk Otakmu", tokoh: { pose: "setengah_ok_senyum" }, isi: () => <Benda nama="otak" x={150} y={480} h={400} goyang /> },
    { k: [29, 30], judul: "Adriy Project", sub: "Explore More, Know More.", tokoh: { pose: "setengah_sorak_dua_kepal", sisi: "kiri" }, isi: () => <Benda nama="koin" x={640} y={500} h={300} goyang /> },
  ],
  sfx: [
    [1, 0, "shopping-mall-ambience-crowd", 0.2],
    [1, 0.4, "alat_stempel_hantaman", 0.45],
    [5, 0, "ui_tanya_pop", 0.45],
    [6, 0, "wrong-answer-fail-notification", 0.35],
    [7, 0.2, "ui_ide_lonceng", 0.5],
    [10, 0.3, "ui_notifikasi_ping", 0.45],
    [12, 0, "transisi_whoosh", 0.4],
    [14, 0, "money-money-05", 0.5],
    [17, 0.5, "sinematik_kejutan_tajam", 0.35],
    [22, 0, "money-money-12", 0.45],
    [26, 0.5, "correct-answer-tone", 0.45],
    [29, 0, "coin3", 0.5],
  ],
  musik: { file: "musik.ogg", vol: 0.09 },
  thumb: { baris: ["Kamu", "Ditipu", "Angka 9?"], sorot: [1], pose: "setengah_kaget_tangan_kepala", benda: ["label_harga", "keranjang_belanja"], label: "TRIK TOKO", ukuran: 1.6 },
};
