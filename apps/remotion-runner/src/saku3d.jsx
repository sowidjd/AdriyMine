// @saku/3d — perangkat 3D untuk video sains/edukasi (gaya cutaway) di Remotion.
// Semua animasi terkunci ke frame video, sehingga pratinjau dan hasil ekspor identik.
import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Html, Line, useGLTF, Center } from '@react-three/drei';
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

const SizeLock = ({ width, height }) => {
  const setSize = useThree((s) => s.setSize);
  const set = useThree((s) => s.set);
  useLayoutEffect(() => {
    setSize(width, height);
    set({ setSize: () => null });
    return () => set({ setSize });
  }, [setSize, width, height, set]);
  return null;
};

const Advancer = ({ onRendered }) => {
  const advance = useThree((s) => s.advance);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useEffect(() => {
    advance(frame / fps); // jam 3D = waktu video (detik)
    onRendered();
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
  useEffect(() => { advance(frame / fps); }, []); // eslint-disable-line react-hooks/exhaustive-deps
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

export const Studio = ({ intensity = 1, environment = true, envIntensity = 0.9, ground = true, groundY = -1.6, shadowOpacity = 0.55, shadowBlur = 2.4, background, keyColor = '#ffffff', rimColor = '#8fb8ff' }) => {
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

export const Effects = ({ bloom = 0.7, bloomThreshold = 0.8, ao = true, dof = 0, focusDistance = 0.015, focalLength = 0.04, vignette = 0.35 }) => {
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
export const Cutaway = ({ children, progress = 1, axis = 'x', at = 0, capColors, showCaps = true, capRoughness = 0.5 }) => {
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
      const color = m.userData.capColor || (capColors && capColors[i]) || (src && src.color ? src.color.clone().offsetHSL(0, 0.06, 0.1) : new THREE.Color('#ff6b6b'));
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

export const Label3D = ({ position = [0, 0, 0], offset = [1.2, 0.8, 0], children, color = '#ffffff', opacity = 1, fontSize, accent = '#4d8dff', dot = true }) => {
  const { height } = useVideoConfig();
  const fs = fontSize ?? Math.round(height * 0.02);
  if (opacity <= 0.001) return null;
  return (
    <group position={position}>
      {dot && <mesh><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} /></mesh>}
      <Line points={[[0, 0, 0], offset]} color={color} lineWidth={Math.max(2, fs / 12)} transparent opacity={opacity} toneMapped={false} />
      <Html position={offset} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontFamily: 'Inter, Arial, sans-serif', fontWeight: 700, fontSize: fs, lineHeight: 1.15, color: '#fff', whiteSpace: 'nowrap',
          padding: `${fs * 0.35}px ${fs * 0.6}px`, borderRadius: fs * 0.4, background: 'rgba(10,14,22,0.72)', borderLeft: `${Math.max(3, fs / 8)}px solid ${accent}`,
          opacity, transform: `translateX(${offset[0] >= 0 ? '50%' : '-50%'})`,
        }}>{children}</div>
      </Html>
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
