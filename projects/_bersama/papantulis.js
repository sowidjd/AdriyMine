// PAPAN TULIS (Whiteboard animation) untuk video Canvas kita. Lihat .claude/skills/whiteboard/SKILL.md.
// Papan putih, coretan spidol yang tergambar goresan demi goresan dengan TANGAN yang memegang spidol mengikuti ujungnya,
// tulisan tangan per huruf, arsiran warna, gambar dari path SVG, ungkap gambar apa pun (Adriy, ikon) dengan sapuan,
// kamera geser/zoom di papan besar, transisi dihapus penghapus. Dimuat SESUDAH dasar.js (ctx, W, H, hash, ease, seg, FONT, TAU).
const WB = (() => {
  const R = n => hash(n * 2.17 + 5.3), CACHE = {};
  const SPIDOL = { hitam: '#222222', biru: '#1F5FBF', merah: '#D93A3A', hijau: '#2E9E4F', oranye: '#F08A24', ungu: '#7A4FC2' };
  const M = { SPIDOL, R };
  let tangan = null;   // posisi tangan frame ini [x, y] atau null

  // ---------- papan ----------
  M.papan = (o = {}) => { ctx.fillStyle = o.warna ?? '#FBFBF8'; ctx.fillRect(0, 0, W, H);
    if (!CACHE.noda) { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const q = c.getContext('2d');
      for (let i = 0; i < 18; i++) { const g = q.createRadialGradient(0, 0, 0, 0, 0, 1); q.save(); q.translate(R(i) * 540, R(i + .5) * 960); q.scale(60 + R(i * 3) * 140, 20 + R(i * 5) * 50); q.rotate(R(i * 7));
        g.addColorStop(0, 'rgba(120,130,150,0.05)'); g.addColorStop(1, 'rgba(120,130,150,0)'); q.fillStyle = g; q.fillRect(-1, -1, 2, 2); q.restore(); }
      CACHE.noda = c; }
    ctx.drawImage(CACHE.noda, 0, 0, W, H); tangan = null; };

  // ---------- coretan ----------
  const panjang = P => { let L = 0; const d = [0]; for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); d.push(L); } return { L, d }; };
  // gambar polyline sampai fraksi k; kembalikan titik ujung
  function goresan(P, k, warna, lebar, id) { if (k <= 0 || P.length < 2) return null; const { L, d } = panjang(P), batas = L * Math.min(1, k);
    ctx.save(); ctx.strokeStyle = warna; ctx.lineWidth = lebar; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = .93; ctx.beginPath(); let ujung = P[0];
    for (let i = 0; i < P.length; i++) { const jit = (R(id * 31 + i) - .5) * .8; if (d[i] > batas) { const u = (batas - d[i - 1]) / (d[i] - d[i - 1] || 1); ujung = [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u]; ctx.lineTo(...ujung); break; }
      i ? ctx.lineTo(P[i][0] + jit, P[i][1] + jit) : ctx.moveTo(P[i][0], P[i][1]); ujung = P[i]; }
    ctx.stroke(); ctx.restore(); return ujung; }

  // ---------- bentuk (semua mengembalikan DAFTAR goresan: [[ [x,y],... ], ...]) ----------
  const goyang = (x, y, id, a = 2.5) => [x + (R(id) - .5) * a, y + (R(id + .5) - .5) * a];
  M.garis = (x1, y1, x2, y2, id = 1) => [Array.from({ length: 12 }, (_, i) => goyang(x1 + (x2 - x1) * i / 11, y1 + (y2 - y1) * i / 11, id + i, 2))];
  M.lingkaran = (x, y, rx, ry = rx, id = 1) => [Array.from({ length: 64 }, (_, i) => { const a = -1.9 + i / 63 * TAU * 1.06, r = 1 + (R(id + i) - .5) * .025; return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]; })];
  M.kotak = (x, y, w, h, id = 1) => [[goyang(x, y, id), goyang(x + w, y, id + 1), goyang(x + w, y + h, id + 2), goyang(x, y + h, id + 3), goyang(x + 2, y - 3, id + 4)]];
  M.panah = (x1, y1, x2, y2, lengkung = .2, id = 1) => { const mx = (x1 + x2) / 2 - (y2 - y1) * lengkung, my = (y1 + y2) / 2 + (x2 - x1) * lengkung, P = [];
    for (let i = 0; i <= 30; i++) { const u = i / 30; P.push([(1 - u) ** 2 * x1 + 2 * (1 - u) * u * mx + u * u * x2, (1 - u) ** 2 * y1 + 2 * (1 - u) * u * my + u * u * y2]); }
    const a = Math.atan2(y2 - P[27][1], x2 - P[27][0]), s = 38; return [P, [[x2 - Math.cos(a - .5) * s, y2 - Math.sin(a - .5) * s], [x2, y2], [x2 - Math.cos(a + .5) * s, y2 - Math.sin(a + .5) * s]]]; };
  M.garisBawah = (x1, x2, y, id = 1) => [[goyang(x1, y, id), goyang((x1 + x2) / 2, y + 5, id + 1), goyang(x2, y - 2, id + 2)]];
  M.centang = (x, y, s = 60) => [[[x - s * .5, y], [x - s * .1, y + s * .4], [x + s * .6, y - s * .5]]];
  M.silang = (x, y, s = 50) => [[[x - s, y - s], [x + s, y + s]], [[x + s, y - s], [x - s, y + s]]];
  M.bintang = (x, y, r) => [Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; })];
  M.orangLidi = (x, y, s = 1, o = {}) => { const tg = o.tangan ?? 0; return [...M.lingkaran(x, y - 150 * s, 32 * s, 32 * s, 3), [[x, y - 118 * s], [x, y - 40 * s]], [[x, y - 40 * s], [x - 34 * s, y + 30 * s]], [[x, y - 40 * s], [x + 34 * s, y + 30 * s]],
    [[x - 50 * s, y - 95 * s + tg * 40 * s], [x, y - 95 * s], [x + 50 * s, y - 95 * s - tg * 50 * s]]]; };
  M.lampu = (x, y, s = 1) => [...M.lingkaran(x, y, 60 * s, 66 * s, 9), [[x - 26 * s, y + 62 * s], [x - 22 * s, y + 100 * s], [x + 22 * s, y + 100 * s], [x + 26 * s, y + 62 * s]], [[x - 20 * s, y + 82 * s], [x + 20 * s, y + 82 * s]],
    ...[-1.2, -.6, 0, .6, 1.2].map(a => [[x + Math.sin(a) * 90 * s, y - Math.cos(a) * 95 * s], [x + Math.sin(a) * 125 * s, y - Math.cos(a) * 130 * s]])];
  M.gelembung = (x, y, w, h) => { const P = Array.from({ length: 50 }, (_, i) => { const a = i / 49 * TAU; return [x + Math.cos(a) * w / 2, y + Math.sin(a) * h / 2]; }); return [P, [[x - w * .2, y + h * .45], [x - w * .35, y + h * .8], [x - w * .02, y + h * .5]]]; };
  M.grafikNaik = (x, y, w, h, nilai = [.2, .35, .3, .55, .5, .8, .95]) => [[[x, y - h], [x, y], [x + w, y]], nilai.map((v, i) => [x + 20 + i * (w - 40) / (nilai.length - 1), y - 20 - v * (h - 40)])];
  // dari path SVG (d="M ... ") -> goresan; skala & geser. Memakai SVGPathElement.getPointAtLength milik peramban.
  M.dariSVG = (d, x = 0, y = 0, s = 1, langkah = 6) => { const NS = 'http://www.w3.org/2000/svg', el = document.createElementNS(NS, 'path'); el.setAttribute('d', d);
    const subs = d.split(/(?=[Mm])/).filter(Boolean), hasil = []; let awal = 0;
    for (const sp of subs) { const e2 = document.createElementNS(NS, 'path'); e2.setAttribute('d', sp.replace(/^m/, 'M')); const L = e2.getTotalLength(), P = [];
      for (let l = 0; l <= L; l += langkah) { const p = e2.getPointAtLength(l); P.push([x + p.x * s, y + p.y * s]); } if (P.length > 1) hasil.push(P); awal += L; }
    return hasil; };

  // ---------- rencana: urutan item digambar satu per satu, durasi sebanding panjang goresan ----------
  // item: {goresan, warna, lebar} | {teks, x, y, ukuran, warna} | {arsir: Path2D/goresan tertutup, warna} | {ungkap: fn, kotak:[x,y,w,h]} | {jeda: detik}
  // o: {mulai (detik), laju (px/detik), lajuTeks (huruf/detik)}. Kembalikan fungsi gambar(t).
  M.rencana = (items, o = {}) => { const laju = o.laju ?? 1400; let t = o.mulai ?? 0;
    const J = items.map((it, i) => { let dur = it.durasi;
      if (dur == null) { if (it.goresan) dur = Math.max(.25, it.goresan.reduce((a, P) => a + panjang(P).L, 0) / laju); else if (it.teks) dur = [...it.teks].length / (o.lajuTeks ?? 14); else if (it.arsir) dur = .9; else if (it.ungkap) dur = 1.4; else dur = it.jeda ?? .3; }
      const j = { it, a: t + (it.tunda ?? 0), b: t + (it.tunda ?? 0) + dur, id: i + 1 }; t = j.b; return j; });
    const f = tt => { for (const j of J) { const k = seg(tt, j.a, j.b); if (k <= 0) continue; const ujung = M.item(j.it, k, j.id); if (k < 1 && ujung) tangan = ujung; } };
    f.selesai = t; f.jadwal = J; return f; };
  // gambar satu item pada kemajuan k; kembalikan posisi ujung spidol
  M.item = (it, k, id = 1) => {
    if (it.goresan) { const tot = it.goresan.reduce((a, P) => a + panjang(P).L, 0); let sisa = tot * k, ujung = null;
      it.goresan.forEach((P, i) => { const L = panjang(P).L; if (sisa <= 0) return; const kk = Math.min(1, sisa / L); ujung = goresan(P, kk, it.warna ?? SPIDOL.hitam, it.lebar ?? 9, id * 17 + i) ?? ujung; sisa -= L; }); return ujung; }
    if (it.teks) return M.tulis(it.teks, it.x, it.y, it.ukuran ?? 70, k, it);
    if (it.arsir) return M.arsir(it.arsir, it.warna ?? SPIDOL.oranye, k, it);
    if (it.ungkap) return M.ungkap(it.ungkap, it.kotak, k);
    return null; };

  // tulisan tangan: huruf muncul satu per satu (disapu kiri->kanan), tangan mengikuti
  M.tulis = (s, x, y, uk, k, o = {}) => { if (k <= 0) return null; ctx.save(); ctx.font = `${o.tebal ?? 600} ${uk}px ${o.font ?? FONT}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = o.warna ?? SPIDOL.hitam;
    const w = ctx.measureText(s).width, x0 = o.rata === 'kiri' ? x : x - w / 2, batas = w * k; ctx.beginPath(); ctx.rect(x0 - 10, y - uk * 1.2, batas + 10, uk * 1.6); ctx.clip(); ctx.globalAlpha = .95; ctx.fillText(s, x0, y); ctx.restore();
    return k < 1 ? [x0 + batas, y - uk * .25 + Math.sin(k * 40) * uk * .12] : null; };
  // arsiran warna (spidol zigzag) di dalam bentuk
  M.arsir = (bentuk, warna, k, o = {}) => { if (k <= 0) return null; const p = bentuk instanceof Path2D ? bentuk : (() => { const q = new Path2D(); bentuk.forEach(P => P.forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y))); q.closePath(); return q; })();
    const [x0, y0, w, h] = o.kotak ?? [0, 0, W, H], jarak = o.jarak ?? 16, n = Math.ceil((w + h) / jarak), m = Math.floor(n * k); let ujung = null;
    ctx.save(); ctx.clip(p); ctx.strokeStyle = warna; ctx.globalAlpha = .75; ctx.lineWidth = jarak * 1.25; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < m; i++) { const d = i * jarak, ax = x0 + Math.min(d, w), ay = y0 + Math.max(0, d - w), bx = x0 + Math.max(0, d - h), by = y0 + Math.min(d, h); if (i % 2) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ujung = [bx, by]; } else { ctx.moveTo(bx, by); ctx.lineTo(ax, ay); ujung = [ax, ay]; } }
    ctx.stroke(); ctx.restore(); return k < 1 ? ujung : null; };
  // ungkap gambar apa pun (fn menggambar normal) dengan sapuan zigzag dari atas ke bawah di dalam kotak [x, y, w, h]
  M.ungkap = (fn, kotak, k) => { if (k <= 0) return null; const [x, y, w, h] = kotak, baris = 6, e = Math.min(1, k), pos = e * baris, b = Math.floor(pos), u = pos - b;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h / baris * b); const ke = b % 2 === 0; ctx.rect(ke ? x : x + w * (1 - u), y + h / baris * b, w * u, h / baris); ctx.clip(); fn(); ctx.restore();
    return k < 1 ? [ke ? x + w * u : x + w * (1 - u), y + h / baris * (b + .6)] : null; };

  // ---------- tangan memegang spidol (digambar dari kode, bukan foto) ----------
  M.tangan = (x, y, o = {}) => { if (x == null) return; const s = o.skala ?? 1, kulit = o.kulit ?? '#E8B892', gelap = '#C98F68';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.35);
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetX = 18; ctx.shadowOffsetY = 26;
    // spidol
    ctx.fillStyle = o.warnaSpidol ?? SPIDOL.hitam; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(10, 26); ctx.lineTo(-10, 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#EDEDED'; ctx.beginPath(); ctx.roundRect(-16, 24, 32, 190, 10); ctx.fill(); ctx.fillStyle = o.warnaSpidol ?? SPIDOL.hitam; ctx.fillRect(-16, 150, 32, 40);
    // tangan
    ctx.fillStyle = kulit; ctx.beginPath(); ctx.ellipse(30, 150, 70, 92, -.25, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.ellipse(-12, 78, 24, 44, .35, 0, TAU); ctx.fill();                          // ibu jari
    ctx.beginPath(); ctx.ellipse(26, 70, 20, 50, -.15, 0, TAU); ctx.fill();                           // telunjuk
    ctx.fillRect(40, 230, 110, 400);                                                                   // lengan (keluar layar)
    ctx.strokeStyle = gelap; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(26, 110, 22, .2, 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(52, 140, 24, .1, 1.5); ctx.stroke();
    ctx.fillStyle = '#F4D7C2'; ctx.beginPath(); ctx.ellipse(20, 32, 9, 12, -.1, 0, TAU); ctx.fill();   // kuku
    ctx.restore(); };
  // panggil di akhir adegan: tangan muncul di ujung goresan yang sedang aktif (atau diam di posisi istirahat bila o.istirahat)
  M.tanganAktif = (o = {}) => { if (tangan) M.tangan(tangan[0], tangan[1], o); else if (o.istirahat) M.tangan(...o.istirahat, o); };

  // ---------- kamera di papan besar ----------
  M.kamera = (kam, fn) => { ctx.save(); ctx.translate(540, 960); ctx.scale(kam.zoom ?? 1, kam.zoom ?? 1); ctx.translate(-(kam.x ?? 540), -(kam.y ?? 960)); fn(); ctx.restore(); };

  // ---------- transisi: penghapus menyapu papan ----------
  M.hapus = (k, gambarLama) => { const e = ease(k); ctx.save(); const garis = 8, x = -200 + (W + 400) * e;
    ctx.beginPath(); ctx.rect(x, -10, W + 400, H + 20); ctx.clip(); gambarLama(); ctx.restore();
    ctx.save(); ctx.translate(x, H * (.3 + .4 * Math.sin(e * Math.PI * garis / 4) * .5)); ctx.rotate(.15);
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetX = 12; ctx.shadowOffsetY = 16;
    ctx.fillStyle = '#3B4A6B'; ctx.beginPath(); ctx.roundRect(-60, -170, 120, 340, 24); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#ECE7DC'; ctx.fillRect(-60, -170, 26, 340); ctx.restore(); };

  // GAYA siap pakai untuk dasar.js: garis spidol hitam, isi warna spidol transparan, papan putih, transisi dihapus
  M.gaya = (o = {}) => ({
    ink: SPIDOL.hitam, hi: o.aksen ?? '#FFE066', card: '#FFFFFF',
    shape(pts, col, id, so = {}) { const p = pathOf(pts); ctx.save(); ctx.globalAlpha = so.text ? 1 : .85; ctx.fillStyle = rgba(col, so.fill ?? 1); ctx.fill(p); ctx.restore();
      if (so.line !== false) { ctx.strokeStyle = SPIDOL.hitam; ctx.lineWidth = so.lw ?? (so.text ? 3 : 6); ctx.lineJoin = ctx.lineCap = 'round'; ctx.stroke(p); } },
    line(pts, lw, col = SPIDOL.hitam, id, a = 1) { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(pts, false)); },
    bg() { M.papan(); },
    trans(k, gambarLama) { M.hapus(k, gambarLama); },
    post() {},
  });
  return M;
})();
