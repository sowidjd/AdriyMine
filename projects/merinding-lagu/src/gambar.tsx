import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT_TANGAN, rnd } from "./lib";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Permukaan kulit makro: rambut rebah -> berdiri, benjolan muncul
export const KulitMakro: React.FC<{ berdiri: number; benjol: number; kilau?: number; w?: number; h?: number }> = ({
  berdiri, benjol, kilau = 0, w = 960, h = 620,
}) => {
  const f = useCurrentFrame();
  const n = 13;
  const base = h * 0.62;
  const titik = Array.from({ length: n }, (_, i) => 40 + (i + 0.5) * ((w - 80) / n) + (rnd(i) - 0.5) * 20);
  // permukaan kulit sebagai kurva dengan benjolan
  let d = `M0 ${base}`;
  for (let x = 0; x <= w; x += 8) {
    let y = base + Math.sin(x / 140) * 10;
    for (const tx of titik) y -= benjol * 26 * Math.exp(-((x - tx) ** 2) / (2 * 22 ** 2));
    d += ` L${x} ${y}`;
  }
  const isi = d + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <g filter="url(#pensil)">
        <path d={isi} fill={C.kulit} />
        <path d={isi} fill="url(#arsirKulit)" />
        <path d={d} fill="none" stroke={C.pensil} strokeWidth={5} strokeLinecap="round" />
        {titik.map((tx, i) => {
          const sudut = interpolate(berdiri, [0, 1], [68 + rnd(i + 9) * 12, 6 + (rnd(i + 3) - 0.5) * 14]);
          const pj = 150 + rnd(i + 5) * 70;
          const y0 = base + Math.sin(tx / 140) * 10 - benjol * 26;
          const rad = ((sudut - 90) * Math.PI) / 180;
          const x1 = tx + Math.cos(rad) * pj;
          const y1 = y0 + Math.sin(rad) * pj;
          const goyang = Math.sin(f / 9 + i) * 3 * (1 - berdiri);
          return (
            <g key={i}>
              <ellipse cx={tx} cy={y0 + 6} rx={9} ry={5} fill={C.kulitGelap} />
              <path d={`M${tx} ${y0} Q${(tx + x1) / 2 + goyang} ${(y0 + y1) / 2 - 8} ${x1} ${y1}`} stroke="#3a2a22" strokeWidth={5} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
      </g>
      {kilau > 0 &&
        titik.map((tx, i) => {
          const fase = (f / 6 + i * 1.7) % 6;
          const o = kilau * Math.max(0, 1 - Math.abs(fase - 1.5) / 1.5);
          return <circle key={i} cx={tx + 20} cy={base - 70 - rnd(i) * 80} r={6 + rnd(i + 2) * 6} fill={C.kuning} opacity={o} />;
        })}
    </svg>
  );
};

export const Gelombang: React.FC<{ amp: number; w?: number; h?: number; warna?: string; batang?: number }> = ({
  amp, w = 900, h = 360, warna = C.biru, batang = 34,
}) => {
  const f = useCurrentFrame();
  const bw = w / batang;
  return (
    <svg width={w} height={h}>
      <g filter="url(#pensil)">
        {Array.from({ length: batang }, (_, i) => {
          const tinggi = (0.15 + 0.85 * Math.abs(Math.sin(i * 0.55 + f / 5) * Math.sin(i * 0.21 + f / 11))) * amp * (h * 0.9);
          return (
            <rect key={i} x={i * bw + bw * 0.2} y={h / 2 - tinggi / 2} width={bw * 0.6} height={Math.max(6, tinggi)} rx={bw * 0.3}
              fill={i % 2 ? C.amber : warna} opacity={0.9} />
          );
        })}
      </g>
    </svg>
  );
};

export const Gunung: React.FC<{ w?: number; h?: number }> = ({ w = 960, h = 640 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={w} height={h}>
      <g filter="url(#pensil)">
        <rect width={w} height={h} rx={30} fill="#f6d9a8" />
        <circle cx={w * 0.72} cy={h * 0.3} r={70} fill={C.kuning} />
        <path d={`M0 ${h} L${w * 0.25} ${h * 0.35} L${w * 0.45} ${h * 0.7} L${w * 0.62} ${h * 0.28} L${w} ${h * 0.82} L${w} ${h} Z`} fill={C.biruMuda} />
        <path d={`M0 ${h} L${w * 0.25} ${h * 0.35} L${w * 0.45} ${h * 0.7} L${w * 0.62} ${h * 0.28} L${w} ${h * 0.82} L${w} ${h} Z`} fill="url(#arsirBiru)" />
        <path d={`M${w * 0.2} ${h * 0.45} L${w * 0.25} ${h * 0.35} L${w * 0.3} ${h * 0.45} Z M${w * 0.57} ${h * 0.38} L${w * 0.62} ${h * 0.28} L${w * 0.67} ${h * 0.38} Z`} fill="#fff" />
        <path d={`M0 ${h} L0 ${h * 0.8} Q${w * 0.3} ${h * 0.62} ${w * 0.6} ${h * 0.85} T${w} ${h * 0.88} L${w} ${h} Z`} fill={C.hijau} />
        <path d={`M0 ${h} L0 ${h * 0.8} Q${w * 0.3} ${h * 0.62} ${w * 0.6} ${h * 0.85} T${w} ${h * 0.88} L${w} ${h} Z`} fill="url(#arsir)" />
        {[0, 1, 2].map((i) => {
          const x = ((i * 380 + f * (1.2 + i * 0.4)) % (w + 300)) - 150;
          return (
            <g key={i} transform={`translate(${x} ${h * (0.15 + i * 0.12)})`}>
              <ellipse cx={0} cy={0} rx={90} ry={32} fill="#fff" opacity={0.9} />
              <ellipse cx={50} cy={-18} rx={55} ry={28} fill="#fff" opacity={0.9} />
            </g>
          );
        })}
        <rect width={w} height={h} rx={30} fill="none" stroke={C.pensil} strokeWidth={6} />
      </g>
    </svg>
  );
};

// Dua orang berpelukan (bentuk sederhana) + hati
export const Pelukan: React.FC<{ p: number }> = ({ p }) => {
  const f = useCurrentFrame();
  const jarak = interpolate(p, [0, 1], [130, 0], clamp);
  return (
    <svg width={760} height={620}>
      <g filter="url(#pensil)">
        <g transform={`translate(${-jarak} 0)`}>
          <path d="M210 600 Q200 380 300 330 Q380 350 400 600 Z" fill={C.biruMuda} />
          <path d="M210 600 Q200 380 300 330 Q380 350 400 600 Z" fill="url(#arsirBiru)" />
          <circle cx={300} cy={260} r={70} fill={C.kulit} stroke={C.pensil} strokeWidth={5} />
          <path d="M232 250 Q300 160 368 250 Q340 200 300 205 Q260 200 232 250 Z" fill="#3a2a22" />
          <path d="M360 400 Q430 380 470 420" stroke={C.kulit} strokeWidth={34} fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(${jarak} 0)`}>
          <path d="M380 600 Q390 360 470 330 Q560 360 560 600 Z" fill={C.amber} />
          <path d="M380 600 Q390 360 470 330 Q560 360 560 600 Z" fill="url(#arsirAmber)" />
          <circle cx={475} cy={260} r={68} fill={C.kulitGelap} stroke={C.pensil} strokeWidth={5} />
          <path d="M405 255 Q475 165 545 255 Q560 320 540 340 Q530 250 475 215 Q420 250 410 340 Q390 320 405 255 Z" fill="#2a1d18" />
          <path d="M420 410 Q360 390 320 425" stroke={C.kulitGelap} strokeWidth={34} fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g transform={`translate(380 ${120 - Math.sin(f / 10) * 8}) scale(${p})`} filter="url(#pensilHalus)">
        <path d="M0 30 C-60 -20 -30 -70 0 -35 C30 -70 60 -20 0 30 Z" fill={C.merah} stroke={C.pensil} strokeWidth={4} />
      </g>
    </svg>
  );
};

// Penampang kulit: epidermis, dermis, folikel, otot arrector pili
export const Penampang: React.FC<{ buka: number; kontraksi: number; sorot: number }> = ({ buka, kontraksi, sorot }) => {
  const w = 960, h = 760;
  const permukaan = 170;
  const fx = 470, fy = 470; // dasar folikel
  const sudut = interpolate(kontraksi, [0, 1], [-38, -4]); // kemiringan rambut
  const rad = ((sudut - 90) * Math.PI) / 180;
  const topX = fx + Math.cos(rad + Math.PI) * -330;
  const keluarX = fx + (permukaan - fy) / Math.tan(rad);
  const benjol = kontraksi * 30;
  const panjang = 260;
  const ujungX = keluarX + Math.cos(rad) * panjang;
  const ujungY = permukaan - benjol + Math.sin(rad) * panjang;
  // otot: dari folikel (tengah) ke bawah epidermis sebelah kanan
  const ox0 = fx + (keluarX - fx) * 0.55, oy0 = fy + (permukaan - fy) * 0.55;
  const ox1 = 760, oy1 = permukaan + 70;
  const tebal = interpolate(kontraksi, [0, 1], [18, 32]);
  const tarik = interpolate(kontraksi, [0, 1], [0, 40]);
  void topX;
  return (
    <svg width={w} height={h} style={{ clipPath: `inset(0 0 ${(1 - buka) * 100}% 0 round 30px)` }}>
      <g filter="url(#pensil)">
        <rect x={0} y={permukaan} width={w} height={h - permukaan} fill="#f2c9b0" />
        <rect x={0} y={permukaan + 80} width={w} height={h - permukaan - 80} fill="#eab0a0" />
        <rect x={0} y={permukaan + 80} width={w} height={h - permukaan - 80} fill="url(#arsirKulit)" />
        <path d={`M0 ${permukaan} L${keluarX - 70} ${permukaan} Q${keluarX} ${permukaan - benjol * 2} ${keluarX + 70} ${permukaan} L${w} ${permukaan}`}
          fill="none" stroke={C.pensil} strokeWidth={6} />
        <path d={`M0 ${permukaan} L${keluarX - 70} ${permukaan} Q${keluarX} ${permukaan - benjol * 2} ${keluarX + 70} ${permukaan} L${w} ${permukaan} L${w} ${permukaan + 80} L0 ${permukaan + 80} Z`}
          fill={C.kulit} opacity={0.8} />
        <line x1={0} y1={permukaan + 80} x2={w} y2={permukaan + 80} stroke={C.kulitGelap} strokeWidth={3} strokeDasharray="14 10" />
        {/* folikel */}
        <path d={`M${fx - 34} ${fy + 20} Q${fx} ${fy + 70} ${fx + 34} ${fy + 20} L${keluarX + 26} ${permukaan + 4} L${keluarX - 26} ${permukaan + 4} Z`}
          fill="#f7e0c8" stroke={C.pensil} strokeWidth={5} opacity={1} />
        <circle cx={fx} cy={fy + 30} r={30 + sorot * 6} fill="none" stroke={C.kuning} strokeWidth={10 * sorot} opacity={sorot} />
        {/* rambut */}
        <path d={`M${fx} ${fy + 30} L${keluarX} ${permukaan - benjol} L${ujungX} ${ujungY}`} stroke="#3a2a22" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* otot arrector pili */}
        <path d={`M${ox0} ${oy0} Q${(ox0 + ox1) / 2} ${(oy0 + oy1) / 2 + 60 - tarik} ${ox1} ${oy1}`} stroke={C.merah} strokeWidth={tebal} fill="none" strokeLinecap="round" />
        <path d={`M${ox0} ${oy0} Q${(ox0 + ox1) / 2} ${(oy0 + oy1) / 2 + 60 - tarik} ${ox1} ${oy1}`} stroke="url(#arsirMerah)" strokeWidth={tebal} fill="none" />
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={30} fill="none" stroke={C.pensil} strokeWidth={6} />
      </g>
    </svg>
  );
};

// Kucing dengan bulu yang mengembang
export const Kucing: React.FC<{ kembang: number; udara?: number; w?: number; h?: number }> = ({ kembang, udara = 0, w = 480, h = 420 }) => {
  const f = useCurrentFrame();
  const cx = w / 2, cy = h * 0.62;
  const rx = 150, ry = 95;
  const bulu = Array.from({ length: 46 }, (_, i) => {
    const a = (i / 46) * Math.PI * 2;
    const x0 = cx + Math.cos(a) * rx, y0 = cy + Math.sin(a) * ry;
    const pj = 10 + kembang * (26 + rnd(i) * 18);
    return { x0, y0, x1: x0 + Math.cos(a) * pj, y1: y0 + Math.sin(a) * pj, a };
  }).filter((b) => b.y0 < cy + ry * 0.7);
  const s = 1 + kembang * 0.15;
  return (
    <svg width={w} height={h}>
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`} filter="url(#pensil)">
        <path d={`M${cx + rx - 10} ${cy - 10} Q${cx + rx + 90} ${cy - 60 - kembang * 40} ${cx + rx + 60} ${cy - 150}`} stroke="#8a8f99" strokeWidth={26 + kembang * 18} fill="none" strokeLinecap="round" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#9aa0aa" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#arsir)" />
        {bulu.map((b, i) => (
          <line key={i} x1={b.x0} y1={b.y0} x2={b.x1} y2={b.y1} stroke="#5d626c" strokeWidth={5} strokeLinecap="round" />
        ))}
        <circle cx={cx - rx + 20} cy={cy - ry - 10} r={70} fill="#9aa0aa" stroke={C.pensil} strokeWidth={4} />
        <path d={`M${cx - rx - 30} ${cy - ry - 40} L${cx - rx - 20} ${cy - ry - 120} L${cx - rx + 15} ${cy - ry - 65} Z M${cx - rx + 30} ${cy - ry - 70} L${cx - rx + 65} ${cy - ry - 120} L${cx - rx + 75} ${cy - ry - 40} Z`} fill="#9aa0aa" stroke={C.pensil} strokeWidth={4} />
        <circle cx={cx - rx - 5} cy={cy - ry - 15} r={kembang > 0.5 ? 13 : 9} fill="#fff" stroke={C.pensil} strokeWidth={3} />
        <circle cx={cx - rx + 45} cy={cy - ry - 15} r={kembang > 0.5 ? 13 : 9} fill="#fff" stroke={C.pensil} strokeWidth={3} />
        <circle cx={cx - rx - 5} cy={cy - ry - 15} r={4} fill={C.pensil} />
        <circle cx={cx - rx + 45} cy={cy - ry - 15} r={4} fill={C.pensil} />
        {[-110, -40, 40, 110].map((dx, i) => (
          <rect key={i} x={cx + dx - 16} y={cy + ry - 30} width={32} height={70} rx={14} fill="#9aa0aa" stroke={C.pensil} strokeWidth={4} />
        ))}
      </g>
      {udara > 0 &&
        bulu.map((b, i) =>
          i % 2 ? null : (
            <circle key={i} cx={(b.x0 + b.x1) / 2 + Math.cos(b.a) * 6} cy={(b.y0 + b.y1) / 2 + Math.sin(f / 8 + i) * 3} r={6}
              fill="#bfe3ff" stroke={C.biruMuda} strokeWidth={2} opacity={udara} />
          ),
        )}
    </svg>
  );
};

// Jalur saraf dari gelombang musik ke otak, dengan percikan dopamin
export const JalurSaraf: React.FC<{ jalur: number; dopamin: number }> = ({ jalur, dopamin }) => {
  const f = useCurrentFrame();
  const w = 960, h = 760;
  const P0 = [120, 600], P1 = [300, 250], P2 = [600, 700], P3 = [700, 330];
  const titik = (t: number) => {
    const m = 1 - t;
    return [
      m ** 3 * P0[0] + 3 * m * m * t * P1[0] + 3 * m * t * t * P2[0] + t ** 3 * P3[0],
      m ** 3 * P0[1] + 3 * m * m * t * P1[1] + 3 * m * t * t * P2[1] + t ** 3 * P3[1],
    ];
  };
  const pjg = 1300;
  return (
    <svg width={w} height={h}>
      <g filter="url(#pensil)">
        <path d={`M${P0[0]} ${P0[1]} C${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]} ${P3[0]} ${P3[1]}`} stroke={C.amber} strokeWidth={12} fill="none"
          strokeDasharray={pjg} strokeDashoffset={pjg * (1 - jalur)} strokeLinecap="round" />
        {/* otak */}
        <g transform="translate(700 300)">
          <path d="M-150 30 C-170 -60 -90 -130 -10 -110 C40 -160 140 -120 150 -50 C200 -10 170 80 100 90 C60 130 -40 130 -70 95 C-140 110 -170 80 -150 30 Z"
            fill="#f3b8c4" stroke={C.pensil} strokeWidth={6} />
          <path d="M-150 30 C-170 -60 -90 -130 -10 -110 C40 -160 140 -120 150 -50 C200 -10 170 80 100 90 C60 130 -40 130 -70 95 C-140 110 -170 80 -150 30 Z" fill="url(#arsirMerah)" />
          <path d="M-90 -40 Q-50 -80 -10 -40 Q30 0 70 -40 M-100 30 Q-60 0 -20 30 Q20 60 80 20" stroke={C.pensil} strokeWidth={5} fill="none" />
        </g>
      </g>
      {Array.from({ length: 6 }, (_, i) => {
        const t = ((f / 40 + i / 6) % 1) * jalur;
        const [x, y] = titik(t);
        return <circle key={i} cx={x} cy={y} r={10} fill={C.kuning} stroke={C.amber} strokeWidth={3} opacity={jalur > 0.05 ? 1 : 0} />;
      })}
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = dopamin * (90 + rnd(i) * 140) + ((f + i * 7) % 30) * dopamin;
        return <circle key={i} cx={700 + Math.cos(a) * r} cy={300 + Math.sin(a) * r * 0.8} r={9 + rnd(i + 4) * 6} fill={C.kuning} opacity={dopamin * (1 - ((f + i * 7) % 30) / 45)} />;
      })}
    </svg>
  );
};

