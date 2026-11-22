import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = { ...cl, easing: Easing.inOut(Easing.cubic) };
const HX = -3, HY = 1.05;            // engsel (poros lengan atas)
const FX = 2.75;                     // posisi pisau pendorong / staples terdepan
const GAP = 0.13;                    // jarak antar staples
const CY = 0.72;                     // tinggi dasar saluran (magazine)

// Bahan: cangkang dibelah oleh bidang potong
const useMat = (warna: string, plane: THREE.Plane | null, opt: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  useMemo(() => new THREE.MeshStandardMaterial({ color: warna, metalness: 0.3, roughness: 0.45, side: THREE.DoubleSide, clippingPlanes: plane ? [plane] : [], ...opt }), [warna, plane]);

const Staple: React.FC<{ x: number; y: number; tekuk?: number; mat: THREE.Material }> = ({ x, y, tekuk = 0, mat }) => (
  <group position={[x, y, 0]}>
    <mesh material={mat} position={[0, 0.27, 0]}><boxGeometry args={[0.05, 0.04, 0.56]} /></mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[0, 0.27, s * 0.26]}>
        <mesh material={mat} position={[0, -0.13, 0]}><boxGeometry args={[0.05, 0.26, 0.04]} /></mesh>
        {/* ujung kaki yang ditekuk ke dalam oleh landasan */}
        <group position={[0, -0.26, 0]} rotation={[s * tekuk * Math.PI / 2, 0, 0]}>
          <mesh material={mat} position={[0, -0.06, 0]}><boxGeometry args={[0.05, 0.12, 0.04]} /></mesh>
        </group>
      </group>
    ))}
  </group>
);

const Pegas: React.FC<{ x0: number; x1: number; mat: THREE.Material }> = ({ x0, x1, mat }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []; const putaran = 16, n = 400;
    for (let i = 0; i <= n; i++) { const t = i / n; const a = t * putaran * Math.PI * 2; pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, CY + 0.24 + Math.sin(a) * 0.13, Math.cos(a) * 0.13)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.022, 6, false);
  }, [x0, x1]);
  return <mesh geometry={geo} material={mat} />;
};

const Adegan: React.FC<{ f: number }> = ({ f }) => {
  // bidang potong: z > potong disembunyikan; bergerak dari 1 (utuh) ke 0 (terbelah)
  const potong = interpolate(f, [60, 105], [1.2, 0.0], ez);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.2), []);
  plane.constant = potong;
  const merah = useMat("#d62f2f", plane, { roughness: 0.35 });
  const abu = useMat("#8d97a3", plane, { metalness: 0.35, roughness: 0.4 });
  const hitam = useMat("#2b2f36", plane);
  const baja = useMat("#e8edf3", null, { metalness: 0.25, roughness: 0.35, emissive: "#3a4350" });
  const pegasM = useMat("#f2c230", null, { metalness: 0.3, roughness: 0.3, emissive: "#4a3500" });
  const kertasM = useMat("#fbfbf7", null, { metalness: 0, roughness: 0.9 });
  const landasanM = useMat("#58b4ff", null, { metalness: 0.3, roughness: 0.3, emissive: "#0d3a66" });

  // tekan & lepas
  const tekan = interpolate(f, [195, 225, 270, 295], [0, 1, 1, 0], ez);
  const sudut = -tekan * 0.115;                        // radian lengan atas turun
  const turun = Math.sin(-sudut) * (FX - HX);          // jarak turun ujung depan
  const majuStaple = interpolate(f, [300, 330], [0, GAP], ez); // staples berikutnya maju
  const pendorongX = -0.2 + majuStaple;
  // staples terdepan: didorong ke kertas lalu kakinya ditekuk
  const yDepan = interpolate(f, [205, 228], [CY, 0.02], ez);
  const tekuk = interpolate(f, [228, 245], [0, 1], ez);
  const lepas = f > 228;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 8]} intensity={1.6} />
      <directionalLight position={[-6, 4, -6]} intensity={0.5} color="#9fc7ff" />
      <group position={[-0.4, -0.6, 0]}>
        {/* alas */}
        <mesh material={hitam} position={[0, 0, 0]}><boxGeometry args={[6.6, 0.28, 1.3]} /></mesh>
        <mesh material={landasanM} position={[FX, 0.16, 0]}><boxGeometry args={[0.5, 0.06, 0.8]} /></mesh>
        {/* kertas */}
        <mesh material={kertasM} position={[3.6, 0.21, 0]}><boxGeometry args={[2.6, 0.03, 1.9]} /></mesh>
        {lepas && <Staple x={FX} y={yDepan} tekuk={tekuk} mat={baja} />}
        {/* engsel */}
        <mesh material={abu} position={[HX, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 1.4, 24]} /></mesh>
        {/* saluran / magazine */}
        <group>
          <mesh material={abu} position={[0, CY, 0]}><boxGeometry args={[5.9, 0.05, 0.9]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} material={abu} position={[0, CY + 0.25, s * 0.44]}><boxGeometry args={[5.9, 0.5, 0.04]} /></mesh>)}
          {/* isi staples */}
          {Array.from({ length: 14 }).map((_, i) => {
            const idx = lepas ? i + 1 : i;
            const x = FX - idx * GAP + (lepas ? majuStaple : 0);
            return <Staple key={i} x={x} y={CY} mat={baja} />;
          })}
          {/* pendorong + pegas */}
          <mesh material={hitam} position={[pendorongX + FX - 14 * GAP - 0.1 - (lepas ? GAP : 0) + 0.0, CY + 0.25, 0]}><boxGeometry args={[0.2, 0.36, 0.7]} /></mesh>
          <Pegas x0={-2.7} x1={pendorongX + FX - 14 * GAP - 0.2 - (lepas ? GAP : 0)} mat={pegasM} />
        </group>
        {/* lengan atas (palu) berputar di engsel */}
        <group position={[HX, HY, 0]} rotation={[0, 0, sudut]}>
          <group position={[-HX, -HY, 0]}>
            <mesh material={merah} position={[0.15, 1.42, 0]}><boxGeometry args={[6.3, 0.42, 1.25]} /></mesh>
            <mesh material={merah} position={[3.05, 1.2, 0]}><boxGeometry args={[0.5, 0.42, 1.25]} /></mesh>
            {/* pisau pendorong */}
            <mesh material={baja} position={[FX, 1.0, 0]}><boxGeometry args={[0.06, 0.55, 0.62]} /></mesh>
          </group>
        </group>
      </group>
    </>
  );
};

