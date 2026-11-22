import React, { useMemo } from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import { Adriy, antara, cl, Ctx, ez, FONT, Kartu, Lampu, muncul, Panah, Teks, useBongkah, useMat } from "./lib";

type V3 = [number, number, number];
export type Adegan = { kode: string; judul: string; han?: string; kamera: (c: Ctx) => { pos: V3; target: V3 }; Tiga: React.FC<{ c: Ctx }>; Atas: React.FC<{ c: Ctx }> };
const orbit = (c: Ctx, r: number, y: number, t: V3 = [0, 0, 0], a0 = 0.5, a1 = -0.3): { pos: V3; target: V3 } => {
  const a = interpolate(c.f, [0, c.d], [a0, a1], cl);
  return { pos: [t[0] + Math.sin(a) * r, t[1] + y, t[2] + Math.cos(a) * r], target: t };
};
const lerp3 = (p: number, A: V3, B: V3): V3 => [A[0] + (B[0] - A[0]) * p, A[1] + (B[1] - A[1]) * p, A[2] + (B[2] - A[2]) * p];
/** kamera berpindah antar titik sesuai kalimat: daftar [kalimat, posisi, target] */
const jalur = (c: Ctx, titik: [number, V3, V3][]) => {
  let pos = titik[0][1], target = titik[0][2];
  for (let k = 1; k < titik.length; k++) {
    const p = interpolate(c.f, [c.T(titik[k][0]) - 25, c.T(titik[k][0]) + 10], [0, 1], ez);
    pos = lerp3(p, pos, titik[k][1]); target = lerp3(p, target, titik[k][2]);
  }
  const g = Math.sin(c.f / 90) * 0.4; // goyang pelan
  return { pos: [pos[0] + g, pos[1], pos[2]] as V3, target };
};
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ============ komponen 3D bersama ============
const Bongkah: React.FC<{ warna?: string; seed?: number; r?: number; potong?: number; pos?: V3; putar?: number; glow?: number; kilap?: number }> = ({ warna = "#1b1d22", seed = 1, r = 1, potong, pos = [0, 0, 0], putar = 0, glow = 0, kilap = 0.35 }) => {
  const g = useBongkah(seed, r);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 5), []);
  plane.constant = potong ?? 5;
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: warna, roughness: 1 - kilap, metalness: 0.15, side: THREE.DoubleSide, clippingPlanes: [plane], emissive: "#ff5a1f", emissiveIntensity: 0 }), [warna, plane, kilap]);
  m.emissiveIntensity = glow;
  return <mesh geometry={g} material={m} position={pos} rotation={[0.3, putar, 0.1]} />;
};

/** Baterai oven kokas dibelah: ruang karbonisasi di antara dinding pemanas. matang 0..1 */
const Baterai: React.FC<{ matang: number; gas: number; f: number; potong?: number }> = ({ matang, gas, f, potong = 0 }) => {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  plane.constant = potong;
  const dinding = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a1543a", roughness: 0.85, side: THREE.DoubleSide, clippingPlanes: [plane], emissive: "#ff4d00", emissiveIntensity: 0.25 }), [plane]);
  const atap = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5b6472", roughness: 0.7, side: THREE.DoubleSide, clippingPlanes: [plane] }), [plane]);
  const isi = useMat("#222", { roughness: 0.9 });
  isi.color.set(new THREE.Color("#1d1f24").lerp(new THREE.Color("#9aa1a8"), Math.max(0, matang - 0.6) / 0.4));
  isi.emissive.set("#ff6a1a"); isi.emissiveIntensity = Math.sin(Math.min(1, matang) * Math.PI) * 0.9;
  const api = useMat("#ffb020", { emissive: "#ff7a00", emissiveIntensity: 1.2 });
  const pipa = useMat("#77808c", { metalness: 0.6, roughness: 0.4 });
  const gasM = useMat("#ffe08a", { emissive: "#ffd060", emissiveIntensity: 0.8, transparent: true, opacity: 0.85 });
  return (
    <group>
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh material={dinding}><boxGeometry args={[0.4, 3.4, 4]} /></mesh>
          {/* api di saluran pemanas */}
          {[-1.2, -0.4, 0.4, 1.2].map((y, k) => <mesh key={k} material={api} position={[0, y, 0.2 + 0.2 * Math.sin(f / 4 + k + i)]} scale={[0.6, 0.6 + 0.3 * Math.abs(Math.sin(f / 5 + k * 2 + i)), 0.6]}><coneGeometry args={[0.1, 0.35, 8]} /></mesh>)}
        </group>
      ))}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => <mesh key={i} material={isi} position={[x, -0.15, 0]}><boxGeometry args={[0.78, 2.9, 3.7]} /></mesh>)}
      <mesh material={atap} position={[0, 1.95, 0]}><boxGeometry args={[6.8, 0.5, 4.2]} /></mesh>
      <mesh material={atap} position={[0, -1.95, 0]}><boxGeometry args={[6.8, 0.5, 4.2]} /></mesh>
      {/* pipa naik & pipa pengumpul gas */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => <mesh key={i} material={pipa} position={[x, 2.7, -1.4]}><cylinderGeometry args={[0.13, 0.13, 1.1, 12]} /></mesh>)}
      <mesh material={pipa} position={[0, 3.3, -1.4]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 6.4, 16]} /></mesh>
      {gas > 0 && Array.from({ length: 30 }).map((_, i) => {
        const x = [-2.4, -1.2, 0, 1.2, 2.4][i % 5]; const t = ((f * 0.03 + rnd(i)) % 1);
        return <mesh key={i} material={gasM} position={[x + Math.sin(i + f / 9) * 0.1, 1.2 + t * 2.0, -1.4 + (rnd(i + 9) - 0.5) * 0.3]} scale={gas * (1 - t) * 0.9 + 0.1}><sphereGeometry args={[0.08, 8, 8]} /></mesh>;
      })}
    </group>
  );
};

const Api: React.FC<{ f: number; n?: number; pos?: V3; s?: number }> = ({ f, n = 14, pos = [0, 0, 0], s = 1 }) => {
  const m = useMat("#ff9a1f", { emissive: "#ff5a00", emissiveIntensity: 1.4, transparent: true, opacity: 0.9 });
  return (
    <group position={pos} scale={s}>
      {Array.from({ length: n }).map((_, i) => { const t = (f * 0.04 + rnd(i)) % 1; return <mesh key={i} material={m} position={[(rnd(i + 3) - 0.5) * 1.4, t * 1.6, (rnd(i + 5) - 0.5) * 1.2]} scale={(1 - t) * 1.2}><coneGeometry args={[0.15, 0.5, 8]} /></mesh>; })}
    </group>
  );
};

