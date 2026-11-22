/**
 * ADRIY PROJECT — BEDAH BENDA #01
 * KENAPA RESLETING BISA MENGUNCI?
 *
 * Template: Video.tsx (kode dari pemilik; typo </Jud> dibetulkan)
 * Canvas: 1080 x 1920
 * FPS: 30
 */

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {
  Adriy,
  C,
  FONT_JUDUL,
  FONT_TANGAN,
  Fonts,
  FPS,
  Judul,
  Kamera,
  Kertas,
  Label,
  Latar,
  Masuk,
  Muncul,
  PencilDefs,
  Subtitle,
  TOTAL_DETIK,
  fk,
} from "./lib";

import berkas from "./berkas.json";

const ada = (f: string) => (berkas as string[]).includes(f);

const cl = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type P = {
  d: number;
  t: (n: number) => number;
};

export const DURASI = Math.ceil((TOTAL_DETIK + 1.8) * FPS);

// ============================================================
// VISUAL UTAMA: RESLETING
// ============================================================

const Gigi: React.FC<{
  warna?: string;
  ukuran?: number;
}> = ({ warna = "#d5d9df", ukuran = 42 }) => (
  <div
    style={{
      width: ukuran,
      height: 55,
      background: warna,
      borderRadius: 8,
      border: "3px solid #64748b",
      boxShadow: "0 5px 0 #334155",
    }}
  />
);

const BarisGigi: React.FC<{
  warna?: string;
  terbalik?: boolean;
}> = ({ warna, terbalik = false }) => (
  <div
    style={{
      display: "flex",
      gap: 8,
      flexDirection: terbalik ? "row-reverse" : "row",
    }}
  >
    {Array.from({ length: 8 }).map((_, i) => (
      <Gigi key={i} warna={warna} />
    ))}
  </div>
);

const ResletingTerbuka: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 18,
      alignItems: "center",
    }}
  >
    <BarisGigi warna="#e2e8f0" />
    <BarisGigi warna="#94a3b8" terbalik />
  </div>
);

const ResletingTerkunci: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 0,
      alignItems: "center",
    }}
  >
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: -5,
        }}
      >
        <div
          style={{
            width: 55,
            height: 35,
            background: i % 2 === 0 ? "#cbd5e1" : "#94a3b8",
            borderRadius: 8,
            border: "3px solid #475569",
            transform: "rotate(-10deg)",
          }}
        />
        <div
          style={{
            width: 55,
            height: 35,
            background: i % 2 === 0 ? "#94a3b8" : "#cbd5e1",
            borderRadius: 8,
            border: "3px solid #475569",
            transform: "rotate(10deg)",
            marginLeft: -8,
          }}
        />
      </div>
    ))}
  </div>
);

// ============================================================
// ADEGAN 1 — HOOK
// Kalimat 1–2
// ============================================================

const A1: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();

  const zoom = interpolate(
    f,
    [0, d],
    [1, 1.12],
    cl
  );

  return (
    <>
      <Kertas malam={0.85} />

      <Kamera d={d} dari={1} ke={zoom}>
        <Muncul at={5} style={{ top: 700, left: 0, right: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              transform: "rotate(-8deg) scale(1.5)",
            }}
          >
            <ResletingTerbuka />
          </div>
        </Muncul>
      </Kamera>

      <Judul at={5} top={250} warna="#ffd27a">
        KENAPA
      </Judul>

      <Judul at={12} top={370} warna="#ffffff">
        RESLETING
      </Judul>

      <Judul at={20} top={490} warna="#ffd27a">
        BISA MENGUNCI?
      </Judul>

      <Adriy
        pose="setengah_kaget_tangan_terbuka"
        sisi="kanan"
        tinggi={520}
        at={8}
      />

      <Label
        at={t(2)}
        x={100}
        y={1050}
        warna="#ffd27a"
      >
        BEDAH BENDA #01
      </Label>
    </>
  );
};

// ============================================================
// ADEGAN 2 — BONGKAR MEKANISME
// Kalimat 3–8
// ============================================================

