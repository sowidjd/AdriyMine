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
  'zod', 'lottie-web',
];
for (const multi of ['@remotion/transitions', '@remotion/effects']) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', multi, 'package.json'), 'utf8'));
  for (const k of Object.keys(j.exports)) {
    if (k === './package.json' || k.includes('*')) continue;
    pkgs.push(k === '.' ? multi : multi + k.slice(1));
  }
}
let out = '// FILE INI DIBUAT OTOMATIS oleh scripts/gen-modules.mjs\n';
pkgs.forEach((p, i) => { out += `import * as m${i} from ${JSON.stringify(p)};\n`; });
out += 'export const BUILTIN = {\n' + pkgs.map((p, i) => `  ${JSON.stringify(p)}: m${i},`).join('\n') + '\n};\n';
fs.writeFileSync(path.join(root, 'src/modules.gen.js'), out);
console.log('modul bawaan:', pkgs.length);
