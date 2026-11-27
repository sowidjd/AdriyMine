// PAPERCUT: gaya kertas berlapis (shadow box / diorama) untuk video Canvas kita. Lihat .claude/skills/papercut/SKILL.md.
// Lapisan kertas berwarna dengan bayangan jatuh ke lapisan di belakangnya, tekstur serat, tepi tebal, kedalaman berparalaks,
// bentuk siap pakai (bukit, ombak, awan, gunung, pohon, kota, matahari, bintang, bingkai berlubang), animasi muncul/pop-up/goyang,
// teks potongan kertas, tokoh jadi potongan kertas. Dimuat SESUDAH dasar.js (ctx, W, H, hash, ease, seg, backOut, FONT, TAU).
const PC = (() => {
  const R = n => hash(n * 1.91 + 3.7), CACHE = {};
  const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // palet depan-ke-belakang: [paling belakang (terang/berkabut) ... paling depan (gelap/jenuh)] + langit + aksen
  const PALET = {
    senja: { langit: ['#FFD3A5', '#FD9E7F', '#E0607E'], lapis: ['#F7B58C', '#EE8C7A', '#D8637A', '#A94676', '#6B2E63', '#3B1C48'], aksen: '#FFE08A' },
    laut: { langit: ['#D9F2F2', '#9ED8DB', '#5FB6C4'], lapis: ['#A7DCE0', '#6FC2CF', '#3E9DB7', '#2A7AA0', '#1C567C', '#123A57'], aksen: '#FFD37A' },
    hutan: { langit: ['#EAF4D3', '#C6E3A5', '#8FC88A'], lapis: ['#B9DDA0', '#8BC77F', '#5EA866', '#3E8653', '#28633F', '#173F2B'], aksen: '#F6C85F' },
    malam: { langit: ['#3A3F7A', '#24275A', '#151638'], lapis: ['#4C4F8F', '#3B3D78', '#2D2E63', '#21214E', '#17173B', '#0E0E27'], aksen: '#FFE9A8' },
    permen: { langit: ['#FFF1F5', '#FFD6E5', '#FDB4CF'], lapis: ['#FFC7DA', '#F9A8C6', '#E886B3', '#C66AA6', '#9A5296', '#6C3B7E'], aksen: '#FFF3B0' },
  };
  let P = PALET.senja;
  const M = { PALET, R };
  M.pakai = nama => (P = PALET[nama] ?? nama);
  M.palet = () => P;

  // ---------- tekstur serat kertas ----------
  function serat() { if (CACHE.serat) return CACHE.serat; const S = 512, c = kanvas(S, S), q = c.getContext('2d');
    for (let i = 0; i < 1400; i++) { const x = R(i) * S, y = R(i + .3) * S, a = R(i + .6) * TAU, l = 2 + R(i + .9) * 10; q.strokeStyle = R(i * 3) > .5 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.07)';
      q.lineWidth = .6 + R(i * 5) * .8; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); q.stroke(); }
    for (let i = 0; i < 2500; i++) { q.fillStyle = `rgba(0,0,0,${.03 + R(i * 7) * .05})`; q.fillRect(R(i * 11) * S, R(i * 13) * S, 1.2, 1.2); }
    return CACHE.serat = ctx.createPattern(c, 'repeat'); }

  // ---------- satu potongan kertas ----------
  // p: Path2D. o: warna, dalam (0 = belakang .. 1 = depan; menentukan bayangan), cahaya [dx,dy], tebal (tepi terang), evenodd
  M.potong = (p, warna, o = {}) => { const d = o.dalam ?? .5, [lx, ly] = o.cahaya ?? [.35, 1], jarak = o.bayang ?? (8 + 16 * d), aturan = o.evenodd ? 'evenodd' : 'nonzero';
    ctx.save(); ctx.shadowColor = `rgba(20,10,25,${o.gelapBayang ?? .38})`; ctx.shadowBlur = jarak * 1.4; ctx.shadowOffsetX = lx * jarak; ctx.shadowOffsetY = ly * jarak;
    ctx.fillStyle = warna; ctx.fill(p, aturan); ctx.restore();
    ctx.save(); ctx.clip(p, aturan); ctx.fillStyle = serat(); ctx.fillRect(-W, -H, W * 3, H * 3);
    if (o.gradasi !== false) { const g = ctx.createLinearGradient(0, o.y0 ?? 0, 0, (o.y0 ?? 0) + (o.tinggiGradasi ?? 500)); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.06)'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); }
    ctx.restore();
    if (o.tepi !== false && !p.tanpaTepi) { ctx.save(); ctx.clip(p, aturan); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 3; ctx.translate(-1.5 * lx, -1.5 * ly); ctx.stroke(p); ctx.restore(); } };

  // ---------- bentuk siap pakai (mengembalikan Path2D) ----------
  // bukit bergelombang dari y dasar ke bawah layar; amp tinggi gelombang; frek; id = benih; geser = pergeseran horizontal (animasi)
  M.bukit = (y, amp = 80, frek = 1, id = 1, geser = 0, o = {}) => { const p = new Path2D(), x0 = o.x0 ?? -200, x1 = o.x1 ?? W + 200; p.moveTo(x0, H + 400);
    for (let x = x0; x <= x1; x += 12) { const u = (x + geser) / W * TAU * frek; p.lineTo(x, y - amp * (.55 * Math.sin(u + R(id) * 6) + .3 * Math.sin(u * 2.3 + R(id + 1) * 6) + .15 * Math.sin(u * 5.1 + R(id + 2) * 6))); }
    p.lineTo(x1, H + 400); p.closePath(); return p; };
  // ombak: gelombang bergerak (t) dengan puncak membulat
  M.ombak = (y, amp, panjang, t, laju = 60, id = 1) => { const p = new Path2D(), g = t * laju * (R(id) > .5 ? 1 : -1); p.moveTo(-100, H + 400);
    for (let x = -100; x <= W + 100; x += 8) { const u = (x + g) / panjang * TAU; p.lineTo(x, y - amp * (Math.cos(u) * .8 + Math.cos(u * 2 + 1) * .2) * (1 + .15 * Math.sin(t * .8 + id))); }
    p.lineTo(W + 100, H + 400); p.closePath(); return p; };
  M.gunung = (x, y, lebar, tinggi, id = 1, salju = false) => { const p = new Path2D(), n = 7; p.moveTo(x - lebar / 2, y);
    for (let i = 1; i < n; i++) { const u = i / n, puncak = 1 - Math.abs(u - .5) * 2; p.lineTo(x - lebar / 2 + lebar * u, y - tinggi * puncak * (.82 + .3 * R(id + i)) ); } p.lineTo(x + lebar / 2, y); p.closePath(); return p; };
  M.awan = (x, y, s, id = 1) => { const p = new Path2D(), n = 5; for (let i = 0; i < n; i++) { const cx = x + (i - (n - 1) / 2) * s * .42, r = s * (.26 + .14 * R(id + i)) * (1 - Math.abs(i - 2) * .12); p.moveTo(cx + r, y - r * .3); p.arc(cx, y - r * .3, r, 0, TAU); }
    p.rect(x - s * .95, y - s * .12, s * 1.9, s * .3); p.tanpaTepi = true; return p; };   // gabungan lingkaran: jangan digaris tepi (sambungan terlihat)
  M.pohon = (x, y, s, jenis = 'cemara') => { const p = new Path2D(); if (jenis === 'cemara') { for (let i = 0; i < 3; i++) { const yy = y - s * (.35 + i * .32), w = s * (.55 - i * .12); p.moveTo(x, yy - s * .45); p.lineTo(x + w, yy); p.lineTo(x - w, yy); p.closePath(); } p.rect(x - s * .07, y - s * .38, s * .14, s * .38); }
    else { p.arc(x, y - s * .9, s * .5, 0, TAU); p.rect(x - s * .08, y - s * .5, s * .16, s * .5); } return p; };
  M.kota = (y, id = 1, o = {}) => { const p = new Path2D(); let x = -40; p.moveTo(-40, H + 400);
    while (x < W + 40) { const w = 60 + R(id + x) * 110, h = (o.min ?? 120) + R(id + x * 3) * (o.maks ?? 380); p.lineTo(x, y - h); if (R(id + x * 7) > .7) { p.lineTo(x + w / 2, y - h - 40); } p.lineTo(x + w, y - h); x += w; }
    p.lineTo(W + 40, H + 400); p.closePath(); return p; };
  M.lingkaran = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
  M.bintang = (x, y, r, n = 5) => { const p = new Path2D(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * .45 : r; i ? p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : p.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } p.closePath(); return p; };
  M.sinar = (x, y, r1, r2, n = 12, rot = 0) => { const p = new Path2D(); for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, b = a + TAU / n * .45; p.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); p.lineTo(x + Math.cos((a + b) / 2) * r2, y + Math.sin((a + b) / 2) * r2); p.lineTo(x + Math.cos(b) * r1, y + Math.sin(b) * r1); p.closePath(); } return p; };
  // bingkai shadow box: seluruh layar dikurangi lubang (lingkaran/lengkung/persegi bulat) -> pakai evenodd
  M.bingkai = (bentuk = 'lingkaran', o = {}) => { const p = new Path2D(); p.rect(-50, -50, W + 100, H + 100); const x = o.x ?? 540, y = o.y ?? 860, r = o.r ?? 420;
    if (bentuk === 'lingkaran') { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); }
    else if (bentuk === 'lengkung') { const w = o.w ?? 820, h = o.h ?? 1100; p.moveTo(x - w / 2, y + h / 2); p.lineTo(x - w / 2, y - h / 2 + w / 2); p.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, 0); p.lineTo(x + w / 2, y + h / 2); p.closePath(); }
    else { const w = o.w ?? 860, h = o.h ?? 1100; p.roundRect(x - w / 2, y - h / 2, w, h, o.sudut ?? 60); } return p; };
  M.perahu = (x, y, s) => { const p = new Path2D(); p.moveTo(x - s, y); p.lineTo(x + s, y); p.lineTo(x + s * .7, y + s * .35); p.lineTo(x - s * .7, y + s * .35); p.closePath();
    p.moveTo(x - s * .05, y - s * 1.2); p.lineTo(x - s * .05, y - s * .05); p.lineTo(x - s * .75, y - s * .05); p.closePath(); p.moveTo(x + s * .05, y - s); p.lineTo(x + s * .05, y - s * .05); p.lineTo(x + s * .6, y - s * .05); p.closePath(); return p; };

  // ---------- langit (lapisan paling belakang, gradasi) ----------
  M.langit = (o = {}) => { const g = ctx.createLinearGradient(0, 0, 0, H); P.langit.forEach((c, i) => g.addColorStop(i / (P.langit.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = serat(); ctx.fillRect(0, 0, W, H); };

  // ---------- kamera kedalaman: paralaks & zoom per lapisan ----------
  // gambar fn di lapisan kedalaman d (0 belakang .. 1 depan). kam = {x, y, zoom}; lapisan depan bergerak lebih jauh.
  M.lapisan = (d, kam, fn) => { const f = .25 + .75 * d; ctx.save(); ctx.translate(540, 960); ctx.scale(1 + ((kam?.zoom ?? 1) - 1) * f, 1 + ((kam?.zoom ?? 1) - 1) * f); ctx.translate(-540 - (kam?.x ?? 0) * f, -960 - (kam?.y ?? 0) * f); fn(); ctx.restore(); };
  // muncul dari bawah (k 0..1) dengan pantulan kecil; urutan belakang->depan diberi jeda (stagger)
  M.naik = (k, jarak = 500) => (1 - backOut(seg(k, 0, 1))) * jarak;
  // pop-up buku: lapisan berdiri dari engsel di y (skala vertikal 0->1)
  M.popup = (k, yEngsel, fn) => { const s = backOut(seg(k, 0, 1)); if (s <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(-W, -H, W * 3, H + yEngsel); ctx.clip(); ctx.translate(0, yEngsel); ctx.scale(1, s); ctx.translate(0, -yEngsel); fn(); ctx.restore(); };

  // ---------- teks potongan kertas ----------
  M.teks = (s, x, y, uk, o = {}) => { const k = o.k ?? 1; if (k <= 0) return; ctx.save(); ctx.font = `700 ${uk}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const huruf = [...s], lebar = huruf.map(c => ctx.measureText(c).width), tot = lebar.reduce((a, b) => a + b, 0); let cx = x - tot / 2;
    huruf.forEach((c, i) => { const kk = backOut(seg(k, i / huruf.length * .6, i / huruf.length * .6 + .4)); if (kk > 0 && c !== ' ') { ctx.save(); ctx.translate(cx + lebar[i] / 2, y + (1 - kk) * 60); ctx.rotate((R(i + (o.id ?? 0)) - .5) * .08);
        const L = o.lapis ?? [P.aksen, '#FFFFFF']; ctx.shadowColor = 'rgba(20,10,25,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 7;
        ctx.fillStyle = L[0]; ctx.fillText(c, 0, 0); ctx.shadowColor = 'transparent'; if (L[1]) { ctx.shadowColor = 'rgba(20,10,25,0.25)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3; ctx.fillStyle = L[1]; ctx.font = `700 ${uk * .9}px ${FONT}`; ctx.fillText(c, -2, -3); ctx.font = `700 ${uk}px ${FONT}`; }
        ctx.restore(); } cx += lebar[i]; }); ctx.restore(); };

  // ---------- tokoh (Adriy dsb.) sebagai potongan kertas: digambar ke kanvas lain lalu diberi bayangan ----------
  M.tokoh = (fn, o = {}) => { const c = CACHE.tk ??= kanvas(W, H), lama = ctx; ctx = c.getContext('2d'); try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); fn(); } finally { ctx = lama; }
    const d = o.dalam ?? .8, j = 8 + 16 * d; ctx.save(); ctx.shadowColor = 'rgba(20,10,25,0.4)'; ctx.shadowBlur = j * 1.3; ctx.shadowOffsetX = .35 * j; ctx.shadowOffsetY = j; ctx.drawImage(c, 0, 0); ctx.restore(); };

  // GAYA siap pakai untuk dasar.js: potongan kertas tanpa garis tinta, langit bergradasi, transisi lapisan turun
  M.gaya = (o = {}) => { M.pakai(o.palet ?? 'senja'); return {
    ink: '#2A1F2D', hi: P.aksen, card: '#FFF9F0',
    shape(pts, col, id, so = {}) { const p = pathOf(pts); M.potong(p, rgba(col, so.fill ?? 1), { dalam: so.text ? .3 : .6, tepi: !so.text, gradasi: !so.text }); },
    line(pts, lw, col = '#2A1F2D', id, a = 1) { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(pts, false)); },
    bg() { M.langit(); },
    trans(k, gambarLama) { const e = ease(k); ctx.save(); ctx.translate(0, e * H * 1.05); ctx.shadowColor = 'rgba(20,10,25,0.5)'; ctx.shadowBlur = 40; gambarLama(); ctx.restore(); },   // adegan lama jatuh ke bawah, adegan baru di baliknya
    post() { const g = ctx.createRadialGradient(540, 960, 700, 540, 960, 1300); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,10,30,0.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); },
  }; };
  return M;
})();
