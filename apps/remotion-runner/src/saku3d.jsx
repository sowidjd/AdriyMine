// @saku/3d — perangkat 3D untuk video sains/edukasi (gaya cutaway) di Remotion.
// Semua animasi terkunci ke frame video, sehingga pratinjau dan hasil ekspor identik.
import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, useGLTF, Center } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, N8AO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Internals, interpolate, Easing, useCurrentFrame, useDelayRender, useVideoConfig } from 'remotion';
import fontBoldJson from './assets/helvetiker_bold.typeface.json';

export const fontBold = fontBoldJson;

/** Waktu video dalam detik (frame / fps). */
export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// ---------- Kanvas 3D yang sinkron dengan frame ----------

const NOOP_SIZE = () => null;
// Kunci ukuran kanvas = ukuran video (tidak ikut berubah saat pemutar diperkecil di layar).
const SizeLock = ({ width, height }) => {
  const get = useThree((s) => s.get);
  const set = useThree((s) => s.set);
  useLayoutEffect(() => {
    const st = get();
    const orig = st.__sakuSetSize || st.setSize;
    orig(width, height);
    if (!st.__sakuSetSize) set({ setSize: NOOP_SIZE, __sakuSetSize: orig });
  }, [width, height, get, set]);
  return null;
};

// Menggambar ulang scene sesuai frame video. Saat baru dibuka atau setelah lompat waktu,
// scene digambar 2x lagi di frame layar berikutnya agar efek, label, dan tekstur yang baru
// siap ikut tergambar (penting untuk cuplikan 1 frame dan video yang dijeda).
const Advancer = ({ onRendered }) => {
  const advance = useThree((s) => s.advance);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const last = useRef({ frame: null, count: 0 });
  useEffect(() => {
    const t = frame / fps;
    advance(t);
    const L = last.current;
    const settle = L.count < 3 || L.frame === null || Math.abs(frame - L.frame) !== 1;
    L.frame = frame; L.count += 1;
    if (!settle) { onRendered(); return undefined; }
    let alive = true;
    const raf = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16));
    raf(() => {
      if (!alive) return;
      advance(t);
      raf(() => { if (!alive) return; advance(t); onRendered(); });
    });
    return () => { alive = false; onRendered(); };
  }, [frame, fps, advance, onRendered]);
  return null;
};

const LoadingHold = () => {
  const { delayRender, continueRender } = useDelayRender();
  useLayoutEffect(() => {
    const h = delayRender('Memuat aset 3D');
    return () => continueRender(h);
  }, [delayRender, continueRender]);
  return null;
};

