// Membangun aplikasi menjadi SATU file HTML (tanpa server, bisa offline).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
execFileSync('node', [path.join(root, 'scripts/gen-modules.mjs')], { stdio: 'inherit' });
const r = await build({
  entryPoints: [path.join(root, 'src/main.jsx')],
  bundle: true, minify: true, format: 'iife', target: ['chrome100', 'safari15', 'firefox110'],
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic', write: false, legalComments: 'none', logLevel: 'warning',
  loader: { '.js': 'jsx' },
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const css = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
const head = `<title>Remotion Saku</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Tempel kode Remotion, putar, dan buat video MP4 langsung di HP.">
<meta name="theme-color" content="#0e1116">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap">
<style>${css}</style>`;
const bodyInner = `<div id="root"></div>
<noscript>Aktifkan JavaScript untuk memakai Remotion Saku.</noscript>
<script>${js}</script>`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
// 1) Untuk Artifact claude.ai (kerangka html/head/body ditambahkan otomatis)
fs.writeFileSync(path.join(root, 'dist/index.html'), head + '\n' + bodyInner + '\n');
// 2) File mandiri: buka langsung di browser HP / hosting statis (GitHub Pages, Netlify)
fs.writeFileSync(path.join(root, 'dist/remotion-saku.html'), `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
${head}</head><body>
${bodyInner}
</body></html>
`);
console.log('ukuran:', (fs.statSync(path.join(root, 'dist/index.html')).size / 1e6).toFixed(2), 'MB');
