import React, {useEffect, useState} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, delayRender, continueRender, Easing} from 'remotion';

const BG = '#f4f7fe';
const NAVY = '#0a1652';
const BLUE = '#1a66e6';

const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const fs = [
      new FontFace('Jakarta', `url(${staticFile('jakarta.woff2')})`, {weight: '200 800'}),
      new FontFace('Inter', `url(${staticFile('inter.woff2')})`, {weight: '100 900'}),
    ];
    Promise.all(fs.map((f) => f.load())).then((l) => {
      l.forEach((f) => document.fonts.add(f));
      continueRender(h);
    });
  }, [h]);
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Logo: kotak biru membulat + ikon catatan, centang, dan pena yang tergambar
const Logo: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const s = spring({frame: f - 6, fps, config: {damping: 11, stiffness: 120, mass: 0.9}});
  const rot = interpolate(s, [0, 1], [-28, -7]);
  const draw = interpolate(f, [20, 46], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const check = interpolate(f, [36, 52], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const pen = spring({frame: f - 40, fps, config: {damping: 13, stiffness: 140}});
  const shine = interpolate(f, [50, 74], [-1.2, 1.4], clamp);
  return (
    <div style={{width: 360, height: 360, transform: `scale(${s}) rotate(${rot}deg)`, position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 96, background: 'linear-gradient(145deg,#4fb0ff 0%,#2a86f5 45%,#1559dc 100%)',
        boxShadow: '0 40px 80px rgba(21,89,220,.35), inset 0 -14px 30px rgba(0,30,120,.25), inset 0 10px 24px rgba(255,255,255,.35)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: -200, bottom: -200, width: 120, left: `${shine * 100}%`, transform: 'rotate(25deg)',
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)'}} />
      </div>
      <svg viewBox="0 0 100 100" style={{position: 'absolute', inset: 0}}>
        <path d="M58 26H34a8 8 0 0 0-8 8v32a8 8 0 0 0 8 8h32a8 8 0 0 0 8-8V44" fill="none" stroke="#fff" strokeWidth={7}
          strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} strokeOpacity={draw > 0.98 ? 0 : 1} />
        <path d="M37 52l8 8 14-15" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={check} strokeOpacity={check > 0.98 ? 0 : 1} />
        <g transform={`translate(${interpolate(pen, [0, 1], [30, 0])} ${interpolate(pen, [0, 1], [-30, 0])})`} opacity={pen}>
          <path d="M80 18l6 6-24 24-9 3 3-9z" fill="#fff" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
          <path d="M76 22l6 6" stroke="#2a86f5" strokeWidth={3} strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

// Ikon fitur yang mengorbit logo (Catatan, Berkas, AI, Kalender)
const ICONS: {c: string; bg: string; d: string}[] = [
  {c: '#1a66e6', bg: '#e1edfd', d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v5h6M8 13h8M8 17h8'},
  {c: '#f59e0b', bg: '#fff1db', d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'},
  {c: '#8b4ef0', bg: '#efe6fd', d: 'M11 3c.7 5 2.1 6.4 7.1 7.1-5 .7-6.4 2.1-7.1 7.1-.7-5-2.1-6.4-7.1-7.1C8.9 9.4 10.3 8 11 3zM19 15v6M16 18h6'},
  {c: '#22a35a', bg: '#dcf3e3', d: 'M8 2v4M16 2v4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18'},
];
const Orbit: React.FC<{f: number; fps: number}> = ({f, fps}) => (
  <>
    {ICONS.map((ic, i) => {
      const s = spring({frame: f - 30 - i * 4, fps, config: {damping: 12, stiffness: 150}});
      const a = (-140 + i * 70 + f * 0.9) * (Math.PI / 180);
      const r = interpolate(s, [0, 1], [60, 330]);
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.82;
      const out = interpolate(f, [84, 98], [1, 0], clamp);
      return (
        <div key={i} style={{position: 'absolute', left: '50%', top: '42%', width: 130, height: 130, marginLeft: -65, marginTop: -65,
          transform: `translate(${x}px,${y}px) scale(${s * out}) rotate(${interpolate(s, [0, 1], [-90, 0])}deg)`,
          borderRadius: 38, background: '#fff', boxShadow: '0 20px 40px rgba(40,80,160,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 92, height: 92, borderRadius: 28, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg viewBox="0 0 24 24" width={56} height={56} fill="none" stroke={ic.c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={ic.d} /></svg>
          </div>
        </div>
      );
    })}
  </>
);

export const Intro: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = 'CatatanByAdriy';
  const sub = ['Catat', 'Kelola', 'Simpan', 'Akses Kapan Saja'];
  const bgIn = interpolate(f, [0, 18], [0, 1], clamp);
  const exit = interpolate(f, [86, 101], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: BG, fontFamily: 'Jakarta, Inter, sans-serif', overflow: 'hidden'}}>
      {/* latar: gradien lembut + lingkaran membesar + riak */}
      <AbsoluteFill style={{opacity: bgIn, background: 'radial-gradient(circle at 50% 40%, #e3eefe 0%, #f4f7fe 60%)'}} />
      {[0, 1, 2].map((i) => {
        const p = interpolate(f, [4 + i * 9, 60 + i * 9], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        return <div key={i} style={{position: 'absolute', left: '50%', top: '42%', width: 1600, height: 1600, marginLeft: -800, marginTop: -800,
          borderRadius: '50%', border: '6px solid rgba(42,134,245,.25)', transform: `scale(${p})`, opacity: 1 - p}} />;
      })}
      <div style={{position: 'absolute', width: 900, height: 900, borderRadius: '50%', left: -420, top: interpolate(f, [0, 100], [-380, -300]),
        background: 'radial-gradient(circle,#bfdcff 0%,rgba(191,220,255,0) 70%)', opacity: bgIn}} />
      <div style={{position: 'absolute', width: 1000, height: 1000, borderRadius: '50%', right: -480, bottom: interpolate(f, [0, 100], [-460, -380]),
        background: 'radial-gradient(circle,#cfe0ff 0%,rgba(207,224,255,0) 70%)', opacity: bgIn}} />

      <AbsoluteFill style={{transform: `scale(${1 + exit * 0.08})`, opacity: 1 - exit}}>
        <Orbit f={f} fps={fps} />
        <div style={{position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)'}}>
          <Logo f={f} fps={fps} />
        </div>
        {/* judul huruf demi huruf */}
        <div style={{position: 'absolute', top: '62%', width: '100%', textAlign: 'center', fontSize: 112, fontWeight: 800, letterSpacing: -2, color: NAVY}}>
          {title.split('').map((ch, i) => {
            const s = spring({frame: f - 34 - i * 1.6, fps, config: {damping: 14, stiffness: 170}});
            const by = i >= 7;
            return <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 90}px) scale(${0.6 + s * 0.4})`, opacity: s,
              color: by ? BLUE : NAVY}}>{ch}</span>;
          })}
        </div>
        {/* subjudul */}
        <div style={{position: 'absolute', top: '69.5%', width: '100%', display: 'flex', justifyContent: 'center', gap: 16, fontFamily: 'Inter',
          fontSize: 38, color: '#5b6380', fontWeight: 500}}>
          {sub.map((w, i) => {
            const s = spring({frame: f - 54 - i * 5, fps, config: {damping: 16}});
            return (
              <React.Fragment key={i}>
                {i > 0 && <span style={{opacity: s, color: BLUE, transform: `scale(${s})`, display: 'inline-block'}}>•</span>}
                <span style={{opacity: s, transform: `translateY(${(1 - s) * 30}px)`, display: 'inline-block'}}>{w}</span>
              </React.Fragment>
            );
          })}
        </div>
        {/* garis aksen */}
        <div style={{position: 'absolute', top: '74.5%', left: '50%', height: 10, borderRadius: 5, transform: 'translateX(-50%)',
          width: interpolate(f, [62, 84], [0, 260], {...clamp, easing: Easing.out(Easing.cubic)}),
          background: 'linear-gradient(90deg,#4fb0ff,#1559dc)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