const ReadyKick = () => {
  const advance = useThree((s) => s.advance);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useEffect(() => {
    const t = frame / fps;
    advance(t);
    const id = setTimeout(() => advance(t), 50);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

/**
 * Pengganti <ThreeCanvas> dan <Canvas>: ukuran otomatis = ukuran video, antialias,
 * stencil (untuk cutaway), bayangan, dan jam yang mengikuti frame video.
 */
export const SakuThreeCanvas = ({ children, width, height, style, gl, dpr, onCreated, frameloop: _f, resize: _r, shadows = true, ...rest }) => {
  const vc = useVideoConfig();
  const w = width ?? vc.width;
  const h = height ?? vc.height;
  const { fps } = vc;
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const contexts = Internals.useRemotionContexts();
  const createdHold = useRef(null);
  const created = useRef(false);
  const frameHold = useRef(null);

  useLayoutEffect(() => {
    if (created.current) return undefined;
    createdHold.current = delayRender('Menyiapkan kanvas 3D');
    return () => { if (createdHold.current !== null) { continueRender(createdHold.current); createdHold.current = null; } };
  }, [delayRender, continueRender]);

  useLayoutEffect(() => {
    if (!created.current) return undefined;
    frameHold.current = delayRender(`Menggambar frame 3D ${frame}`);
    return () => { if (frameHold.current !== null) { continueRender(frameHold.current); frameHold.current = null; } };
  }, [frame, delayRender, continueRender]);

  const onRendered = useCallback(() => {
    if (frameHold.current !== null) { continueRender(frameHold.current); frameHold.current = null; }
  }, [continueRender]);

  const handleCreated = useCallback((state) => {
    state.gl.localClippingEnabled = true;
    created.current = true;
    state.advance(frame / fps);
    if (createdHold.current !== null) { continueRender(createdHold.current); createdHold.current = null; }
    if (onCreated) onCreated(state);
  }, [continueRender, onCreated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Canvas
      style={{ width: w, height: h, ...style }}
      dpr={dpr ?? 1}
      shadows={shadows}
      gl={{ antialias: true, stencil: true, preserveDrawingBuffer: true, powerPreference: 'high-performance', ...(gl || {}) }}
      {...rest}
      resize={{ offsetSize: true }}
      frameloop="never"
      onCreated={handleCreated}
    >
      <SizeLock width={w} height={h} />
      <Internals.RemotionContextProvider contexts={contexts}>
        <Advancer onRendered={onRendered} />
        <Suspense fallback={<LoadingHold />}>
          {children}
          <ReadyKick />
        </Suspense>
      </Internals.RemotionContextProvider>
    </Canvas>
  );
};
export const Canvas3D = SakuThreeCanvas;

// ---------- Studio: lampu, lingkungan pantul, bayangan lantai ----------

export const Studio = ({ intensity = 1, environment = true, envIntensity = 0.55, ground = true, groundY = -1.6, shadowOpacity = 0.55, shadowBlur = 2.4, background, keyColor = '#ffffff', rimColor = '#8fb8ff' }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    if (!environment) return undefined;
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    const prev = scene.environment;
    const prevI = scene.environmentIntensity;
    scene.environment = env;
    scene.environmentIntensity = envIntensity;
    return () => { scene.environment = prev; scene.environmentIntensity = prevI; env.dispose(); pmrem.dispose(); room.dispose && room.dispose(); };
  }, [gl, scene, environment, envIntensity]);
  return (
    <>
      {background && <color attach="background" args={[background]} />}
      <ambientLight intensity={0.12 * intensity} />
      <directionalLight position={[5, 8, 6]} intensity={2.4 * intensity} color={keyColor} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.02}>
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.5, 40]} />
      </directionalLight>
      <directionalLight position={[-6, 3, -5]} intensity={1.1 * intensity} color={rimColor} />
      <pointLight position={[0, -3, 5]} intensity={6 * intensity} color="#ffe2c2" distance={20} />
      {ground && <ContactShadows position={[0, groundY, 0]} opacity={shadowOpacity} scale={22} blur={shadowBlur} far={8} resolution={1024} color="#000000" />}
    </>
  );
};

// ---------- Efek sinematik ----------

export const Effects = ({ bloom = 0.45, bloomThreshold = 1, ao = true, dof = 0, focusDistance = 0.015, focalLength = 0.04, vignette = 0.35 }) => {
  const list = [];
  if (ao) list.push(<N8AO key="ao" aoRadius={0.9} intensity={2} distanceFalloff={1} quality="medium" halfRes />);
  if (dof) list.push(<DepthOfField key="dof" focusDistance={focusDistance} focalLength={focalLength} bokehScale={dof} />);
  if (bloom) list.push(<Bloom key="bloom" intensity={bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.25} mipmapBlur />);
  if (vignette) list.push(<Vignette key="vig" offset={0.28} darkness={vignette} />);
  list.push(<ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />);
  return <EffectComposer multisampling={4} stencilBuffer depthBuffer>{list}</EffectComposer>;
};

// ---------- Cutaway: memotong objek dan mewarnai bidang potongnya ----------

const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], '-x': [-1, 0, 0], '-y': [0, -1, 0], '-z': [0, 0, -1] };
const radiusOf = (m) => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const s = new THREE.Vector3(); m.getWorldScale(s); return m.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z); };

