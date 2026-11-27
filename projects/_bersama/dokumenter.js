// DOKUMENTER: gaya film dokumenter untuk video Canvas kita. Lihat .claude/skills/documentary/SKILL.md.
// Ken Burns (geser & zoom pelan pada gambar), tampilan film arsip (sepia, butiran, goresan, debu, kedip, goyang gerbang),
// letterbox, lower third, kartu tanggal & tempat, mesin ketik, kartu kutipan (wajib sumber), dokumen dengan sorotan,
// peta ilustrasi dengan pin & rute, kartu babak, cahaya bocor, label ILUSTRASI/REKONSTRUKSI.
// Dimuat SESUDAH dasar.js (ctx, W, H, hash, ease, easeOut, seg, FONT, TAU).
const DOK = (() => {
  const R = n => hash(n * 3.11 + 9.7), CACHE = {};
  const SERIF = '"DejaVu Serif", Georgia, serif', MONO = '"DejaVu Sans Mono", monospace';
  const WARNA = { gelap: '#121212', kertas: '#E9DFC8', tinta: '#2A231C', emas: '#D8B26A', merah: '#B33A2E', putih: '#F3EFE6' };
  const M = { WARNA, SERIF, MONO, R };
  const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- gambar & Ken Burns ----------
  // sumber: HTMLImageElement / kanvas, ATAU fungsi gambar(q, w, h) yang dibuat sekali (ilustrasi) -> disimpan di cache dengan kunci.
  M.gambar = (kunci, w, h, fn) => { if (CACHE['g' + kunci]) return CACHE['g' + kunci]; const c = kanvas(w, h), lama = ctx; ctx = c.getContext('2d'); try { fn(w, h); } finally { ctx = lama; } return CACHE['g' + kunci] = c; };
  // muat foto milik sendiri / CC0 (pastikan sudah termuat sebelum render: tunggu DOK.siap)
  const muat = []; M.foto = src => { const im = new Image(); im.src = src; muat.push(new Promise(r => { im.onload = r; im.onerror = r; })); return im; };
  M.siap = () => Promise.all(muat);
  // Ken Burns: dari kotak a ke kotak b (bagian gambar [x, y, w, h] dalam piksel gambar) selama k 0..1; mengisi area tujuan (default layar penuh)
  M.kenBurns = (img, a, b, k, tujuan = [0, 0, W, H]) => { const e = ease(k), L = (i) => a[i] + (b[i] - a[i]) * e; const [dx, dy, dw, dh] = tujuan;
    // jaga rasio: potong sumber agar sesuai rasio tujuan
    let sw = L(2), sh = L(3); const r = dw / dh; if (sw / sh > r) sw = sh * r; else sh = sw / r; const sx = L(0) + (L(2) - sw) / 2, sy = L(1) + (L(3) - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh); };

  // ---------- film arsip (pasang di GAYA.post) ----------
  M.filmLama = (t, o = {}) => { const f = Math.floor(t * 24), kuat = o.kuat ?? 1;
    if (o.sepia !== false) { ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = `rgba(112,84,52,${.85 * kuat})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const kedip = .06 * kuat * (R(f) - .5); if (kedip > 0) { ctx.fillStyle = `rgba(255,240,210,${kedip})`; ctx.fillRect(0, 0, W, H); } else { ctx.fillStyle = `rgba(0,0,0,${-kedip})`; ctx.fillRect(0, 0, W, H); }
    if (!CACHE.butir) CACHE.butir = [0, 1, 2, 3].map(j => { const c = kanvas(270, 480), q = c.getContext('2d'), im = q.createImageData(270, 480); for (let i = 0; i < im.data.length; i += 4) { const v = R(i * .21 + j * 777) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 40; } q.putImageData(im, 0, 0); return c; });
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = kuat; ctx.drawImage(CACHE.butir[f % 4], 0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha = .5 * kuat; for (let i = 0; i < 2; i++) if (R(f * 7 + i) > .55) { const x = R(f * 13 + i) * W; ctx.strokeStyle = R(f + i) > .5 ? 'rgba(255,250,235,0.6)' : 'rgba(20,15,10,0.6)'; ctx.lineWidth = 1 + R(f * 3 + i) * 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (R(f * 5 + i) - .5) * 30, H); ctx.stroke(); }   // goresan
    ctx.fillStyle = 'rgba(20,15,10,0.7)'; for (let i = 0; i < 6; i++) if (R(f * 11 + i * 3) > .6) { ctx.beginPath(); ctx.arc(R(f * 17 + i) * W, R(f * 19 + i) * H, 1 + R(f * 23 + i) * 4, 0, TAU); ctx.fill(); } ctx.restore();   // debu
    const g = ctx.createRadialGradient(540, 960, 620, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,6,2,${.6 * kuat})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  // goyang gerbang proyektor: panggil di awal adegan (sebelum menggambar) -> geser kecil tiap frame
  M.goyangGerbang = (t, amp = 2) => { const f = Math.floor(t * 24); ctx.translate((R(f) - .5) * amp, (R(f + .5) - .5) * amp * 1.5); };
  M.cahayaBocor = (t, a = .35) => { ctx.save(); ctx.globalCompositeOperation = 'screen'; const x = 540 + 500 * Math.sin(t * .35), y = 300 + 200 * Math.cos(t * .27), g = ctx.createRadialGradient(x, y, 0, x, y, 700);
    g.addColorStop(0, `rgba(255,150,60,${a})`); g.addColorStop(.5, `rgba(255,80,40,${a * .4})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  M.letterbox = (k = 1, tinggi = 150) => { const h = tinggi * ease(k); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); };

  // ---------- teks khas dokumenter ----------
  M.ketik = (s, x, y, uk, k, o = {}) => { if (k <= 0) return; const n = Math.floor([...s].length * Math.min(1, k)); ctx.save(); ctx.font = `${o.tebal ?? 400} ${uk}px ${o.font ?? MONO}`; ctx.fillStyle = o.warna ?? WARNA.putih;
    ctx.textAlign = o.rata ?? 'center'; ctx.textBaseline = 'middle'; const tampil = [...s].slice(0, n).join(''); ctx.fillText(tampil, x, y);
    if (k < 1.15 && Math.floor((o.t ?? T) * 2.5) % 2 === 0) { const w = ctx.measureText(tampil).width, kiri = (o.rata ?? 'center') === 'center' ? x - ctx.measureText(s).width / 2 : x; ctx.fillRect(kiri + w + 4, y - uk * .45, uk * .5, uk * .9); }   // kursor berkedip
    ctx.restore(); };
  // kartu tanggal & tempat: "1928" besar + tempat diketik
  M.kartuTanggal = (tahun, tempat, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const y = o.y ?? 760; ctx.save(); ctx.globalAlpha = Math.min(1, k * 3);
    ctx.font = `700 ${o.ukuran ?? 220}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.warna ?? WARNA.putih; ctx.letterSpacing = `${(1 - easeOut(seg(k, 0, .6))) * 40 + 6}px`; ctx.fillText(String(tahun), 540, y); ctx.letterSpacing = '0px';
    ctx.fillStyle = WARNA.emas; ctx.fillRect(540 - 200 * ease(seg(k, .3, .7)), y + 140, 400 * ease(seg(k, .3, .7)), 4); ctx.restore();
    M.ketik(tempat, 540, y + 210, 54, seg(k, .5, 1), { warna: WARNA.putih }); };
  // lower third: nama + keterangan (orang, tempat, benda)
  M.lowerThird = (judul, sub, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const x = o.x ?? 80, y = o.y ?? 1180, e = easeOut(seg(k, 0, .5)), keluar = 1 - ease(o.keluar ?? 0);   // o.keluar 0..1 = memudar
    ctx.save(); ctx.globalAlpha = keluar; ctx.font = `500 34px ${FONT}`; const wSub = sub ? ctx.measureText(sub).width : 0; ctx.font = `700 52px ${FONT}`; const w = Math.max(ctx.measureText(judul).width, wSub, 300) + 60;
    ctx.fillStyle = WARNA.emas; ctx.fillRect(x, y - 50, 10, 120 * e); ctx.fillStyle = 'rgba(12,10,8,0.78)'; ctx.fillRect(x + 10, y - 50, w * e, 74);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 10, y - 60, w * e, 140); ctx.clip(); ctx.fillStyle = WARNA.putih; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(judul, x + 36, y - 12);
    if (sub) { ctx.font = `500 34px ${FONT}`; ctx.fillStyle = WARNA.emas; ctx.fillText(sub, x + 36, y + 52); } ctx.restore(); ctx.restore(); };
  // kartu babak / bab
  M.babak = (nomor, judul, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, k * 2) * (1 - ease(o.keluar ?? 0));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `500 40px ${SERIF}`; ctx.fillStyle = WARNA.emas; ctx.letterSpacing = '12px'; ctx.fillText(`BAB ${nomor}`, 540, 820); ctx.letterSpacing = '0px';
    ctx.font = `700 ${o.ukuran ?? 80}px ${SERIF}`; ctx.fillStyle = WARNA.putih; ctx.fillText(judul, 540, 920 + 20 * (1 - easeOut(k))); ctx.fillStyle = WARNA.emas; const lw = 160 * ease(seg(k, .3, .8)); ctx.fillRect(540 - lw, 1000, lw * 2, 3); ctx.restore(); };
  // kutipan: WAJIB ada sumber (siapa + di mana/kapan). Jangan mengarang kutipan orang nyata.
  M.kutipan = (teks, sumber, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; if (!sumber) throw new Error('DOK.kutipan wajib diberi sumber'); ctx.save(); ctx.globalAlpha = Math.min(1, k * 2) * (1 - ease(o.keluar ?? 0));
    ctx.font = `700 260px ${SERIF}`; ctx.fillStyle = WARNA.emas; ctx.textAlign = 'center'; ctx.fillText('“', 540, 640);
    ctx.font = `italic 500 ${o.ukuran ?? 58}px ${SERIF}`; ctx.fillStyle = WARNA.putih; ctx.textBaseline = 'middle'; const kata = teks.split(' '), baris = []; let b = '';
    for (const w of kata) { if (ctx.measureText(b + w).width > 800 && b) { baris.push(b.trim()); b = ''; } b += w + ' '; } baris.push(b.trim());
    const n = Math.ceil(baris.length * seg(k, .1, .7)); baris.slice(0, n).forEach((s, i) => ctx.fillText(s, 540, 760 + i * (o.ukuran ?? 58) * 1.35));
    ctx.font = `500 36px ${FONT}`; ctx.fillStyle = WARNA.emas; ctx.globalAlpha *= seg(k, .7, 1); ctx.fillText('— ' + sumber, 540, 790 + baris.length * (o.ukuran ?? 58) * 1.35); ctx.restore(); };
  // label kecil kejujuran visual: 'ILUSTRASI', 'REKONSTRUKSI', 'ARSIP: sumber'
  M.label = (teks, o = {}) => { ctx.save(); ctx.font = `700 28px ${FONT}`; ctx.letterSpacing = '4px'; const w = ctx.measureText(teks).width + 36, x = o.x ?? 80, y = o.y ?? 240;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, w, 48); ctx.strokeStyle = WARNA.emas; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, 48); ctx.fillStyle = WARNA.putih; ctx.textBaseline = 'middle'; ctx.fillText(teks, x + 18, y + 25); ctx.letterSpacing = '0px'; ctx.restore(); };

  // ---------- dokumen dengan baris disorot (baris = bar teks samar, bukan tulisan asli) ----------
  M.dokumen = (x, y, w, h, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -.03); const s = .9 + .1 * easeOut(k); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, k * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = WARNA.kertas; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    const g = ctx.createRadialGradient(0, 0, w * .3, 0, 0, w * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,20,0.35)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    if (o.judul) { ctx.font = `700 46px ${SERIF}`; ctx.fillStyle = WARNA.tinta; ctx.textAlign = 'center'; ctx.fillText(o.judul, 0, -h / 2 + 90); ctx.fillRect(-w * .35, -h / 2 + 115, w * .7, 3); }
    const n = o.baris ?? 14, sorot = o.sorot ?? [], ks = o.kSorot ?? 1;
    for (let i = 0; i < n; i++) { const yy = -h / 2 + 170 + i * 46, lw = w * (.72 - R(i) * .25); if (sorot.includes(i)) { ctx.fillStyle = 'rgba(255,210,60,0.65)'; ctx.fillRect(-w * .38 - 6, yy - 16, (lw + 12) * ease(ks), 32); }
      ctx.fillStyle = 'rgba(42,35,28,0.55)'; for (let x0 = -w * .38; x0 < -w * .38 + lw;) { const ww = 30 + R(i * 9 + x0) * 90; ctx.fillRect(x0, yy - 7, Math.min(ww, -w * .38 + lw - x0), 12); x0 += ww + 14; } }
    if (o.cap) { ctx.save(); ctx.globalAlpha *= seg(k, .5, .8); ctx.translate(w * .2, h * .3); ctx.rotate(-.2); ctx.strokeStyle = WARNA.merah; ctx.lineWidth = 6; ctx.strokeRect(-150, -50, 300, 100); ctx.font = `700 48px ${SERIF}`; ctx.fillStyle = WARNA.merah; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.cap, 0, 4); ctx.restore(); }
    ctx.restore(); };

  // ---------- peta ilustrasi (skematis, BUKAN peta nyata): pin jatuh + rute putus-putus ----------
  M.peta = (x, y, w, h, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; ctx.save(); ctx.translate(x - w / 2, y - h / 2); ctx.globalAlpha = Math.min(1, k * 3);
    ctx.fillStyle = WARNA.kertas; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(90,70,40,0.18)'; ctx.lineWidth = 1.5; for (let i = 0; i <= w; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); } for (let i = 0; i <= h; i += 60) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    if (o.daratan) { ctx.fillStyle = 'rgba(160,140,100,0.45)'; ctx.strokeStyle = 'rgba(90,70,40,0.6)'; ctx.lineWidth = 3; o.daratan.forEach(P => { ctx.beginPath(); P.forEach(([px, py], i) => i ? ctx.lineTo(px * w, py * h) : ctx.moveTo(px * w, py * h)); ctx.closePath(); ctx.fill(); ctx.stroke(); }); }
    const T2 = o.titik ?? []; if (o.rute && T2.length > 1) { ctx.setLineDash([18, 14]); ctx.strokeStyle = WARNA.merah; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); const tot = T2.length - 1, p = ease(seg(k, .3, 1)) * tot;
      for (let i = 0; i <= Math.floor(p) && i < T2.length; i++) i ? ctx.lineTo(T2[i].x * w, T2[i].y * h) : ctx.moveTo(T2[0].x * w, T2[0].y * h);
      const j = Math.floor(p); if (j < tot) { const u = p - j; ctx.lineTo((T2[j].x + (T2[j + 1].x - T2[j].x) * u) * w, (T2[j].y + (T2[j + 1].y - T2[j].y) * u) * h); } ctx.stroke(); ctx.setLineDash([]); }
    T2.forEach((p, i) => { const kp = seg(k, .2 + i * .15, .4 + i * .15); if (kp <= 0) return; const px = p.x * w, py = p.y * h - (1 - easeOut(kp)) * 60;
      ctx.fillStyle = WARNA.merah; ctx.beginPath(); ctx.arc(px, py - 34, 20, Math.PI, 0); ctx.lineTo(px, py); ctx.closePath(); ctx.fill(); ctx.fillStyle = WARNA.kertas; ctx.beginPath(); ctx.arc(px, py - 34, 7, 0, TAU); ctx.fill();
      ctx.font = `700 34px ${FONT}`; ctx.fillStyle = WARNA.tinta; ctx.textAlign = 'center'; ctx.fillText(p.label, px, py + 40); });
    ctx.font = `700 26px ${FONT}`; ctx.fillStyle = 'rgba(42,35,28,0.7)'; ctx.textAlign = 'right'; ctx.fillText(o.keterangan ?? 'peta ilustrasi, bukan skala', w - 20, h - 20); ctx.restore(); };

  // GAYA siap pakai untuk dasar.js. nada: 'arsip' (sepia film lama) | 'modern' (gelap sinematik)
  M.gaya = (o = {}) => ({
    ink: '#1A1612', hi: WARNA.emas, card: '#F3EFE6',
    shape(pts, col, id, so = {}) { const p = pathOf(pts); ctx.fillStyle = rgba(col, so.fill ?? 1); ctx.fill(p); if (so.line !== false) { ctx.strokeStyle = so.text ? 'rgba(0,0,0,0.3)' : '#1A1612'; ctx.lineWidth = so.lw ?? (so.text ? 2 : 4); ctx.lineJoin = 'round'; ctx.stroke(p); } },
    line(pts, lw, col = '#1A1612', id, a = 1) { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(pts, false)); },
    bg() { ctx.fillStyle = o.latar ?? '#0E0D0C'; ctx.fillRect(0, 0, W, H); },
    trans(k, gambarLama) { ctx.save(); ctx.globalAlpha = 1 - ease(seg(k, 0, .5)); gambarLama(); ctx.restore(); ctx.fillStyle = `rgba(0,0,0,${Math.sin(k * Math.PI) * .9})`; ctx.fillRect(0, 0, W, H); },   // celup ke hitam
    // post hanya efek ringan: Adriy & caption TIDAK boleh disepia (aturan §15). Sepia/goresan penuh dipanggil di dalam adegan: DOK.filmLama(t) SEBELUM Adriy digambar.
    post(t) { if ((o.nada ?? 'arsip') === 'arsip') M.filmLama(t, { kuat: .35, sepia: false }); else { const g = ctx.createRadialGradient(540, 960, 650, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      if (o.letterbox !== false) M.letterbox(1, o.tinggiBar ?? 120); },
  });
  return M;
})();
