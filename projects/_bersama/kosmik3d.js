// KOSMIK 3D (Cosmic Motion) — luar angkasa 3D untuk video Canvas kita (Three.js r159, MIT). Lihat .claude/skills/cosmic-motion/SKILL.md.
// Bintang berkelip, nebula, planet bertekstur prosedural (bumi, mars, jupiter, saturnus, bulan, es, lava), matahari bercahaya,
// orbit, sabuk asteroid, komet, galaksi spiral, lubang hitam, lompatan warp, kamera mulus, label.
// Semua gerak = fungsi waktu t (frame-deterministik, aman untuk render.mjs & HyperFrames). Tanpa Math.random.
(function () {
  const T3 = THREE, V = (x, y, z) => new T3.Vector3(x, y, z), TAU = Math.PI * 2;
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const hs = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- derau 3D berbenih (untuk tekstur yang menyambung di bola) ----------
  const h3 = (x, y, z, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 19.3) * 43758.5453; return n - Math.floor(n); };
  function derau(x, y, z, s = 0) { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), L = (a, b, k) => a + (b - a) * k;
    const c = (i, j, k) => h3(X + i, Y + j, Z + k, s);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); }
  function fbm(x, y, z, s = 0, okt = 5) { let a = .5, f = 1, t = 0; for (let i = 0; i < okt; i++) { t += a * derau(x * f, y * f, z * f, s + i); f *= 2.03; a *= .5; } return t; }
  const hex = c => new T3.Color(c);
  const campur = (a, b, k) => a.clone().lerp(b, cl(k));

  // tekstur equirectangular dari fungsi f(x,y,z di bola satuan, lat) -> [r,g,b,a] 0..255
  function teksturBola(f, w = 1024, h = 512) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'), img = q.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) { const lat = (.5 - j / h) * Math.PI, cy = Math.sin(lat), r = Math.cos(lat);
      for (let i = 0; i < w; i++) { const lon = (i / w) * TAU, x = Math.cos(lon) * r, z = Math.sin(lon) * r, p = f(x, cy, z, lat), k = (j * w + i) * 4;
        d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = p[3] ?? 255; } }
    q.putImageData(img, 0, 0); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4; return t; }
  const rgb = c => [c.r * 255, c.g * 255, c.b * 255];
  // titik bercahaya lembut (untuk bintang, glow, nebula)
  function teksturGlow(warna = '#FFFFFF', keras = .25) { const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'), g = q.createRadialGradient(128, 128, 0, 128, 128, 128);
    const k = hex(warna), s = `${k.r * 255 | 0},${k.g * 255 | 0},${k.b * 255 | 0}`; g.addColorStop(0, `rgba(${s},1)`); g.addColorStop(keras, `rgba(${s},.55)`); g.addColorStop(1, `rgba(${s},0)`);
    q.fillStyle = g; q.fillRect(0, 0, 256, 256); return new T3.CanvasTexture(c); }

  // ---------- resep tekstur planet ----------
  const RESEP = {
    bumi: (x, y, z, lat, s) => { const n = fbm(x * 2.2, y * 2.2, z * 2.2, s), es = Math.abs(lat) > 1.22 - .12 * fbm(x * 6, y * 6, z * 6, s + 3);
      if (es) return [240, 246, 252]; const laut = hex('#0F3E8A'), dangkal = hex('#2C7FC9'), hijau = hex('#3E8E4A'), gurun = hex('#C9A866'), gunung = hex('#7A6A55');
      if (n < .55) return rgb(campur(laut, dangkal, sm((n - .45) / .1)));
      const kering = fbm(x * 3, y * 3, z * 3, s + 9) + (1 - Math.abs(lat) * 1.2) * .15; let c = campur(hijau, gurun, sm((kering - .62) / .1)); c = campur(c, gunung, sm((n - .7) / .08) * .7); return rgb(c); },
    awan: (x, y, z, lat, s) => { const n = fbm(x * 3.2 + fbm(x * 2, y * 2, z * 2, s + 5) * 1.5, y * 3.2, z * 3.2, s + 1); const a = sm((n - .52) / .16) * 235; return [255, 255, 255, a]; },
    mars: (x, y, z, lat, s) => { const n = fbm(x * 2.5, y * 2.5, z * 2.5, s), c = campur(hex('#B4532A'), hex('#E08A55'), n * 1.3 - .3);
      const kawah = Math.pow(derau(x * 14, y * 14, z * 14, s + 7), 6); const es = Math.abs(lat) > 1.35; return es ? [236, 226, 220] : rgb(campur(c, hex('#5E2A18'), sm((.62 - n) / .2) * .6 + kawah * .4)); },
    bulan: (x, y, z, lat, s) => { const n = fbm(x * 3, y * 3, z * 3, s); let c = campur(hex('#5D5D62'), hex('#C9C8C4'), n * 1.4 - .2);
      for (let i = 0; i < 3; i++) { const k = derau(x * (6 + i * 5), y * (6 + i * 5), z * (6 + i * 5), s + 11 + i); if (k > .82) c = campur(c, hex('#3C3C40'), (k - .82) * 4); } return rgb(c); },
    jupiter: (x, y, z, lat, s) => { const w = fbm(x * 4, y * 4, z * 4, s) * .6, b = Math.sin((y + w * .25) * 22) * .5 + .5, b2 = Math.sin((y + w * .1) * 7) * .5 + .5;
      let c = campur(hex('#C9A27A'), hex('#F2E2C8'), b); c = campur(c, hex('#9C6B47'), b2 * .45);
      const dx = Math.atan2(z, x) - 1.2, dy = y + .35, bintik = Math.exp(-(dx * dx) / .05 - (dy * dy) / .006); return rgb(campur(c, hex('#C0583A'), bintik * .9)); },
    saturnus: (x, y, z, lat, s) => { const w = fbm(x * 3, y * 3, z * 3, s) * .3, b = Math.sin((y + w * .2) * 16) * .5 + .5; return rgb(campur(hex('#D6B47E'), hex('#F3E3B8'), b)); },
    es: (x, y, z, lat, s) => { const w = fbm(x * 3, y * 3, z * 3, s) * .4, b = Math.sin((y + w * .15) * 9) * .5 + .5; return rgb(campur(hex('#5FA6C9'), hex('#BFE6F2'), b)); },
    lava: (x, y, z, lat, s) => { const n = fbm(x * 3, y * 3, z * 3, s), r = Math.pow(1 - Math.abs(n - .5) * 2, 8); return rgb(campur(hex('#2A1A16'), hex('#FF6A1F'), r)); },
    matahari: (x, y, z, lat, s) => { const n = fbm(x * 6, y * 6, z * 6, s, 4); return rgb(campur(hex('#FF8A1E'), hex('#FFF2B0'), n * 1.5 - .25)); },
  };

  // ---------- Kosmik3D ----------
  window.Kosmik3D = function (opsi = {}) {
    const W = opsi.w ?? 1080, H = opsi.h ?? 1920;
    const kanvas = document.createElement('canvas'); kanvas.width = W; kanvas.height = H;
    const renderer = new T3.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = T3.SRGBColorSpace;
    renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = opsi.eksposur ?? 1.1; renderer.setClearColor(0x000000, 0);
    const scene = new T3.Scene(), cam = new T3.PerspectiveCamera(opsi.fov ?? 40, W / H, .05, 4000); cam.position.set(0, 0, 12);
    scene.add(new T3.AmbientLight('#25304A', .35));
    const K = { renderer, scene, kamera3d: cam, kanvas, hs, sm, V, RESEP };
    const tiap = []; K.tiapFrame = f => tiap.push(f);

    // ===== bintang berkelip (shader, ukuran & kelip berbenih) =====
    K.bintang = (o = {}) => {
      const n = o.jumlah ?? 4000, R = o.radius ?? 250, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), uk = new Float32Array(n), fs = new Float32Array(n);
      const pal = ['#FFFFFF', '#CFE0FF', '#FFE6C4', '#FFD0A8', '#BFD0FF'].map(hex);
      for (let i = 0; i < n; i++) { const u = hs(i) * 2 - 1, a = hs(i + .5) * TAU, r = R * (.6 + .4 * hs(i + .7)), q = Math.sqrt(1 - u * u);
        pos.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3); const c = pal[Math.floor(hs(i * 3.1) * pal.length)]; col.set([c.r, c.g, c.b], i * 3);
        uk[i] = 1.4 + 6 * Math.pow(hs(i * 7.7), 5); fs[i] = hs(i * 5.3) * TAU; }
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3));
      g.setAttribute('uk', new T3.BufferAttribute(uk, 1)); g.setAttribute('fs', new T3.BufferAttribute(fs, 1));
      const m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, uniforms: { uT: { value: 0 }, uSkala: { value: o.skala ?? 1 } },
        vertexShader: `attribute float uk; attribute float fs; varying vec3 vC; varying float vK; uniform float uT; uniform float uSkala;
          void main(){ vC = color; vK = .65 + .35 * sin(uT * (1.5 + fract(fs) * 2.5) + fs * 7.0); vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = uk * uSkala * (300. / -mv.z) * 5.0; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vC; varying float vK; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, d); a = a * a; gl_FragColor = vec4(vC * vK, a * vK); }`, vertexColors: true });
      const p = new T3.Points(g, m); p.frustumCulled = false; scene.add(p); tiap.push(t => { m.uniforms.uT.value = t; p.rotation.y = t * (o.putar ?? .004); }); return p; };

    // ===== nebula: awan warna lembut (sprite aditif bertekstur derau) =====
    K.nebula = (o = {}) => {
      const grup = new T3.Group(), warna = o.warna ?? ['#7B3FBF', '#2F8FB8', '#D9477A', '#4A2C8F'];
      const teks = warna.map((w, j) => { const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'), img = q.createImageData(256, 256), d = img.data, k = hex(w);
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const u = x / 128 - 1, v = y / 128 - 1, r = Math.sqrt(u * u + v * v), n = fbm(u * 2.2 + j, v * 2.2, j * 3.3, 40 + j);
          const a = cl(1 - r) ** 1.6 * sm((n - .35) / .4), i = (y * 256 + x) * 4; d[i] = k.r * 255; d[i + 1] = k.g * 255; d[i + 2] = k.b * 255; d[i + 3] = a * 255; }
        q.putImageData(img, 0, 0); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; });
      const n = o.jumlah ?? 14;
      for (let i = 0; i < n; i++) { const s = new T3.Sprite(new T3.SpriteMaterial({ map: teks[i % teks.length], transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: (o.terang ?? .5) * (.5 + .5 * hs(i + 3)) }));
        const sk = (o.ukuran ?? 60) * (.6 + .8 * hs(i * 2)); s.scale.set(sk, sk, 1); s.position.set((hs(i * 5) - .5) * (o.lebar ?? 90), (hs(i * 7) - .5) * (o.tinggi ?? 120), -(o.jarak ?? 60) - hs(i * 9) * 40); s.material.rotation = hs(i) * TAU; grup.add(s); }
      tiap.push(t => grup.children.forEach((s, i) => { s.material.rotation += 0; s.material.rotation = hs(i) * TAU + t * .02 * (hs(i + 1) - .5); }));
      scene.add(grup); return grup; };

    // ===== planet bertekstur =====
    const cacheTeks = {};
    K.planet = (jenis = 'bumi', o = {}) => {
      const r = o.radius ?? 1, s = o.benih ?? 1, grup = new T3.Group(); grup.name = jenis;
      const kunci = jenis + s; const map = cacheTeks[kunci] ?? (cacheTeks[kunci] = teksturBola((x, y, z, lat) => RESEP[jenis](x, y, z, lat, s), o.resolusi ?? 1024, (o.resolusi ?? 1024) / 2));
      const bhn = jenis === 'matahari' ? new T3.MeshBasicMaterial({ map, color: '#FFFFFF' }) : new T3.MeshStandardMaterial({ map, roughness: jenis === 'bumi' ? .75 : .92, metalness: 0 });
      const bola = new T3.Mesh(new T3.SphereGeometry(r, 96, 64), bhn); grup.add(bola);
      if (jenis === 'bumi' && o.awan !== false) { const aw = new T3.Mesh(new T3.SphereGeometry(r * 1.012, 96, 64), new T3.MeshStandardMaterial({ map: teksturBola((x, y, z, lat) => RESEP.awan(x, y, z, lat, s)), transparent: true, depthWrite: false, roughness: 1 }));
        grup.add(aw); grup.awan = aw; }
      const atm = o.atmosfer ?? { bumi: '#5AA8FF', mars: '#FFB08A', es: '#9FE3FF', jupiter: '#FFE2B8', saturnus: '#FFE9B0', matahari: '#FFB347' }[jenis];
      if (atm) { const m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, side: T3.BackSide, uniforms: { uC: { value: hex(atm) }, uK: { value: jenis === 'matahari' ? 2.2 : 1 } },
          vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `uniform vec3 uC; uniform float uK; varying vec3 vN; varying vec3 vP; void main(){ float f = pow(1. - abs(dot(normalize(-vP), vN)), 2.2); float a = smoothstep(0.,1.,f) * uK; gl_FragColor = vec4(uC * a, a); }` });
        const halo = new T3.Mesh(new T3.SphereGeometry(r * (jenis === 'matahari' ? 1.35 : 1.12), 64, 48), m); grup.add(halo); grup.halo = halo; }
      if (o.cincin || jenis === 'saturnus') { const rg = new T3.RingGeometry(r * 1.35, r * 2.35, 160, 1), uv = rg.attributes.uv, p = rg.attributes.position, v3 = V(0, 0, 0);
        for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i); uv.setXY(i, (v3.length() - r * 1.35) / (r * 1.0), .5); }
        const c = document.createElement('canvas'); c.width = 512; c.height = 4; const q = c.getContext('2d');
        for (let x = 0; x < 512; x++) { const u = x / 512, a = cl(.25 + .75 * derau(u * 40, 0, 0, 3)) * (u > .58 && u < .63 ? .1 : 1) * sm(u * 12) * sm((1 - u) * 8);
          q.fillStyle = `rgba(${220 + 30 * derau(u * 9, 1, 0, 4) | 0},${200 + 20 * derau(u * 9, 2, 0, 4) | 0},${160 | 0},${a})`; q.fillRect(x, 0, 1, 4); }
        const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace;
        const ring = new T3.Mesh(rg, new T3.MeshStandardMaterial({ map: t, transparent: true, side: T3.DoubleSide, depthWrite: false, roughness: 1 })); ring.rotation.x = Math.PI / 2; grup.add(ring); grup.cincin = ring; }
      if (jenis === 'matahari') { const glow = new T3.Sprite(new T3.SpriteMaterial({ map: teksturGlow('#FFB347', .18), transparent: true, depthWrite: false, blending: T3.AdditiveBlending })); glow.scale.setScalar(r * 7); grup.add(glow);
        const sinar = new T3.PointLight('#FFF1D6', o.terang ?? 900, 0, 2); grup.add(sinar); grup.sinar = sinar; grup.glow = glow; }
      grup.rotation.z = o.miring ?? (jenis === 'bumi' ? .41 : jenis === 'saturnus' ? .47 : .05);
      // putar sesuai waktu (detik per putaran)
      grup.putar = (t, periode = 24) => { bola.rotation.y = t / periode * TAU; if (grup.awan) grup.awan.rotation.y = t / periode * TAU * 1.15; };
      grup.titik = { atas: V(0, r, 0), kanan: V(r, 0, 0), depan: V(0, 0, r) };
      return grup; };

    // matahari terarah (untuk adegan satu planet): cahaya dari satu arah + lampu isi biru lembut
    K.cahayaMatahari = (arah = [-5, 2, 4], kuat = 3) => { const d = new T3.DirectionalLight('#FFF4E2', kuat); d.position.set(...arah); scene.add(d); const f = new T3.DirectionalLight('#5C7CFF', .25); f.position.set(-arah[0], -arah[1], -arah[2]); scene.add(f); return d; };

    // ===== orbit & tata surya =====
    K.garisOrbit = (r, o = {}) => { const pts = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * TAU; pts.push(V(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      const l = new T3.Line(new T3.BufferGeometry().setFromPoints(pts), new T3.LineBasicMaterial({ color: o.warna ?? '#8FA8FF', transparent: true, opacity: o.alfa ?? .35 })); return l; };
    // posisi di orbit pada waktu t (periode detik, fase 0..1)
    K.diOrbit = (obj, r, t, periode, fase = 0, miring = 0) => { const a = (t / periode + fase) * TAU; obj.position.set(Math.cos(a) * r, Math.sin(a) * r * Math.sin(miring), Math.sin(a) * r * Math.cos(miring)); };

    // ===== sabuk asteroid =====
    K.asteroid = (o = {}) => { const n = o.jumlah ?? 600, geo = new T3.DodecahedronGeometry(1, 1), p = geo.attributes.position, v3 = V(0, 0, 0);
      for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i); v3.multiplyScalar(.75 + .45 * derau(v3.x * 2, v3.y * 2, v3.z * 2, 5)); p.setXYZ(i, v3.x, v3.y, v3.z); } geo.computeVertexNormals();
      const im = new T3.InstancedMesh(geo, new T3.MeshStandardMaterial({ color: '#8C8279', roughness: .95, flatShading: true }), n), m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), s3 = V(1, 1, 1);
      im.perbarui = t => { for (let i = 0; i < n; i++) { const r = (o.r0 ?? 8) + ((o.r1 ?? 10) - (o.r0 ?? 8)) * hs(i), a = hs(i * 3) * TAU + t * (o.laju ?? .05) * (10 / r) ** 1.5;
          const y = (hs(i * 7) - .5) * (o.tebal ?? .6), sk = (o.ukuran ?? .08) * (.3 + Math.pow(hs(i * 11), 3) * 2.2);
          e.set(t * hs(i + 1) + i, t * hs(i + 2), 0); q.setFromEuler(e); s3.setScalar(sk); m4.compose(V(Math.cos(a) * r, y, Math.sin(a) * r), q, s3); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; };
      im.perbarui(0); return im; };

    // ===== komet: kepala bercahaya + ekor partikel menjauhi matahari =====
    K.komet = (o = {}) => { const grup = new T3.Group(), kepala = new T3.Sprite(new T3.SpriteMaterial({ map: teksturGlow('#CFF3FF', .12), transparent: true, depthWrite: false, blending: T3.AdditiveBlending }));
      kepala.scale.setScalar(o.ukuran ?? .9); grup.add(kepala); const n = 260, pos = new Float32Array(n * 3), g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
      const ekor = new T3.Points(g, new T3.PointsMaterial({ map: teksturGlow('#9FDFFF', .1), size: .35, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: .8, color: '#BDEBFF' })); grup.add(ekor);
      grup.perbarui = (t, arahEkor = V(1, .2, 0)) => { const d = arahEkor.clone().normalize();
        for (let i = 0; i < n; i++) { const u = ((hs(i) + t * .6) % 1), L = u * (o.panjang ?? 6); pos.set([d.x * L + (hs(i * 3) - .5) * u * .9, d.y * L + (hs(i * 5) - .5) * u * .9, d.z * L + (hs(i * 7) - .5) * u * .9], i * 3); }
        g.attributes.position.needsUpdate = true; }; grup.perbarui(0); return grup; };

    // ===== galaksi spiral (rotasi diferensial di shader) =====
    K.galaksi = (o = {}) => { const n = o.jumlah ?? 60000, lengan = o.lengan ?? 2, R = o.radius ?? 20, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), rr = new Float32Array(n);
      const inti = hex(o.warnaInti ?? '#FFD9A0'), luar = hex(o.warnaLuar ?? '#6FA0FF'), merah = hex('#FF7AA8');
      // 2 lengan spiral logaritmik yang lebar + bintang cakram di antara lengan + tonjolan inti (bentuk mirip Bima Sakti)
      for (let i = 0; i < n; i++) { const jenisB = hs(i * 1.9), r = jenisB < .12 ? Math.pow(hs(i), 2.2) * R * .25 : Math.pow(hs(i), 1.25) * R;
        let a; if (jenisB < .12 || jenisB > .82) a = hs(i * 2.3) * TAU;                                  // inti & cakram: sebaran merata
        else { const cab = Math.floor(hs(i * 2.3) * lengan), lebar = .55 + .25 * (r / R); a = cab / lengan * TAU - Math.log(1 + r) * 2.4 + (hs(i * 3.7) - .5) * lebar * (1 + hs(i * 6.1)); }
        const tebal = (jenisB < .12 ? 1.6 : .45) * (1 - r / R * .6);
        pos.set([Math.cos(a) * r, (hs(i * 6.6) - .5) * tebal * 2, Math.sin(a) * r], i * 3);
        let c = campur(inti, luar, Math.pow(r / R, .6)); if (jenisB > .82) c = campur(c, hex('#8C7FB8'), .5); if (hs(i * 9.9) > .95) c = merah; col.set([c.r, c.g, c.b], i * 3); rr[i] = r; }
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.setAttribute('rr', new T3.BufferAttribute(rr, 1));
      const m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, vertexColors: true, uniforms: { uT: { value: 0 }, uUk: { value: o.ukuran ?? 1 } },
        vertexShader: `attribute float rr; varying vec3 vC; uniform float uT; uniform float uUk; void main(){ vC = color; float a = uT * (0.1 + 0.12 / (1. + rr * 0.2)); float c = cos(a), s = sin(a);
          vec3 p = vec3(c*position.x - s*position.z, position.y, s*position.x + c*position.z); vec4 mv = modelViewMatrix * vec4(p,1.); gl_PointSize = uUk * 150. / -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * 1.2, a * .7); }` });
      const p = new T3.Points(g, m); p.frustumCulled = false; const grup = new T3.Group(); grup.add(p);
      const glow = new T3.Sprite(new T3.SpriteMaterial({ map: teksturGlow('#FFE0B0', .15), transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: .9 })); glow.scale.setScalar(R * .45); grup.add(glow);
      grup.perbarui = t => { m.uniforms.uT.value = t; }; return grup; };

    // ===== lubang hitam: bola gelap + piringan akresi berputar + cincin foton =====
    K.lubangHitam = (o = {}) => { const r = o.radius ?? 1, grup = new T3.Group();
      const piring = new T3.Mesh(new T3.RingGeometry(r * 1.6, r * 5, 256, 1), new T3.ShaderMaterial({ transparent: true, depthWrite: false, side: T3.DoubleSide, blending: T3.AdditiveBlending, uniforms: { uT: { value: 0 }, uR: { value: r } },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform float uT; uniform float uR; varying vec3 vP; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
          void main(){ float rr = length(vP.xy) / uR; float a = atan(vP.y, vP.x); float sw = a + uT * (2.2 / rr) + rr * 1.3;
            float s = n(vec2(sw * 3.0, rr * 4.0)) * .6 + n(vec2(sw * 9.0, rr * 11.0)) * .4; float k = smoothstep(1.6, 2.0, rr) * smoothstep(5.0, 2.4, rr);
            vec3 c = mix(vec3(1.0, .95, .8), vec3(1.0, .45, .12), smoothstep(1.8, 4.2, rr)); gl_FragColor = vec4(c * (0.6 + s) * k * 1.6, k * (0.5 + .5 * s)); }` }));
      piring.rotation.x = Math.PI / 2 - (o.miring ?? .22); grup.add(piring);
      // "lengkungan" cahaya di atas & bawah (meniru lensa gravitasi)
      const lensa = piring.clone(); lensa.material = piring.material; lensa.rotation.x = 0; lensa.scale.setScalar(.62); grup.add(lensa);
      grup.add(new T3.Mesh(new T3.SphereGeometry(r, 64, 48), new T3.MeshBasicMaterial({ color: '#000000' })));
      const cincin = new T3.Sprite(new T3.SpriteMaterial({ map: teksturGlow('#FFC58A', .5), transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: .5 })); cincin.scale.setScalar(r * 3.4); grup.add(cincin);
      grup.perbarui = t => { piring.material.uniforms.uT.value = t; lensa.lookAt(cam.position); }; return grup; };

    // ===== warp: garis bintang memanjang ke arah kamera (k 0..1) =====
    K.warp = (o = {}) => { const n = o.jumlah ?? 900, pos = new Float32Array(n * 6), g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
      const m = new T3.LineBasicMaterial({ color: o.warna ?? '#CFE3FF', transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false }), l = new T3.LineSegments(g, m); l.frustumCulled = false;
      l.perbarui = (t, k) => { m.opacity = sm(k); const cp = cam.position, dir = V(0, 0, -1).applyQuaternion(cam.quaternion), up = V(0, 1, 0).applyQuaternion(cam.quaternion), kanan = dir.clone().cross(up);
        for (let i = 0; i < n; i++) { const a = hs(i) * TAU, r = 1.5 + 18 * Math.sqrt(hs(i + 3)), z = 60 - ((hs(i * 7) * 60 + t * 90 * (.3 + k)) % 60), L = .2 + 14 * k * k;
          const b = cp.clone().addScaledVector(dir, z).addScaledVector(kanan, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r), e = b.clone().addScaledVector(dir, L);
          pos.set([b.x, b.y, b.z, e.x, e.y, e.z], i * 6); } g.attributes.position.needsUpdate = true; }; return l; };

    // ===== kamera mulus (spline Catmull-Rom) =====
    const kurva = pts => new T3.CatmullRomCurve3(pts.map(p => V(...p)), false, 'centripetal');
    K.kamera = (t, kunci) => {
      if (kunci.length === 1) { const k = kunci[0][1]; cam.position.set(...k.pos); cam.lookAt(...(k.lihat || [0, 0, 0])); if (k.fov) { cam.fov = k.fov; cam.updateProjectionMatrix(); } return; }
      if (!kunci._s) { kunci._s = kurva(kunci.map(k => k[1].pos)); kunci._l = kurva(kunci.map(k => k[1].lihat || [0, 0, 0])); }
      const ts = kunci.map(k => k[0]), n = ts.length - 1; let i = 0; while (i < n - 1 && t > ts[i + 1]) i++;
      const lok = cl((t - ts[i]) / (ts[i + 1] - ts[i])), e = n === 1 ? sm(lok) : i === 0 ? lok * lok * (2 - lok) : i === n - 1 ? 1 - (1 - lok) * (1 - lok) * (1 + lok) : lok;
      const u = (i + (t <= ts[0] ? 0 : t >= ts[n] ? 1 : e)) / n;
      cam.position.copy(kunci._s.getPoint(cl(u))); cam.lookAt(kunci._l.getPoint(cl(u)));
      const f0 = kunci[i][1].fov ?? cam.fov, f1 = kunci[Math.min(i + 1, n)][1].fov ?? f0; cam.fov = f0 + (f1 - f0) * sm(lok); cam.updateProjectionMatrix(); };
    K.keLayar = (obj, lokal = V(0, 0, 0)) => { obj.updateWorldMatrix(true, false); const p = lokal.clone().applyMatrix4(obj.matrixWorld).project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; };
    K.label = (ctx, obj, lokal, teks, o = {}) => { const [x, y, z] = K.keLayar(obj, lokal), k = o.k ?? 1; if (k <= 0 || z > 1 || x < 40 || x > W - 40 || y < 120 || y > H - 120) return;   // titik di luar layar: label tidak digambar
      const tx = cl(o.x ?? (x < W / 2 ? x - 220 : x + 220), 150, 837), ty = cl(o.y ?? y - 130, 260, 1500);
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = o.garis ?? 'rgba(220,235,255,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (tx - x) * sm(k), y + (ty - y) * sm(k)); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.stroke(); ctx.font = `700 ${o.ukuran ?? 44}px ${o.font ?? 'Fredoka, sans-serif'}`; const w = ctx.measureText(teks).width + 44, h = (o.ukuran ?? 44) * 1.55;
      ctx.fillStyle = o.latar ?? 'rgba(10,16,40,0.78)'; ctx.beginPath(); ctx.roundRect(tx - w / 2, ty - h / 2, w, h, 18); ctx.fill(); ctx.strokeStyle = 'rgba(150,190,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = o.warna ?? '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(teks, tx, ty + 2); ctx.restore(); };

    K.gambar = (ctx, t, o = {}) => { for (const f of tiap) f(t); scene.traverse(m => { if (m.perbarui && (m.isInstancedMesh)) m.perbarui(t); });
      renderer.render(scene, cam); ctx.drawImage(kanvas, o.x ?? 0, o.y ?? 0, o.w ?? W, o.h ?? H); };
    return K;
  };
})();
