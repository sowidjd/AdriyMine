// INFOGRAFIS: motion graphic data untuk video Canvas kita. Lihat .claude/skills/infografis/SKILL.md.
// Angka menghitung naik, batang tumbuh, donat menyapu, garis tergambar, piktogram terisi, cincin progres, perbandingan luas,
// garis waktu, diagram alur, ikon vektor, label langsung, sumber data. Dimuat SESUDAH dasar.js (ctx, W, H, ease, seg, backOut, FONT).
// Palet kategori = palet rujukan skill dataviz, sudah divalidasi (buta warna & kontras) untuk latar IG.TEMA terang (#FBF7EE) dan gelap (#141B2D).
const IG = (() => {
  const TEMA = {
    terang: { latar: '#FBF7EE', titikLatar: 'rgba(30,30,40,0.07)', teks: '#191919', teks2: '#5E5E5E', grid: 'rgba(25,25,25,0.12)', sumbu: 'rgba(25,25,25,0.45)', redup: '#C9C4B8',
      seri: ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac', '#008a17', '#6a4ce2', '#ec4647'], urut: ['#cfe3fa', '#8fbdf0', '#4f97e6', '#257de0', '#1a5aa6', '#103a6e'] },
    gelap: { latar: '#141B2D', titikLatar: 'rgba(255,255,255,0.06)', teks: '#EFEFEF', teks2: '#A3A9B8', grid: 'rgba(255,255,255,0.12)', sumbu: 'rgba(255,255,255,0.45)', redup: '#3A4358',
      seri: ['#338ced', '#e76624', '#00a888', '#d28e05', '#e24d8b', '#0aac23', '#9887ef', '#eb6263'], urut: ['#1c3557', '#1f4f86', '#2a6cb5', '#338ced', '#78b2f3', '#bcd8f9'] },
  };
  let C = TEMA.gelap;
  const G = { TEMA };
  G.pakai = nama => { C = TEMA[nama] ?? nama; return C; };
  G.warna = () => C;

  // ---------- format angka Indonesia: 12.345,6 ----------
  G.fmt = (n, desimal = 0) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal });
  const teks = (s, x, y, uk, o = {}) => { ctx.font = `${o.tebal ?? 700} ${uk}px ${o.font ?? FONT}`; ctx.fillStyle = o.warna ?? C.teks; ctx.textAlign = o.rata ?? 'center'; ctx.textBaseline = o.garis ?? 'middle'; ctx.fillText(s, x, y); return ctx.measureText(s).width; };
  G.teks = teks;
  const batangBulat = (x, y, w, h, r, ujung) => { // persegi dengan ujung data membulat 4px (sisi 'atas'|'kanan'), pangkal rata di garis dasar
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); ctx.beginPath();
    if (ujung === 'kanan') { ctx.moveTo(x, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x, y + h); }
    else { ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h); }
    ctx.closePath(); ctx.fill(); };

  // ---------- latar & judul ----------
  G.latar = (o = {}) => { ctx.fillStyle = C.latar; ctx.fillRect(0, 0, W, H); if (o.titik !== false) { ctx.fillStyle = C.titikLatar; for (let y = 30; y < H; y += 54) for (let x = 30; x < W; x += 54) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); } } };
  // judul grafik: judul + subjudul (satuan / konteks). Wajib di setiap grafik.
  G.judul = (judul, sub, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const y = o.y ?? 300, d = (1 - easeOut(k)) * 30; ctx.save(); ctx.globalAlpha = k;
    teks(judul, o.x ?? 540, y + d, o.ukuran ?? 66); if (sub) teks(sub, o.x ?? 540, y + 70 + d, 38, { tebal: 500, warna: C.teks2 }); ctx.restore(); };
  // sumber data (wajib untuk angka nyata; aturan §1). Ditaruh di kotak aman bawah.
  G.sumber = (s, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; ctx.save(); ctx.globalAlpha = k * .9; teks('Sumber: ' + s, o.x ?? 540, o.y ?? 1250, o.ukuran ?? 28, { tebal: 500, warna: C.teks2 }); ctx.restore(); };

  // ---------- angka besar menghitung naik ----------
  G.angka = (nilai, x, y, uk, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const v = (o.dari ?? 0) + (nilai - (o.dari ?? 0)) * easeOut(k), s = (o.awalan ?? '') + G.fmt(v, o.desimal ?? 0) + (o.akhiran ?? '');
    const sk = o.pop === false ? 1 : 1 + .08 * Math.exp(-(((k - 1) * 12) ** 2)) * (k >= 1 ? 1 : 0); ctx.save(); ctx.translate(x, y); ctx.scale(sk, sk);
    teks(s, 0, 0, uk, { warna: o.warna ?? C.teks }); if (o.label) teks(o.label, 0, uk * .78, uk * .32, { tebal: 500, warna: C.teks2 }); ctx.restore(); };

  // ---------- batang (horizontal: paling mudah dibaca di HP) ----------
  // data: [{label, nilai}], o: {x, y, w, h, k, sorot (indeks; lainnya redup), maks, satuan, desimal, warna, vertikal}
  G.batang = (data, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const n = data.length, maks = o.maks ?? Math.max(...data.map(d => d.nilai)), x0 = o.x ?? 120, y0 = o.y ?? 520, w = o.w ?? 840, h = o.h ?? 640;
    if (o.vertikal) {
      const lebar = w / n, bw = lebar * .62, dasar = y0 + h; ctx.strokeStyle = C.grid; ctx.lineWidth = 2;
      for (let g = 0; g <= 4; g++) { const yy = dasar - h * .85 * g / 4; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke(); }
      data.forEach((d, i) => { const kk = ease(seg(k, i / n * .5, i / n * .5 + .5)), bh = h * .85 * d.nilai / maks * kk, x = x0 + i * lebar + (lebar - bw) / 2;
        ctx.fillStyle = o.sorot == null || o.sorot === i ? (d.warna ?? o.warna ?? C.seri[0]) : C.redup; batangBulat(x, dasar - bh, bw, bh, 8, 'atas');
        teks(d.label, x + bw / 2, dasar + 40, 32, { tebal: 600, warna: C.teks2 }); if (kk > .05) teks(G.fmt(d.nilai * kk, o.desimal ?? 0) + (o.satuan ?? ''), x + bw / 2, dasar - bh - 32, 38); });
      ctx.strokeStyle = C.sumbu; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, dasar); ctx.lineTo(x0 + w, dasar); ctx.stroke(); return; }
    const tinggi = h / n, bh = Math.min(tinggi * .5, 64), lbl = o.lebarLabel ?? 0, xb = x0 + lbl, wb = w - lbl - 150;
    data.forEach((d, i) => { const kk = ease(seg(k, i / n * .5, i / n * .5 + .5)), yy = y0 + i * tinggi, bw = wb * d.nilai / maks * kk, aktif = o.sorot == null || o.sorot === i;
      teks(d.label, lbl ? x0 : xb, yy + (lbl ? tinggi / 2 - 2 : 6), 36, { tebal: 600, rata: 'left', warna: aktif ? C.teks : C.teks2, garis: lbl ? 'middle' : 'top' });
      const by = lbl ? yy + (tinggi - bh) / 2 : yy + 52; ctx.fillStyle = aktif ? (d.warna ?? o.warna ?? C.seri[0]) : C.redup; batangBulat(xb, by, Math.max(bw, 2), bh, 8, 'kanan');
      if (kk > .05) teks(G.fmt(d.nilai * kk, o.desimal ?? 0) + (o.satuan ?? ''), xb + bw + 16, by + bh / 2 + 2, 40, { rata: 'left', warna: aktif ? C.teks : C.teks2 }); });
    ctx.strokeStyle = C.sumbu; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xb, y0 + (lbl ? 0 : 40)); ctx.lineTo(xb, y0 + h - (lbl ? 0 : 8)); ctx.stroke(); };

  // ---------- donat (≤ 4 bagian; lebih dari itu pakai batang) ----------
  // data: [{label, nilai}], o: {cx, cy, r, tebal, k, tengah (teks besar), sub}
  G.donat = (data, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const cx = o.cx ?? 540, cy = o.cy ?? 820, r = o.r ?? 230, tb = o.tebal ?? 84, tot = data.reduce((a, d) => a + d.nilai, 0);
    let a0 = -Math.PI / 2; const sapu = ease(k) * TAU, celah = .012;
    data.forEach((d, i) => { const da = d.nilai / tot * TAU, a1 = Math.min(a0 + da, -Math.PI / 2 + sapu); if (a1 > a0 + celah) {
        ctx.strokeStyle = d.warna ?? C.seri[i]; ctx.lineWidth = tb; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(cx, cy, r, a0 + celah, a1 - celah); ctx.stroke();
        const am = a0 + da / 2, kl = seg(k, .55 + i * .1, .8 + i * .1); if (kl > 0) { const lx = cx + Math.cos(am) * (r + tb / 2 + 70), ly = cy + Math.sin(am) * (r + tb / 2 + 60);
          ctx.save(); ctx.globalAlpha = kl; teks(G.fmt(d.nilai / tot * 100, 0) + '%', lx, ly - 18, 46); teks(d.label, lx, ly + 26, 30, { tebal: 500, warna: C.teks2 }); ctx.restore(); } }
      a0 += da; });
    if (o.tengah) { const kt = seg(k, .4, .9); ctx.save(); ctx.globalAlpha = kt; teks(o.tengah, cx, cy - (o.sub ? 16 : 0), o.ukuranTengah ?? 84); if (o.sub) teks(o.sub, cx, cy + 50, 32, { tebal: 500, warna: C.teks2 }); ctx.restore(); } };

  // ---------- garis (tren waktu) ----------
  // seri: [{label, titik: [[x, y], ...]}] (x, y = nilai data), o: {kotak:[x,y,w,h], xMin,xMax,yMin,yMax, k, labelX: [..], satuan, sorot}
  G.garis = (seri, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const [bx, by, bw, bh] = o.kotak ?? [150, 520, 760, 620];   // ujung kanan 910 (kotak aman)
    const semua = seri.flatMap(s => s.titik), xMin = o.xMin ?? Math.min(...semua.map(p => p[0])), xMax = o.xMax ?? Math.max(...semua.map(p => p[0])), yMin = o.yMin ?? 0, yMax = o.yMax ?? Math.max(...semua.map(p => p[1])) * 1.1;
    const px = x => bx + (x - xMin) / (xMax - xMin) * bw, py = y => by + bh - (y - yMin) / (yMax - yMin) * bh;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 2; for (let g = 0; g <= 4; g++) { const yy = by + bh * g / 4; ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(bx + bw, yy); ctx.stroke(); const v = yMax - (yMax - yMin) * g / 4; teks(G.fmt(v, o.desimal ?? (Math.abs(v - Math.round(v)) > 1e-6 ? 1 : 0)), bx - 18, yy, 28, { rata: 'right', tebal: 500, warna: C.teks2 }); }
    (o.labelX ?? [xMin, xMax]).forEach(v => teks(String(v), px(v), by + bh + 40, 30, { tebal: 500, warna: C.teks2 }));
    seri.forEach((s, i) => { const P = s.titik.map(([x, y]) => [px(x), py(y)]), aktif = o.sorot == null || o.sorot === i, warna = aktif ? (s.warna ?? C.seri[i]) : C.redup;
      let L = 0; const d = [0]; for (let j = 1; j < P.length; j++) { L += Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]); d.push(L); }
      const batas = L * ease(k); ctx.strokeStyle = warna; ctx.lineWidth = aktif ? 7 : 5; ctx.lineJoin = ctx.lineCap = 'round'; ctx.beginPath(); let ujung = P[0];
      for (let j = 0; j < P.length; j++) { if (d[j] > batas) { const u = (batas - d[j - 1]) / (d[j] - d[j - 1]); ujung = [P[j - 1][0] + (P[j][0] - P[j - 1][0]) * u, P[j - 1][1] + (P[j][1] - P[j - 1][1]) * u]; ctx.lineTo(...ujung); break; }
        j ? ctx.lineTo(...P[j]) : ctx.moveTo(...P[j]); ujung = P[j]; } ctx.stroke();
      ctx.fillStyle = warna; ctx.beginPath(); ctx.arc(ujung[0], ujung[1], 11, 0, TAU); ctx.fill(); ctx.strokeStyle = C.latar; ctx.lineWidth = 3; ctx.stroke();
      if (k > .9 && s.label) { ctx.save(); ctx.globalAlpha = seg(k, .9, 1); teks(s.label, Math.min(ujung[0], bx + bw - 10), ujung[1] - 40, 34, { rata: 'right', warna: aktif ? C.teks : C.teks2 }); ctx.restore(); } }); };

  // ---------- ikon vektor sederhana (s = ukuran px) ----------
  G.ikon = (nama, x, y, s, warna, o = {}) => { ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.fillStyle = ctx.strokeStyle = warna ?? C.teks; ctx.lineWidth = 9; ctx.lineCap = ctx.lineJoin = 'round';
    const P = () => ctx.beginPath(), F = () => ctx.fill(), S = () => ctx.stroke();
    switch (nama) {
      case 'orang': P(); ctx.arc(0, -30, 17, 0, TAU); F(); P(); ctx.moveTo(-26, 48); ctx.lineTo(-26, 8); ctx.quadraticCurveTo(-26, -8, -10, -8); ctx.lineTo(10, -8); ctx.quadraticCurveTo(26, -8, 26, 8); ctx.lineTo(26, 48); ctx.closePath(); F(); break;
      case 'jam': P(); ctx.arc(0, 0, 40, 0, TAU); S(); P(); ctx.moveTo(0, 0); ctx.lineTo(0, -24); ctx.moveTo(0, 0); ctx.lineTo(18, 10); S(); break;
      case 'koin': P(); ctx.arc(0, 0, 40, 0, TAU); F(); ctx.fillStyle = o.isi ?? C.latar; ctx.font = `700 46px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Rp', 0, 3); break;
      case 'hati': P(); ctx.moveTo(0, 38); ctx.bezierCurveTo(-60, 0, -40, -46, 0, -20); ctx.bezierCurveTo(40, -46, 60, 0, 0, 38); F(); break;
      case 'air': P(); ctx.moveTo(0, -44); ctx.bezierCurveTo(30, -8, 34, 12, 34, 18); ctx.arc(0, 18, 34, 0, Math.PI); ctx.bezierCurveTo(-34, 12, -30, -8, 0, -44); F(); break;
      case 'hp': ctx.beginPath(); ctx.roundRect(-24, -44, 48, 88, 10); S(); P(); ctx.arc(0, 32, 4, 0, TAU); F(); break;
      case 'bumi': P(); ctx.arc(0, 0, 40, 0, TAU); S(); P(); ctx.ellipse(0, 0, 18, 40, 0, 0, TAU); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); S(); break;
      case 'petir': P(); ctx.moveTo(8, -46); ctx.lineTo(-24, 6); ctx.lineTo(0, 6); ctx.lineTo(-8, 46); ctx.lineTo(24, -8); ctx.lineTo(0, -8); ctx.closePath(); F(); break;
      case 'piring': P(); ctx.arc(0, 0, 40, 0, TAU); S(); P(); ctx.arc(0, 0, 22, 0, TAU); S(); break;
      case 'buku': P(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(-24, -42, -44, -34); ctx.lineTo(-44, 36); ctx.quadraticCurveTo(-24, 28, 0, 40); ctx.quadraticCurveTo(24, 28, 44, 36); ctx.lineTo(44, -34); ctx.quadraticCurveTo(24, -42, 0, -30); ctx.lineTo(0, 40); S(); break;
      case 'centang': P(); ctx.moveTo(-30, 2); ctx.lineTo(-8, 24); ctx.lineTo(32, -22); S(); break;
      case 'silang': P(); ctx.moveTo(-26, -26); ctx.lineTo(26, 26); ctx.moveTo(26, -26); ctx.lineTo(-26, 26); S(); break;
      default: P(); ctx.arc(0, 0, 36, 0, TAU); F();
    } ctx.restore(); };

  // ---------- piktogram: "3 dari 10 orang" ----------
  G.piktogram = (total, isi, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const kol = o.kolom ?? Math.min(total, 5), s = o.ukuran ?? 120, gap = o.jarak ?? s * 1.25, baris = Math.ceil(total / kol);
    const x0 = (o.x ?? 540) - (kol - 1) * gap / 2, y0 = o.y ?? 700, kIsi = seg(k, .35, 1);
    for (let i = 0; i < total; i++) { const muncul = backOut(seg(k, i / total * .3, i / total * .3 + .2)); if (muncul <= 0) continue; const terisi = i < isi && kIsi > i / Math.max(isi, 1) * .9;
      ctx.save(); ctx.translate(x0 + (i % kol) * gap, y0 + Math.floor(i / kol) * gap * 1.1); ctx.scale(muncul, muncul); G.ikon(o.ikon ?? 'orang', 0, 0, s, terisi ? (o.warna ?? C.seri[1]) : C.redup); ctx.restore(); }
    if (o.label) { ctx.save(); ctx.globalAlpha = seg(k, .7, 1); teks(o.label, o.x ?? 540, y0 + baris * gap * 1.1 + 10, 44); ctx.restore(); } };

  // ---------- cincin & batang progres ----------
  G.cincin = (persen, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const cx = o.cx ?? 540, cy = o.cy ?? 800, r = o.r ?? 220, tb = o.tebal ?? 42, p = persen / 100 * ease(k);
    ctx.lineWidth = tb; ctx.lineCap = 'round'; ctx.strokeStyle = C.redup; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    if (p > 0) { ctx.strokeStyle = o.warna ?? C.seri[2]; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * TAU); ctx.stroke(); }
    teks(G.fmt(persen * ease(k), o.desimal ?? 0) + '%', cx, cy - (o.label ? 14 : 0), o.ukuran ?? 96); if (o.label) teks(o.label, cx, cy + 62, 34, { tebal: 500, warna: C.teks2 }); };
  G.progres = (persen, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const x = o.x ?? 140, y = o.y ?? 900, w = o.w ?? 800, h = o.h ?? 56, p = persen / 100 * ease(k);
    ctx.fillStyle = C.redup; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); if (p > 0) { ctx.fillStyle = o.warna ?? C.seri[0]; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * p), h, h / 2); ctx.fill(); }
    if (o.label) teks(o.label, x, y - 40, 38, { rata: 'left' }); teks(G.fmt(persen * ease(k), o.desimal ?? 0) + '%', x + w, y - 40, 40, { rata: 'right' }); };

  // ---------- perbandingan ukuran: LUAS lingkaran sebanding nilai (bukan jari-jari) ----------
  G.perbandingan = (data, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const maks = Math.max(...data.map(d => d.nilai)), Rm = o.rMaks ?? 230, y = o.y ?? 860;
    const rs = data.map(d => Rm * Math.sqrt(d.nilai / maks)), tot = rs.reduce((a, r) => a + r * 2, 0) + (data.length - 1) * 50; let x = (o.x ?? 540) - tot / 2;
    data.forEach((d, i) => { const r = rs[i] * backOut(seg(k, i * .25, i * .25 + .5)), cx = x + rs[i]; if (r > 0) { ctx.fillStyle = d.warna ?? C.seri[i]; ctx.beginPath(); ctx.arc(cx, y + Rm - rs[i], r, 0, TAU); ctx.fill();
        const kl = seg(k, i * .25 + .3, i * .25 + .6); ctx.save(); ctx.globalAlpha = kl; teks(d.label, cx, y + Rm + 50, 36, { tebal: 600 }); teks(G.fmt(d.nilai, o.desimal ?? 0) + (o.satuan ?? ''), cx, y + Rm + 100, 34, { tebal: 500, warna: C.teks2 }); ctx.restore(); }
      x += rs[i] * 2 + 50; }); };

  // ---------- garis waktu vertikal ----------
  G.lini = (peristiwa, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const x = o.x ?? 260, y0 = o.y ?? 480, h = o.h ?? 900, n = peristiwa.length, step = h / Math.max(n - 1, 1);
    ctx.strokeStyle = C.sumbu; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h * ease(k)); ctx.stroke();
    peristiwa.forEach((p, i) => { const kk = backOut(seg(k, i / n * .8, i / n * .8 + .25)); if (kk <= 0) return; const yy = y0 + i * step;
      ctx.fillStyle = p.warna ?? C.seri[0]; ctx.beginPath(); ctx.arc(x, yy, 18 * kk, 0, TAU); ctx.fill(); ctx.strokeStyle = C.latar; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.globalAlpha = Math.min(1, kk); teks(String(p.waktu), x + 50, yy - 22, 44, { rata: 'left' }); teks(p.teks, x + 50, yy + 26, 32, { rata: 'left', tebal: 500, warna: C.teks2 }); ctx.restore(); }); };

  // ---------- diagram alur: kotak + panah yang tergambar ----------
  G.alur = (simpul, sisi, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const n = simpul.length;
    sisi.forEach(([a, b], i) => { const ka = ease(seg(k, (i + .6) / n * .8, (i + 1.2) / n * .8)); if (ka <= 0) return; const A = simpul[a], B = simpul[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const sx = A.x + ux * (A.r ?? 90), sy = A.y + uy * (A.r ?? 80), ex = B.x - ux * (B.r ?? 90), ey = B.y - uy * (B.r ?? 80), mx = sx + (ex - sx) * ka, my = sy + (ey - sy) * ka;
      ctx.strokeStyle = C.sumbu; ctx.fillStyle = C.sumbu; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.stroke();
      if (ka > .9) { const a2 = Math.atan2(uy, ux); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(a2 - .5) * 26, ey - Math.sin(a2 - .5) * 26); ctx.lineTo(ex - Math.cos(a2 + .5) * 26, ey - Math.sin(a2 + .5) * 26); ctx.closePath(); ctx.fill(); } });
    simpul.forEach((s, i) => { const kk = backOut(seg(k, i / n * .8, i / n * .8 + .2)); if (kk <= 0) return; ctx.save(); ctx.translate(s.x, s.y); ctx.scale(kk, kk);
      ctx.font = `700 ${s.ukuran ?? 36}px ${FONT}`; const w = Math.max(s.w ?? 0, ctx.measureText(s.teks).width + 60), h = s.h ?? 96;
      ctx.fillStyle = s.warna ?? C.seri[i % C.seri.length]; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill();
      teks(s.teks, 0, 2, s.ukuran ?? 36, { warna: s.warnaTeks ?? '#FFFFFF' }); if (s.ikon) G.ikon(s.ikon, 0, -h / 2 - 60, 80, s.warna ?? C.seri[i % C.seri.length]); ctx.restore(); }); };

  // ---------- kata kunci: teks besar meluncur + garis aksen ----------
  G.kataKunci = (s, x, y, uk, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; const e = easeOut(seg(k, 0, .6)); ctx.save(); ctx.globalAlpha = Math.min(1, k * 3);
    const w = teks(s, x + (1 - e) * (o.dari ?? -60), y, uk, { warna: o.warna ?? C.teks }); ctx.fillStyle = o.aksen ?? C.seri[1]; const lg = w * ease(seg(k, .35, .9));
    ctx.beginPath(); ctx.roundRect(x - w / 2, y + uk * .55, lg, uk * .12, uk * .06); ctx.fill(); ctx.restore(); };

  // GAYA siap pakai untuk dasar.js: datar & bersih, latar titik-titik, transisi geser
  G.gaya = (o = {}) => { G.pakai(o.tema ?? 'gelap'); return {
    ink: '#1A1A22', hi: C.seri[3],   // ink = teks caption di atas kartu terang card: o.tema === 'terang' ? '#FFFFFF' : '#F4F6FB',
    shape(pts, col, id, so = {}) { const p = pathOf(pts); ctx.fillStyle = rgba(col, so.fill ?? 1); ctx.fill(p); if (so.line !== false && so.text) { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke(p); } else if (so.line !== false) { ctx.strokeStyle = '#1A1A22'; ctx.lineWidth = so.lw ?? 4; ctx.lineJoin = 'round'; ctx.stroke(p); } },
    line(pts, lw, col = C.teks, id, a = 1) { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(pts, false)); },
    bg() { G.latar(); },
    trans(k, gambarLama) { const e = ease(k); ctx.save(); ctx.translate(-e * W * .35, 0); ctx.globalAlpha = 1 - e; gambarLama(); ctx.restore(); },
    post() {},
  }; };
  return G;
})();
