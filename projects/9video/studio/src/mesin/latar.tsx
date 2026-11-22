/** Latar bergerak, satu gaya per tema. */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type JenisLatar = "angkasa" | "laut" | "gurun" | "lab" | "peta" | "mimpi" | "toko" | "kafe" | "hujan";
type Opsi = Record<string, number | string | boolean> | undefined;

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Angkasa: React.FC<{ f: number; o: Opsi }> = ({ f, o }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 30% 20%, #2a1b5c 0%, #0b0b2b 45%, #02020a 100%)" }}>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 80% 70%, rgba(56,189,248,.18), transparent 45%)" }} />
    {Array.from({ length: 140 }).map((_, i) => {
      const s = rnd(i) * 3 + 1;
      return (
        <div key={i} style={{ position: "absolute", left: rnd(i + 3) * 1080, top: (rnd(i + 7) * 1920 + f * 0.15 * s) % 1920, width: s, height: s, borderRadius: "50%", background: "#fff", opacity: 0.3 + 0.7 * Math.abs(Math.sin(f / 25 + i)), boxShadow: s > 3 ? "0 0 8px #bfdbfe" : undefined }} />
      );
    })}
    {o?.bumi && (
      <div style={{ position: "absolute", bottom: -1500, left: -400, width: 1900, height: 1900, borderRadius: "50%", background: "radial-gradient(circle at 50% 10%, #3b82f6, #1e3a8a 40%, #020617 70%)", boxShadow: "0 -20px 80px rgba(96,165,250,.6)" }} />
    )}
  </AbsoluteFill>
);