const proyeksi = (p: [number, number, number], cam: THREE.Vector3, target: THREE.Vector3) => {
  const c = new THREE.PerspectiveCamera(38, 1080 / 1920, 0.1, 100); c.position.copy(cam); c.lookAt(target); c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v = new THREE.Vector3(p[0] - 0.4, p[1] - 0.6, p[2]).project(c);
  return [(v.x + 1) / 2 * 1080, (1 - v.y) / 2 * 1920];
};
const Label: React.FC<{ f: number; at: number; p: number[]; dx: number; dy: number; teks: string; warna?: string }> = ({ f, at, p, dx, dy, teks, warna = "#ffd54a" }) => {
  const o = interpolate(f, [at, at + 10], [0, 1], cl);
  const [x, y] = p; const bx = x + dx, by = y + dy;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <line x1={x} y1={y} x2={bx} y2={by} stroke={warna} strokeWidth={5} />
        <circle cx={x} cy={y} r={11} fill={warna} stroke="#0b1018" strokeWidth={4} />
      </svg>
      <div style={{ position: "absolute", left: bx, top: by, transform: "translate(-50%,-50%)", whiteSpace: "nowrap", background: "rgba(10,14,22,.9)", border: `4px solid ${warna}`, borderRadius: 18, padding: "10px 22px", color: "#fff", fontSize: 40, fontWeight: 800, fontFamily: "Arial, sans-serif" }}>{teks}</div>
    </div>
  );
};

export const Stapler: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // kamera: berputar pelan, lalu mendekat ke ujung depan saat ditekan
  const orbit = interpolate(f, [0, 190], [1.05, 0.55], ez);
  const dekat = interpolate(f, [185, 205, 300, 320], [0, 1, 1, 0.4], ez);
  const r = 15.5 - dekat * 6.5;
  const target = new THREE.Vector3(interpolate(dekat, [0, 1], [0, 2.3]), interpolate(dekat, [0, 1], [0.2, -0.1]), 0);
  const cam = new THREE.Vector3(target.x + Math.sin(orbit) * r, target.y + 5.5 - dekat * 2.6, target.z + Math.cos(orbit) * r);
  const judulO = interpolate(f, [5, 20], [0, 1], cl);
  const cap = (a: number, b: number) => interpolate(f, [a, a + 10, b - 8, b], [0, 1, 1, 0], cl);
  const Caption: React.FC<{ a: number; b: number; t: string }> = ({ a, b, t }) => (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1460, opacity: cap(a, b), textAlign: "center", color: "#fff", fontSize: 54, fontWeight: 800, fontFamily: "Arial, sans-serif", lineHeight: 1.2, textShadow: "0 4px 14px #000" }}>{t}</div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #24344d 0%, #0b1018 75%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [cam.x, cam.y, cam.z] }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
        <CamLook pos={cam} target={target} />
        <Adegan f={f} />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", opacity: judulO, fontFamily: "Arial, sans-serif" }}>
        <div style={{ color: "#ffd54a", fontSize: 46, fontWeight: 800, letterSpacing: 6 }}>BEDAH BENDA</div>
        <div style={{ color: "#fff", fontSize: 96, fontWeight: 900 }}>Cara Kerja Stapler</div>
      </div>
      {f >= 110 && f < 190 && (() => {
        const P = (q: [number, number, number]) => proyeksi(q, cam, target);
        return (
          <>
            <Label f={f} at={110} p={P([-1.6, 0.96, 0])} dx={-60} dy={-260} teks="① Pegas" warna="#f2c230" />
            <Label f={f} at={125} p={P([0.62, 0.97, 0])} dx={0} dy={-330} teks="② Pendorong" warna="#cfd6df" />
            <Label f={f} at={140} p={P([1.8, 0.85, 0])} dx={-120} dy={260} teks="③ Isi staples" warna="#e8edf3" />
            <Label f={f} at={155} p={P([2.75, 1.05, 0])} dx={-170} dy={-330} teks="④ Pisau pendorong" warna="#ff6b6b" />
            <Label f={f} at={170} p={P([2.75, 0.19, 0])} dx={-60} dy={360} teks="⑤ Landasan" warna="#58b4ff" />
          </>
        );
      })()}
      <Caption a={62} b={108} t="Kita belah stapler jadi dua…" />
      <Caption a={195} b={245} t="Ditekan: pisau mendorong 1 staples menembus kertas" />
      <Caption a={245} b={292} t="Landasan menekuk kakinya ke dalam, kertas terkunci" />
      <Caption a={298} b={360} t="Dilepas: pegas mendorong staples berikutnya maju" />
    </AbsoluteFill>
  );
};

import { useThree } from "@react-three/fiber";
const CamLook: React.FC<{ pos: THREE.Vector3; target: THREE.Vector3 }> = ({ pos, target }) => {
  const { camera } = useThree();
  camera.position.copy(pos); camera.lookAt(target); camera.updateProjectionMatrix();
  return null;
};