/**
 * <Cutaway progress={0..1} axis="x" at={0}> ...mesh... </Cutaway>
 * Membuang bagian objek di sisi `axis` sampai posisi `at`. Permukaan potongan diberi warna
 * (otomatis dari warna material, atau mesh.userData.capColor / prop capColors).
 * Mesh harus tertutup (bola, kotak, model utuh).
 */
export const Cutaway = ({ children, progress = 1, axis = 'x', at = 0, capColors, showCaps = true, capRoughness = 0.85 }) => {
  const group = useRef(null);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  const st = useRef({ caps: [], maxProj: 1, size: 10, ready: false });
  const key = Array.isArray(capColors) ? capColors.join(',') : '';

  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    const g = group.current;
    if (!g) return undefined;
    g.updateWorldMatrix(true, true);
    const meshes = [];
    g.traverse((o) => { if (o.isMesh && !o.userData.__saku) meshes.push(o); });
    meshes.sort((a, b) => radiusOf(b) - radiusOf(a)); // luar dulu, dalam menimpa
    const helpers = [];
    const caps = [];
    const touched = [];
    meshes.forEach((m, i) => {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mt) => { touched.push([mt, mt.clippingPlanes]); mt.clippingPlanes = [plane]; mt.clipShadows = true; mt.needsUpdate = true; });
      m.renderOrder = 5000 + i;
      if (!showCaps) return;
      const base = i * 3 + 1;
      const mk = (side, op) => {
        const mat = new THREE.MeshBasicMaterial({ depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, side, clippingPlanes: [plane], stencilFail: op, stencilZFail: op, stencilZPass: op });
        const hm = new THREE.Mesh(m.geometry, mat);
        hm.userData.__saku = true; hm.renderOrder = base; hm.raycast = () => {};
        m.add(hm); helpers.push([m, hm]);
      };
      mk(THREE.BackSide, THREE.IncrementWrapStencilOp);
      mk(THREE.FrontSide, THREE.DecrementWrapStencilOp);
      const src = mats[0];
      const color = new THREE.Color(m.userData.capColor || (capColors && capColors[i]) || (src && src.color ? src.color.clone().offsetHSL(0, 0.04, 0.04) : '#ff6b6b'));
      const capMat = new THREE.MeshStandardMaterial({
        color, roughness: capRoughness, metalness: 0.05, side: THREE.DoubleSide,
        emissive: src && src.emissive ? src.emissive.clone() : new THREE.Color(0), emissiveIntensity: src && src.emissiveIntensity ? src.emissiveIntensity * 0.8 : 0,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp, depthFunc: THREE.LessEqualDepth,
      });
      const cap = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), capMat);
      cap.userData.__saku = true; cap.renderOrder = base + 1; cap.raycast = () => {};
      cap.onAfterRender = (r) => r.clearStencil();
      scene.add(cap); caps.push(cap);
    });
    const box = new THREE.Box3().setFromObject(g);
    st.current = { caps, box, size: box.getSize(new THREE.Vector3()).length() * 2 + 1, ready: true };
    return () => {
      helpers.forEach(([m, hm]) => { m.remove(hm); hm.material.dispose(); });
      caps.forEach((c) => { scene.remove(c); c.geometry.dispose(); c.material.dispose(); });
      touched.forEach(([mt, prev]) => { mt.clippingPlanes = prev || null; mt.needsUpdate = true; });
      st.current.ready = false;
    };
  }, [scene, gl, plane, showCaps, key, capRoughness]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const s = st.current;
    if (!s.ready) return;
    const dir = new THREE.Vector3(...(AXES[axis] || AXES.x)).normalize();
    let maxProj = -Infinity;
    const b = s.box;
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) maxProj = Math.max(maxProj, dir.dot(new THREE.Vector3(x, y, z)));
    const p = Math.min(1, Math.max(0, progress));
    const d = THREE.MathUtils.lerp(maxProj + 0.02, at, p);
    plane.normal.copy(dir).negate();
    plane.constant = d; // simpan titik dengan dir·p <= d
    const center = b.getCenter(new THREE.Vector3());
    const onPlane = center.clone().add(dir.clone().multiplyScalar(d - dir.dot(center)));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    s.caps.forEach((c) => { c.position.copy(onPlane); c.quaternion.copy(q); c.scale.setScalar(s.size); c.visible = p > 0.001; });
  });

  return <group ref={group}>{children}</group>;
};

