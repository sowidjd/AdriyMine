import React, { useMemo } from "react";
import { AbsoluteFill, Audio, interpolate, useCurrentFrame, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type MateriProps = { judul: string; tema: string; audio: string; durasi: number;
  bagian: { judul: string; a: number; b: number }[]; kalimat: { teks: string; a: number; b: number; bagian: number }[] };
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FONT = "Arial, 'WenQuanYi Zen Hei', sans-serif";
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Kamera: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree(); const a = f / 240;
  camera.position.set(Math.sin(a) * 7, 2.2 + Math.sin(f / 300) * 0.6, Math.cos(a) * 7); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  return null;
};

/** Objek 3D per tema, dibelah oleh bidang potong yang bergerak pelan (gaya cutaway). */
const Objek: React.FC<{ tema: string; f: number }> = ({ tema, f }) => {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  plane.constant = 0.4 * Math.sin(f / 90);
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.6, 3); const p = g.attributes.position as THREE.BufferAttribute; const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + Math.sin(v.x * 3) * Math.cos(v.y * 2.7) * Math.sin(v.z * 3.7) * 0.18); p.setXYZ(i, v.x, v.y * 0.85, v.z); }
    g.computeVertexNormals(); return g;
  }, []);
  const m = (warna: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => <meshStandardMaterial color={warna} side={THREE.DoubleSide} clippingPlanes={[plane]} roughness={0.6} {...o} />;
  if (tema === "bumi") return (<group rotation={[0.2, f / 200, 0]}>
    {[["#2563eb", 1.9], ["#a16207", 1.5], ["#f97316", 1.05], ["#fde047", 0.6]].map(([w, r], i) => <mesh key={i}><sphereGeometry args={[Number(r), 48, 48]} />{m(String(w), { emissive: i > 1 ? String(w) : "#000", emissiveIntensity: 0.5 })}</mesh>)}
  </group>);
  if (tema === "atom") return (<group rotation={[0.3, f / 150, 0]}>
    {Array.from({ length: 14 }).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 0.8, (rnd(i + 1) - 0.5) * 0.8, (rnd(i + 2) - 0.5) * 0.8]}><sphereGeometry args={[0.28, 24, 24]} /><meshStandardMaterial color={i % 2 ? "#ef4444" : "#60a5fa"} /></mesh>)}
    {[0, 1, 2].map((k) => <group key={k} rotation={[k, k * 1.2, 0]}><mesh><torusGeometry args={[2.2, 0.02, 8, 96]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh position={[Math.cos(f / 20 + k * 2) * 2.2, Math.sin(f / 20 + k * 2) * 2.2, 0]}><sphereGeometry args={[0.14, 16, 16]} /><meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.8} /></mesh></group>)}
  </group>);
  if (tema === "roda") return (<group rotation={[0.4, 0, 0]}>
    {[[-1.1, 0, 1, 12], [1.25, 0.4, -1.2, 9]].map(([x, y, arah, gigi], j) => <group key={j} position={[Number(x), Number(y), 0]} rotation={[0, 0, (f / 40) * Number(arah)]}>
      <mesh><cylinderGeometry args={[1, 1, 0.4, 48]} />{m("#cbd5e1", { metalness: 0.35, roughness: 0.35 })}</mesh>
      {Array.from({ length: Number(gigi) }).map((_, i) => { const a = (i / Number(gigi)) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 1.12, 0, Math.sin(a) * 1.12]} rotation={[0, -a, 0]}><boxGeometry args={[0.3, 0.4, 0.22]} /><meshStandardMaterial color="#94a3b8" metalness={0.35} /></mesh>; })}
    </group>)}
  </group>);
  return (<group rotation={[0.3, f / 180, 0.1]}>
    <mesh geometry={geo}>{m("#1d1f24", { roughness: 0.5, metalness: 0.2 })}</mesh>
    {Array.from({ length: 50 }).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 2.2, (rnd(i + 1) - 0.5) * 2, (rnd(i + 2) - 0.5) * 2.2]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} /></mesh>)}
  </group>);
};

export const Materi: React.FC<MateriProps> = ({ judul, tema, audio, bagian, kalimat, durasi }) => {
  const f = useCurrentFrame();
  const kal = kalimat.find((k) => f >= k.a - 3 && f < k.b + 12);
  const ki = kal ? kalimat.indexOf(kal) : -1;
  let bi = 0; bagian.forEach((b, i) => { if (f >= b.a) bi = i; });
  const b = bagian[bi];
  const masuk = interpolate(f - (b?.a ?? 0), [0, 14], [0, 1], cl);
  const lalu = kalimat.slice(Math.max(0, ki - 2), Math.max(0, ki)).filter((k) => k.bagian === bi);
  const o = kal ? interpolate(f, [kal.a - 3, kal.a + 8], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) }) : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 35%, #1f2f47 0%, #0a0f17 70%)", fontFamily: FONT }}>
      {audio && <Audio src={audio} />}
      <div style={{ position: "absolute", top: 300, left: 0, width: 1080, height: 820 }}>
        <ThreeCanvas width={1080} height={820} camera={{ fov: 40 }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
          <Kamera f={f} /><ambientLight intensity={0.6} /><directionalLight position={[5, 8, 6]} intensity={1.7} /><directionalLight position={[-5, 2, -5]} intensity={0.5} color="#9fc7ff" />
          <Objek tema={tema} f={f} />
        </ThreeCanvas>
      </div>
      <div style={{ position: "absolute", top: 110, left: 60, right: 60, textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#f59e0b", color: "#111", fontWeight: 900, fontSize: 32, padding: "6px 20px", borderRadius: 12 }}>{judul}</div>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 60, marginTop: 12, opacity: masuk, textShadow: "0 4px 18px #000", lineHeight: 1.1 }}>{b?.judul}</div>
      </div>
      <div style={{ position: "absolute", top: 1130, left: 50, right: 50, display: "flex", flexDirection: "column", gap: 14 }}>
        {lalu.map((k, i) => <div key={i} style={{ opacity: 0.45, background: "rgba(8,12,20,.85)", borderLeft: "10px solid #64748b", borderRadius: 14, padding: "10px 18px", color: "#cbd5e1", fontSize: 30, fontWeight: 700 }}>{k.teks}</div>)}
      </div>
      {kal && <div style={{ position: "absolute", left: 50, right: 50, top: 1430, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, background: "rgba(8,12,20,.92)", borderLeft: "14px solid #f59e0b", borderRadius: 18, padding: "18px 24px", color: "#fff", fontSize: 46, fontWeight: 800, lineHeight: 1.25, boxShadow: "0 0 0 3px #f59e0b" }}>{kal.teks}</div>}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${(f / durasi) * 100}%`, background: "#f59e0b" }} />
    </AbsoluteFill>
  );
};