export const TandaTanya: React.FC<{ p: number; size?: number }> = ({ p, size = 420 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: "Caveat", fontWeight: 700, fontSize: size, color: C.amber, lineHeight: 1, transform: `scale(${p}) rotate(${Math.sin(f / 12) * 6}deg)`, filter: "url(#pensilHalus)", textShadow: `6px 6px 0 ${C.biru}` }}>
      ?
    </div>
  );
};

// Kepala sederhana dengan headphone untuk perbandingan respons
export const Pendengar: React.FC<{ merinding: number; warna: string; kulit: string }> = ({ merinding, warna, kulit }) => {
  const f = useCurrentFrame();
  return (
    <svg width={400} height={520}>
      <g filter="url(#pensil)">
        <path d="M60 520 Q60 330 200 320 Q340 330 340 520 Z" fill={warna} />
        <path d="M60 520 Q60 330 200 320 Q340 330 340 520 Z" fill="url(#arsir)" />
        <circle cx={200} cy={210} r={110} fill={kulit} stroke={C.pensil} strokeWidth={5} />
        <path d="M85 200 Q200 40 315 200" stroke={C.pensil} strokeWidth={16} fill="none" />
        <rect x={68} y={180} width={44} height={80} rx={20} fill={C.biru} stroke={C.pensil} strokeWidth={4} />
        <rect x={288} y={180} width={44} height={80} rx={20} fill={C.biru} stroke={C.pensil} strokeWidth={4} />
        {merinding > 0.5 ? (
          <>
            <path d="M150 210 Q165 200 180 210 M220 210 Q235 200 250 210" stroke={C.pensil} strokeWidth={5} fill="none" />
            <path d="M170 265 Q200 285 230 265" stroke={C.pensil} strokeWidth={5} fill="none" />
          </>
        ) : (
          <>
            <circle cx={165} cy={210} r={8} fill={C.pensil} />
            <circle cx={235} cy={210} r={8} fill={C.pensil} />
            <line x1={175} y1={270} x2={225} y2={270} stroke={C.pensil} strokeWidth={5} />
          </>
        )}
        {merinding > 0.5 &&
          Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={90 + (i % 5) * 55 + (Math.floor(i / 5) ? 25 : 0)} cy={400 + Math.floor(i / 5) * 50} r={6} fill="#fff" opacity={0.7} />
          ))}
      </g>
      {merinding > 0.5 &&
        Array.from({ length: 5 }, (_, i) => {
          const o = Math.max(0, Math.sin(f / 7 + i * 1.3));
          return <text key={i} x={40 + i * 80} y={70 + (i % 2) * 40} fontSize={46} fill={C.kuning} opacity={o} style={{ fontFamily: FONT_TANGAN }}>✦</text>;
        })}
      {merinding <= 0.5 && (
        <text x={300} y={90} fontSize={64} fill={C.biruMuda} style={{ fontFamily: FONT_TANGAN }}>...</text>
      )}
    </svg>
  );
};