const Partikel: React.FC<{ n: number; f: number; warna: string; asal: V3; tinggi?: number; sebar?: number; size?: number; laju?: number }> = ({ n, f, warna, asal, tinggi = 2.5, sebar = 0.8, size = 0.08, laju = 0.025 }) => {
  const m = useMat(warna, { emissive: warna, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
  return <>{Array.from({ length: n }).map((_, i) => { const t = (f * laju + rnd(i * 7)) % 1; return <mesh key={i} material={m} position={[asal[0] + (rnd(i) - 0.5) * sebar * (1 + t), asal[1] + t * tinggi, asal[2] + (rnd(i + 2) - 0.5) * sebar]} scale={1 - t * 0.6}><sphereGeometry args={[size, 8, 8]} /></mesh>; })}</>;
};

// ============ S0 Pembuka ============
const S0: Adegan = {
  kode: "BEDAH BAHAN BAKU", judul: "Batubara Kokas", han: "炼焦煤 Liànjiāo Méi",
  kamera: (c) => orbit(c, 6.5, 1.2, [0, 0.3, 0], 0.4, -0.4),
  Tiga: ({ c }) => {
    const potong = interpolate(c.f, [c.T(1), c.T(1) + 40], [3, 0], ez);
    const kokas = muncul(c.f, c.T(2), 30);
    return (<><Lampu /><Bongkah seed={3} r={1.6} potong={potong} putar={c.f / 60} glow={kokas * 0.0} warna={kokas > 0.5 ? "#6e737a" : "#1b1d22"} kilap={kokas > 0.5 ? 0.1 : 0.4} />
      {c.f > c.T(1) && Array.from({ length: 60 }).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 2, (rnd(i + 1) - 0.5) * 2, -rnd(i + 2) * 1.2]} scale={kokas * 0.6 + 0.4}><sphereGeometry args={[0.05 + rnd(i + 3) * 0.06, 8, 8]} /><meshStandardMaterial color="#0a0a0a" /></mesh>)}</>);
  },
  Atas: ({ c }) => (<>
    <Kartu c={c} items={[{ i: 1, teks: "Bahan baku utama pabrik kokas", warna: "#f59e0b" }, { i: 2, teks: "Kokas 焦炭: padat, kuat, berpori", sub: "dipanaskan TANPA udara", warna: "#94a3b8" }, { i: 3, teks: "Tidak semua batubara bisa!", warna: "#ef4444", tanda: "⚠" }]} kanan={360} />
    <Adriy pose="setengah_ide_tablet" o={muncul(c.f, c.T(1))} x={730} y={1130} h={450} />
  </>),
};

// ============ S1 Pendahuluan ============
const S1: Adegan = {
  kode: "PENDAHULUAN", judul: "Dari Batubara Menjadi Kokas", han: "炭化室 Tànhuà Shì",
  kamera: (c) => jalur(c, [[0, [5, 4, 9], [0, 0.3, 0]], [3, [3, 2.5, 7.5], [0, 0, 0]], [7, [20 + 0, 2.2, 7.5], [20, 0.3, 0]], [11, [6, 3, 8], [0, 0, 0]]]),
  Tiga: ({ c }) => {
    const matang = interpolate(c.f, [c.T(1), c.E(2)], [0, 1], cl);
    const bakar = interpolate(c.f, [c.T(8), c.E(8)], [0, 1], cl);
    const urai = interpolate(c.f, [c.T(9), c.E(10)], [0, 1], cl);
    return (<><Lampu />
      <Baterai matang={matang} gas={c.f > c.T(1) && c.f < c.T(7) ? 1 : 0} f={c.f} potong={interpolate(c.f, [0, 40], [3, 0], ez)} />
      <group position={[20, 0, 0]}>
        {/* kiri: dengan udara → terbakar jadi abu */}
        <group position={[-1.8, -0.6, 0]}>
          <Bongkah seed={5} r={0.8 * (1 - bakar * 0.75)} glow={bakar * 1.2} warna={bakar > 0.7 ? "#9ca3af" : "#1b1d22"} />
          {bakar > 0 && bakar < 0.95 && <Api f={c.f} pos={[0, -0.3, 0]} s={0.9} />}
        </group>
        {/* kanan: kotak tertutup tanpa udara */}
        <group position={[1.8, -0.6, 0]}>
          <mesh><boxGeometry args={[2, 2.2, 2]} /><meshStandardMaterial color="#9fd3ff" transparent opacity={0.18} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.15, 0.15, 0.6, 12]} /><meshStandardMaterial color="#77808c" /></mesh>
          <Bongkah seed={7} r={0.7} glow={urai * 0.6} warna={urai > 0.6 ? "#7b8189" : "#1b1d22"} kilap={0.2} />
          {urai > 0.05 && <Partikel n={18} f={c.f} warna="#ffd060" asal={[0, 0.4, 0]} tinggi={2.4} sebar={0.3} />}
        </group>
      </group>
    </>);
  },
  Atas: ({ c }) => (<>
    <Kartu c={c} items={[
      { i: 0, teks: "Ruang Karbonisasi 炭化室", sub: "ruang tertutup, tanpa udara", warna: "#f97316" },
      { i: 1, teks: "Melunak → gas & cairan → menyatu", warna: "#fbbf24" },
      { i: 3, teks: "Batubara Kokas 炼焦煤 Liànjiāo Méi", warna: "#f59e0b" },
      { i: 4, teks: "Tambang → dipilih → disiapkan & dicampur", tanda: "①②③", warna: "#38bdf8" },
      { i: 5, teks: "Diisikan → dipanaskan tanpa udara", tanda: "④⑤", warna: "#38bdf8" },
      { i: 6, teks: "Kokas 焦炭 + gas → pemurnian gas 煤气净化", tanda: "⑥⑦", warna: "#22c55e" },
      { i: 8, teks: "Dengan oksigen: terbakar → abu + panas", warna: "#ef4444", tanda: "🔥" },
      { i: 9, teks: "Tanpa udara: terurai, bukan terbakar", sub: "gas keluar, karbon padat tertinggal", warna: "#22c55e", tanda: "✓" },
      { i: 11, teks: "Panas dari ruang pembakaran di balik dinding", warna: "#f97316" },
    ]} maks={3} />
    {c.f > c.T(7) - 20 && c.f < c.T(11) - 20 && (<>
      <Teks o={muncul(c.f, c.T(7))} x={140} y={420} size={40} warna="#fca5a5">Dengan udara</Teks>
      <Teks o={muncul(c.f, c.T(7))} x={640} y={420} size={40} warna="#86efac">Tanpa udara</Teks>
    </>)}
  </>),
};