const A2: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();

  const sliderY = interpolate(
    f,
    [t(5), t(8)],
    [0, 110],
    cl
  );

  return (
    <>
      <Kertas malam={0.25} />

      <Judul at={5} top={230}>
        RAHASIANYA
      </Judul>

      <Judul at={12} top={350} warna="#e5a23b">
        ADA DI SLIDER
      </Judul>

      {/* Gigi resleting */}
      <Muncul at={t(3)} style={{ top: 570, left: 0, right: 0 }}>
        <div style={{ display: "flex", justifyContent: "center", transform: "scale(1.6)" }}>
          <ResletingTerbuka />
        </div>
      </Muncul>

      {/* Slider */}
      <Muncul at={t(4)}>
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 760 + sliderY,
            width: 420,
            height: 180,
            background: "#64748b",
            border: "8px solid #334155",
            borderRadius: 50,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,.25)",
          }}
        >
          {f >= t(5) ? (
            <div style={{ fontFamily: FONT_JUDUL, fontSize: 150, fontWeight: 700, color: "#ffd27a", lineHeight: 1 }}>Y</div>
          ) : (
            <div
              style={{
                width: 150,
                height: 70,
                background: "#cbd5e1",
                borderRadius: 30,
                border: "6px solid #475569",
              }}
            />
          )}
        </div>
      </Muncul>

      <Label
        at={t(5)}
        x={90}
        y={1075}
        warna="#2563eb"
        size={56}
      >
        JALUR INTERNAL
      </Label>

      <Label
        at={t(6)}
        x={90}
        y={1150}
        warna="#d97706"
        size={56}
      >
        GIGI BERTEMU
      </Label>

      <Adriy
        pose="jelaskan_tangan_terbuka"
        sisi="kanan"
        tinggi={700}
        at={t(3)}
      />
    </>
  );
};

// ============================================================
// ADEGAN 3 — REVEAL
// Kalimat 9–12
// ============================================================

const A3: React.FC<P> = ({ d, t }) => {
  const f = useCurrentFrame();

  const zoom = interpolate(
    f,
    [0, d],
    [1, 1.2],
    cl
  );

  return (
    <>
      <Latar
        atas="#17345c"
        bawah="#02050c"
        titik
      />

      <Kamera d={d} dari={1} ke={zoom}>
        <Muncul at={t(9)} style={{ top: 640, left: 0, right: 0 }}>
          <div style={{ display: "flex", justifyContent: "center", transform: "scale(1.5)" }}>
            <ResletingTerkunci />
          </div>
        </Muncul>
      </Kamera>

      <Judul at={5} top={250} warna="#ffffff">
        TERKUNCI
      </Judul>

      <Judul at={15} top={370} warna="#60a5fa">
        SATU PER SATU
      </Judul>

      <Label
        at={t(9)}
        x={640}
        y={1050}
        warna="#93c5fd"
        size={56}
      >
        TANPA LEM
      </Label>

      <Label
        at={t(10)}
        x={640}
        y={1125}
        warna="#93c5fd"
        size={56}
      >
        TANPA MAGNET
      </Label>

      <Adriy
        pose="setengah_kaget_tangan_terbuka"
        sisi="kiri"
        tinggi={520}
        at={t(9)}
      />
    </>
  );
};

// ============================================================
// ADEGAN 4 — KESIMPULAN & CTA
// Kalimat 13–15
// ============================================================

