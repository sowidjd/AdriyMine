// CAMPURAN (Mixed Media): gaya kolase untuk video Canvas kita. Lihat .claude/skills/mixed-media/SKILL.md.
// Kertas bertekstur & robek, selotip, stiker bertepi putih (bisa membungkus Adriy / objek 3D), coretan spidol yang tergambar,
// huruf guntingan, halftone, kliping koran, polaroid, cap stempel, gerak stop-motion, butiran film, transisi kertas disobek.
// Dimuat SESUDAH dasar.js (memakai ctx, W, H, hash, ease, backOut, seg, FONT, TAU). Semua acak berbenih; semua gerak fungsi t.
const MM = (() => {
  const R = (n) => hash(n * 1.37 + 11.1);                                   // acak berbenih 0..1
  const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const TEKS = {}, CACHE = {};
  const PALET = { kraft: '#C9A57A', putih: '#F7F3EA', koran: '#E8E2D2', kuning: '#F4D35E', merah: '#E4572E', biru: '#3E7CB1', hijau: '#76B041', pink: '#F29CB7', hitam: '#1F1B1A', tosca: '#2EC4B6' };

  // ---------- tekstur kertas (dibuat sekali) ----------
  function serat(q, w, h, n, warna, seed) { q.strokeStyle = warna; for (let i = 0; i < n; i++) { const x = R(seed + i) * w, y = R(seed + i * 3) * h, a = R(seed + i * 7) * TAU, l = 3 + R(seed + i * 5) * 12;
    q.lineWidth = .5 + R(seed + i * 9); q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); q.stroke(); } }
  function bintik(q, w, h, n, warna, seed, r = 1.4) { q.fillStyle = warna; for (let i = 0; i < n; i++) { q.beginPath(); q.arc(R(seed + i * 2) * w, R(seed + i * 4) * h, R(seed + i * 6) * r + .3, 0, TAU); q.fill(); } }
  function belang(q, w, h, seed, a) { for (let i = 0; i < 26; i++) { const g = q.createRadialGradient(0, 0, 0, 0, 0, 1); const x = R(seed + i) * w, y = R(seed + i * 2) * h, r = 40 + R(seed + i * 3) * 120;
    q.save(); q.translate(x, y); q.scale(r, r); g.addColorStop(0, `rgba(0,0,0,${a * R(seed + i * 4)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g; q.fillRect(-1, -1, 2, 2); q.restore(); } }
  function buatTekstur() {
    const S = 512, mk = (dasar, f) => { const c = kanvas(S, S), q = c.getContext('2d'); q.fillStyle = dasar; q.fillRect(0, 0, S, S); f(q); return c; };
    TEKS.kraft = mk(PALET.kraft, q => { belang(q, S, S, 1, .12); serat(q, S, S, 900, 'rgba(90,60,30,0.25)', 2); serat(q, S, S, 300, 'rgba(255,240,210,0.3)', 3); bintik(q, S, S, 500, 'rgba(70,45,20,0.25)', 4); });
    TEKS.putih = mk(PALET.putih, q => { belang(q, S, S, 5, .04); serat(q, S, S, 500, 'rgba(120,100,70,0.12)', 6); bintik(q, S, S, 200, 'rgba(120,100,70,0.12)', 7, 1); });
    TEKS.koran = mk(PALET.koran, q => { belang(q, S, S, 8, .06); q.fillStyle = 'rgba(40,35,30,0.55)';
      for (let k = 0; k < 3; k++) for (let y = 8; y < S; y += 11) { const x0 = 10 + k * 170, w = 150 - (R(y + k) > .85 ? 60 * R(y * 3 + k) : 0); q.fillRect(x0, y, w, 4.5); }
      serat(q, S, S, 300, 'rgba(100,90,70,0.15)', 9); });
    TEKS.kotak = mk('#FBFBF7', q => { q.strokeStyle = 'rgba(80,140,200,0.35)'; q.lineWidth = 1.2; for (let i = 0; i <= S; i += 32) { q.beginPath(); q.moveTo(i, 0); q.lineTo(i, S); q.moveTo(0, i); q.lineTo(S, i); q.stroke(); }
      serat(q, S, S, 200, 'rgba(120,100,70,0.1)', 10); });
    TEKS.garis = mk('#FBF9F1', q => { q.strokeStyle = 'rgba(80,140,200,0.4)'; q.lineWidth = 1.5; for (let y = 40; y < S; y += 34) { q.beginPath(); q.moveTo(0, y); q.lineTo(S, y); q.stroke(); }
      q.strokeStyle = 'rgba(220,80,80,0.5)'; q.beginPath(); q.moveTo(60, 0); q.lineTo(60, S); q.stroke(); serat(q, S, S, 200, 'rgba(120,100,70,0.1)', 11); });
    TEKS.serat = mk('rgba(0,0,0,0)', q => { q.clearRect(0, 0, S, S); serat(q, S, S, 700, 'rgba(255,255,255,0.22)', 12); serat(q, S, S, 500, 'rgba(0,0,0,0.12)', 13); bintik(q, S, S, 300, 'rgba(0,0,0,0.12)', 14, 1.2); });
    // butiran film: 6 bingkai, diganti mengikuti waktu stop-motion
    TEKS.butir = [0, 1, 2, 3, 4, 5].map(f => { const c = kanvas(360, 640), q = c.getContext('2d'), im = q.createImageData(360, 640), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const v = R(i * .37 + f * 1000) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 26; } q.putImageData(im, 0, 0); return c; });
  }
  const pola = jenis => (CACHE['p' + jenis] ??= ctx.createPattern(TEKS[jenis], 'repeat'));

  // ---------- bentuk sobek ----------
  // titik keliling persegi (pusat 0,0) dengan tepi bergerigi berbenih; sisi: string berisi 'a' atas,'k' kanan,'b' bawah,'r' kiri yang disobek
  function sobek(w, h, id, sisi = 'akbr', kasar = 1) { const P = [], st = 9, pt = (x, y, nx, ny, i, robek) => { const j = robek ? (R(id * 31 + i) - .5) * 9 * kasar + (R(id * 7 + Math.floor(i / 5)) - .5) * 6 * kasar : (R(id + i) - .5) * 1.2; P.push([x + nx * j, y + ny * j]); };
    let i = 0; for (let x = -w / 2; x < w / 2; x += st) pt(x, -h / 2, 0, 1, i++, sisi.includes('a')); for (let y = -h / 2; y < h / 2; y += st) pt(w / 2, y, -1, 0, i++, sisi.includes('k'));
    for (let x = w / 2; x > -w / 2; x -= st) pt(x, h / 2, 0, -1, i++, sisi.includes('b')); for (let y = h / 2; y > -h / 2; y -= st) pt(-w / 2, y, 1, 0, i++, sisi.includes('r')); return P; }
  const jalur = P => { const p = new Path2D(); P.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
  const bayang = (on, b = 14, ox = 5, oy = 9, a = .35) => { ctx.shadowColor = on ? `rgba(30,20,10,${a})` : 'transparent'; ctx.shadowBlur = on ? b : 0; ctx.shadowOffsetX = on ? ox : 0; ctx.shadowOffsetY = on ? oy : 0; };

  // ---------- API ----------
  const M = { PALET, R };
  M.init = () => { buatTekstur(); };

  // stop-motion: waktu dibulatkan ke fps rendah; goyang = getaran kecil yang berganti tiap "bingkai"
  M.langkah = (t, fps = 12) => Math.floor(t * fps) / fps;
  M.goyang = (id, t, amp = 1, fps = 12) => (R(id * 13.7 + Math.floor(t * fps)) - .5) * 2 * amp;

  // potongan kertas. o: jenis ('kraft'|'putih'|'koran'|'kotak'|'garis') atau warna (#hex), rot, sisi sobek, bayang, k (muncul 0..1)
  M.kertas = (x, y, w, h, id, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const s = o.muncul === false ? 1 : backOut(seg(k, 0, 1));
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? (R(id) - .5) * .12); ctx.scale(s, s);
    const P = sobek(w, h, id, o.sisi ?? 'akbr', o.kasar ?? 1), p = jalur(P);
    if (o.tepiPutih !== false && (o.sisi ?? 'akbr').length) { const Q = sobek(w + 10, h + 10, id + 500, o.sisi ?? 'akbr', 1.3); bayang(o.bayang !== false); ctx.fillStyle = '#FBF8F0'; ctx.fill(jalur(Q)); bayang(false); }
    else bayang(o.bayang !== false);
    const jenis = o.jenis ?? 'putih'; ctx.fillStyle = TEKS[jenis] ? pola(jenis) : jenis; ctx.fill(p); bayang(false);
    if (!TEKS[jenis]) { ctx.save(); ctx.clip(p); ctx.fillStyle = pola('serat'); ctx.fillRect(-w, -h, w * 2, h * 2); ctx.restore(); }
    if (o.isi) { ctx.save(); ctx.clip(p); o.isi(w, h); ctx.restore(); }
    ctx.restore(); };

  // selotip kertas transparan dengan ujung bergerigi
  M.selotip = (x, y, pjg, rot, id, o = {}) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const h = o.lebar ?? 46, P = [];
    for (let i = 0; i <= 6; i++) P.push([-pjg / 2 + (i % 2 ? 6 : 0) + (R(id + i) - .5) * 3, -h / 2 + i * h / 6]); for (let i = 6; i >= 0; i--) P.push([pjg / 2 - (i % 2 ? 6 : 0) + (R(id + i + 9) - .5) * 3, -h / 2 + i * h / 6]);
    const p = jalur(P); ctx.fillStyle = o.warna ?? 'rgba(245,235,200,0.72)'; bayang(true, 4, 1, 2, .18); ctx.fill(p); bayang(false);
    ctx.save(); ctx.clip(p); ctx.fillStyle = pola('serat'); ctx.fillRect(-pjg, -h, pjg * 2, h * 2); ctx.restore(); ctx.restore(); };

  // jalankan fn dengan ctx = kanvas lain (untuk stiker / polaroid). fn memakai fungsi gambar biasa (adriy, tag, A3.gambar, ...)
  M.keKanvas = (c, fn) => { const lama = ctx; ctx = c.getContext('2d'); try { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); fn(); ctx.restore(); } finally { ctx = lama; } };

  // stiker: apa pun yang digambar fn (di kanvas penuh 1080x1920) diberi tepi putih tebal + bayangan, lalu ditempel di (x,y) dengan rot & skala
  // area: [x, y, w, h] bagian kanvas yang dipotong (default seluruh layar). Hasil: stiker berpusat di (x, y).
  M.stiker = (fn, x, y, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const [ax, ay, aw, ah] = o.area ?? [0, 0, W, H], tepi = o.tepi ?? 14, pad = tepi + 4;
    const a = CACHE.stA ??= kanvas(W, H), b = CACHE.stB ??= kanvas(W + 80, H + 80); M.keKanvas(a, fn);
    const q = b.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, b.width, b.height);
    for (let i = 0; i < 24; i++) { const s = i / 24 * TAU; q.drawImage(a, ax, ay, aw, ah, pad + Math.cos(s) * tepi, pad + Math.sin(s) * tepi, aw, ah); }
    q.globalCompositeOperation = 'source-in'; q.fillStyle = o.warnaTepi ?? '#FFFFFF'; q.fillRect(0, 0, b.width, b.height); q.globalCompositeOperation = 'source-over';
    q.drawImage(a, ax, ay, aw, ah, pad, pad, aw, ah);
    const s = (o.skala ?? 1) * (o.muncul === false ? 1 : backOut(seg(k, 0, 1)));
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(s, s); bayang(true, 16, 6, 10, .32);
    ctx.drawImage(b, 0, 0, aw + pad * 2, ah + pad * 2, -(aw / 2 + pad), -(ah / 2 + pad), aw + pad * 2, ah + pad * 2); bayang(false); ctx.restore(); };

  // coretan spidol yang tergambar sepanjang k (0..1); pts = [[x,y],...]; o: warna, lebar, boil (getar tiap bingkai), halus
  M.coret = (pts, o = {}) => { const k = o.k ?? 1; if (k <= 0 || pts.length < 2) return; const t = o.t ?? T, g = o.boil ?? 2.2, f = Math.floor(t * 8), id = o.id ?? 1;
    const Q = pts.map(([x, y], i) => [x + (R(id + i * 3 + f * 17) - .5) * g, y + (R(id + i * 5 + f * 29) - .5) * g]);
    let L = 0; const d = [0]; for (let i = 1; i < Q.length; i++) { L += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]); d.push(L); }
    const batas = L * ease(k); ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lap, al, dx] of [[0, .92, 0], [1, .5, 1.6]]) { ctx.strokeStyle = o.warna ?? PALET.merah; ctx.globalAlpha = al; ctx.lineWidth = (o.lebar ?? 9) * (lap ? .55 : 1); ctx.beginPath();
      for (let i = 0; i < Q.length; i++) { if (d[i] > batas) { const j = i - 1, u = (batas - d[j]) / (d[i] - d[j] || 1); ctx.lineTo(Q[j][0] + (Q[i][0] - Q[j][0]) * u + dx, Q[j][1] + (Q[i][1] - Q[j][1]) * u + dx); break; }
        i ? ctx.lineTo(Q[i][0] + dx, Q[i][1] + dx) : ctx.moveTo(Q[i][0] + dx, Q[i][1] + dx); } ctx.stroke(); }
    ctx.restore(); };
  // bentuk coretan siap pakai (semua mengembalikan titik untuk M.coret)
  M.lingkaran = (x, y, rx, ry, id = 1, putaran = 1.15) => Array.from({ length: 60 }, (_, i) => { const a = -2.2 + i / 59 * TAU * putaran, r = 1 + (R(id + i) - .5) * .06 + i / 59 * .08; return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]; });
  M.panah = (x1, y1, x2, y2, lengkung = .25) => { const mx = (x1 + x2) / 2 - (y2 - y1) * lengkung, my = (y1 + y2) / 2 + (x2 - x1) * lengkung, P = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; P.push([(1 - u) ** 2 * x1 + 2 * (1 - u) * u * mx + u * u * x2, (1 - u) ** 2 * y1 + 2 * (1 - u) * u * my + u * u * y2]); }
    const a = Math.atan2(y2 - P[22][1], x2 - P[22][0]), s = 34; P.push([x2 - Math.cos(a - .5) * s, y2 - Math.sin(a - .5) * s], [x2, y2], [x2 - Math.cos(a + .5) * s, y2 - Math.sin(a + .5) * s]); return P; };
  M.garisBawah = (x1, x2, y, id = 1) => [[x1, y + (R(id) - .5) * 6], [(x1 + x2) / 2, y + 4], [x2, y - 3], [x2 - 40, y + 10], [x1 + 30, y + 14]];
  M.bintang = (x, y, r) => Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + i / 10 * TAU * 2, rr = i % 2 ? r * .45 : r; return [x + Math.cos(i * TAU / 10 - Math.PI / 2) * rr, y + Math.sin(i * TAU / 10 - Math.PI / 2) * rr]; });
  M.zigzag = (x1, x2, y, tinggi = 14, n = 10) => Array.from({ length: n + 1 }, (_, i) => [x1 + (x2 - x1) * i / n, y + (i % 2 ? -tinggi : tinggi)]);

  // huruf guntingan (gaya surat kaleng): tiap huruf di potongan kertas berbeda, muncul berurutan
  M.guntingan = (teks, x, y, ukuran, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const huruf = [...teks], fonts = [`700 ${ukuran}px ${FONT}`, `700 ${ukuran * 1.05}px "DejaVu Serif", serif`, `700 ${ukuran * .95}px "DejaVu Sans Mono", monospace`, `900 ${ukuran}px "DejaVu Sans", sans-serif`];
    const latar = o.latar ?? ['koran', 'putih', PALET.kuning, PALET.merah, 'kraft', PALET.biru, PALET.hitam, PALET.pink], id0 = o.id ?? 7;
    const lebar = huruf.map((c, i) => { ctx.font = fonts[Math.floor(R(id0 + i * 3) * fonts.length)]; return c === ' ' ? ukuran * .4 : ctx.measureText(c).width + ukuran * .35; });
    const total = lebar.reduce((a, b) => a + b, 0), maks = o.maks ?? 900;
    if (total > maks && !o._kecil) return M.guntingan(teks, x, y, ukuran * maks / total, { ...o, _kecil: true });   // muat di kotak aman
    let cx = x - total / 2 * (o.rata === 'kiri' ? 0 : 1); const n = huruf.length;
    huruf.forEach((c, i) => { const w = lebar[i], kk = seg(k, i / n * .7, i / n * .7 + .3); if (c !== ' ' && kk > 0) {
        const L = latar[Math.floor(R(id0 + i * 7) * latar.length)], gelap = [PALET.merah, PALET.biru, PALET.hitam].includes(L), f = fonts[Math.floor(R(id0 + i * 3) * fonts.length)];
        const rot = (R(id0 + i * 11) - .5) * .22 + M.goyang(id0 + i, o.t ?? T, .02), dy = (R(id0 + i * 13) - .5) * ukuran * .12;
        M.kertas(cx + w / 2, y + dy, w, ukuran * 1.25, id0 * 100 + i, { jenis: L, rot, k: kk, tepiPutih: false, kasar: .5, isi: () => {
          ctx.font = f; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = gelap ? '#FFFFFF' : PALET.hitam; ctx.fillText(R(id0 + i * 17) > .7 ? c.toLowerCase() : c.toUpperCase(), 0, ukuran * .05); } }); }
      cx += w; }); };

  // halftone: titik-titik cetak di dalam path/persegi; ukuran titik mengikuti terang(x,y) 0..1 (0 = titik besar)
  M.halftone = (klip, warna, o = {}) => { const j = o.jarak ?? 13, a = o.sudut ?? .4, [x0, y0, x1, y1] = o.kotak ?? [0, 0, W, H];
    ctx.save(); if (klip) ctx.clip(klip); ctx.fillStyle = warna; const ca = Math.cos(a), sa = Math.sin(a), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R2 = Math.hypot(x1 - x0, y1 - y0) / 2;
    for (let u = -R2; u < R2; u += j) for (let v = -R2; v < R2; v += j) { const px = cx + u * ca - v * sa, py = cy + u * sa + v * ca; if (px < x0 - j || px > x1 + j || py < y0 - j || py > y1 + j) continue;
      const r = (1 - (o.terang ? o.terang(px, py) : .5)) * j * .62; if (r > .4) { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); } }
    ctx.restore(); };
  // bentuk hati (path) untuk isiHalftone / kertas
  M.hati = (x, y, r) => { const p = new Path2D(); p.moveTo(x, y + r * .95); p.bezierCurveTo(x - r * 1.5, y + r * .1, x - r * 1.1, y - r * 1.05, x, y - r * .45);
    p.bezierCurveTo(x + r * 1.1, y - r * 1.05, x + r * 1.5, y + r * .1, x, y + r * .95); p.closePath(); return p; };
  // isi path apa pun dengan warna dasar + titik halftone berbayang (kotak = [x0,y0,x1,y1] batas path)
  M.isiHalftone = (p, kotak, warnaDasar, warnaTitik, o = {}) => { const [x0, y0, x1, y1] = kotak, x = (x0 + x1) / 2, y = (y0 + y1) / 2, r = Math.max(x1 - x0, y1 - y0) / 2;
    ctx.save(); bayang(o.bayang !== false, 18, 6, 10, .3); ctx.fillStyle = warnaDasar; ctx.fill(p); bayang(false); const [lx, ly] = o.cahaya ?? [-.5, -.6];
    M.halftone(p, warnaTitik, { jarak: o.jarak ?? 12, kotak, terang: (px, py) => Math.max(0, Math.min(1, .55 + ((px - x) * lx + (py - y) * ly) / r * .65)) });
    ctx.strokeStyle = PALET.hitam; ctx.lineWidth = o.lw ?? 5; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore(); };
  // bola cetak halftone (planet, bola, sel) dengan arah cahaya
  M.bolaHalftone = (x, y, r, warnaDasar, warnaTitik, o = {}) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); ctx.save(); bayang(o.bayang !== false, 18, 6, 10, .3); ctx.fillStyle = warnaDasar; ctx.fill(p); bayang(false);
    const [lx, ly] = o.cahaya ?? [-.5, -.6]; M.halftone(p, warnaTitik, { jarak: o.jarak ?? 12, kotak: [x - r, y - r, x + r, y + r], terang: (px, py) => Math.max(0, Math.min(1, .55 + ((px - x) * lx + (py - y) * ly) / r * .65)) });
    ctx.strokeStyle = PALET.hitam; ctx.lineWidth = 4; ctx.stroke(p); ctx.restore(); };

  // kliping koran: judul tebal + kolom teks palsu
  M.kliping = (x, y, w, h, judul, id, o = {}) => M.kertas(x, y, w, h, id, { jenis: 'koran', rot: o.rot, k: o.k, isi: (ww, hh) => {
    ctx.fillStyle = PALET.koran; ctx.fillRect(-ww / 2, -hh / 2, ww, hh * .34); ctx.fillStyle = PALET.hitam; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let uk = o.ukuran ?? 52; ctx.font = `900 ${uk}px "DejaVu Serif", serif`; while (ctx.measureText(judul).width > ww * .88 && uk > 20) { uk -= 2; ctx.font = `900 ${uk}px "DejaVu Serif", serif`; }
    ctx.fillText(judul, 0, -hh / 2 + hh * .17); ctx.fillRect(-ww * .44, -hh / 2 + hh * .3, ww * .88, 3); } });

  // polaroid: bingkai putih, isi digambar fn(cx, cy, w, h) di dalam jendela foto (koordinat layar asli lewat stiker/keKanvas bila perlu)
  M.polaroid = (x, y, w, h, id, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const s = backOut(seg(k, 0, 1));
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? (R(id) - .5) * .16); ctx.scale(s, s); bayang(true, 18, 6, 12, .35);
    ctx.fillStyle = '#FDFBF6'; ctx.fillRect(-w / 2, -h / 2, w, h); bayang(false); ctx.fillStyle = pola('serat'); ctx.fillRect(-w / 2, -h / 2, w, h);
    const m = w * .06, fw = w - m * 2, fh = h - m - h * .2; ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + m, -h / 2 + m, fw, fh); ctx.clip(); ctx.fillStyle = o.latar ?? '#2B2B33'; ctx.fillRect(-w / 2 + m, -h / 2 + m, fw, fh);
    if (o.isi) o.isi(-w / 2 + m, -h / 2 + m, fw, fh); ctx.restore();
    if (o.tulisan) { ctx.font = `500 ${h * .075}px ${FONT}`; ctx.fillStyle = '#2F3A8F'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.tulisan, 0, h / 2 - h * .1); }
    ctx.restore(); if (o.selotip !== false) M.selotip(x + Math.sin(o.rot ?? 0) * h / 2, y - h / 2 * s, 150, (R(id + 3) - .5) * .5, id + 7); };

  // cap stempel karet (tekstur bolong-bolong), dicap dengan hentakan
  M.cap = (teks, x, y, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const uk = o.ukuran ?? 70, key = 'cap' + teks + uk + (o.warna ?? '');
    const c = CACHE[key] ??= (() => { const q0 = kanvas(10, 10).getContext('2d'); q0.font = `900 ${uk}px "DejaVu Sans", sans-serif`; const tw = q0.measureText(teks).width, w = tw + uk * 1.1, h = uk * 1.7, c = kanvas(w + 20, h + 20), q = c.getContext('2d');
      q.translate(10, 10); q.strokeStyle = q.fillStyle = o.warna ?? '#C8322B'; q.lineWidth = uk * .09; q.beginPath(); q.roundRect(4, 4, w - 8, h - 8, uk * .2); q.stroke(); q.lineWidth = uk * .03; q.beginPath(); q.roundRect(uk * .16, uk * .16, w - uk * .32, h - uk * .32, uk * .12); q.stroke();
      q.font = `900 ${uk}px "DejaVu Sans", sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(teks, w / 2, h / 2 + uk * .04);
      q.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { q.beginPath(); q.arc(R(i * 3 + 1) * w, R(i * 5 + 2) * h, R(i * 7 + 3) * uk * .05 + .5, 0, TAU); q.fill(); } return c; })();
    const s = 1 + 1.2 * (1 - easeOut(seg(k, 0, .35))); ctx.save(); ctx.globalAlpha = .9 * seg(k, 0, .15); ctx.translate(x, y); ctx.rotate(o.rot ?? -.12); ctx.scale(s, s); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore(); };

  // latar meja kolase
  M.latar = (jenis = 'kraft') => { ctx.fillStyle = pola(jenis); ctx.fillRect(0, 0, W, H); };
  // butiran film + vinyet (pasang di GAYA.post)
  M.butiran = (t, a = 1) => { const c = TEKS.butir[Math.floor(t * 12) % TEKS.butir.length]; ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(c, 0, 0, W, H); ctx.restore();
    const g = ctx.createRadialGradient(540, 960, 650, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,25,10,0.38)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };

  // transisi: adegan lama disobek & ditarik ke kiri (pasang di GAYA.trans)
  M.transSobek = (k, gambarLama) => { const e = ease(k), x = W * 1.15 * (1 - e) - 60, P = [[-100, -50]];
    for (let y = -50; y <= H + 50; y += 18) P.push([x + (R(y * .7) - .5) * 40 + Math.sin(y * .01) * 30, y]); P.push([-100, H + 50]);
    const p = jalur(P); ctx.save(); ctx.translate(-e * 120, 0); ctx.rotate(-e * .05); bayang(true, 22, 10, 0, .45); ctx.fillStyle = '#FBF8F0'; ctx.fill(p); bayang(false); ctx.clip(p);
    ctx.translate(-12, 0); gambarLama(); ctx.restore(); };

  // GAYA siap pakai untuk dasar.js: potongan kertas, garis spidol, latar meja kolase, transisi sobek, butiran
  M.gaya = (o = {}) => ({
    ink: PALET.hitam, hi: o.aksen ?? PALET.kuning, card: '#FBF8F0',
    init() { M.init(); },
    shape(pts, col, id, so = {}) { const p = pathOf(pts); bayang(!so.text && so.line !== false, 8, 3, 5, .28); ctx.fillStyle = rgba(col, so.fill ?? 1); ctx.fill(p); bayang(false);
      if (!so.text) { ctx.save(); ctx.clip(p); ctx.fillStyle = pola('serat'); ctx.fillRect(0, 0, W, H); ctx.restore(); }
      if (so.line !== false) { ctx.strokeStyle = PALET.hitam; ctx.lineWidth = so.lw ?? 4; ctx.lineJoin = 'round'; ctx.stroke(p); } },
    line(pts, lw, col = PALET.hitam, id, a = 1) { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(pts, false)); },
    bg() { M.latar(o.latar ?? 'kraft'); },
    trans(k, gambarLama) { M.transSobek(k, gambarLama); },
    post(t) { M.butiran(t, o.butiran ?? .9); },
  });
  return M;
})();
