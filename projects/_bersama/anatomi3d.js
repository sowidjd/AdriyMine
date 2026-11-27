// ANATOMI 3D — organ tubuh 3D (Three.js r159, MIT) untuk video Canvas kita. Lihat .claude/skills/anatomi-3d/SKILL.md.
// Semua gerak = fungsi waktu t (frame-deterministik, aman untuk render.mjs & HyperFrames). Tanpa Math.random.
// Pakai: <script src="../_bersama/lib/three-0.159.min.js"></script> <script src="../_bersama/anatomi3d.js"></script>
//   const A3 = Anatomi3D({ gaya: 'basah' });  const j = A3.jantung();  A3.scene.add(j);
//   di adegan: j.detak(t); A3.kamera(t, KUNCI); A3.gambar(ctx, t);   (WebGL digambar ke kanvas 2D kita)
(function () {
  const T3 = THREE, V = (x, y, z) => new T3.Vector3(x, y, z), TAU = Math.PI * 2;
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const hs = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // acak berbenih

  // ---------- warna organ (seragam di semua video) ----------
  const WARNA = {
    jantung: '#B8322C', arteri: '#C8423A', vena: '#3F63B8', lemak: '#E9C77A',
    paru: '#E8949A', bronkus: '#F3D3C8', trakea: '#EEDAD0',
    lambung: '#E58F86', ususHalus: '#EBA49D', ususBesar: '#D68A78', esofagus: '#E59C8E',
    otak: '#E9B5B0', otakKecil: '#D99F9B', batangOtak: '#E3B9A8',
    darah: '#C9221E', udara: '#FFFFFF', makanan: '#E7C25A',
  };
  // gaya material: 'basah' (mengkilap, realistis-lembut) | 'clay' (matte pastel, cocok dengan dunia Adriy) | 'kaca' (tembus, edukatif)
  function bahan(warna, gaya, o = {}) {
    const c = new T3.Color(warna);
    if (gaya === 'clay') return new T3.MeshStandardMaterial({ color: c, roughness: .82, metalness: 0, ...o });
    if (gaya === 'kaca') return new T3.MeshPhysicalMaterial({ color: c, roughness: .25, metalness: 0, transparent: true, opacity: .42, depthWrite: false, clearcoat: 1, side: T3.DoubleSide, ...o });
    return new T3.MeshPhysicalMaterial({ color: c, roughness: .42, metalness: 0, clearcoat: .7, clearcoatRoughness: .3, sheen: .6, sheenColor: new T3.Color('#FFD9D2'), sheenRoughness: .5, ...o });
  }

  // ---------- geometri ----------
  // bola yang dibentuk ulang: f(arah satuan) -> titik permukaan
  function bolaBentuk(f, detail = 96) {
    const g = new T3.SphereGeometry(1, detail, Math.round(detail * .75)), p = g.attributes.position, v = V(0, 0, 0);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const q = f(v.clone()); p.setXYZ(i, q.x, q.y, q.z); }
    g.computeVertexNormals(); return g;
  }
  // tabung berjari-jari berubah sepanjang kurva; radius(s, t) bisa dianimasikan lewat .perbarui(t)
  function tabung(kurva, radius, o = {}) {
    const n = o.seg ?? 160, m = o.radial ?? 28, fr = kurva.computeFrenetFrames(n, false), pts = kurva.getSpacedPoints(n);
    const g = new T3.BufferGeometry(), pos = new Float32Array((n + 1) * (m + 1) * 3), idx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * (m + 1) + j, b = a + m + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    g.setIndex(idx); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
    g.perbarui = (t = 0) => {
      for (let i = 0; i <= n; i++) { const s = i / n, r = Math.max(.002, radius(s, t)), P = pts[i], N = fr.normals[Math.min(i, n - 1)], B = fr.binormals[Math.min(i, n - 1)];
        for (let j = 0; j <= m; j++) { const a = j / m * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r, k = (i * (m + 1) + j) * 3;
          pos[k] = P.x + N.x * c + B.x * d; pos[k + 1] = P.y + N.y * c + B.y * d; pos[k + 2] = P.z + N.z * c + B.z * d; } }
      g.attributes.position.needsUpdate = true; g.computeVertexNormals();
      if (o.tutup !== false) { /* ujung terbuka diperkecil radius-nya oleh fungsi radius */ }
    };
    g.perbarui(0); return g;
  }
  // ubah transparansi material; Three.js perlu needsUpdate saat sifat 'transparent' berganti
  function aturTembus(mat, k, maks) { const tr = k > 0; if (mat.transparent !== tr) { mat.transparent = tr; mat.needsUpdate = true; } mat.opacity = 1 - maks * k; mat.depthWrite = k < .5; }
  const kurva = (pts, tutup = false) => new T3.CatmullRomCurve3(pts.map(p => V(...p)), tutup, 'centripetal');
  // gelombang peristaltik: penyempitan yang berjalan sepanjang s
  const peristaltik = (s, t, kuat = .25, rapat = 22, laju = 3.2) => 1 - kuat * Math.pow(Math.max(0, Math.sin(s * rapat - t * laju)), 6);
  // irama jantung "lub-dub": 0..1, puncak dua kali per detak
  function irama(t, bpm = 72) { const f = (t * bpm / 60) % 1; return Math.exp(-Math.pow((f - .08) / .05, 2)) + .55 * Math.exp(-Math.pow((f - .3) / .06, 2)); }

  // ---------- Anatomi3D ----------
  window.Anatomi3D = function (opsi = {}) {
    const W = opsi.w ?? 1080, H = opsi.h ?? 1920, gaya = opsi.gaya ?? 'basah';
    const kanvas = document.createElement('canvas'); kanvas.width = W; kanvas.height = H;
    const renderer = new T3.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    renderer.outputColorSpace = T3.SRGBColorSpace; renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = opsi.eksposur ?? 1.05;
    renderer.localClippingEnabled = true; renderer.setClearColor(0x000000, 0);
    const scene = new T3.Scene(), cam = new T3.PerspectiveCamera(opsi.fov ?? 32, W / H, .05, 100);
    cam.position.set(0, 0, 9);

    // lingkungan studio lembut (tanpa file): kubah gelap + 3 lampu strip -> pantulan basah yang bagus
    const pm = new T3.PMREMGenerator(renderer), ruang = new T3.Scene();
    ruang.add(new T3.Mesh(new T3.SphereGeometry(20, 32, 16), new T3.MeshBasicMaterial({ color: '#2A2230', side: T3.BackSide })));
    for (const [x, y, z, w, h, c] of [[-6, 4, 5, 6, 3, '#FFE7D6'], [7, 2, -2, 3, 8, '#BFD6FF'], [0, 9, 0, 8, 2, '#FFFFFF']]) {
      const s = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ color: c, side: T3.DoubleSide })); s.position.set(x, y, z); s.lookAt(0, 0, 0); ruang.add(s); }
    scene.environment = pm.fromScene(ruang, .04).texture;
    const kunci = new T3.DirectionalLight('#FFE9DA', 2.2); kunci.position.set(-4, 5, 6); scene.add(kunci);   // hangat dari kiri atas
    const tepi = new T3.DirectionalLight('#9FC2FF', 1.6); tepi.position.set(5, 2, -5); scene.add(tepi);      // dingin dari belakang kanan
    scene.add(new T3.HemisphereLight('#FFF4EC', '#3A2A33', .55));

    const A = { renderer, scene, kamera3d: cam, kanvas, gaya, WARNA, irama, peristaltik, hs, sm, V };
    const daftarAnim = [];   // fungsi(t) yang dipanggil otomatis tiap frame
    A.tiapFrame = f => daftarAnim.push(f);
    A.bahan = (w, o) => bahan(w, o?.gaya ?? gaya, o?.m);

    // bayangan kontak lembut di bawah organ
    A.bayangan = (y = -2, r = 2.2, a = .35) => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const q = c.getContext('2d'), g = q.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, `rgba(20,10,15,${a})`); g.addColorStop(1, 'rgba(20,10,15,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128);
      const m = new T3.Mesh(new T3.PlaneGeometry(r * 2, r * 2), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(c), transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = y; scene.add(m); return m; };

    // ===== JANTUNG =====
    A.jantung = (o = {}) => {
      const grup = new T3.Group(); grup.name = 'jantung';
      const bentuk = v => { let { x, y, z } = v;
        if (y < 0) { const k = -y; const s = 1 - .5 * Math.pow(k, 1.6); x *= s; z *= s; y *= 1.35; } else y *= .85;
        const p = V(x * 1.05, y, z * .85);
        for (const d of [-1, 1]) p.addScaledVector(v, .14 * Math.exp(-((x - d * .5) ** 2 + (y - .65) ** 2 + (z + .1) ** 2) / .09));   // dua serambi
        p.addScaledVector(v, -.035 * Math.exp(-((x * .85 + y * .5 - .05) ** 2) / .006) * sm(z * 3));   // alur antarbilik (halus)
        return p; };
      const badan = new T3.Mesh(bolaBentuk(bentuk), A.bahan(WARNA.jantung)); grup.add(badan);
      const pembuluh = (pts, r, w, r1 = r) => { const k = kurva(pts), g = tabung(k, s => lerpR(r, r1, s) * (s > .97 ? .9 : 1), { seg: 90, radial: 24 }), m = new T3.Mesh(g, A.bahan(w)); grup.add(m); return m; };
      const lerpR = (a, b, s) => a + (b - a) * s;
      const aorta = pembuluh([[.05, .45, .05], [.12, 1.15, .1], [.35, 1.55, 0], [.72, 1.42, -.25], [.8, .7, -.45], [.78, -.2, -.5]], .2, WARNA.arteri, .17);
      const pulmo = pembuluh([[-.12, .35, .45], [-.12, .95, .38], [-.3, 1.25, .2], [-.75, 1.3, .05]], .17, WARNA.vena, .12);
      pembuluh([[-.3, 1.25, .2], [.1, 1.35, -.15], [.55, 1.25, -.2]], .12, WARNA.vena, .1);
      const vena = pembuluh([[-.5, .35, -.05], [-.55, 1.0, -.05], [-.52, 1.75, -.05]], .16, WARNA.vena, .15);
      for (let i = 0; i < 3; i++) pembuluh([[.25 + i * .12, 1.5, 0], [.28 + i * .16, 1.95 - i * .05, .02]], .06, WARNA.arteri, .05);   // cabang lengkung aorta
      // pembuluh koroner menempel di permukaan
      const diPermukaan = d => bentuk(d.clone().normalize()).multiplyScalar(1.015);
      for (const [a, b, c2] of [[[.1, .5, .9], [.25, -.2, .95], [.35, -.85, .45]], [[-.2, .45, .9], [-.55, 0, .8], [-.45, -.7, .5]]]) {
        const k = kurva([a, b, c2].map(p => diPermukaan(V(...p)).toArray()));
        grup.add(new T3.Mesh(tabung(k, s => .035 * (1 - .5 * s), { seg: 60, radial: 10 }), A.bahan(WARNA.arteri))); }
      grup.rotation.z = o.miring ?? .42; grup.rotation.y = -.2;
      grup.bagian = { badan, aorta, pulmo, vena };
      // titik penting (koordinat lokal) untuk label
      grup.titik = { aorta: V(.4, 1.6, 0), bilikKiri: V(.35, -.4, .7), serambiKanan: V(-.55, .6, .45), venaKava: V(-.52, 1.6, 0), arteriParu: V(-.6, 1.3, .1), apeks: V(.1, -1.3, .2) };
      grup.detak = (t, bpm = 72) => { const b = irama(t, bpm); const s = 1 + .045 * b; badan.scale.set(s, 1 + .03 * b, s); aorta.scale.setScalar(1 + .02 * b); };
      return grup;
    };

    // ===== PARU-PARU + pohon bronkus =====
    A.paru = (o = {}) => {
      const grup = new T3.Group(); grup.name = 'paru';
      const sisi = d => bolaBentuk(v => { let { x, y, z } = v;
        const p = V(x * .78, y * 1.35, z * .72);
        if (y < -.3) p.y = -.3 * 1.35 + (y + .3) * .7;                       // dasar lebih datar (diafragma)
        if (x * d < 0) p.x *= .45;                                            // sisi tengah rata
        if (d > 0 && x < 0 && y < .2 && y > -.9) p.x *= .55;                  // lekuk jantung di paru kiri
        p.y += .25 * Math.max(0, y) ** 3;                                     // puncak sedikit meruncing
        return p; }, 80);
      const bhn = A.bahan(WARNA.paru, { m: o.tembus ? {} : {} });
      const kiri = new T3.Mesh(sisi(1), bhn), kanan = new T3.Mesh(sisi(-1), bhn.clone());
      kiri.position.x = .82; kanan.position.x = -.82; kanan.scale.x = 1.08; grup.add(kiri, kanan);
      // trakea + bronkus bercabang (berbenih, dalam koordinat grup)
      const pohon = new T3.Group(); grup.add(pohon);
      const cincin = (k, r) => new T3.Mesh(tabung(k, s => r * (1 + .08 * Math.pow(Math.abs(Math.sin(s * 60)), 8)), { seg: 120, radial: 18 }), A.bahan(WARNA.trakea, { gaya: 'basah' }));
      pohon.add(cincin(kurva([[0, 2.6, 0], [0, 1.9, 0], [0, 1.15, 0]]), .16));
      const cabang = (p, arah, r, lv, id) => { if (lv > 4) return;
        const pjg = .58 * Math.pow(.7, lv), q = p.clone().addScaledVector(arah, pjg);
        pohon.add(new T3.Mesh(tabung(kurva([p.toArray(), p.clone().lerp(q, .5).add(V(0, .03, 0)).toArray(), q.toArray()]), s => r * (1 - .25 * s), { seg: 24, radial: 10 }), A.bahan(WARNA.bronkus)));
        for (const k of [-1, 1]) { const a = arah.clone().applyAxisAngle(V(0, 0, 1), k * (.38 + .15 * hs(id * 7 + k))).applyAxisAngle(V(0, 1, 0), (hs(id * 3 + k) - .5) * 1.2).normalize();
          cabang(q, a, r * .7, lv + 1, id * 2 + (k > 0 ? 1 : 0)); } };
      for (const d of [-1, 1]) cabang(V(0, 1.15, 0), V(d * .7, -.7, 0).normalize(), .11, 0, d > 0 ? 3 : 5);
      grup.bagian = { kiri, kanan, pohon };
      grup.titik = { trakea: V(0, 2.2, 0), paruKanan: V(-1.3, .2, .5), paruKiri: V(1.25, .3, .5), bronkus: V(-.5, .85, 0) };
      // napas: k 0..1 (0 = buang napas, 1 = tarik). Pakai A.napas(t) untuk irama 15x/menit.
      grup.napas = k => { const s = 1 + .07 * k; kiri.scale.set(s, 1 + .1 * k, s); kanan.scale.set(s * 1.08, 1 + .1 * k, s); };
      grup.tembus = k => { for (const m of [kiri, kanan]) aturTembus(m.material, k, .72); };
      return grup;
    };
    A.napas = (t, perMenit = 15) => .5 - .5 * Math.cos(t * perMenit / 60 * TAU);

    // ===== LAMBUNG + kerongkongan =====
    A.lambung = (o = {}) => {
      const grup = new T3.Group(); grup.name = 'lambung';
      const k = kurva([[-.15, 2.4, -.1], [-.05, 1.5, 0], [.15, .95, .05], [.62, .75, .05], [.82, .2, .1], [.6, -.4, .1], [.05, -.62, .1], [-.42, -.42, .1], [-.62, -.1, .05], [-.7, .25, 0]]);
      const prof = s => s < .2 ? .14 : s < .3 ? .14 + .3 * sm((s - .2) / .1) : s < .65 ? .44 - .05 * Math.sin((s - .3) * 9) : s < .9 ? .44 - .3 * sm((s - .65) / .25) : .14 - .02 * sm((s - .9) / .1);
      let tAktif = 0;
      const g = tabung(k, (s, t) => prof(s) * (s > .3 && s < .92 ? peristaltik(s, t, o.kuat ?? .16, 26, 2.4) : 1), { seg: 220, radial: 40 });
      const badan = new T3.Mesh(g, A.bahan(WARNA.lambung)); grup.add(badan);
      grup.kurva = k; grup.bagian = { badan };
      grup.titik = { kerongkongan: V(-.1, 1.8, .15), fundus: V(.62, .95, .3), pilorus: V(-.55, -.25, .3), badan: V(.6, 0, .45) };
      grup.gerak = t => { if (t !== tAktif) { g.perbarui(t); tAktif = t; } };
      return grup;
    };

    // ===== USUS HALUS + USUS BESAR =====
    A.usus = (o = {}) => {
      const grup = new T3.Group(); grup.name = 'usus';
      // usus besar: bingkai (naik di kanan tubuh = kiri layar, melintang, turun)
      const kb = kurva([[-1.1, -1.6, .1], [-1.25, -.6, .2], [-1.15, .65, .15], [-.4, .95, .3], [.4, .9, .3], [1.15, .7, .15], [1.25, -.4, .2], [1.0, -1.55, .2], [.4, -1.9, .25]]);
      const besar = tabung(kb, (s, t) => .26 * (1 - .14 * Math.pow(Math.abs(Math.sin(s * 70)), 3)) * peristaltik(s, t * .4, .08, 10, 1.2), { seg: 260, radial: 30 });
      grup.add(new T3.Mesh(besar, A.bahan(WARNA.ususBesar)));
      // usus halus: lilitan berbenih di dalam bingkai
      const pts = []; const baris = 7;
      for (let b = 0; b < baris; b++) { const y = .55 - b * .3, dir = b % 2 ? -1 : 1;
        for (let i = 0; i <= 8; i++) { const u = i / 8, x = dir * (-.78 + 1.56 * u);
          pts.push([x + .07 * Math.sin(i * 1.7 + b), y + .11 * Math.sin(u * TAU * 2 + b * 1.3), .35 + .18 * Math.sin(u * TAU * 1.5 + b * 2.1)]); } }
      const kh = kurva(pts);
      const halus = tabung(kh, (s, t) => .105 * peristaltik(s, t, o.kuat ?? .22, 160, 3), { seg: 900, radial: 18 });
      grup.add(new T3.Mesh(halus, A.bahan(WARNA.ususHalus)));
      grup.kurvaHalus = kh; grup.kurvaBesar = kb;
      grup.titik = { ususHalus: V(0, -.1, .6), ususBesar: V(-1.2, .3, .45), usus12: V(.9, .75, .45) };
      let tAktif = -1; grup.gerak = t => { if (t !== tAktif) { halus.perbarui(t); besar.perbarui(t); tAktif = t; } };
      return grup;
    };

    // ===== OTAK =====
    A.otak = (o = {}) => {
      const grup = new T3.Group(); grup.name = 'otak';
      const lipat = v => { const f = (a, b, c) => Math.sin(v.x * a + v.y * b * 1.3 + v.z * c + Math.sin(v.y * 5 + v.z * 3) * 1.4);
        return (1 - Math.abs(f(15, 5, 7))) * .55 + (1 - Math.abs(f(-7, 13, 11))) * .3 + (1 - Math.abs(f(10, -9, 15))) * .15; };   // lekuk tajam, gulungan bulat
      const besar = new T3.Mesh(bolaBentuk(v => { const r = 1 - .065 * lipat(v) - .12 * Math.exp(-(v.x * v.x) / .0035) * (v.y > -.4 ? 1 : 0);
        const p = v.clone().multiplyScalar(r); p.set(p.x * .88, p.y * .78, p.z * 1.08); if (p.y < -.35) p.y = -.35 + (p.y + .35) * .6; return p; }, 220), A.bahan(WARNA.otak, { m: { roughness: .55, clearcoat: .4 } }));
      const kecil = new T3.Mesh(bolaBentuk(v => { const r = 1 - .03 * Math.abs(Math.sin(v.y * 40)); return V(v.x * .42 * r, v.y * .26 * r, v.z * .3 * r); }, 80), A.bahan(WARNA.otakKecil));
      kecil.position.set(0, -.62, -.65);
      const batang = new T3.Mesh(tabung(kurva([[0, -.3, -.15], [0, -.8, -.3], [0, -1.35, -.35]]), s => .2 - .05 * s, { seg: 30, radial: 20 }), A.bahan(WARNA.batangOtak));
      grup.add(besar, kecil, batang);
      grup.bagian = { besar, kecil, batang };
      grup.titik = { depan: V(0, .3, 1.05), belakang: V(.3, .2, -1), otakKecil: V(.3, -.65, -.75), batang: V(0, -1.2, -.3), atas: V(.3, .8, 0) };
      return grup;
    };

    // ===== PARTIKEL mengalir di sepanjang kurva (sel darah, udara, makanan) =====
    A.aliran = (kurvaAlir, o = {}) => {
      const n = o.jumlah ?? 60, jenis = o.jenis ?? 'darah';
      const geo = jenis === 'darah' ? new T3.TorusGeometry(.05, .03, 8, 16) : new T3.SphereGeometry(jenis === 'udara' ? .035 : .06, 12, 8);
      const mat = jenis === 'udara' ? new T3.MeshPhysicalMaterial({ color: '#FFFFFF', transparent: true, opacity: .7, roughness: .1, emissive: '#BFE3FF', emissiveIntensity: .6 })
        : A.bahan(jenis === 'makanan' ? WARNA.makanan : WARNA.darah);
      const im = new T3.InstancedMesh(geo, mat, n), m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), sc = V(1, 1, 1);
      im.perbarui = t => { for (let i = 0; i < n; i++) {
          const u = ((hs(i) + t * (o.laju ?? .12) * (.8 + .4 * hs(i + 9))) % 1 + 1) % 1, p = kurvaAlir.getPointAt(u), r = (o.sebar ?? .08);
          p.add(V((hs(i * 3) - .5) * r, (hs(i * 5) - .5) * r, (hs(i * 7) - .5) * r));
          e.set(t * (1 + hs(i)) + i, t * .7 + i * 2, 0); q.setFromEuler(e); const k = Math.min(1, u * 12, (1 - u) * 12); sc.setScalar(k);
          m4.compose(p, q, sc); im.setMatrixAt(i, m4); }
        im.instanceMatrix.needsUpdate = true; };
      im.perbarui(0); return im;
    };

    // ===== efek =====
    // potong (cutaway): bidang potong bergerak; k 0..1 membuka dari depan
    A.potong = (grup, k, sumbu = 'z') => { const n = sumbu === 'z' ? V(0, 0, -1) : sumbu === 'x' ? V(-1, 0, 0) : V(0, -1, 0);
      const bidang = new T3.Plane(n, 2 - 2.2 * k);
      grup.traverse(m => { if (m.isMesh) { const sisi = k > 0 ? T3.DoubleSide : T3.FrontSide; if (m.material.side !== sisi || !!m.material.clippingPlanes !== k > 0) m.material.needsUpdate = true;
      m.material.clippingPlanes = k > 0 ? [bidang] : null; m.material.side = sisi; } }); };
    // tembus (sinar-X): k 0..1
    A.tembus = (grup, k) => grup.traverse(m => { if (m.isMesh && m.material) aturTembus(m.material, k, .75); });
    // urai (exploded view): bagian bergeser menjauh dari pusat
    A.urai = (grup, k, jarak = 1) => grup.children.forEach((c, i) => { if (!c.userData.asal) c.userData.asal = c.position.clone();
      const d = c.userData.asal.clone(); if (d.lengthSq() < 1e-4) d.set(Math.cos(i * 2.4), Math.sin(i * 2.4), .3); c.position.copy(c.userData.asal).addScaledVector(d.normalize(), k * jarak); });
    // sorot: satu bagian menyala lembut, sisanya meredup
    A.sorot = (grup, target, k) => grup.traverse(m => { if (!m.isMesh) return; const ya = m === target; m.material.emissive = m.material.emissive || new T3.Color(0);
      m.material.emissive.set(ya ? '#FF7A5C' : '#000000'); m.material.emissiveIntensity = ya ? .35 * k : 0; if (!ya) aturTembus(m.material, k, .55); });

    // ===== kamera mulus: kunci [[detik, {pos:[x,y,z], lihat:[x,y,z], fov}], ...] =====
    // posisi lewat spline Catmull-Rom (gerak menyambung tanpa berhenti-mulai), dipercepat/diperlambat halus di ujung.
    A.kamera = (t, kunci) => {
      if (kunci.length === 1) { const k = kunci[0][1]; cam.position.set(...k.pos); cam.lookAt(...(k.lihat || [0, 0, 0])); if (k.fov) { cam.fov = k.fov; cam.updateProjectionMatrix(); } return; }
      if (!kunci._s) { kunci._s = kurva(kunci.map(k => k[1].pos)); kunci._l = kurva(kunci.map(k => k[1].lihat || [0, 0, 0])); }
      const ts = kunci.map(k => k[0]), n = ts.length - 1; let i = 0; while (i < n - 1 && t > ts[i + 1]) i++;
      const lok = cl((t - ts[i]) / (ts[i + 1] - ts[i])), e = n === 1 ? sm(lok) : i === 0 ? lok * lok * (2 - lok) : i === n - 1 ? 1 - (1 - lok) * (1 - lok) * (1 + lok) : lok;
      const u = (i + (t <= ts[0] ? 0 : t >= ts[n] ? 1 : e)) / n;
      cam.position.copy(kunci._s.getPoint(cl(u))); cam.lookAt(kunci._l.getPoint(cl(u)));
      const f0 = kunci[i][1].fov ?? cam.fov, f1 = kunci[Math.min(i + 1, n)][1].fov ?? f0; cam.fov = f0 + (f1 - f0) * sm(lok); cam.updateProjectionMatrix(); };

    // titik 3D (lokal di obj) -> piksel layar [x, y] di kanvas 1080x1920
    A.keLayar = (obj, lokal) => { obj.updateWorldMatrix(true, false); const p = lokal.clone().applyMatrix4(obj.matrixWorld).project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; };

    // label 2D yang menempel ke titik 3D: garis penunjuk + kotak teks (di kotak aman x 60–927, y 212–1540)
    A.label = (ctx, obj, lokal, teks, o = {}) => {
      const [x, y] = A.keLayar(obj, lokal), k = o.k ?? 1; if (k <= 0) return;
      const tx = cl(o.x ?? (x < W / 2 ? x - 230 : x + 230), 150, 837), ty = cl(o.y ?? y - 120, 260, 1500);
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = o.garis ?? '#FFFFFF'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (tx - x) * sm(k), y + (ty - y) * sm(k)); ctx.stroke();
      ctx.fillStyle = o.garis ?? '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
      ctx.font = `700 ${o.ukuran ?? 44}px ${o.font ?? 'Fredoka, sans-serif'}`; const w = ctx.measureText(teks).width + 44, h = (o.ukuran ?? 44) * 1.55;
      ctx.fillStyle = o.latar ?? 'rgba(25,18,28,0.82)'; ctx.beginPath(); ctx.roundRect(tx - w / 2, ty - h / 2, w, h, 18); ctx.fill();
      ctx.fillStyle = o.warna ?? '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(teks, tx, ty + 2); ctx.restore(); };

    // gambar frame waktu t ke konteks 2D (ctx) kita
    A.gambar = (ctx, t, o = {}) => { for (const f of daftarAnim) f(t);
      scene.traverse(m => { if (m.perbarui && m.isInstancedMesh) m.perbarui(t); });
      renderer.render(scene, cam); ctx.drawImage(kanvas, o.x ?? 0, o.y ?? 0, o.w ?? W, o.h ?? H); };
    return A;
  };
})();