// ============ S2 Pengertian & pembatubaraan ============
const LAPIS = [
  { n: "Sisa tumbuhan", w: "#3f7d2a", y: 2.1 }, { n: "Gambut 泥炭 Nítàn", w: "#6b4a2b", y: 1.35 }, { n: "Batubara cokelat 褐煤 Hèméi", w: "#4a3320", y: 0.55 },
  { n: "Bituminus 烟煤 Yānméi", w: "#1e1f24", y: -0.25 }, { n: "Antrasit 无烟煤 Wúyānméi", w: "#0b0b0e", y: -1.05 },
];
const S2: Adegan = {
  kode: "1.1", judul: "Pengertian Batubara", han: "煤炭 Méitàn · 煤化作用",
  kamera: (c) => jalur(c, [[0, [6, 2.5, 8], [0, 0.6, 0]], [5, [4.5, 1.5, 7.5], [0, 0.4, 0]], [9, [14, 2, 8], [12, 0.6, 0]], [12, [27, 1.2, 7], [26, 0, 0]]]),
  Tiga: ({ c }) => {
    const aktif = c.idx >= 5 && c.idx <= 8 ? c.idx - 4 : c.idx >= 2 && c.idx <= 4 ? 0 : -1;
    const tekan = muncul(c.f, c.T(3), 20);
    const batang = muncul(c.f, c.T(9), 30);
    const skala = muncul(c.f, c.T(12), 30);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.6), []);
    return (<><Lampu />
      {LAPIS.map((l, i) => (
        <mesh key={i} position={[0, l.y, 0]}><boxGeometry args={[4.4, 0.78, 3]} /><meshStandardMaterial color={l.w} roughness={i >= 3 ? 0.35 : 0.9} metalness={i === 4 ? 0.4 : 0.05} emissive="#f59e0b" emissiveIntensity={aktif === i ? 0.35 + 0.2 * Math.sin(c.f / 6) : 0} clippingPlanes={[plane]} side={THREE.DoubleSide} /></mesh>
      ))}
      {Array.from({ length: 9 }).map((_, i) => <mesh key={i} position={[-1.8 + (i % 5) * 0.9, 2.9, -1 + Math.floor(i / 5) * 0.9]}><coneGeometry args={[0.22, 0.9, 8]} /><meshStandardMaterial color="#3fa34d" /></mesh>)}
      {tekan > 0 && [-1.5, 0, 1.5].map((x) => <Panah key={x} a={[x, 5, 0.8]} b={[x, 3.6, 0.8]} warna="#60a5fa" s={tekan} tebal={0.08} />)}
      {tekan > 0 && <mesh position={[2.6, 0.5 - (1 - tekan) * 1.5, 0.8]} scale={[1, tekan, 1]}><cylinderGeometry args={[0.1, 0.1, 3, 12]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} /></mesh>}
      {/* grafik batang: karbon naik, air & zat terbang turun */}
      <group position={[12, -1.2, 0]}>
        {[[25, 90], [45, 60], [75, 35], [92, 8]].map(([k, v], i) => (
          <group key={i} position={[-2.4 + i * 1.6, 0, 0]}>
            <mesh position={[-0.3, (k / 100) * 3 * batang / 2, 0]} scale={[1, Math.max(0.01, batang), 1]}><boxGeometry args={[0.5, (k / 100) * 3, 0.5]} /><meshStandardMaterial color="#334155" emissive="#64748b" emissiveIntensity={0.3} /></mesh>
            <mesh position={[0.3, (v / 100) * 3 * batang / 2, 0]} scale={[1, Math.max(0.01, batang), 1]}><boxGeometry args={[0.5, (v / 100) * 3, 0.5]} /><meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.3} /></mesh>
          </group>
        ))}
      </group>
      {/* skala Vdaf */}
      <group position={[26, 0, 0]}>
        {[[0, 10, "#0b0b0e"], [10, 37, "#2d2f36"], [37, 55, "#5b3a22"]].map(([a, b, w], i) => (
          <mesh key={i} position={[-3 + ((Number(a) + Number(b)) / 2) / 55 * 6, 0, 0]} scale={[Math.max(0.01, skala), 1, 1]}><boxGeometry args={[(Number(b) - Number(a)) / 55 * 6, 0.7, 0.7]} /><meshStandardMaterial color={String(w)} emissive="#f59e0b" emissiveIntensity={0.12} /></mesh>
        ))}
      </group>
    </>);
  },
  Atas: ({ c }) => {
    const urut = c.idx >= 2 && c.idx <= 8;
    const batang = c.idx >= 9 && c.idx <= 11; const skala = c.idx >= 12;
    return (<>
      {urut && LAPIS.map((l, i) => <Teks key={i} o={muncul(c.f, i === 0 ? c.T(2) : c.T(4 + i)) * (i === (c.idx >= 5 ? c.idx - 4 : 0) ? 1 : 0.55)} x={40} y={[470, 590, 700, 810, 920][i]} size={32} bg="rgba(8,12,20,.8)">{l.n}</Teks>)}
      {urut && <Teks o={muncul(c.f, c.T(3))} x={720} y={420} size={30} warna="#bfdbfe">⬇ tekanan · 🌡 suhu · ⏳ jutaan tahun</Teks>}
      {batang && <><Teks o={1} x={90} y={420} size={34} warna="#cbd5e1">■ karbon  <span style={{ color: "#38bdf8" }}>■ air & zat terbang</span></Teks><Teks o={1} x={60} y={1080} size={28} warna="#e2e8f0" bg="none">Gambut · Cokelat · Bituminus · Antrasit</Teks></>}
      {skala && <><Teks o={muncul(c.f, c.T(12))} x={540} y={480} center size={36}>Vdaf (zat terbang, kering bebas abu)</Teks><Teks o={muncul(c.f, c.T(13))} x={60} y={900} w={960} size={30} bg="none">≤10% Antrasit 无烟煤 · 10–37% Bituminus 烟煤 · &gt;37% Cokelat 褐煤</Teks></>}
      <Kartu c={c} items={[
        { i: 1, teks: "Bahan padat kaya karbon dari tumbuhan purba", warna: "#22c55e" },
        { i: 4, teks: "Pembatubaraan 煤化作用 Méihuà Zuòyòng", warna: "#f59e0b" },
        { i: 7, teks: "Bituminus → dipakai untuk kokas", tanda: "✓", warna: "#22c55e" },
        { i: 9, teks: "Makin tua: karbon ↑, air & zat terbang ↓", warna: "#38bdf8" },
        { i: 10, teks: "Antrasit TIDAK melunak → tidak bisa jadi kokas", tanda: "✗", warna: "#ef4444" },
        { i: 12, teks: "Klasifikasi Tiongkok GB/T 5751", warna: "#a78bfa" },
      ]} maks={3} />
    </>);
  },
};

