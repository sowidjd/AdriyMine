/**
 * ADRIY PROJECT — RAHASIA DI BALIK SEBUAH MAGNET (kode dari pemilik)
 *
 * Penyesuaian:
 * - Typo kurung tutup di SceneTitle dibetulkan.
 * - Waktu adegan & subtitle mengikuti narasi suara Mia (timeline.json), bukan detik tetap.
 * - Frame tiap adegan dihitung dari awal adegan (lokal), jadi animasi selalu mulai dari awal.
 * - Magnet di adegan 8 & 9 diberi posisi (sebelumnya menempel di pojok kiri atas).
 * - Gambar ADRIY (pose seluruh badan) diukur dari tinggi supaya tidak menutupi layar.
 * - 🔩 diganti baut gambar sendiri (emoji tidak ada di mesin render).
 * - Narasi + musik CC0 ditambahkan.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  staticFile,
  useVideoConfig,
} from "remotion";
import timeline from "./timeline.json";

const FPS = 30;
type Kal = { no: number; teks: string; mulai: number; durasi: number };
const KAL: Kal[] = (timeline as { kalimat: Kal[] }).kalimat;
const SUB: Kal[] = (timeline as unknown as { sub: Kal[] }).sub;
const TOTAL_DETIK: number = (timeline as { total: number }).total;
export const DURASI = Math.ceil((TOTAL_DETIK + 2) * FPS);

// frame mulai kalimat ke-n (1-based)
const fk = (n: number) => Math.round(KAL[n - 1].mulai * FPS);

const captionAt = (frame: number) => {
  const t = frame / FPS;
  const k = SUB.find((x) => t >= x.mulai - 0.05 && t < x.mulai + x.durasi + 0.3);
  return k ? k.teks : "";
};

const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const Background = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #19385c 0%, #071525 48%, #02050b 100%)",
      }}
    >
      {Array.from({ length: 50 }).map((_, i) => {
        const x = (i * 137.5) % 1080;
        const y = (i * 257.3) % 1920;
        const move = Math.sin(frame / 35 + i) * 30;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + move,
              width: i % 4 === 0 ? 5 : 2,
              height: i % 4 === 0 ? 5 : 2,
              borderRadius: "50%",
              background: "#9bd0ff",
              opacity: 0.15 + Math.abs(Math.sin(frame / 20 + i)) * 0.3,
              boxShadow: "0 0 12px #60a5fa",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Magnet3D = ({ frame, exploded = false }: { frame: number; exploded?: boolean }) => {
  const rotate = interpolate(frame, [0, 120], [-15, 20], cl);
  const float = Math.sin(frame / 15) * 20;

  const separation = exploded ? interpolate(frame, [0, 100], [0, 260], cl) : 0;

  return (
    <div
      style={{
        width: 620,
        height: 230,
        position: "relative",
        transformStyle: "preserve-3d",
        transform: `perspective(1200px) rotateY(${rotate}deg) rotateX(-12deg) translateY(${float}px)`,
      }}
    >
      {/* Bagian merah */}
      <div
        style={{
          position: "absolute",
          left: -separation,
          width: 310,
          height: 200,
          borderRadius: "35px 8px 8px 35px",
          background: "linear-gradient(145deg,#ffaaaa 0%,#ef4444 20%,#b91c1c 75%,#701010 100%)",
          boxShadow: "inset 0 8px 20px rgba(255,255,255,.3), 0 30px 60px rgba(0,0,0,.5)",
          transform: "translateZ(35px)",
          border: "2px solid rgba(255,255,255,.15)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "translateZ(30px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 90,
            color: "#fff",
            fontWeight: 900,
            textShadow: "0 5px 20px #600",
          }}
        >
          N
        </div>
      </div>

      {/* Bagian biru */}
      <div
        style={{
          position: "absolute",
          right: separation,
          width: 310,
          height: 200,
          borderRadius: "8px 35px 35px 8px",
          background: "linear-gradient(145deg,#bfdbfe 0%,#60a5fa 20%,#2563eb 75%,#172f7b 100%)",
          boxShadow: "inset 0 8px 20px rgba(255,255,255,.3), 0 30px 60px rgba(0,0,0,.5)",
          transform: "translateZ(35px)",
          border: "2px solid rgba(255,255,255,.15)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "translateZ(30px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 90,
            color: "#fff",
            fontWeight: 900,
            textShadow: "0 5px 20px #003",
          }}
        >
          S
        </div>
      </div>

      {/* Sisi magnet */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          width: 620,
          height: 200,
          transform: "translateZ(-35px)",
          background: "linear-gradient(90deg,#7f1d1d,#1e3a8a)",
          borderRadius: 30,
        }}
      />
    </div>
  );
};

