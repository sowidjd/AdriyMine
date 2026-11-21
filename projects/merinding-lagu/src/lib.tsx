import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import timeline from "./timeline.json";

export const FPS = 30;

// Palet colored-pencil: biru tua, amber hangat, kuning redup, warna kulit
export const C = {
  kertas: "#efe6d2",
  kertasGelap: "#1c2a44",
  biru: "#1f3a5f",
  biruMuda: "#5b7fa8",
  pensil: "#2b2b3a",
  amber: "#e09a3e",
  kuning: "#d9b44a",
  kulit: "#e8b894",
  kulitGelap: "#c98d6a",
  merah: "#c0504d",
  hijau: "#6f9a6a",
};

export const FONT_JUDUL = "Caveat";
export const FONT_TANGAN = "PatrickHand";

export const Fonts: React.FC = () => (
  <style>{`
    @font-face { font-family: 'Caveat'; src: url('${staticFile("caveat-700.woff2")}') format('woff2'); font-weight: 700; }
    @font-face { font-family: 'PatrickHand'; src: url('${staticFile("patrick-hand.woff2")}') format('woff2'); }
  `}</style>
);

type Kal = { no: number; teks: string; mulai: number; durasi: number };
export const KAL: Kal[] = (timeline as { kalimat: Kal[] }).kalimat;
export const TOTAL_DETIK: number = (timeline as { total: number }).total;
// frame mulai kalimat ke-n (1-based)
export const fk = (n: number) => Math.round(KAL[n - 1].mulai * FPS);

// Filter pensil: garis bergetar ("line boil") + butir kertas + arsiran
export const PencilDefs: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 4) % 6;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id="pensil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={3} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.8 1.4" result="ga" />
          <feComposite in="d" in2="ga" operator="in" />
        </filter>
        <filter id="pensilHalus" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {[
          ["arsir", C.pensil, 0.35],
          ["arsirBiru", C.biru, 0.45],
          ["arsirAmber", C.amber, 0.55],
          ["arsirMerah", C.merah, 0.55],
          ["arsirKulit", C.kulitGelap, 0.5],
        ].map(([id, col, op]) => (
          <pattern key={id as string} id={id as string} width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <line x1={0} y1={0} x2={0} y2={9} stroke={col as string} strokeWidth={2} opacity={op as number} />
          </pattern>
        ))}
      </defs>
    </svg>
  );
};

// Kertas: dasar krem/biru + butir + vignet; nada = 0 (siang/krem) .. 1 (malam/biru tua); hangat 0..1
export const Kertas: React.FC<{ malam?: number; hangat?: number }> = ({ malam = 0, hangat = 0 }) => {
  return (
    <AbsoluteFill style={{ background: C.kertas }}>
      <AbsoluteFill style={{ background: C.kertasGelap, opacity: malam }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 38%, rgba(255,190,90,.55), rgba(224,154,62,.0) 70%)",
          opacity: hangat,
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.35 }}>
        <filter id="butir">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={3} seed={7} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1080} height={1920} filter="url(#butir)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 55%, rgba(40,25,10,.35) 100%)" }} />
    </AbsoluteFill>
  );
};

// Kamera: dorong pelan masuk / tarik keluar
export const Kamera: React.FC<{ d: number; dari?: number; ke?: number; x?: number; y?: number; children: React.ReactNode }> = ({
  d, dari = 1, ke = 1.06, x = 0, y = 0, children,
}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, d], [dari, ke], { extrapolateRight: "clamp" });
  const tx = interpolate(f, [0, d], [0, x], { extrapolateRight: "clamp" });
  const ty = interpolate(f, [0, d], [0, y], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `translate(${tx}px,${ty}px) scale(${s})` }}>{children}</AbsoluteFill>;
};

export const Masuk: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, d - 6, d], [0, 1, 1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// Muncul dengan pegas mulai frame `at`
export const usePop = (at: number, damping = 12) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping, stiffness: 120 } });
};

