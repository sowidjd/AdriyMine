import React, { useMemo } from "react";
import { interpolate, Easing, Img, staticFile } from "remotion";
import * as THREE from "three";
import tl from "./timeline.json";

export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ez = { ...cl, easing: Easing.inOut(Easing.cubic) };
export const FONT = "Arial, 'WenQuanYi Zen Hei', sans-serif";

/** Waktu lokal adegan: T(i) = frame mulai kalimat ke-i (lokal), E(i) = akhir. */
export type Ctx = { f: number; d: number; T: (i: number) => number; E: (i: number) => number; idx: number };
export const buatCtx = (ad: number, F: number): Ctx => {
  const s = tl.adegan[ad];
  const ks = tl.kalimat.filter((k) => k.adegan === ad);
  const T = (i: number) => (ks[Math.min(i, ks.length - 1)]?.a ?? s.a) - s.a;
  const E = (i: number) => (ks[Math.min(i, ks.length - 1)]?.b ?? s.b) - s.a;
  const f = F - s.a;
  let idx = 0; ks.forEach((k, i) => { if (F >= k.a - 3) idx = i; });
  return { f, d: s.b - s.a, T, E, idx };
};
export const muncul = (f: number, at: number, dur = 12) => interpolate(f, [at, at + dur], [0, 1], ez);
export const antara = (f: number, a: number, b: number, fade = 10) => interpolate(f, [a, a + fade, b - fade, b], [0, 1, 1, 0], cl);

// ---------- bahan ----------
export const mat = (warna: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: warna, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide, ...o });
export const useMat = (warna: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}, dep: unknown[] = []) =>
  useMemo(() => mat(warna, o), [warna, ...dep]); // eslint-disable-line

/** Bongkahan batubara: ikosahedron dengan permukaan bergerigi (deterministik). */
export const useBongkah = (seed = 1, r = 1, gerigi = 0.18) =>
  useMemo(() => {
    const g = new THREE.IcosahedronGeometry(r, 3);
    const p = g.attributes.position as THREE.BufferAttribute; const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 2) * Math.sin(v.z * 3.7 + seed * 3);
      v.multiplyScalar(1 + n * gerigi + (Math.sin(i * 12.9898 + seed) * 0.5) * 0.04);
      p.setXYZ(i, v.x, v.y * 0.85, v.z);
    }
    g.computeVertexNormals(); return g;
  }, [seed, r, gerigi]);

export const Lampu: React.FC<{ kuat?: number }> = ({ kuat = 1 }) => (
  <>
    <ambientLight intensity={0.6 * kuat} />
    <directionalLight position={[5, 9, 7]} intensity={1.7 * kuat} />
    <directionalLight position={[-6, 3, -5]} intensity={0.6 * kuat} color="#9fc7ff" />
  </>
);

/** Panah 3D sederhana (batang + kerucut) dari a ke b. */
export const Panah: React.FC<{ a: [number, number, number]; b: [number, number, number]; warna?: string; tebal?: number; s?: number }> = ({ a, b, warna = "#ffcc33", tebal = 0.06, s = 1 }) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const dir = B.clone().sub(A); const L = dir.length() * s;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const m = useMat(warna, { emissive: warna, emissiveIntensity: 0.35 });
  if (L < 0.01) return null;
  return (
    <group position={A} quaternion={q}>
      <mesh material={m} position={[0, Math.max(0, L - 0.25) / 2, 0]}><cylinderGeometry args={[tebal, tebal, Math.max(0.01, L - 0.25), 10]} /></mesh>
      <mesh material={m} position={[0, L - 0.125, 0]}><coneGeometry args={[tebal * 2.6, 0.25, 14]} /></mesh>
    </group>
  );
};

// ---------- overlay ----------
export const Judul: React.FC<{ kode: string; judul: string; han?: string; o: number }> = ({ kode, judul, han, o }) => (
  <div style={{ position: "absolute", top: 120, left: 60, right: 60, opacity: o, fontFamily: FONT, textAlign: "center" }}>
    <div style={{ display: "inline-block", background: "#f59e0b", color: "#111", fontWeight: 900, fontSize: 34, padding: "6px 22px", borderRadius: 12, letterSpacing: 2 }}>{kode}</div>
    <div style={{ color: "#fff", fontWeight: 900, fontSize: 62, lineHeight: 1.1, marginTop: 12, textShadow: "0 4px 18px #000" }}>{judul}</div>
    {han && <div style={{ color: "#fcd34d", fontSize: 40, marginTop: 6 }}>{han}</div>}
  </div>
);

export type Item = { i: number; teks: string; sub?: string; warna?: string; tanda?: string };
/** Daftar kartu yang muncul per kalimat; kartu aktif disorot. Maks n kartu terakhir terlihat. */
export const Kartu: React.FC<{ c: Ctx; items: Item[]; top?: number; maks?: number; kolom?: number; kanan?: number }> = ({ c, items, top = 1160, maks = 4, kolom = 1, kanan = 50 }) => {
  const tampil = items.filter((it) => c.f >= c.T(it.i) - 4);
  const akhir = tampil.slice(-maks);
  return (
    <div style={{ position: "absolute", top, left: 50, right: kanan, display: "grid", gridTemplateColumns: `repeat(${kolom}, 1fr)`, gap: 14, fontFamily: FONT }}>
      {akhir.map((it, k) => {
        const aktif = it === tampil[tampil.length - 1];
        const o = muncul(c.f, c.T(it.i) - 4, 10);
        const w = it.warna ?? "#f59e0b";
        return (
          <div key={it.teks + k} style={{ opacity: o * (aktif ? 1 : 0.55), transform: `translateX(${(1 - o) * -40}px) scale(${aktif ? 1 : 0.96})`, background: "rgba(8,12,20,.88)", borderLeft: `12px solid ${w}`, borderRadius: 16, padding: "12px 20px", boxShadow: aktif ? `0 0 0 3px ${w}` : "none" }}>
            <div style={{ color: "#fff", fontSize: 38, fontWeight: 800, lineHeight: 1.15 }}>{it.tanda ? <span style={{ color: w }}>{it.tanda} </span> : null}{it.teks}</div>
            {it.sub && <div style={{ color: "#cbd5e1", fontSize: 30, marginTop: 4, lineHeight: 1.2 }}>{it.sub}</div>}
          </div>
        );
      })}
    </div>
  );
};

export const Teks: React.FC<{ o: number; x: number; y: number; w?: number; size?: number; warna?: string; bg?: string; center?: boolean; children: React.ReactNode }> = ({ o, x, y, w, size = 40, warna = "#fff", bg = "rgba(8,12,20,.85)", center, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o, transform: `translate(${center ? "-50%" : "0"}, ${(1 - o) * 16}px)`, background: bg, borderRadius: 14, padding: bg === "none" ? 0 : "10px 18px", color: warna, fontSize: size, fontWeight: 800, fontFamily: FONT, textAlign: center ? "center" : "left", lineHeight: 1.2, whiteSpace: w ? "normal" : "nowrap" }}>{children}</div>
);

export const Adriy: React.FC<{ pose: string; o: number; x: number; y: number; h: number; balik?: boolean }> = ({ pose, o, x, y, h, balik }) => (
  <Img src={staticFile(`adriy/${pose}.png`)} style={{ position: "absolute", left: x, top: y, height: h, opacity: o, transform: `translateY(${(1 - o) * 60}px) scaleX(${balik ? -1 : 1})`, filter: "drop-shadow(0 10px 24px rgba(0,0,0,.6))" }} />
);