const FieldLines = ({ frame }: { frame: number }) => {
  const pulse = 0.5 + Math.sin(frame / 18) * 0.3;

  return (
    <svg
      viewBox="0 0 1000 1000"
      style={{ position: "absolute", width: 1000, height: 1000, left: 40, top: 450 }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d={`M ${250 + i * 20} 500
          C ${150 + i * 20} ${100 - i * 10},
            ${850 - i * 20} ${100 - i * 10},
            ${750 - i * 20} 500
          C ${850 - i * 20} ${900 + i * 10},
            ${150 + i * 20} ${900 + i * 10},
            ${250 + i * 20} 500`}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="3"
          strokeOpacity={0.15 + pulse * 0.2}
          strokeDasharray="10 12"
          strokeDashoffset={-frame * 1.5}
        />
      ))}
    </svg>
  );
};

const ExplodedMagnet = ({ frame }: { frame: number }) => {
  const distance = interpolate(frame, [0, 100], [0, 165], cl);

  const parts = [
    { color: "#ef4444", label: "N", x: -distance },
    { color: "#f59e0b", label: "", x: -distance * 0.4 },
    { color: "#cbd5e1", label: "", x: 0 },
    { color: "#64748b", label: "", x: distance * 0.4 },
    { color: "#2563eb", label: "S", x: distance },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: 800,
        height: 400,
        transform: "perspective(1000px) rotateX(-18deg)",
      }}
    >
      {parts.map((part, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 100 + i * 120,
            top: 80,
            width: 120,
            height: 220,
            borderRadius: 18,
            background: `linear-gradient(145deg,${part.color},#111827)`,
            border: "2px solid rgba(255,255,255,.15)",
            boxShadow: "0 30px 60px rgba(0,0,0,.5)",
            transform: `translateX(${part.x}px) translateZ(${i * 15}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 55,
            fontWeight: 900,
          }}
        >
          {part.label}
        </div>
      ))}
    </div>
  );
};

const Atom = ({ frame, index }: { frame: number; index: number }) => {
  const angle = frame / 20 + index;
  const orbit = 50 + (index % 3) * 30;
  // sebar atom di area tengah (y 560–1150)
  const cx = 200 + ((index * 173) % 680);
  const cy = 560 + ((index * 97) % 400);

  return (
    <div
      style={{
        position: "absolute",
        left: cx + Math.cos(angle) * orbit,
        top: cy + Math.sin(angle) * orbit,
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 25%,#fff,#60a5fa 30%,#1d4ed8 70%,#071a40)",
        boxShadow: "0 0 30px rgba(96,165,250,.6)",
      }}
    />
  );
};

const Domains = ({ frame, sejajar = 1 }: { frame: number; sejajar?: number }) => {
  const alignment = interpolate(frame, [0, 240], [0, sejajar], cl);

  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 460,
        width: 880,
        height: 600,
        display: "grid",
        gridTemplateColumns: "repeat(6,1fr)",
        gap: 12,
        padding: 30,
        borderRadius: 40,
        background: "rgba(8,24,50,.7)",
        border: "2px solid rgba(96,165,250,.3)",
        boxSizing: "border-box",
      }}
    >
      {Array.from({ length: 36 }).map((_, i) => {
        const initial = (i * 83) % 360;
        const rotation = interpolate(alignment, [0, 1], [initial, 0]);

        return (
          <div key={i} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div
              style={{
                width: 70,
                height: 20,
                borderRadius: 20,
                background: "linear-gradient(90deg,#ef4444 50%,#3b82f6 50%)",
                transform: `rotate(${rotation}deg)`,
                boxShadow: "0 0 15px rgba(96,165,250,.3)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const Baut = () => (
  <svg width={120} height={200} viewBox="0 0 120 200">
    <defs>
      <linearGradient id="besi" x1="0" x2="1">
        <stop offset="0" stopColor="#475569" />
        <stop offset="0.45" stopColor="#e2e8f0" />
        <stop offset="1" stopColor="#334155" />
      </linearGradient>
    </defs>
    <rect x={10} y={0} width={100} height={45} rx={8} fill="url(#besi)" stroke="#1e293b" strokeWidth={3} />
    <rect x={38} y={45} width={44} height={150} rx={6} fill="url(#besi)" stroke="#1e293b" strokeWidth={3} />
    {Array.from({ length: 9 }).map((_, i) => (
      <line key={i} x1={36} y1={60 + i * 15} x2={84} y2={68 + i * 15} stroke="#1e293b" strokeWidth={3} />
    ))}
  </svg>
);

const Character = ({ emotion = "curious", kiri = false }: { emotion?: string; kiri?: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const masuk = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const float = Math.sin(frame / 12) * 10;

  return (
    <Img
      src={staticFile(`adriy-${emotion}.png`)}
      style={{
        position: "absolute",
        bottom: 0,
        [kiri ? "left" : "right"]: -20,
        height: 620,
        width: "auto",
        transform: `translateY(${interpolate(masuk, [0, 1], [200, 0]) + float}px)`,
        filter: "drop-shadow(0 30px 50px rgba(0,0,0,.5))",
      }}
    />
  );
};

const SceneTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 260,
        width: "100%",
        textAlign: "center",
        padding: "0 50px",
        boxSizing: "border-box",
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
      }}
    >
      <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textShadow: "0 5px 30px #000" }}>{title}</div>

      {subtitle && <div style={{ marginTop: 20, fontSize: 42, color: "#93c5fd" }}>{subtitle}</div>}
    </div>
  );
};

const Subtitle = ({ text }: { text: string }) =>
  text ? (
    <div
      style={{
        position: "absolute",
        top: 1085,
        left: 65,
        right: 65,
        padding: "25px 30px",
        borderRadius: 24,
        background: "rgba(0,0,0,.72)",
        border: "1px solid rgba(255,255,255,.12)",
        color: "#fff",
        fontSize: 42,
        fontWeight: 800,
        lineHeight: 1.4,
        textAlign: "center",
        textShadow: "0 3px 10px #000",
        zIndex: 50,
      }}
    >
      {text}
    </div>
  ) : null;

const Scene = ({ children }: { children: React.ReactNode }) => (
  <AbsoluteFill>
    <Background />
    {children}
  </AbsoluteFill>
);

const Tengah = ({ top, children }: { top: number; children: React.ReactNode }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    {children}
  </div>
);

// ─── Komponen tambahan untuk versi panjang ───────────────────

// Satu atom: inti + orbit + elektron dengan panah spin
const AtomDiagram = ({ f, x, y, skala = 1 }: { f: number; x: number; y: number; skala?: number }) => {
  const a = f / 14;
  const ex = Math.cos(a) * 230;
  const ey = Math.sin(a) * 80;
  return (
    <svg width={600} height={360} viewBox="-300 -180 600 360" style={{ position: "absolute", left: x - 300, top: y - 180, transform: `scale(${skala})` }}>
      <ellipse cx={0} cy={0} rx={230} ry={80} fill="none" stroke="#60a5fa" strokeWidth={3} strokeDasharray="10 10" opacity={0.6} />
      <circle cx={0} cy={0} r={46} fill="url(#inti)" />
      <defs>
        <radialGradient id="inti" cx="35%" cy="30%">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </radialGradient>
      </defs>
      <g transform={`translate(${ex},${ey})`}>
        <circle r={22} fill="#93c5fd" stroke="#1d4ed8" strokeWidth={4} />
        <g transform={`rotate(${f * 8})`}>
          <ellipse rx={34} ry={10} fill="none" stroke="#fbbf24" strokeWidth={3} opacity={0.8} />
        </g>
        <line x1={0} y1={14} x2={0} y2={-58} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        <polygon points="-12,-50 12,-50 0,-74" fill="#fff" />
      </g>
    </svg>
  );
};

const Kartu = ({ at, f, top, left, children, warna = "#60a5fa", size = 44 }: {
  at: number; f: number; top: number; left: number; children: React.ReactNode; warna?: string; size?: number;
}) => {
  const p = interpolate(f, [at, at + 14], [0, 1], cl);
  return (
    <div
      style={{
        position: "absolute", top, left, padding: "12px 28px", borderRadius: 18,
        background: "rgba(10,30,60,.85)", border: `3px solid ${warna}`, color: "#fff",
        fontSize: size, fontWeight: 900, letterSpacing: 2, opacity: p,
        transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

// Panah magnet kecil (merah = utara, biru = selatan)
const Panah = ({ sudut, w = 120 }: { sudut: number; w?: number }) => (
  <div style={{ width: w, height: w * 0.28, borderRadius: 20, background: "linear-gradient(90deg,#3b82f6 50%,#ef4444 50%)", transform: `rotate(${sudut}deg)`, boxShadow: "0 0 18px rgba(96,165,250,.45)" }} />
);

// Pasangan elektron: atas & bawah → saling meniadakan
const PasanganElektron = ({ f }: { f: number }) => (
  <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30 }}>
    {[0, 1, 2].map((i) => {
      const p = interpolate(f, [10 + i * 12, 26 + i * 12], [0, 1], cl);
      return (
        <div key={i} style={{ display: "flex", gap: 18, opacity: p, padding: 22, borderRadius: 26, border: "3px dashed rgba(147,197,253,.5)" }}>
          {[0, 180].map((r) => (
            <div key={r} style={{ width: 100, height: 100, borderRadius: "50%", background: "#1e3a8a", border: "4px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 76, color: "#fff", fontWeight: 900, transform: `rotate(${r}deg)` }}>↑</div>
          ))}
        </div>
      );
    })}
  </div>
);

const Unsur = ({ f, at }: { f: number; at: number }) => (
  <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26 }}>
    {[["Fe", "Besi"], ["Ni", "Nikel"], ["Co", "Kobalt"], ["Nd", "Neodymium"]].map(([u, n], i) => {
      const p = interpolate(f, [at + i * 10, at + 14 + i * 10], [0, 1], cl);
      return (
        <div key={u} style={{ width: 200, height: 250, borderRadius: 24, background: "linear-gradient(160deg,#1e3a8a,#0b1730)", border: "3px solid #60a5fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: p, transform: `scale(${0.8 + 0.2 * p})` }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: "#fff" }}>{u}</div>
          <div style={{ fontSize: 30, color: "#93c5fd", marginTop: 6 }}>{n}</div>
          <div style={{ marginTop: 14, fontSize: 44, color: "#fbbf24" }}>↑</div>
        </div>
      );
    })}
  </div>
);

// Grid domain dengan tingkat kesejajaran a (0 = acak, 1 = sejajar)
const GridDomain = ({ a, top = 470, cols = 6, rows = 6, w = 880, h = 600 }: { a: number; top?: number; cols?: number; rows?: number; w?: number; h?: number }) => (
  <div
    style={{
      position: "absolute", left: (1080 - w) / 2, top, width: w, height: h, boxSizing: "border-box",
      display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, padding: 30, borderRadius: 40,
      background: "rgba(8,24,50,.7)", border: "2px solid rgba(96,165,250,.3)",
    }}
  >
    {Array.from({ length: cols * rows }).map((_, i) => {
      const awal = (i * 83) % 360;
      return (
        <div key={i} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Panah sudut={interpolate(a, [0, 1], [awal, 0])} w={74} />
        </div>
      );
    })}
  </div>
);

// Pertukaran: barisan atom bertetangga yang saling menyejajarkan
const BarisPertukaran = ({ f }: { f: number }) => (
  <div style={{ position: "absolute", top: 600, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30 }}>
    {Array.from({ length: 6 }).map((_, i) => {
      const a = interpolate(f, [20 + i * 14, 50 + i * 14], [0, 1], cl);
      const awal = [70, -120, 160, -40, 110, -150][i];
      return (
        <div key={i} style={{ width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle at 30% 25%,#1e40af,#0b1730)", border: "3px solid #60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Panah sudut={interpolate(a, [0, 1], [awal, 0])} w={100} />
        </div>
      );
    })}
  </div>
);

const Paku = ({ a, magnet = false }: { a: number; magnet?: boolean }) => (
  <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ position: "relative", width: 860, height: 260 }}>
      <div style={{ position: "absolute", left: 0, top: 20, width: 60, height: 220, borderRadius: 12, background: "linear-gradient(90deg,#64748b,#e2e8f0,#475569)" }} />
      <div style={{ position: "absolute", left: 60, top: 70, width: 740, height: 120, background: "linear-gradient(180deg,#94a3b8,#e2e8f0 40%,#475569)", clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)", display: "flex", alignItems: "center", justifyContent: "space-around", paddingRight: 70, boxSizing: "border-box" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Panah key={i} sudut={interpolate(a, [0, 1], [(i * 97) % 360, 0])} w={64} />
        ))}
      </div>
      {magnet && <div style={{ position: "absolute", right: -10, top: -70, fontSize: 40, color: "#93c5fd", fontWeight: 900 }}>MEDAN LUAR →</div>}
    </div>
  </div>
);

const Gembok = ({ p }: { p: number }) => (
  <svg width={160} height={190} viewBox="0 0 160 190" style={{ opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>
    <path d="M40 85 V55 a40 40 0 0 1 80 0 V85" fill="none" stroke="#fbbf24" strokeWidth={16} />
    <rect x={15} y={80} width={130} height={100} rx={18} fill="#f59e0b" stroke="#92400e" strokeWidth={5} />
    <circle cx={80} cy={125} r={14} fill="#78350f" />
    <rect x={74} y={130} width={12} height={30} rx={4} fill="#78350f" />
  </svg>
);

const Kulkas = ({ f }: { f: number }) => (
  <div style={{ position: "absolute", top: 480, left: 330, width: 420, height: 600, borderRadius: 30, background: "linear-gradient(160deg,#f1f5f9,#cbd5e1)", border: "6px solid #94a3b8" }}>
    <div style={{ position: "absolute", top: 190, left: 0, right: 0, height: 6, background: "#94a3b8" }} />
    <div style={{ position: "absolute", top: 40, right: 26, width: 14, height: 110, borderRadius: 8, background: "#64748b" }} />
    <div style={{ position: "absolute", top: 260, left: 70, transform: `rotate(${Math.sin(f / 20) * 3}deg)` }}>
      <div style={{ width: 150, height: 110, borderRadius: 16, background: "linear-gradient(135deg,#f472b6,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>♥</div>
    </div>
    <div style={{ position: "absolute", top: 400, left: 210, width: 130, height: 90, borderRadius: 14, background: "linear-gradient(135deg,#60a5fa,#1d4ed8)" }} />
  </div>
);

const Termometer = ({ p }: { p: number }) => (
  <div style={{ position: "absolute", top: 470, left: 90, width: 120, height: 600 }}>
    <div style={{ position: "absolute", left: 35, top: 0, width: 50, height: 500, borderRadius: 25, background: "rgba(255,255,255,.15)", border: "4px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${10 + p * 90}%`, background: "linear-gradient(0deg,#dc2626,#f97316)" }} />
    </div>
    <div style={{ position: "absolute", left: 10, top: 470, width: 100, height: 100, borderRadius: "50%", background: "#dc2626", border: "4px solid #e2e8f0" }} />
    <div style={{ position: "absolute", left: 140, top: 500 - p * 450, fontSize: 48, fontWeight: 900, color: "#fdba74", whiteSpace: "nowrap" }}>{Math.round(20 + p * 750)}°C</div>
  </div>
);