// ---------- Label penunjuk (gaya video sains) ----------

const textOf = (children) => React.Children.toArray(children).map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : '')).join('');

/**
 * Label penunjuk: titik di objek, garis, dan kotak teks yang mengikuti posisi 3D.
 * Teks digambar sebagai elemen biasa di atas kanvas (ikut terekam saat ekspor).
 */
export const Label3D = ({ position = [0, 0, 0], offset = [1.2, 0.8, 0], children, color = '#ffffff', opacity = 1, fontSize, accent = '#4d8dff', dot = true, align }) => {
  const { height } = useVideoConfig();
  const fs = fontSize ?? Math.round(height * 0.02);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const base = useRef(null);
  const anchor = useRef(null);
  const nodes = useRef(null);
  const text = textOf(children);
  const side = align || (offset[0] > 0.05 ? 'left' : offset[0] < -0.05 ? 'right' : 'center');

  useLayoutEffect(() => {
    const target = gl.domElement.parentNode;
    if (!target) return undefined;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('data-saku-label', '');
    Object.assign(svg.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible', pointerEvents: 'none', zIndex: '4' });
    const line = document.createElementNS(NS, 'line');
    const dotEl = document.createElementNS(NS, 'circle');
    svg.appendChild(line); svg.appendChild(dotEl);
    const box = document.createElement('div');
    box.setAttribute('data-saku-label', '');
    target.appendChild(svg); target.appendChild(box);
    nodes.current = { svg, line, dot: dotEl, box };
    return () => { svg.remove(); box.remove(); nodes.current = null; };
  }, [gl]);

  const toScreen = (obj) => {
    obj.updateWorldMatrix(true, false);
    const v = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld).project(camera);
    return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, behind: v.z > 1 };
  };

  const place = useCallback(() => {
    const n = nodes.current;
    if (!n || !base.current || !anchor.current) return;
    const p = toScreen(base.current), q = toScreen(anchor.current);
    const w = n.box.offsetWidth, h = n.box.offsetHeight, m = Math.round(size.width * 0.03);
    let left = side === 'left' ? q.x : side === 'right' ? q.x - w : q.x - w / 2;
    left = Math.min(Math.max(m, left), Math.max(m, size.width - w - m)); // tetap di dalam bingkai
    const top = Math.min(Math.max(m, q.y - h / 2), Math.max(m, size.height - h - m));
    n.box.style.transform = `translate(${left}px, ${top}px)`;
    // garis dari titik ke sisi kotak yang terdekat
    const ex = p.x < left ? left : p.x > left + w ? left + w : p.x;
    const ey = p.y < top ? top : p.y > top + h ? top + h : top + h / 2;
    n.svg.setAttribute('width', size.width); n.svg.setAttribute('height', size.height);
    n.line.setAttribute('x1', p.x); n.line.setAttribute('y1', p.y); n.line.setAttribute('x2', ex); n.line.setAttribute('y2', ey);
    n.dot.setAttribute('cx', p.x); n.dot.setAttribute('cy', p.y);
    const hide = p.behind || q.behind;
    n.box.style.display = hide ? 'none' : 'block';
    n.svg.style.display = hide ? 'none' : 'block';
  }, [camera, size, side]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const n = nodes.current;
    if (!n) return;
    const lw = Math.max(2, fs / 12);
    n.box.textContent = text;
    Object.assign(n.box.style, {
      position: 'absolute', left: '0px', top: '0px', zIndex: '5', pointerEvents: 'none', whiteSpace: 'nowrap',
      fontFamily: 'Inter, Arial, sans-serif', fontWeight: '700', fontSize: fs + 'px', lineHeight: '1.15', color: '#fff',
      padding: `${fs * 0.35}px ${fs * 0.6}px`, borderRadius: fs * 0.4 + 'px', background: 'rgba(10,14,22,0.78)',
      borderLeft: `${Math.max(3, fs / 8)}px solid ${accent}`,
      opacity: String(opacity), visibility: opacity > 0.001 ? 'visible' : 'hidden',
    });
    n.line.setAttribute('stroke', color); n.line.setAttribute('stroke-width', lw); n.line.setAttribute('stroke-linecap', 'round');
    n.dot.setAttribute('r', dot ? lw * 2.2 : 0); n.dot.setAttribute('fill', color);
    n.svg.style.opacity = String(opacity); n.svg.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
    place();
  });
  useFrame(place);

  return (
    <group ref={base} position={position}>
      <group ref={anchor} position={offset} />
    </group>
  );
};