// ============ S3 Batubara kokas & tahapan ============
const SUHU = [25, 25, 25, 25, 25, 25, 150, 280, 380, 400, 430, 480, 1000];
const S3: Adegan = {
  kode: "1.2", judul: "Batubara untuk Kokas", han: "炼焦煤 Liànjiāo Méi",
  kamera: (c) => jalur(c, [[0, [0, 2.5, 9], [0, 0, 0]], [5, [20, 0.5, 7.5], [20, 0, 0]], [16, [40, 4, 7], [40, -0.2, 0]]]),
  Tiga: ({ c }) => {
    const st = c.idx; // tahap 6..12
    const p = (i: number) => muncul(c.f, c.T(i), 25);
    const lunak = p(8), plastis = p(9), satu = p(10), padat = p(11), susut = p(12);
    const warna = new THREE.Color("#1d1f24").lerp(new THREE.Color("#ff7a1a"), Math.min(lunak, 1 - padat * 0.9)).lerp(new THREE.Color("#8b9097"), padat);
    const gerak = interpolate(c.f, [c.T(18), c.E(18)], [0, 1], ez); const tekan = muncul(c.f, c.T(19), 20);
    return (<><Lampu />
      {/* bandingkan: boiler vs oven */}
      <group position={[-2.2, -0.8, 0]}>
        <mesh position={[0, 0.6, 0]}><boxGeometry args={[2, 2.4, 1.8]} /><meshStandardMaterial color="#64748b" transparent opacity={0.35} /></mesh>
        <Bongkah seed={9} r={0.5} glow={1} pos={[0, 0, 0]} />
        <Api f={c.f} pos={[0, -0.1, 0]} s={0.8} />
        <mesh position={[0.6, 2.6, 0]}><cylinderGeometry args={[0.2, 0.25, 1.6, 12]} /><meshStandardMaterial color="#475569" /></mesh>
        <Partikel n={14} f={c.f} warna="#9ca3af" asal={[0.6, 3.3, 0]} tinggi={1.5} sebar={0.4} size={0.15} />
      </group>
      <group position={[2.2, -0.8, 0]}>
        <mesh position={[0, 0.6, 0]}><boxGeometry args={[1.4, 2.4, 1.8]} /><meshStandardMaterial color="#a1543a" emissive="#ff4d00" emissiveIntensity={0.2} transparent opacity={0.45} /></mesh>
        <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.9, 1.9, 1.4]} /><meshStandardMaterial color={c.f > c.T(3) ? "#8b9097" : "#1d1f24"} /></mesh>
        {c.f > c.T(3) && <Partikel n={12} f={c.f} warna="#ffd060" asal={[0, 1.9, 0]} tinggi={1.5} sebar={0.3} />}
      </group>
      {/* mikro: butiran di antara dua dinding panas */}
      <group position={[20, 0, 0]}>
        {[-2.6, 2.6].map((x) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.4, 5, 1.6]} /><meshStandardMaterial color="#a1543a" emissive="#ff4d00" emissiveIntensity={0.35 + 0.1 * Math.sin(c.f / 7)} /></mesh>)}
        <group scale={[1 - susut * 0.08, 1 - susut * 0.04, 1]}>
          {Array.from({ length: 90 }).map((_, i) => {
            const gx = (i % 9) - 4, gy = Math.floor(i / 9) - 4.5;
            const s = 0.22 * (1 + lunak * 0.12 + satu * 0.25) * (0.85 + rnd(i) * 0.3);
            return <mesh key={i} position={[gx * 0.5 + (rnd(i + 1) - 0.5) * 0.1, gy * 0.48, (rnd(i + 2) - 0.5) * 0.4]} scale={s}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={warna} roughness={plastis > 0.5 && padat < 0.5 ? 0.25 : 0.8} emissive="#ff5a00" emissiveIntensity={Math.max(0, lunak - padat) * 0.5} /></mesh>;
          })}
          {/* uap air (tahap 1) */}
          {st === 6 && <Partikel n={30} f={c.f} warna="#60a5fa" asal={[0, -2, 0.4]} tinggi={4} sebar={4} size={0.06} />}
          {st === 7 && <Partikel n={30} f={c.f} warna="#fde68a" asal={[0, -2, 0.4]} tinggi={4} sebar={4} size={0.07} />}
          {/* retakan saat menyusut */}
          {susut > 0 && [-1.5, 0.3, 1.6].map((x, k) => <mesh key={k} position={[x, 0.4 - k * 0.6, 0.45]} rotation={[0, 0, 0.3 * (k - 1)]} scale={[1, susut, 1]}><boxGeometry args={[0.04, 2.2, 0.05]} /><meshStandardMaterial color="#000" /></mesh>)}
        </group>
      </group>
      {/* lapisan plastis bergerak dari dua dinding ke tengah */}
      <group position={[40, 0, 0]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (2.8 + tekan * 0.15), 0, 0]}><boxGeometry args={[0.4, 4.4, 2]} /><meshStandardMaterial color="#a1543a" emissive="#ff4d00" emissiveIntensity={0.35} /></mesh>)}
        {[-1, 1].map((s) => {
          const x = s * (2.5 - gerak * 2.5);
          return (<group key={s}>
            <mesh position={[(s * 2.6 + x) / 2, 0, 0]} scale={[Math.max(0.01, Math.abs(s * 2.6 - x)), 1, 1]}><boxGeometry args={[1, 4.2, 1.8]} /><meshStandardMaterial color="#8b9097" /></mesh>
            <mesh position={[x, 0, 0]}><boxGeometry args={[0.35, 4.2, 1.85]} /><meshStandardMaterial color="#ff8a2a" emissive="#ff6a00" emissiveIntensity={0.7} transparent opacity={0.9} /></mesh>
          </group>);
        })}
        <mesh position={[0, 0, 0]} scale={[Math.max(0.01, 5 * (1 - gerak) - 0.3), 1, 1]}><boxGeometry args={[1, 4.2, 1.8]} /><meshStandardMaterial color="#1d1f24" /></mesh>
        {tekan > 0 && [-1, 1].map((s) => [1.2, 0, -1.2].map((y) => <Panah key={`${s}${y}`} a={[s * 0.6, y, 1.1]} b={[s * 2.7, y, 1.1]} warna="#ef4444" s={tekan} />))}
      </group>
    </>);
  },
  Atas: ({ c }) => {
    const mikro = c.idx >= 5 && c.idx <= 15;
    const tahap = Math.max(0, Math.min(12, c.idx));
    return (<>
      {c.idx <= 4 && <><Teks o={1} x={90} y={430} size={34} warna="#fca5a5">Bahan bakar 动力煤</Teks><Teks o={1} x={600} y={430} size={34} warna="#86efac">Kokas 炼焦煤</Teks></>}
      {mikro && <div style={{ position: "absolute", top: 410, right: 60, fontFamily: FONT, textAlign: "right" }}>
        <div style={{ fontSize: 30, color: "#fca5a5", fontWeight: 800 }}>suhu ±</div>
        <div style={{ fontSize: 96, color: "#fff", fontWeight: 900, textShadow: "0 0 20px #f97316" }}>{Math.round(interpolate(c.f, [c.T(Math.max(5, tahap)), c.T(Math.max(5, tahap)) + 30], [SUHU[Math.max(5, tahap - 1)], SUHU[Math.max(5, tahap)]], cl))}°C</div>
      </div>}
      {c.idx >= 16 && <Teks o={1} x={540} y={430} center size={34}>Panas masuk dari <span style={{ color: "#f97316" }}>kedua dinding</span></Teks>}
      <Kartu c={c} items={[
        { i: 1, teks: "Bahan bakar: dibakar dengan udara → abu + gas buang", warna: "#ef4444" },
        { i: 3, teks: "Kokas: tanpa udara → kokas + gas + tar", warna: "#22c55e" },
        { i: 6, teks: "Pengeringan 水分蒸发 (< 200 °C)", tanda: "1", warna: "#60a5fa" },
        { i: 7, teks: "Penguraian 热分解 (200–350 °C)", tanda: "2", warna: "#fde68a" },
        { i: 8, teks: "Pelunakan 软化 (350–400 °C)", tanda: "3", warna: "#fb923c" },
        { i: 9, teks: "Lapisan plastis 胶质层", tanda: "4", warna: "#f97316" },
        { i: 10, teks: "Penyatuan butiran", tanda: "5", warna: "#f97316" },
        { i: 11, teks: "Pemadatan → semi-kokas 半焦 (450–500 °C)", tanda: "6", warna: "#94a3b8" },
        { i: 12, teks: "Kokas 焦炭: pusat kue 950–1050 °C", tanda: "7", warna: "#cbd5e1" },
        { i: 13, teks: "Suhu = perkiraan literatur, bukan SOP", tanda: "ⓘ", warna: "#a78bfa" },
        { i: 15, teks: "Tidak menyatu → kokas lemah, mudah hancur", tanda: "⚠", warna: "#ef4444" },
        { i: 18, teks: "Lapisan plastis bergerak ke tengah", warna: "#f97316" },
        { i: 19, teks: "Gas terperangkap → tekanan pemuaian 膨胀压力", tanda: "⚠", warna: "#ef4444" },
      ]} maks={3} />
    </>);
  },
};