const BukanMagnet = ({ f }: { f: number }) => (
  <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80 }}>
    {[["PLASTIK", "#22c55e"], ["KAYU", "#b45309"]].map(([n, c], i) => {
      const p = interpolate(f, [10 + i * 14, 24 + i * 14], [0, 1], cl);
      return (
        <div key={n} style={{ position: "relative", opacity: p }}>
          <div style={{ width: 280, height: 220, borderRadius: 26, background: c, opacity: 0.85, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 900, color: "#fff" }}>{n}</div>
          <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%", background: "#ef4444", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, color: "#fff", fontWeight: 900 }}>✕</div>
        </div>
      );
    })}
  </div>
);

// ─── Daftar adegan: [kalimat awal, kalimat akhir, isi] ─────────
type Isi = (f: number, d: number, t: (n: number) => number) => React.ReactNode;

const ADEGAN: [number, number, Isi][] = [
  [1, 2, (f) => (
    <>
      <SceneTitle title="RAHASIA" subtitle="DI BALIK SEBUAH MAGNET" />
      <FieldLines frame={f} />
      <Tengah top={720}>
        <div style={{ transform: `scale(${interpolate(f, [0, 300], [1, 1.15], cl)})` }}>
          <Magnet3D frame={f} />
        </div>
      </Tengah>
      <Character emotion="setengah_kaget_tangan_terbuka" />
    </>
  )],
  [3, 4, (f, d, t) => (
    <>
      <SceneTitle title="BENDA BIASA?" subtitle="Dua kutub: N dan S" />
      <Tengah top={640}>
        <div style={{ transform: `scale(${interpolate(f, [t(4), d], [1, 2.4], cl)})`, opacity: interpolate(f, [d - 20, d], [1, 0.3], cl) }}>
          <Magnet3D frame={f} />
        </div>
      </Tengah>
      <Kartu f={f} at={t(4) + 10} top={960} left={250} warna="#fbbf24">SAMPAI KE ATOM</Kartu>
      <Character emotion="setengah_bingung_garuk" kiri />
    </>
  )],
  [5, 5, (f) => (
    <>
      <SceneTitle title="BAHAN MAGNET" subtitle="Magnet permanen" />
      <Tengah top={560}>
        <Magnet3D frame={f} />
      </Tengah>
      {["NEODYMIUM", "FERRITE", "ALNICO"].map((b, i) => (
        <Kartu key={b} f={f} at={20 + i * 22} top={830 + i * 80} left={90}>{b}</Kartu>
      ))}
      <Character emotion="setengah_senang_kepal" />
    </>
  )],
  [6, 7, (f, d, t) => (
    <>
      <SceneTitle title="KITA BONGKAR" subtitle="Lapis demi lapis" />
      <Tengah top={560}>
        <div style={{ opacity: interpolate(f, [t(7), t(7) + 20], [1, 0.15], cl) }}>
          <ExplodedMagnet frame={f} />
        </div>
      </Tengah>
      <div style={{ opacity: interpolate(f, [t(7), t(7) + 20], [0, 1], cl) }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <Atom frame={f} index={i} key={i} />
        ))}
      </div>
      <Character emotion="setengah_mikir_dagu_2" kiri />
    </>
  )],
  [8, 9, (f, d, t) => (
    <>
      <SceneTitle title="ELEKTRON" subtitle="Magnet yang sangat kecil" />
      <AtomDiagram f={f} x={540} y={720} skala={1.3} />
      <Kartu f={f} at={t(9)} top={930} left={90} warna="#fbbf24">SPIN</Kartu>
      <Kartu f={f} at={t(9) + 25} top={930} left={330}>GERAK ORBIT</Kartu>
      <Character emotion="setengah_semangat_kedip" />
    </>
  )],
  [10, 12, (f, d, t) => (
    <>
      <SceneTitle title="KENAPA TIDAK SEMUA?" subtitle="Elektron berpasangan" />
      <PasanganElektron f={f - t(11)} />
      <Kartu f={f} at={t(12)} top={800} left={190} warna="#ef4444" size={60}>SALING MENIADAKAN</Kartu>
      <Character emotion="setengah_pusing_swirl" kiri />
    </>
  )],
  [13, 14, (f, d, t) => (
    <>
      <SceneTitle title="BERBEDA" subtitle="Elektron tidak berpasangan" />
      <Unsur f={f} at={10} />
      <Kartu f={f} at={t(14)} top={850} left={200} warna="#fbbf24">TIAP ATOM = MAGNET KECIL</Kartu>
      <Character emotion="setengah_eureka_kepal" />
    </>
  )],
  [15, 16, (f, d, t) => (
    <>
      <SceneTitle title="SALING MENGATUR" subtitle="Atom bertetangga" />
      <BarisPertukaran f={f} />
      <Kartu f={f} at={t(16)} top={830} left={110} warna="#a78bfa">INTERAKSI PERTUKARAN</Kartu>
      <Kartu f={f} at={t(16) + 20} top={920} left={110} warna="#a78bfa" size={38}>efek fisika kuantum</Kartu>
      <Character emotion="setengah_mikir_gir" kiri />
    </>
  )],
  [17, 18, (f, d, t) => (
    <>
      <SceneTitle title="DOMAIN MAGNETIK" subtitle="Kelompok yang arahnya seragam" />
      <GridDomain a={1} top={470} cols={3} rows={3} w={600} h={460} />
      <div style={{ position: "absolute", top: 960, left: 240, width: 600, opacity: interpolate(f, [t(18), t(18) + 15], [0, 1], cl) }}>
        <div style={{ height: 8, background: "#fbbf24", borderRadius: 4 }} />
        <div style={{ textAlign: "center", fontSize: 42, fontWeight: 900, color: "#fde68a", marginTop: 10 }}>± beberapa mikrometer</div>
      </div>
    </>
  )],
  [19, 19, (f) => {
    const p = spring({ frame: f, fps: FPS, config: { damping: 10 } });
    return (
      <>
        <SceneTitle title="SIMPAN DULU" subtitle="Biar nggak lupa" />
        <Tengah top={560}>
          <svg width={260} height={340} viewBox="0 0 260 340" style={{ transform: `scale(${p})` }}>
            <path d="M30 20 H230 V320 L130 240 L30 320 Z" fill="#fbbf24" stroke="#92400e" strokeWidth={10} strokeLinejoin="round" />
          </svg>
        </Tengah>
        <Character emotion="setengah_tunjuk_kamera_marah" />
      </>
    );
  }],
  [20, 21, (f, d, t) => (
    <>
      <SceneTitle title="PAKU BIASA" subtitle="Domain ke segala arah" />
      <Paku a={0} />
      <Kartu f={f} at={t(21)} top={880} left={260} warna="#ef4444" size={56}>TIDAK MENARIK</Kartu>
      <Character emotion="setengah_bingung_garuk" kiri />
    </>
  )],
  [22, 23, (f, d, t) => (
    <>
      <SceneTitle title="DIBERI MEDAN KUAT" subtitle="Domain mulai sejajar" />
      <GridDomain a={interpolate(f, [10, d - 20], [0, 1], cl)} h={520} />
      <Kartu f={f} at={t(23)} top={1010} left={170} warna="#fbbf24" size={40}>MAKIN SEJAJAR = MAKIN KUAT</Kartu>
    </>
  )],
  [24, 25, (f, d, t) => (
    <>
      <SceneTitle title="TERKUNCI" subtitle="Magnet permanen" />
      <div style={{ opacity: interpolate(f, [t(25) - 10, t(25) + 10], [1, 0], cl) }}>
        <GridDomain a={1} cols={4} rows={4} w={640} h={520} />
        <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Gembok p={interpolate(f, [15, 35], [0, 1], cl)} />
        </div>
      </div>
      <div style={{ opacity: interpolate(f, [t(25) - 10, t(25) + 10], [0, 1], cl) }}>
        <Kulkas f={f} />
      </div>
      <Character emotion="setengah_tenang_tangan_dada" kiri />
    </>
  )],
  [26, 28, (f, d, t) => {
    const panas = interpolate(f, [t(27), t(28) + 30], [0, 1], cl);
    return (
      <>
        <SceneTitle title="MUSUHNYA: PANAS" subtitle="Suhu Curie" />
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 60%, rgba(249,115,22,.35), transparent 70%)", opacity: panas }} />
        <div style={{ position: "absolute", left: 140 }}>
          <GridDomain a={1 - panas} cols={4} rows={5} w={560} h={520} top={470} />
        </div>
        <Termometer p={panas} />
        <Kartu f={f} at={t(28)} top={1010} left={330} warna="#f97316" size={40}>BESI ± 770°C</Kartu>
      </>
    );
  }],
  [29, 30, (f, d, t) => (
    <>
      <SceneTitle title="MEDAN MAGNET" subtitle="Keluar dari N, masuk ke S" />
      <FieldLines frame={f} />
      <Tengah top={770}>
        <Magnet3D frame={f} />
      </Tengah>
      <Character emotion="setengah_mikir_dagu_2" kiri />
    </>
  )],
  [31, 33, (f, d, t) => {
    const dekat = interpolate(f, [0, t(33)], [0, 1], { ...cl, easing: (x) => x * x });
    const induksi = interpolate(f, [t(32), t(32) + 20], [0, 1], cl);
    return (
      <>
        <SceneTitle title="GAYA TARIK" subtitle="Besi jadi magnet sementara" />
        <div style={{ position: "absolute", top: 700, left: 40, transform: "scale(0.75)", transformOrigin: "left top" }}>
          <Magnet3D frame={f} />
        </div>
        <div style={{ position: "absolute", top: 700, left: interpolate(dekat, [0, 1], [760, 540]), width: 300, height: 170, borderRadius: 18, background: "linear-gradient(180deg,#94a3b8,#e2e8f0 40%,#475569)", border: "3px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", boxSizing: "border-box" }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#2563eb", opacity: induksi }}>S</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: "#1e293b" }}>BESI</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#dc2626", opacity: induksi }}>N</div>
        </div>
        <Kartu f={f} at={t(33)} top={930} left={240} warna="#22c55e" size={50}>KUTUB BERLAWANAN</Kartu>
        <Character emotion="setengah_eureka_kepal" />
      </>
    );
  }],
  [34, 34, (f) => (
    <>
      <SceneTitle title="BUKAN MAGNETIK" subtitle="Tidak ada domain" />
      <BukanMagnet f={f} />
      <Character emotion="setengah_kaget_dua_tangan" kiri />
    </>
  )],
  [35, 37, (f, d) => (
    <>
      <SceneTitle title="ADRIY PROJECT" subtitle="Explore More, Know More." />
      <FieldLines frame={f} />
      <Tengah top={680}>
        <Magnet3D frame={f} />
      </Tengah>
      <Character emotion="setengah_jempol_senyum" kiri />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [d - 25, d], [0, 1], cl) }} />
    </>
  )],
];

