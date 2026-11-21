import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  Adriy, C, FONT_JUDUL, FONT_TANGAN, Fonts, FPS, Judul, KAL, Kamera, Kertas, Label, Masuk, Muncul, PencilDefs, Subtitle,
  TOTAL_DETIK, fk, usePop,
} from "./lib";
import { Gelombang, Gunung, JalurSaraf, Kucing, KulitMakro, Pelukan, Penampang, Pendengar, TandaTanya } from "./gambar";

const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const DURASI = Math.ceil((TOTAL_DETIK + 1.8) * FPS);

// Adegan = rentang kalimat (sesuai skrip pemilik)
const ADEGAN: [number, number][] = [[1, 1], [2, 2], [3, 4], [5, 6], [7, 7], [8, 10], [11, 12], [13, 13], [14, 16], [17, 18], [19, 21], [22, 24], [25, 26]];
const mulaiAdegan = (i: number) => (i === 0 ? 0 : fk(ADEGAN[i][0]) - 6);
const akhirAdegan = (i: number) => (i === ADEGAN.length - 1 ? DURASI : mulaiAdegan(i + 1));

type P = { d: number; t: (n: number) => number };

const Tengah: React.FC<{ top: number; children: React.ReactNode; scale?: number }> = ({ top, children, scale = 1 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${scale})` }}>{children}</div>
);

// 1. HOOK
const S1: React.FC<P> = ({ d }) => {
  const f = useCurrentFrame();
  const b = interpolate(f, [d * 0.35, d * 0.85], [0, 1], cl);
  return (
    <>
      <Kertas malam={0.6} />
      <Kamera d={d} dari={1.12} ke={1.25} y={-30}>
        <Tengah top={420}><KulitMakro berdiri={b} benjol={b} kilau={b} /></Tengah>
      </Kamera>
      <Judul at={d * 0.4} top={240} warna="#ffd27a" size={96}>MERINDING KARENA LAGU?</Judul>
      <Adriy pose="kaget" sisi="kiri" tinggi={520} at={10} />
    </>
  );
};

// 2. PENGENALAN AKUN
const S2: React.FC<P> = ({ d }) => {
  const kartu = usePop(d * 0.45);
  return (
    <>
      <Kertas malam={0.15} />
      <Kamera d={d} dari={1} ke={1.05}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <g filter="url(#pensil)">
            <rect x={40} y={1060} width={1000} height={30} rx={10} fill="#b98a5a" />
            <rect x={40} y={1060} width={1000} height={30} rx={10} fill="url(#arsir)" />
          </g>
        </svg>
        <Img src={staticFile("lampu_meja.png")} style={{ position: "absolute", left: 70, top: 690, height: 380 }} />
        <Img src={staticFile("headphone.png")} style={{ position: "absolute", left: 330, top: 860, height: 200 }} />
      </Kamera>
      <Muncul at={0} style={{ top: 240, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 120, color: C.biru, filter: "url(#pensilHalus)" }}>ADRIY PROJECT</div>
        <div style={{ fontFamily: FONT_TANGAN, fontSize: 48, color: C.amber, marginTop: -6 }}>membongkar hal kecil</div>
      </Muncul>
      <div style={{ position: "absolute", left: 90, top: 520, transform: `scale(${kartu})`, transformOrigin: "left center", background: "#fbf5e6", borderRadius: 28, border: `5px solid ${C.pensil}`, overflow: "hidden", width: 576, height: 300 }}>
        <div style={{ transform: "scale(0.6) translateY(-120px)", transformOrigin: "top left" }}><KulitMakro berdiri={0.3} benjol={0} /></div>
      </div>
      <Adriy pose="sajikan" sisi="kanan" tinggi={760} at={6} />
    </>
  );
};

// 3. RELATE
const S3: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t4 = t(4);
  const amp = interpolate(f, [0, t4, t4 + 70], [0.25, 0.45, 1], cl);
  const b = interpolate(f, [d - 55, d - 15], [0, 1], cl);
  const hp = usePop(0);
  return (
    <>
      <Kertas malam={0.3} hangat={0.2} />
      <Kamera d={d} dari={1} ke={1.08}>
        <Img src={staticFile("headphone.png")} style={{ position: "absolute", left: 90, top: 260, height: 300, transform: `scale(${hp}) rotate(${Math.sin(f / 8) * 5}deg)` }} />
        {["♪", "♫", "♪"].map((n, i) => (
          <div key={i} style={{ position: "absolute", left: 380 + i * 110, top: 300 - ((f * 2 + i * 60) % 160), fontSize: 80, color: i % 2 ? C.amber : C.biru, opacity: 0.85, fontFamily: FONT_TANGAN }}>{n}</div>
        ))}
        <Tengah top={620}><Gelombang amp={amp} w={860} h={320} /></Tengah>
        <div style={{ position: "absolute", left: 60, top: 960, opacity: b, transform: "scale(0.55)", transformOrigin: "top left", background: "#fbf5e6", borderRadius: 40, border: `6px solid ${C.pensil}` }}>
          <KulitMakro berdiri={b} benjol={b} kilau={b} />
        </div>
      </Kamera>
      <Adriy pose="tenang" sisi="kanan" tinggi={520} at={t4 - 10} />
    </>
  );
};

// 4. PERLUASAN RELATE
const S4: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t6 = t(6);
  const sisa = d - t6;
  const a = t6, b = t6 + sisa * 0.36, c = t6 + sisa * 0.68;
  const tampil = (x0: number, x1: number) => interpolate(f, [x0, x0 + 8, x1 - 6, x1], [0, 1, 1, 0], cl);
  return (
    <>
      <Kertas hangat={0.25} />
      <div style={{ opacity: interpolate(f, [0, 8, a - 4, a + 4], [0, 1, 1, 0], cl) }}>
        <Judul at={0} top={560} size={130}>BUKAN CUMA MUSIK</Judul>
      </div>
      <div style={{ opacity: tampil(a, b + 6) }}>
        <Kamera d={d} dari={1} ke={1.1}><Tengah top={380}><Gunung /></Tengah></Kamera>
        <Label at={a + 10} x={110} y={280} warna={C.biru} size={56}>pemandangan luar biasa</Label>
      </div>
      <div style={{ opacity: tampil(b, c + 6) }}>
        <Tengah top={380}><Pelukan p={interpolate(f, [b, b + 40], [0, 1], cl)} /></Tengah>
        <Label at={b + 10} x={330} y={280} warna={C.biru} size={56}>momen haru</Label>
      </div>
      <div style={{ opacity: interpolate(f, [c, c + 8], [0, 1], cl) }}>
        <Label at={c + 4} x={200} y={280} warna={C.biru} size={56}>sesuatu yang bikin kagum</Label>
        <div style={{ position: "absolute", left: 560, top: 520, transform: "scale(0.5)", transformOrigin: "top left", background: "#fbf5e6", borderRadius: 40, border: `6px solid ${C.pensil}` }}>
          <KulitMakro berdiri={interpolate(f, [c + 15, c + 50], [0, 1], cl)} benjol={interpolate(f, [c + 15, c + 50], [0, 1], cl)} kilau={1} />
        </div>
        <Adriy pose="takjub" sisi="kiri" tinggi={560} at={c} />
      </div>
    </>
  );
};

// 5. PATAHKAN
const S5: React.FC<P> = ({ d }) => {
  const f = useCurrentFrame();
  const q = usePop(6, 9);
  const buka = interpolate(f, [d * 0.45, d * 0.65], [0, 1], cl);
  const lbl = d * 0.62;
  return (
    <>
      <Kertas malam={0.2} />
      <div style={{ opacity: interpolate(f, [d * 0.4, d * 0.5], [1, 0], cl) }}>
        <Tengah top={300}><TandaTanya p={q} /></Tengah>
        <Judul at={4} top={220} size={100} warna={C.merah}>TAPI TERNYATA...</Judul>
      </div>
      <div style={{ opacity: buka }}>
        <Tengah top={300} scale={0.9}><Penampang buka={buka} kontraksi={interpolate(f, [lbl, d], [0, 1], cl)} sorot={0} /></Tengah>
      </div>
      <Muncul at={lbl} style={{ top: 1000, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 110, color: C.biru, filter: "url(#pensilHalus)" }}>PILOERECTION</div>
        <div style={{ fontFamily: FONT_TANGAN, fontSize: 44, color: C.pensil, marginTop: -10 }}>rambut berdiri karena otot kecil berkontraksi</div>
      </Muncul>
      {f < lbl ? <Adriy pose="mikir" sisi="kanan" tinggi={500} at={0} /> : <Adriy pose="eureka" sisi="kanan" tinggi={500} at={lbl} />}
    </>
  );
};

// 6. PENJELASAN SAINS
const S6: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t9 = t(9), t10 = t(10);
  const sorot = interpolate(f, [20, 40, t9 - 10, t9], [0, 1, 1, 0], cl);
  const k = interpolate(f, [t9 + 20, t9 + 70], [0, 1], cl);
  return (
    <>
      <Kertas />
      <Kamera d={d} dari={1.0} ke={1.06}>
        <Tengah top={260} scale={0.92}><Penampang buka={1} kontraksi={k} sorot={sorot} /></Tengah>
      </Kamera>
      <Label at={25} x={150} y={830} warna={C.biru}>← folikel rambut</Label>
      <Label at={t9} x={520} y={700} warna={C.merah}>otot arrector pili ↑</Label>
      <Label at={t9 + 40} x={90} y={250} warna={C.pensil}>permukaan kulit</Label>
      <Muncul at={t10} style={{ top: 1060, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 96, color: C.amber, textShadow: `3px 3px 0 ${C.biru}` }}>= BULU KUDUK BERDIRI</div>
      </Muncul>
      <Adriy pose="tunjuk" sisi="kanan" tinggi={640} at={4} />
    </>
  );
};

// 7. HEWAN BERBULU
const S7: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t12 = t(12);
  const kembang = interpolate(f, [30, 90], [0, 1], cl);
  const udara = interpolate(f, [100, 130], [0, 1], cl);
  const banding = interpolate(f, [t12, t12 + 12], [0, 1], cl);
  return (
    <>
      <Kertas malam={0.1} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <text key={i} x={(i * 97) % 1000} y={((i * 211 + f * 3) % 1200) + 200} fontSize={28} fill={C.biruMuda} opacity={0.5}>❄</text>
        ))}
      </svg>
      <div style={{ opacity: 1 - banding }}>
        <Tengah top={430}><Kucing kembang={kembang} udara={udara} w={620} h={540} /></Tengah>
        <Muncul at={100} style={{ top: 250, left: 60, right: 153, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 82, color: C.biru }}>BULU MENGEMBANG = LAPISAN UDARA</div>
        </Muncul>
      </div>
      <div style={{ opacity: banding }}>
        <div style={{ position: "absolute", left: 30, top: 480 }}><Kucing kembang={0} w={440} h={400} /></div>
        <div style={{ position: "absolute", left: 470, top: 440 }}><Kucing kembang={1} w={460} h={440} /></div>
        <Label at={t12 + 8} x={150} y={900} size={52}>santai</Label>
        <Label at={t12 + 20} x={600} y={900} size={52} warna={C.merah}>kaget!</Label>
        <Judul at={t12} top={260} size={90}>TUBUH TAMPAK LEBIH BESAR</Judul>
      </div>
      <Adriy pose="ide" sisi="kiri" tinggi={560} at={t12 + 10} />
    </>
  );
};

// 8. PERTANYAAN BARU
const S8: React.FC<P> = ({ d }) => {
  const f = useCurrentFrame();
  const q = usePop(d * 0.55, 9);
  return (
    <>
      <Kertas malam={0.35} />
      <Muncul at={0} style={{ left: 120, top: 330 }}>
        <Img src={staticFile("termometer.png")} style={{ height: 520 }} />
      </Muncul>
      <Label at={12} x={110} y={870} size={52} warna="#fff">27°C, normal</Label>
      <div style={{ position: "absolute", left: 420, top: 420, transform: "scale(0.55)", transformOrigin: "top left", background: "#fbf5e6", borderRadius: 40, border: `6px solid ${C.pensil}` }}>
        <KulitMakro berdiri={interpolate(f, [30, 70], [0, 1], cl)} benjol={interpolate(f, [30, 70], [0, 1], cl)} />
      </div>
      <Judul at={d * 0.45} top={230} size={84} warna="#ffd27a">KALAU BUKAN DINGIN... LALU APA?</Judul>
      <div style={{ position: "absolute", right: 260, top: 900, transform: `scale(${q})` }}><TandaTanya p={1} size={200} /></div>
      <Adriy pose="bingung" sisi="kanan" tinggi={700} at={4} />
    </>
  );
};

// 9. RESPONS EMOSIONAL
const S9: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t15 = t(15), t16 = t(16);
  const jalur = interpolate(f, [10, t15], [0, 1], cl);
  const dop = interpolate(f, [t16 + 30, t16 + 70], [0, 1], cl);
  return (
    <>
      <Kertas malam={0.15} hangat={dop * 0.5} />
      <div style={{ position: "absolute", left: 60, top: 700, transform: "scale(0.45)", transformOrigin: "top left" }}><Gelombang amp={0.9} w={600} h={300} /></div>
      <Tengah top={330} scale={0.95}><JalurSaraf jalur={jalur} dopamin={dop} /></Tengah>
      <Muncul at={6} style={{ top: 230, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 104, color: C.biru, filter: "url(#pensilHalus)" }}>EMOTIONAL CHILLS</div>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 70, color: C.amber, marginTop: -14 }}>atau FRISSON</div>
      </Muncul>
      <Label at={t15} x={140} y={1080} size={46} warna={C.pensil}>respons emosional yang terasa di tubuh</Label>
      <Label at={t16 + 40} x={600} y={860} size={56} warna={C.merah}>dopamin = rasa senang</Label>
      <Adriy pose="eureka" sisi="kiri" tinggi={480} at={t16 + 30} />
    </>
  );
};

// 10. AJAKAN TENGAH
const S10: React.FC<P> = ({ t }) => {
  const t18 = t(18);
  const komentar = ["lagu waktu wisuda 🥲", "lagu daerah dinyanyikan ramai-ramai", "musik film kesukaanku!"];
  return (
    <>
      <Kertas hangat={0.3} />
      <Muncul at={0} style={{ left: 70, right: 160, top: 260 }}>
        <div style={{ background: "#fbf5e6", border: `6px solid ${C.pensil}`, borderRadius: 34, padding: "34px 40px", boxShadow: "8px 10px 0 rgba(31,58,95,.25)" }}>
          <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 84, color: C.biru, lineHeight: 1 }}>LAGU APA YANG BIKIN KAMU MERINDING?</div>
          <div style={{ fontFamily: FONT_TANGAN, fontSize: 52, color: C.amber, marginTop: 14 }}>Tulis di komentar 👇</div>
        </div>
      </Muncul>
      {komentar.map((k, i) => (
        <Muncul key={i} at={t18 + 6 + i * 16} style={{ left: 90 + (i % 2) * 60, top: 720 + i * 130 }} geser={60}>
          <div style={{ background: "#fff", border: `4px solid ${C.biruMuda}`, borderRadius: 40, padding: "14px 30px", fontFamily: FONT_TANGAN, fontSize: 44, color: C.pensil }}>💬 {k}</div>
        </Muncul>
      ))}
      <Adriy pose="sajikan" sisi="kanan" tinggi={700} at={4} />
    </>
  );
};

// 11. BATAS PENELITIAN
const S11: React.FC<P> = ({ t }) => {
  const f = useCurrentFrame();
  const t20 = t(20), t21 = t(21);
  const beda = interpolate(f, [t20, t20 + 10], [0, 1], cl);
  return (
    <>
      <Kertas malam={0.1} />
      <Judul at={4} top={230} size={86}>RESPONS SETIAP ORANG BERBEDA</Judul>
      <div style={{ position: "absolute", left: 40, top: 480, transform: "scale(0.85)", transformOrigin: "top left" }}>
        <Pendengar merinding={beda} warna={C.amber} kulit={C.kulit} />
      </div>
      <div style={{ position: "absolute", left: 390, top: 480, transform: "scale(0.85)", transformOrigin: "top left" }}>
        <Pendengar merinding={0} warna={C.biruMuda} kulit={C.kulitGelap} />
      </div>
      <Label at={t20 + 10} x={90} y={960} size={46} warna={C.merah}>merinding</Label>
      <Label at={t20 + 20} x={450} y={960} size={46} warna={C.biru}>biasa saja</Label>
      {["kepribadian", "kenangan", "selera"].map((x, i) => (
        <Label key={x} at={t21 + i * 12} x={70 + i * 250} y={1080} size={48} warna={C.biru}>• {x}</Label>
      ))}
      {f > t21 && <Label at={t21 + 40} x={300} y={1160} size={40} warna={C.pensil}>(diduga berperan)</Label>}
      <Adriy pose="jelaskan" sisi="kanan" tinggi={640} at={6} />
    </>
  );
};

// 12. BAWA KEMBALI
const S12: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t24 = t(24);
  return (
    <>
      <Kertas hangat={interpolate(f, [0, d * 0.6], [0.3, 1], cl)} />
      <Kamera d={d} dari={1.05} ke={1.18}>
        <Tengah top={300}><KulitMakro berdiri={1} benjol={1} kilau={1} /></Tengah>
      </Kamera>
      <Judul at={t24} top={230} size={92} warna={C.merah}>momen ini penting.</Judul>
      <Adriy pose="tenang" sisi="kiri" tinggi={520} at={8} />
    </>
  );
};

// 13. CTA
const S13: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();
  const t26 = t(26);
  const gelap = interpolate(f, [d - 24, d], [0, 1], cl);
  return (
    <>
      <Kertas hangat={0.7} />
      <Muncul at={6} style={{ top: 360, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: 150, color: C.biru, filter: "url(#pensilHalus)", lineHeight: 0.95 }}>ADRIY PROJECT</div>
        <svg width={600} height={40}><path d="M20 20 Q300 0 580 22" stroke={C.amber} strokeWidth={10} fill="none" filter="url(#pensil)" strokeLinecap="round" /></svg>
      </Muncul>
      <Muncul at={t26} style={{ top: 640, left: 60, right: 153, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_TANGAN, fontSize: 64, color: C.amber }}>EXPLORE MORE, KNOW MORE.</div>
      </Muncul>
      <Adriy pose="jempol" sisi="kanan" tinggi={560} at={10} geserX={250} />
      <AbsoluteFill style={{ background: "#000", opacity: gelap }} />
    </>
  );
};

const ADEGAN_KOMP = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13];

// SFX: [adegan, kalimat acuan atau null, geser detik, file, volume]
const SFX: [number, number | null, number, string, number][] = [
  [0, null, 1.4, "tubuh_merinding_berkilau", 0.7],
  [1, null, 2.2, "transisi_whoosh", 0.5],
  [2, 4, 3.0, "tubuh_merinding_berkilau", 0.6],
  [3, 6, 0.0, "musik_piano_arpeggio_lembut", 0.35],
  [4, null, 0.15, "musik_piringan_tergores", 0.6],
  [4, null, 2.6, "ui_ide_lonceng", 0.6],
  [5, null, 0.3, "sains_sinar_x_pindai", 0.4],
  [6, null, 0.1, "transisi_whoosh", 0.5],
  [7, null, 3.0, "ui_tanya_pop", 0.7],
  [8, null, 0.2, "musik_gelombang_orkestra", 0.4],
  [9, 18, 0.2, "ui_gulir_layar", 0.5],
  [11, null, 0.3, "musik_piano_arpeggio_lembut", 0.3],
  [12, null, 0.3, "ui_ide_lonceng", 0.6],
];

export const Merinding: React.FC = () => {
  const f = useCurrentFrame();
  const m2 = mulaiAdegan(8);
  return (
    <AbsoluteFill style={{ background: C.kertas, overflow: "hidden" }}>
      <Fonts />
      <PencilDefs />
      {ADEGAN_KOMP.map((S, i) => {
        const from = mulaiAdegan(i), d = akhirAdegan(i) - from;
        const t = (n: number) => fk(n) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Masuk d={d}><S d={d} t={t} /></Masuk>
          </Sequence>
        );
      })}
      <Subtitle />
      <Audio src={staticFile("narasi.wav")} volume={1} />
      <Sequence from={0} durationInFrames={m2 + 30}>
        <Audio src={staticFile("musik1.ogg")} loop volume={(x) => interpolate(x, [0, 20, m2, m2 + 30], [0, 0.14, 0.14, 0], cl)} />
      </Sequence>
      <Sequence from={m2} durationInFrames={DURASI - m2}>
        <Audio src={staticFile("musik2.ogg")} loop volume={(x) => interpolate(x, [0, 30, DURASI - m2 - 40, DURASI - m2], [0, 0.15, 0.15, 0], cl)} />
      </Sequence>
      {SFX.map(([a, k, g, file, v], i) => {
        const at = (k ? fk(k) : mulaiAdegan(a)) + Math.round(g * FPS);
        return (
          <Sequence key={i} from={at} durationInFrames={FPS * 6}>
            <Audio src={staticFile(`${file}.wav`)} volume={v} />
          </Sequence>
        );
      })}
      {void f}
      {void KAL}
    </AbsoluteFill>
  );
};
