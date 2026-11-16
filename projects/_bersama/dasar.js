// Dasar bersama untuk video Clawd (Canvas 2D, frame-deterministik). Setiap video menulis GAYA (cara menggambar) + adegan S.
// Jam video = narasi: setTL(timeline.json) lalu renderAt(t). CUES = efek suara [[detik, file, volume]] ('mk:nama' = Mixkit milik pemilik, lainnya sfx-kit).
const W = 1080, H = 1920, TAU = Math.PI * 2;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const FONT = 'Fredoka, "DejaVu Sans", sans-serif';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); }, easeOut = x => 1 - Math.pow(1 - clamp(x), 3), easeIn = x => Math.pow(clamp(x), 3);
const backOut = x => { x = clamp(x); const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function mixh(a, b, k) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), c = i => Math.round(lerp((pa >> i) & 255, (pb >> i) & 255, clamp(k))); return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); }
const rgba = (h, a) => { const p = parseInt(h.slice(1), 16); return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${a})`; };
const ell = (cx, cy, rx, ry, n = 28, rot = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });
function rr(x, y, w, h, r, n = 4) { const P = [], c = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return P; }
function pathOf(pts, closed = true) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (closed) p.closePath(); return p; }
function bbox(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; }
const star = (cx, cy, r1, r2, n = 5, rot = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
let T = 0, BOIL = 0, HIDE_CLAWD = false;
// GAYA must define: shape(pts, col, id, o), line(pts, lw, col, id, alpha), bg(t), post(t); optional: ink, hi, card, trans(k, s, prev, t)
const C = { clay: '#D97757', clayDk: '#A84D33', ink: '#22201E', white: '#FFFDF7', cream: '#FFF6E2', amber: '#E3A33B', yellow: '#F2C94C', red: '#D2463C', blue: '#4F7FB8', sky: '#9CC8EC', slate: '#56657A' };

// ---------- timeline ----------
let TL = null, LN = {};
const t0 = id => LN[id].t0, t1 = id => LN[id].t1;
function setTL(tl) { TL = tl; LN = {}; tl.lines.forEach(l => LN[l.id] = l); buildScenes(); }

// ---------- text ----------
function layout(str, size, maxW, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const words = str.split(' ').map(s => ({ t: s.replace(/\*/g, ''), hi: s.includes('*') })), sp = ctx.measureText(' ').width;
  const lines = [[]]; let w = 0; for (const wd of words) { const ww = ctx.measureText(wd.t).width; if (w + ww > maxW && lines.at(-1).length) { lines.push([]); w = 0; } lines.at(-1).push({ ...wd, w: ww }); w += ww + sp; }
  const widths = lines.map(l => l.reduce((s, q) => s + q.w, 0) + sp * (l.length - 1)); return { lines, widths, sp };
}
// a text label; *word* = highlighted. o: age, life, rot, bg, bare, col, maxW, hi
function tag(str, x, y, size, o = {}) {
  const k = backOut(seg(o.age ?? 1, 0, .25)), out = 1 - seg(o.age ?? 0, (o.life ?? 99) - .15, o.life ?? 99);
  if (k <= 0 || out <= 0) return;
  ctx.save(); ctx.globalAlpha *= out; ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(k, k);
  const { lines, widths, sp } = layout(str, size, o.maxW ?? 860), lh = size * 1.2, bw = Math.max(...widths) + size * .9, bh = lines.length * lh + size * .55;
  if (!o.bare) GAYA.shape(rr(-bw / 2, -bh / 2, bw, bh, Math.min(18, bh / 3)), o.bg || GAYA.card || C.cream, 900 + size, { fill: .97, text: true });
  ctx.font = `700 ${size}px ${FONT}`; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => { let cx = -widths[i] / 2; const cy = (i - (lines.length - 1) / 2) * lh + size * .04;
    for (const wd of ln) { if (wd.hi) { ctx.fillStyle = rgba(o.hi || GAYA.hi || C.amber, .6); ctx.fillRect(cx - 5, cy - size * .02, wd.w + 10, size * .44); }
      ctx.fillStyle = o.col || GAYA.ink || C.ink; ctx.fillText(wd.t, cx, cy); cx += wd.w + sp; } });
  ctx.restore();
}
function caption(t) {   // narration line inside the safe box (y <= 1540)
  if (!TL) return;
  for (const l of TL.lines) if (t >= l.t0 - .05 && t < l.t1 + .25 && l.cap) { tag(l.cap, W / 2, 1440, 52, { age: t - l.t0 + .05, life: l.t1 + .3 - l.t0, maxW: 800 }); break; }
}

// ---------- ADRIY: tokoh khas Adriy.Project (burung hantu kecil, kacamata bulat besar, syal merah) ----------
// Sama di semua gaya; GAYA hanya menentukan cara goresannya. Ukuran: u = satuan (tinggi ± 9,5u), (x, y) = titik kaki.
// Nama fungsi `clawd` dipertahankan supaya adegan lama tetap jalan; pakai `adriy` untuk adegan baru.
const ADRIY = { body: '#A9714B', wing: '#8A5A3C', belly: '#F1DCC0', glass: '#FFFFFF', beak: '#F2A23B', scarf: '#D9534F' };
function clawd(x, y, u, o = {}) {
  if (HIDE_CLAWD && !o.end) return;
  const sq = o.sq || 0, id = 4000, F = o.face || 'neutral', S = GAYA.shape, L = GAYA.line, ink = GAYA.ink || C.ink;
  const body = o.color || ADRIY.body, wingC = o.dark || ADRIY.wing;
  const br = .012 * Math.sin(T * 2.6 + x * .01), blink = ['neutral', 'curious', 'worried', 'sad'].includes(F) && ((T + x * .003) % 3.4) < .12;
  ctx.save(); ctx.translate(x, y + (o.dy || 0) * u); ctx.rotate(o.rot || 0); ctx.scale((1 + sq * .6 - br * .5) * (o.flip ? -1 : 1), 1 - sq + br);
  const step = o.walk ? Math.sin(o.walk) : 0;
  for (const d of [-1, 1]) S(ell(d * 1.5 * u, -.25 * u + (d > 0 ? step : -step) * .35 * u, .95 * u, .45 * u, 14), ADRIY.beak, id + 10 + d, {});   // feet
  const [aL, aR] = o.arms || [.2, .2];
  for (const [d, a] of [[-1, aL], [1, aR]]) { ctx.save(); ctx.translate(d * 3.7 * u, -6 * u); ctx.rotate(-d * (a - .2) * 1.75); S(ell(0, 2 * u, 1 * u, 2.3 * u, 18), wingC, id + 20 + d, {}); ctx.restore(); }   // wings
  for (const d of [-1, 1]) S([[d * 1.6 * u, -8.4 * u], [d * 3.3 * u, -10.1 * u], [d * 3.6 * u, -7.6 * u]], wingC, id + 30 + d, {});   // ear tufts
  S(ell(0, -4.65 * u, 4.2 * u, 4.55 * u, 32), body, id + 40, { body: true });
  S(ell(0, -2.7 * u, 2.7 * u, 2.2 * u, 24), ADRIY.belly, id + 41, { fill: .95, line: false });
  for (let i = 0; i < 3; i++) L([[(-1 + i) * u - .35 * u, -2.6 * u + (i % 2) * .5 * u], [(-1 + i) * u, -2.3 * u + (i % 2) * .5 * u], [(-1 + i) * u + .35 * u, -2.6 * u + (i % 2) * .5 * u]], u * .12, wingC, id + 42 + i, .8);   // belly chevrons
  // scarf (the signature red) with a tail on the right
  S([[-3.7 * u, -4.3 * u], [-1.5 * u, -3.55 * u], [1.5 * u, -3.55 * u], [3.7 * u, -4.3 * u], [3.5 * u, -3.4 * u], [1.5 * u, -2.75 * u], [-1.5 * u, -2.75 * u], [-3.5 * u, -3.4 * u]], ADRIY.scarf, id + 50, {});
  S([[1.8 * u, -3.1 * u], [2.9 * u, -3.2 * u], [3.3 * u, -1.2 * u + Math.sin(T * 3) * .15 * u], [2.4 * u, -1.5 * u]], ADRIY.scarf, id + 51, {});
  if (o.blush) for (const d of [-1, 1]) { ctx.fillStyle = 'rgba(230,90,90,0.35)'; ctx.beginPath(); ctx.ellipse(d * 2.9 * u, -4.5 * u, .8 * u, .4 * u, 0, 0, TAU); ctx.fill(); }
  if (o.cheeks) for (const d of [-1, 1]) S(ell(d * 2.4 * u, -4.3 * u, 1.2 * u, 1 * u, 16), mixh(body, '#FFFFFF', .2), id + 52 + d, { fill: 1 });
  // brows for worried / sad (above the glasses)
  if (F === 'sad' || F === 'worried') for (const d of [-1, 1]) L([[d * 1.6 * u - .9 * u, (d < 0 ? -7.7 : -8.2) * u], [d * 1.6 * u + .9 * u, (d < 0 ? -8.2 : -7.7) * u]], u * .2, ink, id + 55 + d);
  // the big round glasses + eyes inside
  const [lx, ly] = o.look || [0, 0], big = (F === 'surprised' || F === 'shock') ? 1.08 : 1;
  for (const d of [-1, 1]) { const ex = d * 1.6 * u, ey = -6.1 * u, r = 1.55 * u * big;
    S(ell(ex, ey, r, r, 24), ADRIY.glass, id + 60 + d, { fill: 1, lw: Math.max(3, u * .32) });
    const dot = (rx, ry) => { ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(ex + lx * .55 * u, ey + ly * .55 * u + .1 * u, rx, ry, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex + lx * .55 * u + rx * .4, ey + ly * .55 * u - ry * .35, rx * .32, 0, TAU); ctx.fill(); };
    if (blink || F === 'sleepy') L([[ex - .8 * u, ey + .1 * u], [ex + .8 * u, ey + .1 * u]], u * .24, ink, id + 65 + d);
    else if (F === 'happy' || F === 'laugh') L([[ex - .75 * u, ey + .35 * u], [ex, ey - .4 * u], [ex + .75 * u, ey + .35 * u]], u * .26, ink, id + 66 + d);
    else if (F === 'squint') L([[ex - d * .75 * u, ey - .5 * u], [ex + d * .4 * u, ey], [ex - d * .75 * u, ey + .5 * u]], u * .26, ink, id + 67 + d);
    else if (F === 'star') S(star(ex, ey, .95 * u, .4 * u), C.yellow, id + 68 + d, { fill: 1 });
    else if (F === 'surprised' || F === 'shock') dot(.7 * u, .75 * u);
    else if (F === 'sad' || F === 'worried') dot(.55 * u, .65 * u);
    else dot(.6 * u, .62 * u);
  }
  L([[-.15 * u, -6.1 * u], [.15 * u, -6.1 * u]], Math.max(3, u * .3), ink, id + 70);   // glasses bridge
  if (F === 'sleepy') for (const d of [-1, 1]) { ctx.save(); ctx.beginPath(); ctx.arc(d * 1.6 * u, -6.1 * u, 1.45 * u, Math.PI, TAU); ctx.fillStyle = rgba(body, .9); ctx.fill(); ctx.restore(); }
  if (o.goggles) { L([[-4.2 * u, -6.4 * u], [4.2 * u, -6.4 * u]], u * .3, '#3E6FA6', id + 71, .9); for (const d of [-1, 1]) S(ell(d * 1.6 * u, -6.1 * u, 1.75 * u, 1.75 * u, 24), '#9CCFE8', id + 72 + d, { fill: .35 }); }
  // beak: closed triangle, or open for O / D / laugh / chew
  const m = o.mouth || { surprised: 'O', shock: 'O', curious: 'o', laugh: 'D', star: 'O' }[F];
  const open = m === 'O' ? .9 : m === 'D' ? 1.1 : m === 'o' ? .4 : m === 'chew' ? .5 + .5 * Math.sin(T * 14) : 0;
  if (open > 0) { S([[-.75 * u, -4.75 * u], [.75 * u, -4.75 * u], [0, -4.75 * u + (.6 + open) * u]], '#5A2A1E', id + 75, { fill: 1 }); }
  S([[-.75 * u, -5.05 * u], [.75 * u, -5.05 * u], [0, -3.95 * u - (open > 0 ? .55 * u : 0)]], ADRIY.beak, id + 76, { fill: 1 });
  if (F === 'sad' && open === 0) L([[-.5 * u, -3.55 * u], [0, -3.75 * u], [.5 * u, -3.55 * u]], u * .15, ink, id + 77, .7);
  if (o.phone) { ctx.save(); ctx.translate(-4.6 * u, -3.4 * u); ctx.rotate(-.25); S(rr(-1.3 * u, -2.2 * u, 2.6 * u, 4.4 * u, .4 * u), '#2C2F36', id + 90, {}); ctx.fillStyle = o.phoneGlow || '#BFE3FF'; ctx.fillRect(-1 * u, -1.8 * u, 2 * u, 3.4 * u); ctx.restore(); }
  ctx.restore();
  if (o.mark) mark(o.mark, x + (o.flip ? -1 : 1) * 5.2 * u, y - 10.6 * u + (o.dy || 0) * u, u, o.markAge ?? 1);
}
const adriy = clawd;
// emotion marks (pictures, not words): '!', '?', 'sweat', 'idea', 'heart', 'zzz', 'notes', 'sparkle', 'cloud'
function mark(kind, x, y, u, age = 1) {
  const k = backOut(seg(age, 0, .3)); if (k <= 0) return; const S = GAYA.shape, ink = GAYA.ink || C.ink;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (kind === '!') { S([[-.5 * u, -2.6 * u], [.5 * u, -2.6 * u], [.3 * u, .2 * u], [-.3 * u, .2 * u]], C.red, 5001, { fill: 1 }); S(ell(0, 1 * u, .45 * u, .45 * u, 12), C.red, 5002, { fill: 1 }); }
  else if (kind === '?') { ctx.font = `700 ${4 * u}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.blue; ctx.fillText('?', 0, 0); ctx.lineWidth = u * .15; ctx.strokeStyle = ink; ctx.strokeText('?', 0, 0); }
  else if (kind === 'sweat') { ctx.translate(-2.5 * u, 3.5 * u); S([[0, -1.3 * u], [.7 * u, .2 * u], [0, .8 * u], [-.7 * u, .2 * u]], '#9ED3F0', 5003, { fill: 1 }); }
  else if (kind === 'idea') { S(ell(0, -.5 * u, 1.4 * u, 1.5 * u, 20), C.yellow, 5004, { fill: 1 }); S(rr(-.7 * u, .9 * u, 1.4 * u, .9 * u, .2 * u), '#9AA3AD', 5005, {}); for (let i = 0; i < 6; i++) { const a = -Math.PI + i * Math.PI / 5; GAYA.line([[Math.cos(a) * 2 * u, -.5 * u + Math.sin(a) * 2 * u], [Math.cos(a) * 2.8 * u, -.5 * u + Math.sin(a) * 2.8 * u]], u * .2, C.amber, 5006 + i, 1); } }
  else if (kind === 'heart') { const P = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; P.push([16 * Math.pow(Math.sin(a), 3) * u * .09, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * u * .09]); } S(P, C.red, 5010, { fill: 1 }); }
  else if (kind === 'zzz') { ctx.font = `700 ${2.2 * u}px ${FONT}`; ctx.fillStyle = C.blue; ['z', 'z', 'Z'].forEach((z, i) => ctx.fillText(z, i * 1.2 * u, -i * 1.4 * u - (T * 8 % 10))); }
  else if (kind === 'notes') { for (let i = 0; i < 3; i++) { const yy = -i * 1.6 * u + Math.sin(T * 4 + i) * .4 * u, xx = i * 1.4 * u; S(ell(xx, yy, .55 * u, .42 * u, 12, -.4), ink, 5020 + i, { fill: 1 }); GAYA.line([[xx + .5 * u, yy], [xx + .5 * u, yy - 2 * u], [xx + 1.2 * u, yy - 1.5 * u]], u * .18, ink, 5025 + i, 1); } }
  else if (kind === 'sparkle') { for (let i = 0; i < 3; i++) S(star(hash(i) * 3 * u - 1.5 * u, hash(i + 4) * 3 * u - 1.5 * u, .9 * u, .25 * u, 4, T * 2), C.yellow, 5030 + i, { fill: 1 }); }
  else if (kind === 'cloud') { const P = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, r = u * (1.6 + .35 * Math.sin(i * 2.1)); P.push([Math.cos(a) * r * 1.5, Math.sin(a) * r * .8]); } S(P, '#8C96A3', 5040, { fill: 1 }); for (let i = 0; i < 4; i++) GAYA.line([[(-1.5 + i) * u, 1.5 * u], [(-1.8 + i) * u, (2.5 + (T * 6 + i) % 1) * u]], u * .15, C.blue, 5041 + i, 1); }
  ctx.restore();
}