// ============ S4 Komponen ============
const KOMP = [
  { n: "Air 水分", v: 6, w: "#38bdf8" }, { n: "Abu 灰分", v: 9, w: "#9ca3af" }, { n: "Zat terbang 挥发分", v: 26, w: "#facc15" }, { n: "Karbon tetap 固定碳", v: 59, w: "#334155" },
];
const S4: Adegan = {
  kode: "1.3", judul: "Komponen Batubara", han: "煤质组成 Méizhì Zǔchéng",
  kamera: (c) => jalur(c, [[0, [1.5, 1.5, 8.5], [1.2, 0.2, 0]], [25, [3, 1, 7], [1.5, 0, 0]], [34, [21, 1.2, 8], [20, 0.4, 0]]]),
  Tiga: ({ c }) => {
    const k = c.idx <= 6 ? 0 : c.idx <= 14 ? 1 : c.idx <= 20 ? 2 : c.idx <= 24 ? 3 : -1;
    const sulfur = c.idx >= 25 && c.idx <= 29, fosfor = c.idx >= 30 && c.idx <= 33;
    let y = -2;
    const patah = muncul(c.f, c.T(32), 15);
    return (<><Lampu />
      <Bongkah seed={4} r={1.25} pos={[-0.7, 0.2, 0]} potong={0} putar={0.6 + c.f / 200} />
      {/* titik di dalam potongan: air, pirit, fosfor */}
      {k === 0 && Array.from({ length: 26 }).map((_, i) => <mesh key={i} position={[-0.7 + (rnd(i) - 0.5) * 1.8, 0.2 + (rnd(i + 1) - 0.5) * 1.6, i < 13 ? 0.02 : -0.3]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.6} /></mesh>)}
      {k === 2 && <Partikel n={34} f={c.f} warna="#facc15" asal={[-0.7, 0.9, 0]} tinggi={2.6} sebar={1.2} size={0.07} />}
      {sulfur && Array.from({ length: 12 }).map((_, i) => <mesh key={i} position={[-0.7 + (rnd(i + 4) - 0.5) * 1.6, 0.2 + (rnd(i + 6) - 0.5) * 1.4, 0.05]} rotation={[i, i, 0]}><boxGeometry args={[0.13, 0.13, 0.13]} /><meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.25} emissive="#a16207" emissiveIntensity={0.4} /></mesh>)}
      {sulfur && c.idx >= 28 && <Partikel n={16} f={c.f} warna="#bef264" asal={[-0.7, 1, 0]} tinggi={2} sebar={0.8} size={0.07} />}
      {fosfor && Array.from({ length: 12 }).map((_, i) => <mesh key={i} position={[-0.7 + (rnd(i + 8) - 0.5) * 1.6, 0.2 + (rnd(i + 9) - 0.5) * 1.4, 0.05]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#c084fc" emissive="#9333ea" emissiveIntensity={0.7} /></mesh>)}
      {/* batang baja patah (fosfor) */}
      {c.idx >= 32 && c.idx <= 33 && [-1, 1].map((s) => <mesh key={s} position={[1.9 + s * (0.55 + patah * 0.15), -1.6, 0.5]} rotation={[0, 0, s * patah * 0.15]}><boxGeometry args={[1, 0.22, 0.22]} /><meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} /></mesh>)}
      {/* kolom komposisi */}
      <group position={[2.2, 0, 0]}>
        {KOMP.map((m, i) => { const h = m.v / 100 * 4; const cy = y + h / 2; y += h; return (
          <mesh key={i} position={[0, cy, 0]} scale={k === i ? [1.25, 1, 1.25] : [1, 1, 1]}><cylinderGeometry args={[0.55, 0.55, h - 0.03, 32]} /><meshStandardMaterial color={m.w} emissive={m.w} emissiveIntensity={k === i ? 0.45 : 0.08} transparent opacity={k === -1 || k === i ? 1 : 0.45} /></mesh>); })}
      </group>
      {/* basis analisis: ar, ad, d, daf */}
      <group position={[20, -1.6, 0]}>
        {[[6, 9, 26, 59], [2, 9, 26, 59], [0, 9, 26, 59], [0, 0, 26, 59]].map((col, j) => { let yy = 0; return (
          <group key={j} position={[-2.7 + j * 1.8, 0, 0]}>
            {col.map((v, i) => { const h = v / 100 * 3.6; const cy = yy + h / 2; yy += h; return v ? <mesh key={i} position={[0, cy * muncul(c.f, c.T(35) + j * 10, 20), 0]}><boxGeometry args={[1.1, Math.max(0.01, h - 0.02), 1.1]} /><meshStandardMaterial color={KOMP[i].w} emissive={KOMP[i].w} emissiveIntensity={0.2} /></mesh> : null; })}
          </group>); })}
      </group>
    </>);
  },
  Atas: ({ c }) => (<>
    {c.idx < 34 && KOMP.map((m, i) => <Teks key={i} o={1} x={700} y={[985, 910, 800, 600][i]} size={28} bg="rgba(8,12,20,.75)"><span style={{ color: m.w === "#334155" ? "#cbd5e1" : m.w }}>{m.n}</span></Teks>)}
    {c.idx >= 5 && c.idx <= 6 && <Teks o={muncul(c.f, c.T(5))} x={60} y={430} size={44} warna="#7dd3fc">🌡 tertahan ±100 °C</Teks>}
    {c.idx >= 11 && c.idx <= 12 && <Teks o={muncul(c.f, c.T(11))} x={60} y={430} size={40} warna="#e5e7eb">Abu kokas ≈ 9,0 ÷ 0,75 = <b style={{ color: "#fbbf24" }}>12%</b></Teks>}
    {c.idx >= 16 && c.idx <= 17 && <Teks o={muncul(c.f, c.T(16))} x={60} y={430} w={600} size={30} warna="#fde68a">gas · uap air · tar · amonia · benzena · naftalena · H₂S</Teks>}
    {c.idx >= 23 && c.idx <= 24 && <Teks o={muncul(c.f, c.T(23))} x={60} y={430} size={36} warna="#e5e7eb">FC = 100 − 1,5 − 9,0 − 26,0 = <b style={{ color: "#fbbf24" }}>63,5%</b></Teks>}
    {c.idx >= 27 && c.idx <= 29 && <Teks o={muncul(c.f, c.T(27))} x={60} y={430} size={36} warna="#fde047">60–80% di kokas · sisanya H₂S di gas</Teks>}
    {c.idx >= 35 && ["ar 收到基", "ad 空气干燥基", "d 干燥基", "daf 干燥无灰基"].map((t, j) => <Teks key={j} o={muncul(c.f, c.T(35) + j * 10)} x={[110, 345, 590, 800][j]} y={1080} size={26} bg="none">{t}</Teks>)}
    <Kartu c={c} items={[
      { i: 0, teks: "Simpan video ini biar gampang diulang", tanda: "🔖", warna: "#f472b6" },
      { i: 2, teks: "① Kadar air 水分", sub: "air bebas 外在 + air bawaan 内在 = air total 全水分 (Mt)", warna: "#38bdf8" },
      { i: 6, teks: "Air banyak → pematangan lebih lama", warna: "#38bdf8" },
      { i: 7, teks: "② Kadar abu 灰分", sub: "mineral tak terbakar → masuk kokas", warna: "#9ca3af" },
      { i: 13, teks: "SiO₂ · Al₂O₃ · Fe₂O₃ · CaO · alkali (K, Na)", sub: "alkali tinggi → kekuatan kokas turun", warna: "#9ca3af" },
      { i: 15, teks: "③ Zat terbang 挥发分", sub: "→ gas oven kokas mentah → pemurnian gas", warna: "#facc15" },
      { i: 19, teks: "Zat terbang ↑ → gas & tar ↑, kokas ↓ & retak", warna: "#facc15" },
      { i: 20, teks: "Uji lab: dipanaskan tanpa udara ±900 °C", warna: "#facc15" },
      { i: 21, teks: "④ Karbon tetap 固定碳 → kerangka kokas", sub: "dihitung, bukan diukur", warna: "#64748b" },
      { i: 25, teks: "⑤ Sulfur 硫", sub: "pirit FeS₂ · organik · sulfat", warna: "#eab308" },
      { i: 29, teks: "Sulfur → baja rapuh saat panas", tanda: "⚠", warna: "#eab308" },
      { i: 30, teks: "⑥ Fosfor 磷: hampir semua tinggal di kokas", warna: "#c084fc" },
      { i: 32, teks: "Fosfor → baja getas saat dingin", tanda: "⚠", warna: "#c084fc" },
      { i: 33, teks: "Satu-satunya cara: pilih batubara fosfor rendah", warna: "#c084fc" },
      { i: 34, teks: "Basis analisis: ar · ad · d · daf", sub: "bandingkan selalu dengan basis yang sama", warna: "#a78bfa" },
    ]} maks={2} />
  </>),
};

// ============ S5 Sifat ============
const S5: Adegan = {
  kode: "1.4", judul: "Sifat Penting Batubara Kokas", han: "炼焦煤性质 Xìngzhì",
  kamera: (c) => jalur(c, [[0, [0, 1.5, 8], [0, 0, 0]], [5, [12, 1.2, 7.5], [12, 0, 0]], [9, [24, 3, 6.5], [24, 0, 0]], [12, [36, 1, 8], [36, 0, 0]], [17, [48, 4, 6.5], [48, -0.5, 0]]]),
  Tiga: ({ c }) => {
    const ikat = muncul(c.f, c.T(2), 40);
    const retak = muncul(c.f, c.T(8), 20);
    const muai = interpolate(c.f, [c.T(13), c.T(14) + 20, c.T(15), c.T(16) + 20], [0, 1, 1, -0.6], cl);
    const dorong = interpolate(c.f, [c.T(16) + 20, c.E(16)], [0, 1], ez);
    const cair = c.idx === 10 ? 0.3 + 0.7 * ((c.f / 60) % 1) : 1;
    return (<><Lampu />
      {/* butiran saling mengikat */}
      {Array.from({ length: 16 }).map((_, i) => <mesh key={i} position={[((i % 4) - 1.5) * (1 - ikat * 0.25), (Math.floor(i / 4) - 1.5) * (1 - ikat * 0.25), 0]}><dodecahedronGeometry args={[0.34, 0]} /><meshStandardMaterial color="#26282e" emissive="#ff7a1a" emissiveIntensity={ikat * 0.25} /></mesh>)}
      {ikat > 0.2 && Array.from({ length: 12 }).map((_, i) => { const a = i % 4, b = Math.floor(i / 4); return <mesh key={i} position={[(a - 1.5) * 0.75 + 0.37, (b - 1) * 0.75, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 0.5, 8]} /><meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={0.8} /></mesh>; })}
      {/* analogi lem & bangunan */}
      <group position={[12, -1.2, 0]}>
        {Array.from({ length: 20 }).map((_, i) => { const r = Math.floor(i / 4), k = i % 4; return <mesh key={i} position={[(k - 1.5) * 0.92 + (r % 2) * 0.46, r * 0.5, 0]}><boxGeometry args={[0.88, 0.45, 0.5]} /><meshStandardMaterial color="#b45309" /></mesh>; })}
        {retak > 0 && [[-0.5, 1.2, 0.4], [0.7, 0.6, -0.5], [0.1, 1.8, 0.2]].map(([x, yy, r], i) => <mesh key={i} position={[x, yy, 0.27]} rotation={[0, 0, r]} scale={[1, retak, 1]}><boxGeometry args={[0.05, 1.1, 0.02]} /><meshStandardMaterial color="#000" /></mesh>)}
      </group>
      {/* alat Gieseler: wadah + pengaduk */}
      <group position={[24, -1, 0]}>
        <mesh><cylinderGeometry args={[1, 1, 2, 32, 1, true]} /><meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.95, 0.95, 1.4, 32]} /><meshStandardMaterial color="#ff8a2a" emissive="#f97316" emissiveIntensity={0.5 * cair} /></mesh>
        <group rotation={[0, c.f * 0.08 * cair, 0]}>
          <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.06, 0.06, 2.4, 8]} /><meshStandardMaterial color="#e5e7eb" metalness={0.9} /></mesh>
          {[0, 1, 2].map((k) => <mesh key={k} position={[0, -0.1, 0]} rotation={[0, (k * Math.PI * 2) / 3, 0]}><boxGeometry args={[1.4, 0.08, 0.15]} /><meshStandardMaterial color="#e5e7eb" metalness={0.9} /></mesh>)}
        </group>
      </group>
      {/* pemuaian & penyusutan di oven */}
      <group position={[36, 0, 0]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (1.6 + Math.max(0, muai) * 0.25), 0, 0]}><boxGeometry args={[0.4, 3.4, 2]} /><meshStandardMaterial color="#a1543a" emissive="#ff0000" emissiveIntensity={Math.max(0, muai) * 0.5} /></mesh>)}
        <mesh position={[dorong * 4, 0, 0]} scale={[1 + muai * 0.1, 1, 1]}><boxGeometry args={[2.8, 3.1, 1.8]} /><meshStandardMaterial color={muai < 0 ? "#8b9097" : "#ff8a2a"} emissive="#f97316" emissiveIntensity={muai > 0 ? 0.4 : 0} /></mesh>
        {muai > 0.2 && [-1, 1].map((s) => [1, 0, -1].map((y) => <Panah key={`${s}${y}`} a={[s * 1.2, y, 1.1]} b={[s * 2.3, y, 1.1]} warna="#ef4444" s={muai} />))}
        <mesh position={[-2.6 + dorong * 4 - 0.4, 0, 0]}><boxGeometry args={[0.5, 2.6, 1.4]} /><meshStandardMaterial color="#2563eb" /></mesh>
      </group>
      {/* ayakan 3 mm */}
      <group position={[48, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2, 0.12, 12, 48]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
        {Array.from({ length: 9 }).map((_, i) => <mesh key={i} position={[(i - 4) * 0.42, 0, 0]}><boxGeometry args={[0.03, 0.03, 3.9]} /><meshStandardMaterial color="#cbd5e1" /></mesh>)}
        {Array.from({ length: 9 }).map((_, i) => <mesh key={`b${i}`} position={[0, 0, (i - 4) * 0.42]}><boxGeometry args={[3.9, 0.03, 0.03]} /><meshStandardMaterial color="#cbd5e1" /></mesh>)}
        {Array.from({ length: 40 }).map((_, i) => { const kecil = i % 3 !== 0; const t = ((c.f * 0.012 + rnd(i)) % 1); const yy = kecil ? 1.5 - t * 4 : 1.5 - Math.min(t, 0.37) * 4; return <mesh key={i} position={[(rnd(i + 1) - 0.5) * 3, yy, (rnd(i + 2) - 0.5) * 3]}><dodecahedronGeometry args={[kecil ? 0.08 : 0.24, 0]} /><meshStandardMaterial color="#1f2126" /></mesh>; })}
      </group>
    </>);
  },
  Atas: ({ c }) => (<>
    {c.idx >= 3 && c.idx <= 4 && <Teks o={1} x={60} y={430} size={40} warna="#fdba74">Indeks G 粘结指数 — makin tinggi makin kuat</Teks>}
    {c.idx >= 21 && <Teks o={muncul(c.f, c.T(21))} x={60} y={430} w={960} size={30} warna="#e2e8f0">📌 Materi lama: oven isi atas 7 m → 70–74% · oven pemadatan 5,5 m → 86–90%</Teks>}
    <Kartu c={c} items={[
      { i: 1, teks: "1.3 = isinya apa · 1.4 = perilakunya saat dipanaskan", warna: "#a78bfa" },
      { i: 2, teks: "① Kemampuan mengikat 粘结性", warna: "#fb923c" },
      { i: 4, teks: "② Kemampuan membentuk kokas 结焦性", warna: "#f59e0b" },
      { i: 6, teks: "Mengikat = kuat lemnya · membentuk kokas = bagus bangunannya", warna: "#f59e0b" },
      { i: 8, teks: "Batubara lemak 肥煤 sendirian → kokas banyak retak", tanda: "⚠", warna: "#ef4444" },
      { i: 9, teks: "③ Kecairan 流动性 — alat Gieseler (ddpm)", warna: "#f97316" },
      { i: 11, teks: "Kuncinya SESUAI, bukan setinggi-tingginya", warna: "#22c55e" },
      { i: 12, teks: "④ Pemuaian & penyusutan 膨胀与收缩", warna: "#ef4444" },
      { i: 14, teks: "Muai berlebih → dinding tertekan, bata retak", tanda: "⚠", warna: "#ef4444" },
      { i: 15, teks: "Susut kurang → sulit didorong 难推焦", tanda: "⚠", warna: "#ef4444" },
      { i: 16, teks: "Susut di akhir → celah → kokas lancar didorong", tanda: "✓", warna: "#22c55e" },
      { i: 17, teks: "⑤ Ukuran butiran 粒度", warna: "#38bdf8" },
      { i: 18, teks: "Terlalu kasar → kurang seragam, retak", warna: "#38bdf8" },
      { i: 19, teks: "Terlalu halus → kepadatan turun, berdebu", warna: "#38bdf8" },
      { i: 20, teks: "Kehalusan 细度 = % lolos ayakan 3 mm", warna: "#38bdf8" },
      { i: 22, teks: "Lab: Y 胶质层 · X 收缩 · b 膨胀 · FSI · Ro 反射率", warna: "#a78bfa" },
    ]} maks={2} />
  </>),
};