// ---------- Kamera ----------

/** Kamera mengitari target. speed = putaran per menit... dalam radian per detik. */
export const OrbitCamera = ({ radius = 8, height = 1.5, speed = 0.25, startAngle = 0.6, target = [0, 0, 0], fov }) => {
  const camera = useThree((s) => s.camera);
  const t = useTime();
  useLayoutEffect(() => {
    const a = startAngle + t * speed;
    camera.position.set(target[0] + Math.sin(a) * radius, target[1] + height, target[2] + Math.cos(a) * radius);
    if (fov && camera.isPerspectiveCamera) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.lookAt(target[0], target[1], target[2]);
  });
  return null;
};

/** Kamera berjalan mengikuti titik-titik: [{ at: detik, position: [x,y,z], target: [x,y,z], fov }] */
export const CameraPath = ({ points = [] }) => {
  const camera = useThree((s) => s.camera);
  const t = useTime();
  useLayoutEffect(() => {
    if (!points.length) return;
    const ps = [...points].sort((a, b) => a.at - b.at);
    let i = ps.findIndex((p) => p.at > t);
    if (i === -1) i = ps.length;
    const A = ps[Math.max(0, i - 1)], B = ps[Math.min(ps.length - 1, i)];
    const k = A === B ? 0 : interpolate(t, [A.at, B.at], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
    const lerp3 = (a, b) => [0, 1, 2].map((j) => (a?.[j] ?? 0) + ((b?.[j] ?? 0) - (a?.[j] ?? 0)) * k);
    const pos = lerp3(A.position, B.position);
    const tar = lerp3(A.target || [0, 0, 0], B.target || [0, 0, 0]);
    camera.position.set(...pos);
    if (camera.isPerspectiveCamera && (A.fov || B.fov)) { camera.fov = (A.fov ?? camera.fov) + ((B.fov ?? A.fov ?? camera.fov) - (A.fov ?? camera.fov)) * k; camera.updateProjectionMatrix(); }
    camera.lookAt(...tar);
  });
  return null;
};

/** Memutar isi pelan-pelan (rad/detik). */
export const Turntable = ({ speed = 0.3, axis = 'y', children, ...rest }) => {
  const t = useTime();
  const rot = [0, 0, 0];
  rot['xyz'.indexOf(axis)] = t * speed;
  return <group rotation={rot} {...rest}>{children}</group>;
};

// ---------- Model .glb / .gltf ----------

export const Model = ({ src, castShadow = true, receiveShadow = true, center = true, ...rest }) => {
  const gltf = useGLTF(src);
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => { if (o.isMesh) { o.castShadow = castShadow; o.receiveShadow = receiveShadow; } });
    return s;
  }, [gltf, castShadow, receiveShadow]);
  const obj = <primitive object={scene} />;
  return <group {...rest}>{center ? <Center>{obj}</Center> : obj}</group>;
};
