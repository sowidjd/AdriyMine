// Membuat src/modules.gen.js: daftar semua paket bawaan yang bisa di-import kode pengguna.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const pkgs = [
  'react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client',
  'remotion', 'remotion/no-react', '@remotion/player', '@remotion/shapes', '@remotion/paths', '@remotion/noise',
  '@remotion/motion-blur', '@remotion/layout-utils', '@remotion/animation-utils', '@remotion/fonts',
  '@remotion/media-utils', '@remotion/media', '@remotion/zod-types', '@remotion/captions', '@remotion/gif',
  '@remotion/lottie', '@remotion/light-leaks', '@remotion/starburst', '@remotion/rounded-text-box',
  'zod', 'lottie-web', '@remotion/three', 'three', '@react-three/fiber', '@react-three/drei',
];
for (const multi of ['@remotion/transitions', '@remotion/effects']) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', multi, 'package.json'), 'utf8'));
  for (const k of Object.keys(j.exports)) {
    if (k === './package.json' || k.includes('*')) continue;
    pkgs.push(k === '.' ? multi : multi + k.slice(1));
  }
}
pkgs.push('postprocessing', '@react-three/postprocessing');
// Pustaka tambahan three.js, bisa di-import sebagai 'three/addons/...' atau 'three/examples/jsm/...'
const ADDONS = [
  'environments/RoomEnvironment', 'loaders/GLTFLoader', 'loaders/OBJLoader', 'loaders/FBXLoader', 'loaders/STLLoader', 'loaders/PLYLoader',
  'loaders/FontLoader', 'loaders/RGBELoader', 'loaders/HDRLoader', 'geometries/TextGeometry', 'geometries/RoundedBoxGeometry',
  'geometries/ConvexGeometry', 'geometries/ParametricGeometry', 'geometries/DecalGeometry', 'math/ImprovedNoise', 'math/SimplexNoise',
  'utils/BufferGeometryUtils', 'utils/SkeletonUtils', 'objects/Reflector', 'objects/Sky', 'objects/Water', 'lines/Line2', 'lines/LineMaterial',
  'lines/LineGeometry', 'lines/LineSegments2', 'lines/LineSegmentsGeometry', 'curves/NURBSCurve', 'modifiers/SimplifyModifier', 'controls/OrbitControls',
];
const entries = pkgs.map((p) => [p, p]);
for (const a of ADDONS) entries.push(['three/addons/' + a, 'three/examples/jsm/' + a + '.js']);
entries.push(['@saku/3d', '../src/saku3d.jsx'.replace('../src/', './')]);
let out = '// FILE INI DIBUAT OTOMATIS oleh scripts/gen-modules.mjs\n';
entries.forEach(([, from], i) => { out += `import * as m${i} from ${JSON.stringify(from)};\n`; });
out += 'export const BUILTIN = {\n' + entries.map(([k], i) => `  ${JSON.stringify(k)}: m${i},`).join('\n') + '\n};\n';
fs.writeFileSync(path.join(root, 'src/modules.gen.js'), out);
console.log('modul bawaan:', entries.length);