// ============ S6 Campuran ============
const JENIS = [{ n: "Gas 气煤", w: "#60a5fa" }, { n: "Lemak 肥煤", w: "#f59e0b" }, { n: "Kokas utama 焦煤", w: "#ef4444" }, { n: "Kurus 瘦煤", w: "#a3a3a3" }];
const S6: Adegan = {
  kode: "1.5", judul: "Pencampuran Batubara", han: "配煤 Pèiméi → 配合煤",
  kamera: (c) => orbit(c, 10, 4, [0, 0.5, 0], 0.5, -0.4),
  Tiga: ({ c }) => {
    const aktif = c.idx >= 3 && c.idx <= 6 ? c.idx - 3 : -1;
    const timbun = interpolate(c.f, [c.T(8), c.d], [0.3, 1], cl);
    return (<><Lampu />
      {JENIS.map((j, i) => (
        <group key={i} position={[-3.3 + i * 2.2, 1.6, -0.6]}>
          <mesh><cylinderGeometry args={[0.8, 0.8, 2.4, 24]} /><meshStandardMaterial color={j.w} emissive={j.w} emissiveIntensity={aktif === i ? 0.5 + 0.2 * Math.sin(c.f / 6) : 0.1} /></mesh>
          <mesh position={[0, -1.6, 0]}><coneGeometry args={[0.8, 0.8, 24]} /><meshStandardMaterial color={j.w} /></mesh>
          <mesh position={[0, -2.15, 0]}><boxGeometry args={[0.9, 0.2, 0.7]} /><meshStandardMaterial color="#1f2937" /></mesh>
        </group>
      ))}
      <mesh position={[0, -0.75, -0.6]}><boxGeometry args={[9, 0.12, 0.9]} /><meshStandardMaterial color="#111827" /></mesh>
      {Array.from({ length: 36 }).map((_, i) => { const t = ((c.f * 0.006 + i / 36) % 1); const j = i % 4; return <mesh key={i} position={[-3.3 + j * 2.2 + t * 8, -0.6, -0.6 + (rnd(i) - 0.5) * 0.4]}><dodecahedronGeometry args={[0.12, 0]} /><meshStandardMaterial color={JENIS[j].w} /></mesh>; })}
      <mesh position={[5.2, -0.3, -0.6]}><boxGeometry args={[1.4, 1.4, 1.4]} /><meshStandardMaterial color="#475569" metalness={0.5} /></mesh>
      <mesh position={[5.2, -1.8 + timbun * 0.5, 1.4]} scale={[timbun, timbun, timbun]}><coneGeometry args={[1.2, 1.2, 24]} /><meshStandardMaterial color="#2a2c32" /></mesh>
    </>);
  },
  Atas: ({ c }) => (<>
    {JENIS.map((j, i) => <Teks key={i} o={muncul(c.f, c.T(3 + i) - 30) * (c.idx === 3 + i || c.idx > 6 ? 1 : 0.6)} x={[60, 300, 540, 800][i]} y={430} size={28} bg="rgba(8,12,20,.85)"><span style={{ color: j.w }}>■</span> {j.n}</Teks>)}
    <Kartu c={c} items={[
      { i: 1, teks: "Pencampuran 配煤 → campuran 配合煤", warna: "#f59e0b" },
      { i: 2, teks: "Tak ada yang sempurna · mahal · keamanan oven · stabil", warna: "#a78bfa" },
      { i: 3, teks: "Gas 气煤: zat terbang tinggi, tambah gas", sub: "berlebihan → kokas kecil & retak", warna: "#60a5fa" },
      { i: 4, teks: "Lemak 肥煤: \"lem\" campuran", sub: "daya ikat sangat kuat, daerah plastis lebar", warna: "#f59e0b" },
      { i: 5, teks: "Kokas utama 焦煤: tulang punggung", sub: "menghasilkan kokas kuat", warna: "#ef4444" },
      { i: 6, teks: "Kurus 瘦煤: kurangi retak, tambah ukuran", warna: "#a3a3a3" },
      { i: 7, teks: "Juga: 1/3 焦煤 dan gas-lemak 气肥煤", warna: "#94a3b8" },
      { i: 8, teks: "Disimpan terpisah → ditakar → dicampur", warna: "#22c55e" },
      { i: 9, teks: "Perbandingan TIDAK dari nama jenis", tanda: "⚠", warna: "#ef4444" },
      { i: 10, teks: "Dari uji bahan, target mutu, kondisi oven, aturan pabrik", warna: "#ef4444" },
      { i: 11, teks: "Operator: timbangan akurat, pengumpan lancar, silo terisi", warna: "#22c55e", tanda: "👷" },
      { i: 12, teks: "📌 Materi lama: kesalahan timbangan ≤ 0,5%", warna: "#fbbf24" },
    ]} maks={3} kanan={c.idx >= 11 ? 360 : 50} />
    <Adriy pose="setengah_ok_laptop" o={antara(c.f, c.T(11), c.d)} x={730} y={1130} h={450} />
  </>),
};