export const Muncul: React.FC<{ at: number; style?: React.CSSProperties; children: React.ReactNode; geser?: number }> = ({
  at, style, children, geser = 40,
}) => {
  const p = usePop(at);
  return (
    <div style={{ position: "absolute", ...style, opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * geser}px) scale(${0.85 + 0.15 * p})` }}>
      {children}
    </div>
  );
};

// ADRIY: PNG asli dari repo aset (tidak digambar ulang), garis tepi kertas tipis
export const Adriy: React.FC<{
  pose: string; sisi: "kiri" | "kanan"; tinggi: number; at?: number; bawah?: number; geserX?: number;
}> = ({ pose, sisi, tinggi, at = 0, bawah = 0, geserX = 10 }) => {
  const f = useCurrentFrame();
  const p = usePop(at, 14);
  const bob = Math.sin((f - at) / 18) * 6;
  // "take": menyusut lalu memantul saat masuk
  const sq = interpolate(p, [0, 0.6, 1], [0.85, 1.04, 1]);
  return (
    <Img
      src={staticFile(`adriy-${pose}.png`)}
      style={{
        position: "absolute",
        bottom: bawah,
        height: tinggi,
        [sisi === "kiri" ? "left" : "right"]: geserX,
        transformOrigin: "bottom center",
        transform: `translateY(${(1 - p) * 220 + bob}px) scale(${sq})`,
        opacity: Math.min(1, p * 2),
        filter: "drop-shadow(0 14px 22px rgba(40,25,10,.35)) drop-shadow(0 0 2px rgba(43,43,58,.6))",
      }}
    />
  );
};

export const Judul: React.FC<{ at: number; top: number; children: React.ReactNode; warna?: string; size?: number }> = ({
  at, top, children, warna = C.biru, size = 104,
}) => (
  <Muncul at={at} style={{ top, left: 60, right: 153, textAlign: "center" }}>
    <div style={{ fontFamily: FONT_JUDUL, fontWeight: 700, fontSize: size, color: warna, lineHeight: 1.0, filter: "url(#pensilHalus)" }}>
      {children}
    </div>
  </Muncul>
);

export const Label: React.FC<{ at: number; x: number; y: number; children: React.ReactNode; warna?: string; size?: number }> = ({
  at, x, y, children, warna = C.pensil, size = 44,
}) => (
  <Muncul at={at} style={{ left: x, top: y }} geser={15}>
    <div style={{ fontFamily: FONT_TANGAN, fontSize: size, color: warna, whiteSpace: "nowrap" }}>{children}</div>
  </Muncul>
);

// Subtitle: kata per kata, kata yang sedang diucapkan diberi warna amber (kinetic emphasis), maks 2 baris
export const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = KAL.find((x) => t >= x.mulai - 0.05 && t < x.mulai + x.durasi + 0.3);
  if (!k) return null;
  const kata = k.teks.split(" ");
  // potongan maks 7 kata
  const pot: string[][] = [];
  for (let i = 0; i < kata.length; i += 7) pot.push(kata.slice(i, i + 7));
  if (pot.length > 1 && pot[pot.length - 1].length < 3) {
    const a = pot.pop()!;
    pot[pot.length - 1].push(...a);
  }
  const berat = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").length + 2;
  const tot = kata.reduce((s, w) => s + berat(w), 0);
  const prog = Math.max(0, Math.min(0.999, (t - k.mulai) / k.durasi));
  let acc = 0, idx = 0;
  for (let i = 0; i < kata.length; i++) {
    acc += berat(kata[i]) / tot;
    if (prog < acc) { idx = i; break; }
    idx = i;
  }
  let mulaiPot = 0, pIdx = 0;
  for (let i = 0; i < pot.length; i++) {
    if (idx < mulaiPot + pot[i].length) { pIdx = i; break; }
    mulaiPot += pot[i].length;
  }
  const kini = pot[pIdx];
  return (
    <div style={{ position: "absolute", left: 60, right: 153, top: 1250, display: "flex", justifyContent: "center", zIndex: 20 }}>
      <div
        style={{
          background: "rgba(28,42,68,.88)",
          borderRadius: 26,
          padding: "18px 30px",
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.3,
          color: "#fff",
          textAlign: "center",
          boxShadow: "0 6px 18px rgba(0,0,0,.25)",
        }}
      >
        {kini.map((w, i) => {
          const g = mulaiPot + i;
          const aktif = g === idx;
          return (
            <span key={i} style={{ color: aktif ? "#ffc562" : g < idx ? "#fff" : "rgba(255,255,255,.75)", display: "inline-block", transform: aktif ? "scale(1.08)" : undefined, margin: "0 7px" }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// util acak tetap
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