const mulai = (i: number) => (i === 0 ? 0 : fk(ADEGAN[i][0]) - 6);
const akhir = (i: number) => (i === ADEGAN.length - 1 ? DURASI : mulai(i + 1));

export const MagnetBedah: React.FC = () => {
  const frame = useCurrentFrame();
  const subtitle = captionAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020814", overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
      {ADEGAN.map(([, , isi], i) => {
        const from = mulai(i);
        const d = akhir(i) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Scene>
              <Lokal d={d} isi={isi} t={(n) => fk(n) - from} />
            </Scene>
          </Sequence>
        );
      })}

      {/* BRAND */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 70,
          zIndex: 100,
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: 5,
          color: "#93c5fd",
        }}
      >
        ADRIY.PROJECT
      </div>

      {/* SUBTITLE */}
      <Subtitle text={subtitle} />

      {/* PROGRESS */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 70,
          right: 70,
          height: 6,
          background: "rgba(255,255,255,.15)",
          borderRadius: 10,
          zIndex: 60,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / DURASI) * 100}%`,
            background: "linear-gradient(90deg,#2563eb,#93c5fd)",
            borderRadius: 10,
          }}
        />
      </div>

      <Audio src={staticFile("narasi.wav")} />
      <Audio
        src={staticFile("musik1.ogg")}
        loop
        volume={(x) => interpolate(x, [0, 25, DURASI - 40, DURASI], [0, 0.12, 0.12, 0], cl)}
      />
    </AbsoluteFill>
  );
};

const Lokal = ({ d, isi, t }: { d: number; t: (n: number) => number; isi: Isi }) => {
  const f = useCurrentFrame();
  return <>{isi(f, d, t)}</>;
};
