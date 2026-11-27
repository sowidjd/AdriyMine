// KINETIK (Kinetic Typography): kata-kata narasi muncul & bergerak mengikuti irama suara. Lihat .claude/skills/kinetic-typography/SKILL.md.
// Waktu per kata: dari timeline.json (l.kata = [{w, t0, t1}] bila ada, mis. dari Whisper) atau diperkirakan dari suku kata.
// *kata* = ditekankan (lebih besar, warna aksen, sorotan). Mode: 'ganti' (satu kalimat per layar) | 'tumpuk' (kalimat menumpuk, kamera turun).
// Dimuat SESUDAH dasar.js (ctx, W, H, TL, LN, hash, ease, easeOut, backOut, seg, FONT, TAU).
const KT = (() => {
  const R = n => hash(n * 4.13 + 1.9), CACHE = {};
  const TEMA = { latar1: '#151226', latar2: '#2A1F4A', teks: '#F5F2FF', redup: '#9A93B8', aksen: '#FFD166', aksen2: '#EF476F', sorot: '#7B5CFF' };
  let C = { ...TEMA };
  const M = { R };
  M.tema = o => (C = { ...TEMA, ...o });
  M.warna = () => C;

  // ---------- waktu per kata ----------
  const sukuKata = w => Math.max(1, (w.toLowerCase().match(/[aiueo]+/g) || []).length);
  M.kataBaris = id => { if (CACHE['k' + id]) return CACHE['k' + id]; const l = LN[id], mentah = l.cap.split(/\s+/).filter(Boolean);
    const kata = mentah.map(w => ({ teks: w.replace(/\*/g, ''), tekan: w.includes('*') }));
    if (l.kata && l.kata.length === kata.length) l.kata.forEach((k, i) => { kata[i].a = k.t0; kata[i].b = k.t1; });
    else { const bobot = kata.map(k => sukuKata(k.teks) + (/[,.;:!?…]$/.test(k.teks) ? 1.2 : 0)), tot = bobot.reduce((a, b) => a + b, 0); let t = l.t0;
      kata.forEach((k, i) => { k.a = t; t += (l.t1 - l.t0) * bobot[i] / tot; k.b = t; }); }
    return CACHE['k' + id] = kata; };

  // ---------- tata letak blok (dibungkus per baris, kata tekan lebih besar) ----------
  M.tata = (kata, o = {}) => { const maks = o.lebar ?? 900, uk = o.ukuran ?? 122, ukT = uk * (o.skalaTekan ?? 1.45), jarak = uk * .28, rows = [[]]; let w = 0;
    const item = kata.map(k => { const u = k.tekan ? ukT : uk; ctx.font = `${k.tekan ? 800 : 700} ${u}px ${o.font ?? FONT}`; return { ...k, u, w: ctx.measureText(k.tekan && o.kapital !== false ? k.teks.toUpperCase() : k.teks).width }; });
    let skala = 1; const totalW = item.reduce((a, b) => a + b.w + jarak, 0); if (item.some(it => it.w > maks)) skala = maks / Math.max(...item.map(it => it.w));
    for (const it of item) { const ww = it.w * skala; if (w + ww > maks && rows.at(-1).length) { rows.push([]); w = 0; } rows.at(-1).push(it); w += ww + jarak * skala; }
    let y = 0; const hasil = []; rows.forEach(r => { const tinggi = Math.max(...r.map(it => it.u)) * skala * 1.08, lebar = r.reduce((a, b) => a + b.w * skala, 0) + jarak * skala * (r.length - 1); let x = -lebar / 2;
      r.forEach(it => { hasil.push({ ...it, x: x + it.w * skala / 2, y: y + tinggi * .5, s: skala }); x += it.w * skala + jarak * skala; }); y += tinggi; });
    hasil.forEach(h => h.y -= y / 2); hasil.tinggi = y; return hasil; };

  // ---------- gaya masuk per kata ----------
  const MASUK = {
    pop: (k) => ({ s: backOut(k), a: Math.min(1, k * 3) }),
    naik: (k) => ({ dy: (1 - easeOut(k)) * 80, a: k }),
    tumbuk: (k) => ({ dy: -(1 - easeOut(k)) * 260, s: 1 + .25 * Math.sin(Math.min(1, k * 1.3) * Math.PI) * (k > .6 ? 1 : 0), sy: k > .55 && k < .9 ? .85 : 1, a: Math.min(1, k * 4) }),
    putar: (k) => ({ rot: (1 - easeOut(k)) * -.6, s: .6 + .4 * easeOut(k), a: k }),
    geser: (k, i) => ({ dx: (1 - easeOut(k)) * (i % 2 ? 300 : -300), a: k }),
    ketik: (k) => ({ potong: k, a: 1 }),
    lebar: (k) => ({ sx: .2 + .8 * backOut(k), a: Math.min(1, k * 2) }),
  };
  M.MASUK = Object.keys(MASUK);

  // gambar satu kata dengan transform & tekanan
  function kataGambar(it, t, o, i) { const dur = o.durasi ?? .32, k = seg(t, it.a - .04, it.a - .04 + dur); if (k <= 0) return;
    const f = MASUK[it.tekan ? (o.masukTekan ?? 'tumbuk') : (o.masuk ?? 'pop')](k, i), u = it.u * it.s, teks = it.tekan && o.kapital !== false ? it.teks.toUpperCase() : it.teks;
    ctx.save(); ctx.translate(it.x + (f.dx ?? 0), it.y + (f.dy ?? 0)); ctx.rotate(f.rot ?? 0); ctx.scale((f.s ?? 1) * (f.sx ?? 1), (f.s ?? 1) * (f.sy ?? 1)); ctx.globalAlpha *= f.a ?? 1;
    if (it.tekan && o.getar !== false) { const g = Math.exp(-(t - it.a) * 6) * 6; ctx.translate((R(Math.floor(t * 30)) - .5) * g, (R(Math.floor(t * 30) + .5) - .5) * g); }
    ctx.font = `${it.tekan ? 800 : 700} ${u}px ${o.font ?? FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(teks).width;
    if (it.tekan && o.sorot !== false) { const ks = ease(seg(t, it.a + .05, it.a + .35)); ctx.fillStyle = C.sorot; ctx.beginPath(); ctx.roundRect(-w / 2 - 18, -u * .48, (w + 36) * ks, u * .96, 14); ctx.fill(); }
    if (f.potong != null) { ctx.beginPath(); ctx.rect(-w / 2 - 10, -u, (w + 20) * f.potong, u * 2); ctx.clip(); }
    const lalu = t > it.b + .05 && o.redupLalu; ctx.fillStyle = it.tekan ? (o.warnaTekan ?? C.aksen) : (lalu ? C.redup : C.teks);
    if (o.bayang !== false) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowOffsetY = 6; ctx.shadowBlur = 0; }
    ctx.fillText(teks, 0, 0); ctx.restore(); }

  // ---------- satu kalimat (blok) ----------
  // o: x, y, ukuran, masuk, masukTekan, keluar (0..1), kamera ('dorong' pelan), redupLalu
  M.kalimat = (id, t, o = {}) => { const kata = M.kataBaris(id), lay = CACHE['l' + id + (o.ukuran ?? '')] ??= M.tata(kata, o), l = LN[id];
    const kel = ease(o.keluar ?? 0), dorong = o.kamera === false ? 1 : 1 + .05 * seg(t, l.t0, l.t1 + .5);
    ctx.save(); ctx.translate(o.x ?? 540, (o.y ?? 800) - kel * 260); ctx.scale(dorong * (1 - .2 * kel), dorong * (1 - .2 * kel)); ctx.globalAlpha = 1 - kel;
    lay.forEach((it, i) => kataGambar(it, t, o, i)); ctx.restore(); return lay; };

  // ---------- pengatur seluruh video ----------
  // ids: urutan id kalimat. mode 'ganti': kalimat aktif di tengah, kalimat sebelumnya terbang ke atas. mode 'tumpuk': kalimat menumpuk ke bawah, kamera mengikuti.
  // gaya: daftar preset masuk yang digilir per kalimat (variasi), mis. ['pop','naik','geser','putar']
  M.jalankan = (ids, t, o = {}) => { const mode = o.mode ?? 'ganti', gaya = o.gaya ?? ['pop', 'naik', 'geser', 'lebar', 'putar'];
    const aktif = ids.findLastIndex(id => t >= LN[id].t0 - .1); if (aktif < 0) return;
    if (mode === 'ganti') { for (let i = Math.max(0, aktif - 1); i <= aktif; i++) { const id = ids[i], kel = i < aktif ? seg(t, LN[ids[aktif]].t0 - .1, LN[ids[aktif]].t0 + .3) : seg(t, LN[id].t1 + (o.tahan ?? 1.2), LN[id].t1 + (o.tahan ?? 1.2) + .4);
        if (kel < 1) M.kalimat(id, t, { ...o, masuk: o.masuk ?? gaya[i % gaya.length], keluar: kel }); } return; }
    // tumpuk
    let y = 0; const posisi = ids.map(id => { const lay = CACHE['l' + id + (o.ukuran ?? '')] ??= M.tata(M.kataBaris(id), o); const p = y + lay.tinggi / 2; y += lay.tinggi + (o.jarakKalimat ?? 60); return p; });
    const tujuan = posisi[aktif], sebelum = posisi[Math.max(0, aktif - 1)], kc = ease(seg(t, LN[ids[aktif]].t0 - .2, LN[ids[aktif]].t0 + .4)), cam = sebelum + (tujuan - sebelum) * kc;
    ids.forEach((id, i) => { if (i > aktif) return; const yy = (o.y ?? 1000) + posisi[i] - cam; if (yy < -300 || yy > H + 300) return;
      M.kalimat(id, t, { ...o, y: yy, masuk: o.masuk ?? gaya[i % gaya.length], kamera: false, redupLalu: i < aktif }); }); };

  // ---------- latar bergerak ----------
  M.latar = t => { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.latar1); g.addColorStop(1, C.latar2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const x = 540 + 420 * Math.sin(t * .2 + i * 2.1), y = 960 + 600 * Math.cos(t * .15 + i * 1.7), r = 600, gg = ctx.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, i === 1 ? 'rgba(239,71,111,0.12)' : 'rgba(123,92,255,0.14)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); } ctx.restore(); };

  // GAYA siap pakai: latar gradasi bergerak, caption bawaan dimatikan (teks sudah tampil besar)
  M.gaya = (o = {}) => { M.tema(o.tema ?? {}); window.TANPA_CAPTION = o.caption !== true; return {
    ink: '#1A1530', hi: C.aksen, card: '#FFFFFF',
    shape(pts, col, id, so = {}) { const p = pathOf(pts); ctx.fillStyle = rgba(col, so.fill ?? 1); ctx.fill(p); if (so.line !== false) { ctx.strokeStyle = '#1A1530'; ctx.lineWidth = so.lw ?? 4; ctx.lineJoin = 'round'; ctx.stroke(p); } },
    line(pts, lw, col = '#1A1530', id, a = 1) { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(pts, false)); },
    bg(t) { M.latar(t); },
    trans(k, gambarLama) { ctx.save(); ctx.globalAlpha = 1 - ease(k); gambarLama(); ctx.restore(); },
    post() {},
  }; };
  return M;
})();
