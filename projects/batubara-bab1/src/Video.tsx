import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import tl from "./timeline.json";
import { ADEGAN } from "./adegan";
import { buatCtx, cl, FONT, Judul } from "./lib";

const Kamera: React.FC<{ pos: number[]; target: number[] }> = ({ pos, target }) => {
  const { camera } = useThree();
  camera.position.set(pos[0], pos[1], pos[2]); camera.lookAt(new THREE.Vector3(target[0], target[1], target[2])); camera.updateProjectionMatrix();
  return null;
};

export const Video: React.FC = () => {
  const F = useCurrentFrame();
  let ad = 0; tl.adegan.forEach((s, i) => { if (F >= s.a) ad = i; });
  const s = tl.adegan[ad]; const A = ADEGAN[ad];
  const c = buatCtx(ad, F);
  const cam = A.kamera(c);
  const masuk = interpolate(F - s.a, [0, 14], [0, 1], cl) * interpolate(s.b - F, [0, 8], [0, 1], cl);
  const kal = tl.kalimat.find((k) => F >= k.a - 2 && F < k.b + 10);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%, #1f2f47 0%, #0a0f17 70%)" }}>
      {!tl.perkiraan && <Audio src={staticFile("narasi.wav")} />}
      <div style={{ position: "absolute", top: 330, left: 0, width: 1080, height: 880, opacity: masuk }}>
        <ThreeCanvas width={1080} height={880} camera={{ fov: 42, position: [0, 0, 10] }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
          <Kamera pos={cam.pos} target={cam.target} />
          <A.Tiga c={c} />
        </ThreeCanvas>
      </div>
      <Judul kode={A.kode} judul={A.judul} han={A.han} o={masuk} />
      <div style={{ position: "absolute", inset: 0, opacity: masuk }}><A.Atas c={c} /></div>
      {kal && <div style={{ position: "absolute", left: 60, right: 60, top: 1600, textAlign: "center", fontFamily: FONT, color: "#fff", fontSize: 44, fontWeight: 800, lineHeight: 1.25, textShadow: "0 3px 10px #000, 0 0 3px #000" }}>{kal.teks}</div>}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${(F / tl.durasi) * 100}%`, background: "#f59e0b" }} />
    </AbsoluteFill>
  );
};