const A4: React.FC<P> = ({ d }) => {
  const f = useCurrentFrame();

  return (
    <>
      <Kertas malam={0.05} hangat={0.8} />

      <Judul at={8} top={250}>
        KECIL
      </Judul>

      <Judul at={15} top={370} warna="#e5a23b">
        TAPI CERDAS
      </Judul>

      <Muncul at={25} style={{ top: 560, left: 60, right: 153 }}>
        <div
          style={{
            textAlign: "center",
            fontFamily: FONT_JUDUL,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            color: C.pensil,
          }}
        >
          SATU GERAKAN
          <br />
          DUA FUNGSI
        </div>
      </Muncul>

      <Muncul at={45} style={{ top: 860, left: 60, right: 153 }}>
        <div
          style={{
            textAlign: "center",
            fontFamily: FONT_TANGAN,
            fontSize: 68,
            color: "#d97706",
          }}
        >
          EXPLORE MORE,
          <br />
          KNOW MORE.
        </div>
      </Muncul>

      <Adriy
        pose="setengah_jempol_senyum"
        sisi="kanan"
        tinggi={560}
        at={20}
      />

      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(
            f,
            [d - 25, d],
            [0, 1],
            cl
          ),
        }}
      />
    </>
  );
};

// ============================================================
// DAFTAR ADEGAN
// [kalimat awal, kalimat akhir, komponen]
// ============================================================

const ADEGAN: [number, number, React.FC<P>][] = [
  [1, 2, A1],
  [3, 8, A2],
  [9, 12, A3],
  [13, 15, A4],
];

// ============================================================
// SFX
// [kalimat, offset detik, file, volume]
// ============================================================

const SFX: [number, number, string, number][] = [
  [1, 0.2, "tubuh_merinding_berkilau", 0.65],
  [3, 0.3, "transisi_whoosh", 0.5],
  [5, 0.2, "sains_sinar_x_pindai", 0.55],
  [8, 0.2, "ui_ide_lonceng", 0.65],
  [11, 0.2, "transisi_whoosh", 0.5],
  [14, 0.2, "tubuh_merinding_berkilau", 0.5],
];

// ============================================================
// MUSIK
// File musik harus tersedia di public/
// ============================================================

const MUSIK: [string, number, number][] = [
  ["musik1.ogg", 1, 0.14],
];

// ============================================================
// RENDER
// ============================================================

const mulai = (i: number) =>
  i === 0 ? 0 : fk(ADEGAN[i][0]) - 6;

const akhir = (i: number) =>
  i === ADEGAN.length - 1
    ? DURASI
    : mulai(i + 1);

export const Video: React.FC = () => (
  <AbsoluteFill
    style={{
      background: C.kertas,
      overflow: "hidden",
    }}
  >
    <Fonts />
    <PencilDefs />

    {/* ADEGAN */}
    {ADEGAN.map(([, , S], i) => {
      const from = mulai(i);
      const d = akhir(i) - from;

      return (
        <Sequence
          key={i}
          from={from}
          durationInFrames={d}
        >
          <Masuk d={d}>
            <S
              d={d}
              t={(n) => fk(n) - from}
            />
          </Masuk>
        </Sequence>
      );
    })}

    {/* SUBTITLE OTOMATIS */}
    <Subtitle />

    {/* NARASI */}
    {ada("narasi.wav") && (
      <Audio src={staticFile("narasi.wav")} />
    )}

    {/* MUSIK */}
    {MUSIK
      .filter(([file]) => ada(file))
      .map(([file, k, v], i, M) => {
        const from = k === 1 ? 0 : fk(k);

        const to =
          i + 1 < M.length
            ? fk(M[i + 1][1]) + 30
            : DURASI;

        const len = to - from;

        return (
          <Sequence
            key={file}
            from={from}
            durationInFrames={len}
          >
            <Audio
              src={staticFile(file)}
              loop
              volume={(x) =>
                interpolate(
                  x,
                  [0, 25, len - 35, len],
                  [0, v, v, 0],
                  cl
                )
              }
            />
          </Sequence>
        );
      })}

    {/* SFX */}
    {SFX
      .filter(([, , file]) => ada(`${file}.wav`))
      .map(([k, g, file, v], i) => (
        <Sequence
          key={i}
          from={fk(k) + Math.round(g * FPS)}
          durationInFrames={FPS * 6}
        >
          <Audio
            src={staticFile(`${file}.wav`)}
            volume={v}
          />
        </Sequence>
      ))}
  </AbsoluteFill>
);
