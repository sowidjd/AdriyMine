// Contoh kode yang dimuat saat aplikasi pertama kali dibuka.
export const SAMPLE_SINGLE = `import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const Judul: React.FC<{ teks: string; warna: string }> = ({ teks, warna }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const masuk = spring({ frame, fps, config: { damping: 12 } });
  const geser = interpolate(masuk, [0, 1], [120, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: 'Arial Black, sans-serif',
          fontSize: 120,
          color: warna,
          textAlign: 'center',
          padding: 60,
          transform: \`translateY(\${geser}px) scale(\${masuk})\`,
          textShadow: '0 10px 40px rgba(0,0,0,0.35)',
        }}
      >
        {teks}
      </div>
    </AbsoluteFill>
  );
};

export const VideoContoh = () => {
  const frame = useCurrentFrame();
  const latar = interpolate(frame, [0, 300], [200, 320]);
  return (
    <AbsoluteFill style={{ background: \`linear-gradient(160deg, hsl(\${latar} 70% 22%), hsl(\${latar + 40} 80% 45%))\` }}>
      <Sequence durationInFrames={100}>
        <Judul teks="Halo!" warna="#ffffff" />
      </Sequence>
      <Sequence from={100} durationInFrames={100}>
        <Judul teks="Ini Remotion" warna="#ffe26b" />
      </Sequence>
      <Sequence from={200}>
        <Judul teks="Tempel kodemu & putar" warna="#ffffff" />
      </Sequence>
    </AbsoluteFill>
  );
};
`;

export const SAMPLE_MULTI = `// src/Root.tsx
import { Composition } from 'remotion';
import { Kartu } from './Kartu';

export const RemotionRoot = () => (
  <Composition
    id="KartuTikTok"
    component={Kartu}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ judul: 'Fakta Unik', isi: 'Burung hantu bisa memutar kepala 270 derajat.' }}
  />
);

// src/Kartu.tsx
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Kartu: React.FC<{ judul: string; isi: string }> = ({ judul, isi }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps });
  const isiMuncul = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#101826', justifyContent: 'center', padding: 90, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ fontSize: 96, fontWeight: 900, color: '#ffd166', transform: \`scale(\${s})\` }}>{judul}</div>
      <div style={{ marginTop: 40, fontSize: 64, lineHeight: 1.3, color: 'white', opacity: isiMuncul }}>{isi}</div>
    </AbsoluteFill>
  );
};
`;

export const SAMPLE_3D = `import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { RoundedBox } from '@react-three/drei';

const Objek = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const masuk = 0.35 + 0.65 * spring({ frame, fps, config: { damping: 14 } });
  const putar = frame * 0.03;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#ff7ab6" />
      <mesh rotation={[putar, putar * 1.3, 0]} scale={masuk * 1.2} position={[0, 0.8, 0]}>
        <torusKnotGeometry args={[1, 0.34, 220, 32]} />
        <meshStandardMaterial color="#4d8dff" metalness={0.55} roughness={0.2} />
      </mesh>
      <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.22} smoothness={6} position={[0, -2.3, 0]} rotation={[0.5, -putar * 2, 0]} scale={masuk}>
        <meshStandardMaterial color="#ffd166" metalness={0.2} roughness={0.35} />
      </RoundedBox>
    </>
  );
};

export const Video3D = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const teks = interpolate(frame, [0, 25], [0.2, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 35%, #233457, #0a0f1a 70%)' }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, -0.4, 9], fov: 45 }}>
        <Objek />
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 200 }}>
        <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 96, color: 'white', opacity: teks, letterSpacing: 2 }}>3D di HP</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const durationInFrames = 150;
`;

export const SAMPLE_SAINS = `// Contoh video sains 3D: penampang lapisan Bumi (gaya cutaway)
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { Canvas3D, Studio, Effects, Cutaway, Label3D, CameraPath, Turntable } from '@saku/3d';

const LAPISAN = [
  { nama: 'Kerak', tebal: '5–70 km', r: 2.0, warna: '#2f6fd6', potong: '#7d5a3c' },
  { nama: 'Mantel', tebal: '2.900 km', r: 1.86, warna: '#c2410c', potong: '#f97316' },
  { nama: 'Inti luar', tebal: '2.200 km', r: 1.05, warna: '#f59e0b', potong: '#fbbf24' },
  { nama: 'Inti dalam', tebal: '1.220 km', r: 0.55, warna: '#fff1c1', potong: '#fffbeb', panas: true },
];

const Bumi = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const belah = interpolate(frame, [1.2 * fps, 4 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const muncul = (i) => interpolate(frame, [(4.2 + i * 0.7) * fps, (4.6 + i * 0.7) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      <Turntable speed={0.12}>
        <Cutaway progress={belah} axis="z" at={0}>
          {LAPISAN.map((l) => (
            <mesh key={l.nama} castShadow userData={{ capColor: l.potong }}>
              <sphereGeometry args={[l.r, 128, 128]} />
              <meshStandardMaterial color={l.warna} roughness={l.panas ? 0.3 : 0.55} metalness={0.05}
                emissive={l.panas ? '#ffcf6b' : '#000000'} emissiveIntensity={l.panas ? 2.2 : 0} />
            </mesh>
          ))}
        </Cutaway>
      </Turntable>
      {LAPISAN.map((l, i) => (
        <Label3D key={l.nama} position={[l.r * 0.72 - (i === 3 ? 0.4 : 0), 0.15 + i * 0.05, 0.02]} offset={[2.4 - l.r * 0.6, 1.6 - i * 0.9, 0]} opacity={muncul(i)} accent={l.potong}>
          {l.nama} · {l.tebal}
        </Label3D>
      ))}
    </>
  );
};

export const PenampangBumi = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const judul = spring({ frame, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #1c2a4a, #070a12 72%)' }}>
      <Canvas3D camera={{ position: [0, 1, 9], fov: 38 }}>
        <Studio groundY={-2.6} shadowOpacity={0.45} />
        <CameraPath points={[
          { at: 0, position: [0.5, 1.4, 10.5], target: [0, 0, 0] },
          { at: 4, position: [3.2, 1.6, 8.2], target: [0.6, 0, 0] },
          { at: 10, position: [4.2, 2.2, 7.4], target: [1, -0.1, 0] },
        ]} />
        <Bumi />
        <Effects bloom={0.9} bloomThreshold={0.75} ao vignette={0.4} />
      </Canvas3D>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: '9%', pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'Inter, Arial, sans-serif', fontWeight: 800, fontSize: 84, color: 'white', letterSpacing: 1, opacity: judul, transform: \`translateY(\${(1 - judul) * 40}px)\`, textShadow: '0 6px 30px rgba(0,0,0,.5)' }}>
          Isi Perut Bumi
        </div>
        <div style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: 40, color: '#c9d6ea', marginTop: 12, opacity: judul }}>dari kerak sampai inti</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const durationInFrames = 300;
`;
