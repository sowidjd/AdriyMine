import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

const Subtitle = ({ text }: { text: string }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: 60,
        right: 60,
        padding: "22px 36px",
        borderRadius: 28,
        background: "rgba(2,8,20,.72)",
        zIndex: 10,
        textAlign: "center",
        fontSize: 43,
        fontWeight: 800,
        color: "#FFFFFF",
        lineHeight: 1.4,
        textShadow: "0 4px 15px rgba(0,0,0,.9)",
      }}
    >
      {text}
    </div>
  );
};

const Adriy = ({
  emotion = "curious",
  position = "left",
}: {
  emotion?: string;
  position?: "left" | "right";
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  const floating = Math.sin(frame / 15) * 8;

  return (
    <Img
      src={staticFile(`adriy-${emotion}.png`)}
      style={{
        position: "absolute",
        bottom: 0,
        // Pose ADRIY seluruh badan (tinggi > lebar): ukur dari tinggi,
        // supaya tidak menutupi judul dan magnet.
        height: 760,
        width: "auto",
        objectFit: "contain",
        left: position === "left" ? 10 : undefined,
        right: position === "right" ? 10 : undefined,
        transform: `
          translateY(${interpolate(entrance, [0, 1], [200, 0]) + floating}px)
          scale(${interpolate(entrance, [0, 1], [0.8, 1])})
        `,
        filter: "drop-shadow(0 20px 50px rgba(0,0,0,.5))",
      }}
    />
  );
};

const Magnet = () => {
  const frame = useCurrentFrame();

  const rotation = Math.sin(frame / 35) * 8;
  const pulse = 1 + Math.sin(frame / 12) * 0.03;

  return (
    <div
      style={{
        width: 480,
        height: 160,
        display: "flex",
        transform: `rotate(${rotation}deg) scale(${pulse})`,
        filter: "drop-shadow(0 0 35px rgba(80,150,255,.25))",
      }}
    >
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg,#ff7777,#dc2626,#991b1b)",
          borderRadius: "25px 0 0 25px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 70,
          fontWeight: 900,
          color: "white",
        }}
      >
        N
      </div>

      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg,#60a5fa,#2563eb,#1e3a8a)",
          borderRadius: "0 25px 25px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 70,
          fontWeight: 900,
          color: "white",
        }}
      >
        S
      </div>
    </div>
  );
};

const Background = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #17345c, #07111f 60%, #02050c)",
      }}
    >
      {Array.from({ length: 35 }).map((_, i) => {
        const x = (i * 137) % 1080;
        const y = (i * 251) % 1920;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + Math.sin(frame / 20 + i) * 30,
              width: 4,
              height: 4,
              background: "#93c5fd",
              borderRadius: "50%",
              opacity: 0.4,
              boxShadow: "0 0 10px #60a5fa",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const IntroScene = () => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, 120], [1, 1.15]);

  return (
    <AbsoluteFill>
      <Background />

      <div
        style={{
          position: "absolute",
          top: 350,
          left: 80,
          fontSize: 70,
          fontWeight: 900,
          color: "white",
          lineHeight: 1.2,
        }}
      >
        KENAPA
        <br />
        <span style={{ color: "#60a5fa" }}>MAGNET</span>
        <br />
        BISA MENARIK?
      </div>

      <div
        style={{
          position: "absolute",
          top: 820,
          left: 300,
          transform: `scale(${zoom})`,
        }}
      >
        <Magnet />
      </div>

      <Adriy emotion="curious" position="right" />

      <Subtitle text="Pernah berpikir, benda sekecil ini bisa menarik besi tanpa menyentuhnya?" />
    </AbsoluteFill>
  );
};

const ExplodedScene = () => {
  const frame = useCurrentFrame();

  const separation = interpolate(frame, [0, 120], [0, 300], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background />

      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
          fontSize: 60,
          fontWeight: 900,
          color: "white",
        }}
      >
        <span style={{ color: "#60a5fa" }}>KITA BEDAH</span>
        <br />
        MAGNET INI
      </div>

      <div
        style={{
          position: "absolute",
          top: 850,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 240,
            height: 150,
            background: "linear-gradient(135deg,#ff7777,#dc2626)",
            borderRadius: 25,
            transform: `translateX(-${separation / 2}px)`,
          }}
        />

        <div
          style={{
            width: 240,
            height: 150,
            background: "linear-gradient(135deg,#60a5fa,#2563eb)",
            borderRadius: 25,
            transform: `translateX(${separation / 2}px)`,
          }}
        />
      </div>

      <Adriy emotion="explaining" position="left" />

      <Subtitle text="Ternyata, rahasianya tidak sesederhana yang kita lihat dari luar." />
    </AbsoluteFill>
  );
};

const MicroscopicScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background />

      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
          fontSize: 60,
          fontWeight: 900,
          color: "#60a5fa",
        }}
      >
        DUNIA
        <br />
        MIKROSKOPIS
      </div>

      <div
        style={{
          position: "absolute",
          top: 560,
          left: 120,
          width: 840,
          height: 620,
          borderRadius: 40,
          background: "rgba(10,30,60,.8)",
          border: "2px solid rgba(96,165,250,.4)",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 20,
          padding: 40,
        }}
      >
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = interpolate(frame, [0, 150], [(i * 97) % 360, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 15,
                  borderRadius: 20,
                  background: "linear-gradient(90deg,#ef4444 50%,#3b82f6 50%)",
                  transform: `rotate(${angle}deg)`,
                  boxShadow: "0 0 15px rgba(96,165,250,.4)",
                }}
              />
            </div>
          );
        })}
      </div>

      <Adriy emotion="explaining" position="right" />

      <Subtitle text="Di dalamnya terdapat domain magnetik, kelompok kecil yang memiliki arah magnet." />
    </AbsoluteFill>
  );
};

export const MagnetBedah: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* INTRO */}
      <Sequence from={0} durationInFrames={180}>
        <IntroScene />
      </Sequence>

      {/* BEDAH */}
      <Sequence from={180} durationInFrames={300}>
        <ExplodedScene />
      </Sequence>

      {/* MIKROSKOP */}
      <Sequence from={480} durationInFrames={450}>
        <MicroscopicScene />
      </Sequence>

      {/* ENDING */}
      <Sequence from={930} durationInFrames={870}>
        <AbsoluteFill>
          <Background />

          <div
            style={{
              position: "absolute",
              top: 400,
              width: "100%",
              textAlign: "center",
              fontSize: 65,
              fontWeight: 900,
              color: "white",
            }}
          >
            Kekuatan
            <br />
            <span style={{ color: "#60a5fa" }}>TAK TERLIHAT</span>
          </div>

          <Adriy emotion="confident" position="left" />

          <Subtitle text="Inilah salah satu kekuatan alam yang selalu ada di sekitar kita." />

          <div
            style={{
              position: "absolute",
              top: 120,
              right: 80,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 5,
              color: "#93c5fd",
            }}
          >
            ADRIY.PROJECT
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