// ---------- channel badge (same design in every video) & closing card ----------
function brandStamp(x, y, age, life) {
  const k = age < .18 ? lerp(1.6, .92, easeIn(age / .18)) : 1 + .08 * Math.exp(-(age - .18) * 7) * Math.cos((age - .18) * 22), out = 1 - seg(age, life - .25, life);
  if (out <= 0 || age < 0) return;
  ctx.save(); ctx.globalAlpha = out * clamp(age / .08);
  const g = ctx.createRadialGradient(x, y, 0, x, y, 420); g.addColorStop(0, 'rgba(255,214,140,0.55)'); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(x - 420, y - 420, 840, 840);
  ctx.translate(x, y); ctx.rotate(-.05); ctx.scale(k, k);
  GAYA.shape(rr(-330, -95, 660, 190, 34), '#FFE9B8', 9100, { fill: .98, text: true });
  GAYA.line(rr(-312, -77, 624, 154, 26).concat([[-312 + 26, -77]]), 2.4, '#33241C', 9101, .8);
  GAYA.shape(ell(-225, 0, 58, 58, 28), C.cream, 9102, { fill: .98, text: true });
  GAYA.shape(ell(-225, 4, 50, 50, 28), ADRIY.body, 9103, { fill: 1 }); for (const d of [-1, 1]) { GAYA.shape(ell(-225 + d * 19, -6, 17, 17, 18), '#FFFFFF', 9104 + d, { fill: 1, lw: 3 }); ctx.fillStyle = '#33241C'; ctx.beginPath(); ctx.arc(-225 + d * 19, -5, 7, 0, TAU); ctx.fill(); } GAYA.shape([[-233, 14], [-217, 14], [-225, 30]], ADRIY.beak, 9107, { fill: 1, lw: 2 }); GAYA.shape([[-262, 36], [-188, 36], [-196, 48], [-254, 48]], ADRIY.scarf, 9108, { fill: 1, lw: 2 });
  ctx.font = `700 76px ${FONT}`; ctx.fillStyle = '#33241C'; ctx.textBaseline = 'middle'; ctx.fillText('Adriy.Project', -150, 4);
  ctx.restore();
}
function endCard(t, start) {   // "Explore More, Know More": last line, same card in every video (aturan §11)
  const a = t - start; if (a < 0) return;
  const k = lerp(.86, 1, easeOut(seg(a, 0, .6))), al = seg(a, 0, .45);
  ctx.save(); ctx.globalAlpha = al;
  ctx.fillStyle = 'rgba(20,18,16,0.35)'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(540, 820, 0, 540, 820, 600); g.addColorStop(0, 'rgba(255,220,150,0.5)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 200, W, 1300);
  ctx.translate(540, 820); ctx.scale(k, k);
  GAYA.shape(rr(-400, -230, 800, 460, 40), '#FFF3D6', 9200, { fill: .99, text: true });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#33241C';
  ctx.font = `700 104px ${FONT}`; ctx.fillText('Explore More,', 0, -78);
  ctx.fillStyle = '#C4572F'; ctx.fillText('Know More', 0, 52);
  ctx.fillStyle = rgba('#E3A33B', .9); ctx.fillRect(-200, 128, 400, 10);
  ctx.textAlign = 'left'; ctx.restore();
  ctx.save(); ctx.globalAlpha = al; clawd(540, 1330, 24, { end: true, face: 'happy', arms: [.3, 1.3 + .35 * Math.sin(a * 9)], dy: -.3 * Math.abs(Math.sin(a * 3)) }); ctx.restore();
}

// ---------- scenes ----------
let GROUPS = [], SC = []; const S = {};
function buildScenes() {
  SC = GROUPS.map(([name, ids], i) => ({ name, ids, a: i === 0 ? 0 : t0(ids[0]) - .3 }));
  SC.forEach((s, i) => s.b = i + 1 < SC.length ? SC[i + 1].a : TL.duration);
  buildCues();
}
// camera: every scene slowly pushes in (1 -> 1.06) around its focus; CAM_PUNCH beats give a quick zoom bump (like a cut-in)
let CAM_PUNCH = [];
function cam(t, s) {
  const p = seg(t, s.a, s.b), z0 = 1 + .06 * ease(p);
  let z = z0; for (const [tp, st] of CAM_PUNCH) { const d = t - tp; if (d > 0 && d < .6) z += st * Math.exp(-d * 7) * (1 - Math.exp(-d * 40)); }
  const fx = (s.fx ?? 540), fy = (s.fy ?? 860); ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
}
let CUES = []; const c = (t, f, g = 1) => CUES.push([+(+t).toFixed(3), f, g]);
function buildCues() { CUES = []; if (window.cues) window.cues(); CUES.sort((a, b) => a[0] - b[0]); window.CUES = CUES; }
function renderAt(t) {
  T = t; BOIL = Math.floor(t * 12) % 3;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  HIDE_CLAWD = !!(LN.z && t > t0('z') - .3); GAYA.bg(t);
  const i = Math.max(0, SC.findIndex(s => t >= s.a && t < s.b)), s = SC[i];
  ctx.save(); cam(t, s); S[s.name](t); ctx.restore();
  const prev = SC[i - 1], k = seg(t, s.a, s.a + .5);
  if (prev && k < 1) GAYA.trans(k, () => { GAYA.bg(t); ctx.save(); cam(t, prev); S[prev.name](t); ctx.restore(); }, t);
  if (!(LN.z && t > t0('z') - .3)) caption(t);
  if (LN.z) endCard(t, t0('z') - .3);
  GAYA.post(t);
  if (t < .15) { ctx.fillStyle = `rgba(10,10,10,${1 - t / .15})`; ctx.fillRect(0, 0, W, H); }
  if (TL && t > TL.duration - .3) { ctx.fillStyle = `rgba(10,10,10,${seg(t, TL.duration - .3, TL.duration)})`; ctx.fillRect(0, 0, W, H); }
  return cv.toDataURL('image/jpeg', .9);
}
window.renderAt = renderAt; window.setTL = setTL;
window.ready = (async () => { await document.fonts.load(`700 40px Fredoka`); await document.fonts.load(`500 40px Fredoka`); if (GAYA.init) GAYA.init(); return true; })();
if (!location.search.includes('render')) window.ready.then(async () => { const tl = await (await fetch('timeline.json')).json(); setTL(tl); const s0 = performance.now(); (function loop() { renderAt(((performance.now() - s0) / 1000) % TL.duration); requestAnimationFrame(loop); })(); });
