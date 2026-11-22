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

// frame mulai kalimat ke-i (0-based) = frame mulai adegan ke-i
const S = KAL.map((k, i) => (i === 0 ? 0 : Math.round(k.mulai * FPS) - 6));

const sceneAt = (f: number) => {
  let s = 0;
  for (let i = 0; i < S.length; i++) if (f >= S[i]) s = i;
  return s;
};

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

// Isi tiap adegan, f = frame lokal (0 = awal adegan), d = panjang adegan
const ADEGAN: ((f: number, d: number) => React.ReactNode)[] = [
  // 1 — hook
  (f) => (
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
  ),
  // 2 — anggapan umum
  (f) => (
    <>
      <SceneTitle title="BENDA BIASA?" subtitle="Dua kutub: N dan S" />
      <Tengah top={720}>
        <Magnet3D frame={f} />
      </Tengah>
      <Character emotion="setengah_bingung_garuk" kiri />
    </>
  ),
  // 3 — bahan magnet
  (f) => (
    <>
      <SceneTitle title="MEMBEDAH" subtitle="Bahan magnet permanen" />
      <Tengah top={600}>
        <Magnet3D frame={f} />
      </Tengah>
      {["NEODYMIUM", "FERRITE", "ALNICO"].map((b, i) => {
        const p = interpolate(f, [30 + i * 25, 50 + i * 25], [0, 1], cl);
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              top: 830 + i * 80,
              left: 90,
              padding: "12px 30px",
              borderRadius: 18,
              background: "rgba(37,99,235,.25)",
              border: "2px solid #60a5fa",
              color: "#dbeafe",
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: 3,
              opacity: p,
              transform: `translateX(${(1 - p) * -60}px)`,
            }}
          >
            {b}
          </div>
        );
      })}
      <Character emotion="setengah_senang_kepal" />
    </>
  ),
  // 4 — pembongkaran
  (f) => (
    <>
      <SceneTitle title="STRUKTUR MATERIAL" subtitle="Visualisasi pembongkaran" />
      <Tengah top={620}>
        <ExplodedMagnet frame={f} />
      </Tengah>
      <Character emotion="setengah_mikir_dagu_2" kiri />
    </>
  ),
  // 5 — atom & elektron
  (f, d) => (
    <>
      <SceneTitle title="MASUK KE DALAM" subtitle="Atom & elektron" />
      <AbsoluteFill style={{ transform: `scale(${interpolate(f, [0, d], [1, 1.25], cl)})` }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <Atom frame={f} index={i} key={i} />
        ))}
      </AbsoluteFill>
      <Character emotion="setengah_kaget_dua_tangan" />
    </>
  ),
  // 6 — domain acak → mulai sejajar
  (f) => (
    <>
      <SceneTitle title="DOMAIN MAGNETIK" subtitle="Kelompok momen magnetik" />
      <Domains frame={f} sejajar={0.35} />
      <Character emotion="setengah_mikir_gir" kiri />
    </>
  ),
  // 7 — domain sejajar
  (f) => (
    <>
      <SceneTitle title="ARAH YANG SEJAJAR" subtitle="Efek magnet makin kuat" />
      <Domains frame={f + 84} />
      <Character emotion="setengah_semangat_kedip" />
    </>
  ),
  // 8 — medan magnet
  (f) => (
    <>
      <SceneTitle title="MEDAN MAGNET" subtitle="Kekuatan yang tak terlihat" />
      <FieldLines frame={f} />
      <Tengah top={770}>
        <Magnet3D frame={f} />
      </Tengah>
      <Character emotion="setengah_tenang_tangan_dada" kiri />
    </>
  ),
  // 9 — gaya tarik
  (f, d) => (
    <>
      <SceneTitle title="GAYA TARIK" subtitle="Interaksi dengan besi" />
      <Tengah top={720}>
        <div style={{ transform: "translateX(-160px) scale(0.8)" }}>
          <Magnet3D frame={f} />
        </div>
      </Tengah>
      <div
        style={{
          position: "absolute",
          top: 720,
          left: interpolate(f, [0, d * 0.7], [880, 690], {
            ...cl,
            easing: (x) => x * x * x,
          }),
          transform: `rotate(${interpolate(f, [0, d * 0.7], [25, 90], cl)}deg)`,
        }}
      >
        <Baut />
      </div>
      <Character emotion="setengah_eureka_kepal" />
    </>
  ),
  // 10 — penutup
  (f, d) => (
    <>
      <SceneTitle title="ADRIY PROJECT" subtitle="Sains di balik hal sederhana" />
      <Tengah top={680}>
        <Magnet3D frame={f} />
      </Tengah>
      <Character emotion="setengah_jempol_senyum" kiri />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [d - 25, d], [0, 1], cl) }} />
    </>
  ),
];

export const MagnetBedah: React.FC = () => {
  const frame = useCurrentFrame();

  const scene = sceneAt(frame);
  const subtitle = captionAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020814", overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
      {ADEGAN.map((isi, i) => {
        const from = S[i];
        const d = (i + 1 < S.length ? S[i + 1] : DURASI) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Scene>
              <Lokal d={d} isi={isi} />
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

const Lokal = ({ d, isi }: { d: number; isi: (f: number, d: number) => React.ReactNode }) => {
  const f = useCurrentFrame();
  return <>{isi(f, d)}</>;
};