// ============ S7 Pengaruh ============
const S7: Adegan = {
  kode: "1.6", judul: "Pengaruh Kualitas Batubara", han: "煤质对生产的影响",
  kamera: (c) => jalur(c, [[0, [4, 3, 9], [0, 0, 0]], [8, [12, 1.2, 6.5], [12, 0, 0]], [10, [4, 3, 9], [0, 0, 0]]]),
  Tiga: ({ c }) => {
    const tekan = c.idx === 6 ? 1 : 0;
    return (<><Lampu />
      <Baterai matang={0.8 + 0.2 * Math.sin(c.f / 40)} gas={c.idx === 4 || c.idx === 3 ? 1.4 : 0.6} f={c.f} />
      {tekan > 0 && [-1, 1].map((s) => [0.8, -0.8].map((y) => <Panah key={`${s}${y}`} a={[s * 0.1, y, 2.3]} b={[s * 1.1, y, 2.3]} warna="#ef4444" />))}
      <group position={[12, 0, 0]}>
        <Bongkah seed={11} r={0.9} pos={[-1.3, 0, 0]} warna="#16171a" kilap={0.05} putar={c.f / 80} />
        <Bongkah seed={13} r={0.9} pos={[1.3, 0, 0]} warna="#b8bec6" kilap={0.7} putar={-c.f / 80} />
        {[0, 1, 2].map((k) => <mesh key={k} position={[1.3 + (k - 1) * 0.35, 0, 0.85]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.04, 1.4, 0.04]} /><meshStandardMaterial color="#111" /></mesh>)}
      </group>
    </>);
  },
  Atas: ({ c }) => (<>
    {c.idx >= 8 && c.idx <= 9 && <><Teks o={muncul(c.f, c.T(8))} x={90} y={430} size={32} warna="#e5e7eb">Kurang matang 生焦<br /><span style={{ fontSize: 26, color: "#9ca3af" }}>hitam, kusam, rapuh</span></Teks><Teks o={muncul(c.f, c.T(9))} x={600} y={430} size={32} warna="#e5e7eb">Matang lewat 过火焦<br /><span style={{ fontSize: 26, color: "#9ca3af" }}>perak, getas, retak</span></Teks></>}
    <Kartu c={c} kolom={2} maks={8} top={1120} items={[
      { i: 1, teks: "Air ↑", sub: "beban panas ↑, kurang matang", warna: "#38bdf8" },
      { i: 2, teks: "Abu ↑", sub: "abu kokas ↑", warna: "#9ca3af" },
      { i: 3, teks: "Sulfur ↑", sub: "sulfur kokas & H₂S ↑", warna: "#eab308" },
      { i: 4, teks: "Zat terbang ↑", sub: "gas & tar ↑, kokas ↓", warna: "#facc15" },
      { i: 5, teks: "Daya ikat ↓", sub: "rapuh, banyak serbuk", warna: "#fb923c" },
      { i: 6, teks: "Muai berlebih", sub: "dinding tertekan, sulit dorong", warna: "#ef4444" },
      { i: 7, teks: "Berubah-ubah", sub: "semua proses tidak stabil", warna: "#a78bfa" },
      { i: 11, teks: "M40/M25 抗碎强度 ↑ baik", warna: "#22c55e" },
      { i: 12, teks: "M10 耐磨强度 ↓ baik", warna: "#22c55e" },
      { i: 13, teks: "CRI 反应性 ↓ baik", warna: "#22c55e" },
      { i: 14, teks: "CSR 反应后强度 ↑ baik", warna: "#22c55e" },
    ]} />
  </>),
};