const Laut: React.FC<{ f: number; o: Opsi }> = ({ f, o }) => {
  const dalam = Number(o?.dalam ?? 0.5);
  const atas = `hsl(205, 80%, ${Math.round(40 - dalam * 34)}%)`;
  const bawah = `hsl(220, 85%, ${Math.round(14 - dalam * 12)}%)`;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${atas}, ${bawah})` }}>
      {dalam < 0.6 &&
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: -200, left: 80 + i * 170 + Math.sin(f / 40 + i) * 40, width: 120, height: 1500, background: "linear-gradient(180deg, rgba(186,230,253,.35), transparent)", transform: `rotate(${12 - i * 4}deg)`, opacity: (0.6 - dalam) * 1.5, filter: "blur(10px)" }} />
        ))}
      {Array.from({ length: 70 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: rnd(i) * 1080, top: (rnd(i + 2) * 1920 + f * (0.3 + rnd(i) * 0.6)) % 1920, width: 3, height: 3, borderRadius: "50%", background: "#e0f2fe", opacity: 0.25 }} />
      ))}
      {Array.from({ length: 18 }).map((_, i) => {
        const y = 1920 - ((f * (2 + rnd(i) * 3) + rnd(i + 9) * 1920) % 2100);
        const s = 8 + rnd(i + 4) * 22;
        return <div key={`g${i}`} style={{ position: "absolute", left: rnd(i + 5) * 1080 + Math.sin(f / 15 + i) * 12, top: y, width: s, height: s, borderRadius: "50%", border: "2px solid rgba(224,242,254,.55)", background: "rgba(224,242,254,.08)" }} />;
      })}
      {Number(o?.cahaya ?? 0) > 0 &&
        Array.from({ length: 26 }).map((_, i) => (
          <div key={`c${i}`} style={{ position: "absolute", left: rnd(i + 11) * 1080, top: 300 + rnd(i + 13) * 1300, width: 10, height: 10, borderRadius: "50%", background: i % 3 ? "#38bdf8" : "#a7f3d0", boxShadow: `0 0 ${14 + 10 * Math.sin(f / 9 + i)}px ${i % 3 ? "#38bdf8" : "#6ee7b7"}`, opacity: 0.3 + 0.7 * Math.abs(Math.sin(f / 13 + i)) }} />
        ))}
    </AbsoluteFill>
  );
};

const Gurun: React.FC<{ f: number; o: Opsi }> = ({ f, o }) =>
  o?.makam ? (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #7c4a1e 0%, #3b220e 45%, #120a04 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.18 }}>
        {Array.from({ length: 22 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => <rect key={`${r}-${c}`} x={(r % 2) * 90 + c * 180 - 90} y={r * 90} width={176} height={86} fill="none" stroke="#f5d0a0" strokeWidth={3} />),
        )}
      </svg>
      {[140, 940].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x - 160, top: 380, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,.45), transparent 70%)", opacity: 0.7 + 0.3 * Math.sin(f / 4 + i * 2) }} />
      ))}
    </AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2a0f06 0%, #7c2d12 30%, #c2410c 55%, #f59e0b 78%)" }}>
      <div style={{ position: "absolute", top: 980, left: 640, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, #fff7d6, #fcd34d 60%, transparent 72%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <path d="M0 1250 Q 270 1120 540 1240 T 1080 1210 V1920 H0 Z" fill="#d9822b" />
        <path d="M0 1400 Q 300 1300 620 1420 T 1080 1380 V1920 H0 Z" fill="#b8641c" />
        <path d="M-50 1600 Q 350 1500 700 1620 T 1150 1590 V1920 H-50 Z" fill="#8f4a12" />
        <polygon points="760,1250 900,1050 1040,1250" fill="#c2692a" opacity={0.85} />
      </svg>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: (rnd(i) * 1300 - f * (1 + rnd(i) * 2)) % 1100 + (f > 0 ? 0 : 0), top: 900 + rnd(i + 3) * 900, width: 4, height: 2, background: "#fff3d6", opacity: 0.5 }} />
      ))}
    </AbsoluteFill>
  );

const Lab: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(160deg, #0c2a4a 0%, #071a30 60%, #04101f 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.35 }}>
      {Array.from({ length: 30 }).map((_, i) => <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={1920} stroke="#38bdf8" strokeWidth={i % 5 ? 0.6 : 1.6} />)}
      {Array.from({ length: 50 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 40} x2={1080} y2={i * 40} stroke="#38bdf8" strokeWidth={i % 5 ? 0.6 : 1.6} />)}
    </svg>
    {Array.from({ length: 10 }).map((_, i) => (
      <svg key={i} width={120} height={120} viewBox="-60 -60 120 120" style={{ position: "absolute", left: rnd(i) * 960, top: rnd(i + 4) * 1800, opacity: 0.18, transform: `rotate(${f / 3 + i * 30}deg)` }}>
        <polygon points="50,0 25,43 -25,43 -50,0 -25,-43 25,-43" fill="none" stroke="#7dd3fc" strokeWidth={3} />
      </svg>
    ))}
  </AbsoluteFill>
);

const Peta: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #f8ecd0 0%, #ecd9b0 70%, #d9bf8c 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.35 }}>
      {Array.from({ length: 12 }).map((_, i) => <path key={`m${i}`} d={`M ${i * 100 - 60} 0 Q ${i * 100 + 40} 960 ${i * 100 - 60} 1920`} fill="none" stroke="#a16207" strokeWidth={1.5} />)}
      {Array.from({ length: 18 }).map((_, i) => <line key={`p${i}`} x1={0} y1={i * 110} x2={1080} y2={i * 110} stroke="#a16207" strokeWidth={1.5} />)}
    </svg>
    <div style={{ position: "absolute", left: 760, top: 1450, width: 260, height: 260, borderRadius: "50%", border: "14px solid rgba(120,53,15,.12)" }} />
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <path d="M 60 1700 C 300 1450, 700 1650, 1020 1400" fill="none" stroke="#b45309" strokeWidth={5} strokeDasharray="18 14" strokeDashoffset={-f * 2} opacity={0.5} />
    </svg>
  </AbsoluteFill>
);

const Mimpi: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #1e1048 0%, #4c1d95 45%, #be5a9a 100%)" }}>
    <div style={{ position: "absolute", top: 1380, left: 90, width: 190, height: 190, borderRadius: "50%", boxShadow: "-40px 20px 0 0 #fde68a", transform: "rotate(-20deg)", opacity: 0.8 }} />
    {Array.from({ length: 60 }).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: rnd(i) * 1080, top: rnd(i + 1) * 1300, width: 4, height: 4, borderRadius: "50%", background: "#fff", opacity: 0.3 + 0.7 * Math.abs(Math.sin(f / 20 + i)) }} />
    ))}
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={`a${i}`} style={{ position: "absolute", left: ((rnd(i) * 1400 + f * (0.5 + i * 0.2)) % 1500) - 300, top: 500 + i * 260, width: 420, height: 130, borderRadius: 80, background: "rgba(255,255,255,.12)", filter: "blur(6px)" }} />
    ))}
  </AbsoluteFill>
);

const Toko: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #fff7e6 0%, #ffe8c2 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.12 }}>
      {Array.from({ length: 24 }).map((_, i) => <line key={i} x1={i * 90 - 600 + ((f * 0.5) % 90)} y1={0} x2={i * 90 + 600 + ((f * 0.5) % 90)} y2={1920} stroke="#dc2626" strokeWidth={26} />)}
    </svg>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170, background: "repeating-linear-gradient(90deg, #dc2626 0 90px, #fff 90px 180px)", opacity: 0.9 }} />
    <div style={{ position: "absolute", top: 170, left: 0, right: 0, height: 40, background: "radial-gradient(circle at 45px 0, #dc2626 44px, transparent 46px) 0 0 / 180px 40px, radial-gradient(circle at 135px 0, #fff 44px, transparent 46px) 0 0 / 180px 40px" }} />
  </AbsoluteFill>
);

const Kafe: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #6b3f22 0%, #3d2314 55%, #1c0f08 100%)" }}>
    {Array.from({ length: 22 }).map((_, i) => {
      const s = 60 + rnd(i) * 140;
      return <div key={i} style={{ position: "absolute", left: rnd(i + 2) * 1080 - s / 2, top: rnd(i + 5) * 1900 - s / 2 + Math.sin(f / 50 + i) * 15, width: s, height: s, borderRadius: "50%", background: i % 3 ? "rgba(251,191,36,.16)" : "rgba(254,215,170,.12)", filter: "blur(4px)" }} />;
    })}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 520, background: "linear-gradient(180deg, transparent, rgba(28,15,8,.85))" }} />
  </AbsoluteFill>
);

const Hujan: React.FC<{ f: number; o: Opsi }> = ({ f, o }) => {
  const kilat = o?.petir ? Math.max(0, Math.sin(f / 3) > 0.97 ? 1 : 0) : 0;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1f2d2a 0%, #2f4a3f 45%, #142019 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", bottom: 0 }}>
        <path d="M0 1500 Q 200 1380 400 1470 T 800 1440 T 1080 1460 V1920 H0 Z" fill="#0f1f17" />
        {Array.from({ length: 9 }).map((_, i) => <ellipse key={i} cx={60 + i * 125} cy={1500 - (i % 3) * 40} rx={90} ry={140} fill="#13291e" />)}
      </svg>
      {Array.from({ length: 120 }).map((_, i) => {
        const x = rnd(i) * 1200 - 60;
        const y = (rnd(i + 3) * 2000 + f * (28 + rnd(i) * 14)) % 2000 - 80;
        return <div key={i} style={{ position: "absolute", left: x - y * 0.12, top: y, width: 2, height: 50 + rnd(i + 1) * 30, background: "rgba(220,240,255,.45)", transform: "rotate(7deg)" }} />;
      })}
      <AbsoluteFill style={{ background: "#e8f4ff", opacity: kilat * 0.35 }} />
    </AbsoluteFill>
  );
};

export const Latar: React.FC<{ jenis: JenisLatar; opsi?: Opsi }> = ({ jenis, opsi }) => {
  const f0 = useCurrentFrame();
  const f = opsi?.diam ? 40 : f0;
  switch (jenis) {
    case "angkasa": return <Angkasa f={f} o={opsi} />;
    case "laut": return <Laut f={f} o={opsi} />;
    case "gurun": return <Gurun f={f} o={opsi} />;
    case "lab": return <Lab f={f} />;
    case "peta": return <Peta f={f} />;
    case "mimpi": return <Mimpi f={f} />;
    case "toko": return <Toko f={f} />;
    case "kafe": return <Kafe f={f} />;
    case "hujan": return <Hujan f={f} o={opsi} />;
  }
};
