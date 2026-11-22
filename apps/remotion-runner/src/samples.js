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