// ============ S8 Pemeriksaan ============
const S8: Adegan = {
  kode: "1.7", judul: "Pemeriksaan Kualitas", han: "煤质检验与控制",
  kamera: (c) => orbit(c, 9, 4.5, [0, 0, 0], 0.7, -0.5),
  Tiga: ({ c }) => {
    const titik = c.idx >= 8 ? 14 : c.idx >= 1 ? 6 : 0;
    const salah = c.idx === 9;
    return (<><Lampu />
      <mesh position={[0, -0.5, 0]}><coneGeometry args={[3.4, 2.6, 48]} /><meshStandardMaterial color="#454950" roughness={0.85} /></mesh>
      {Array.from({ length: titik }).map((_, i) => { const a = rnd(i) * Math.PI * 2, h = rnd(i + 3); const r = 3.3 * (1 - h) + 0.1; return (
        <group key={i} position={[Math.cos(a) * r, -1.8 + h * 2.6, Math.sin(a) * r]}>
          <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.03, 0.03, 0.7, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
          <mesh position={[0, 0.75, 0]} scale={muncul(c.f, c.T(1) + i * 4, 8)}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} /></mesh>
        </group>); })}
      {salah && <Bongkah seed={21} r={0.45} pos={[2.2, 1.4, 1.2]} warna="#2b2d33" kilap={0.8} glow={0.3} />}
      {c.idx >= 10 && <group position={[3.2, -0.6, 2]}>
        <mesh><cylinderGeometry args={[0.5, 0.5, 1.1, 24]} /><meshStandardMaterial color="#cbd5e1" transparent opacity={0.6} /></mesh>
        <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.55, 0.55, 0.15, 24]} /><meshStandardMaterial color="#1d4ed8" /></mesh>
        <mesh position={[0, -0.15, 0]}><cylinderGeometry args={[0.45, 0.45, 0.7, 24]} /><meshStandardMaterial color="#1f2126" /></mesh>
      </group>}
    </>);
  },
  Atas: ({ c }) => (<>
    <div style={{ position: "absolute", top: 400, left: 40, right: 40, display: "flex", justifyContent: "space-between", fontFamily: FONT }}>
      {["采样 Ambil", "制样 Siapkan", "化验 Uji", "评价 Nilai", "调整 Sesuaikan"].map((t, k) => {
        const on = c.idx >= k + 1 && c.idx <= 5 ? c.idx === k + 1 : c.idx > 5;
        return <div key={k} style={{ opacity: muncul(c.f, c.T(k + 1) - 6) * (on ? 1 : 0.5), background: on ? "#f59e0b" : "rgba(8,12,20,.85)", color: on ? "#111" : "#fff", borderRadius: 14, padding: "10px 12px", fontSize: 26, fontWeight: 800, textAlign: "center", width: 186 }}>{k + 1}<br />{t}</div>;
      })}
    </div>
    <Kartu c={c} items={[
      { i: 1, teks: "Ambil contoh yang mewakili seluruh tumpukan", warna: "#ef4444" },
      { i: 2, teks: "Dihancurkan, dicampur, dibagi", warna: "#f59e0b" },
      { i: 3, teks: "Lab: air, abu, zat terbang, sulfur, G, Y…", sub: "工业分析 · 全硫 · 粘结指数 · 细度 · 全水分", warna: "#38bdf8" },
      { i: 5, teks: "Kualitas berubah → campuran disesuaikan", warna: "#22c55e" },
      { i: 6, teks: "Pengambilan contoh = langkah paling menentukan", tanda: "★", warna: "#ef4444" },
      { i: 8, teks: "Banyak titik, bukan hanya permukaan", tanda: "✓", warna: "#22c55e" },
      { i: 9, teks: "Jangan pilih bongkahan yang \"bagus\"", tanda: "✗", warna: "#ef4444" },
      { i: 10, teks: "Wadah tertutup + label: jenis, lokasi, waktu, petugas", tanda: "🏷", warna: "#60a5fa" },
      { i: 11, teks: "Tujuan: campuran masuk oven STABIL", warna: "#22c55e" },
    ]} maks={3} top={1180} />
  </>),
};

// ============ S9 Ringkasan & salah kaprah ============
const MITOS = [
  ["Semua batubara bisa jadi kokas", "Hanya batubara kokas"], ["Antrasit paling bagus", "Antrasit tidak melunak"], ["Makin halus makin bagus", "Kepadatan pengisian turun"],
  ["Makin kering makin bagus", "Yang penting sesuai & stabil"], ["Abu kokas = abu batubara", "Abu kokas selalu lebih tinggi"], ["Daya ikat setinggi-tingginya", "Harus seimbang"], ["Lab akurat = data pasti benar", "Contoh harus mewakili"],
];
const S9: Adegan = {
  kode: "RINGKASAN", judul: "Salah Kaprah Batubara", han: "备煤 → 下一章",
  kamera: (c) => orbit(c, 10, 4, [0, 0.3, 0], -0.6, 0.6),
  Tiga: ({ c }) => (<><Lampu /><Baterai matang={1} gas={1} f={c.f} potong={0} /></>),
  Atas: ({ c }) => {
    const m = c.idx >= 2 && c.idx <= 8 ? c.idx - 2 : -1;
    return (<>
      {c.idx === 0 && <Teks o={muncul(c.f, 5)} x={540} y={1180} w={960} center size={34}>Periksa → pilih → tentukan campuran → siapkan 备煤 → isi oven → karbonisasi → kokas + gas mentah</Teks>}
      {m >= 0 && <div style={{ position: "absolute", top: 1150, left: 60, right: 60, fontFamily: FONT }}>
        <div style={{ background: "rgba(127,29,29,.9)", borderRadius: 16, padding: "14px 22px", color: "#fecaca", fontSize: 40, fontWeight: 800, textDecoration: interpolate(c.f, [c.T(c.idx) + 40, c.T(c.idx) + 50], [0, 1], cl) > 0.5 ? "line-through" : "none" }}>✗ {MITOS[m][0]}</div>
        <div style={{ marginTop: 14, opacity: muncul(c.f, c.T(c.idx) + 45), background: "rgba(20,83,45,.92)", borderRadius: 16, padding: "14px 22px", color: "#dcfce7", fontSize: 42, fontWeight: 900 }}>✓ {MITOS[m][1]}</div>
      </div>}
      {c.idx >= 9 && <Kartu c={c} items={[
        { i: 9, teks: "Batubara stabil → proses stabil → kokas terkendali", warna: "#22c55e" },
        { i: 10, teks: "Berikutnya: BAB 2 Persiapan Batubara 备煤", warna: "#f59e0b" },
        { i: 11, teks: "Follow Adriy Project", sub: "biar makin sering bilang: oh, ternyata begitu", warna: "#f472b6", tanda: "➕" },
      ]} maks={3} top={1150} kanan={c.idx >= 11 ? 360 : 50} />}
      <Adriy pose="setengah_sorak_kepal" o={antara(c.f, c.T(11) - 10, c.d + 30)} x={730} y={1130} h={450} />
    </>);
  },
};

export const ADEGAN: Adegan[] = [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9];
export { cl };
