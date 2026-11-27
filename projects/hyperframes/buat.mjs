// Jembatan ke HyperFrames (github.com/heygen-com/hyperframes, Apache-2.0).
// Mengubah satu video Canvas kita (yang memakai _bersama/dasar.js) menjadi proyek HyperFrames di projects/<nama>/hf/.
//
//   node projects/hyperframes/buat.mjs gagak
//   cd projects/gagak/hf && npx hyperframes@0.9.104 lint      (lalu: preview / render, lihat README.md)
//
// Animasi tetap ditulis seperti biasa di projects/<nama>/index.html; hf/ bisa dibuat ulang kapan saja.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nama = process.argv[2];
if (!nama) { console.error('Pakai: node projects/hyperframes/buat.mjs <nama-proyek>'); process.exit(1); }
const src = resolve(ROOT, nama), out = resolve(src, 'hf');
let html = readFileSync(resolve(src, 'index.html'), 'utf8');
if (!html.includes('../_bersama/dasar.js')) { console.error(`✗ ${nama}/index.html tidak memakai _bersama/dasar.js; jembatan ini hanya untuk video berbasis dasar.js.`); process.exit(1); }
if (!existsSync(resolve(src, 'timeline.json'))) { console.error(`✗ ${nama}/timeline.json belum ada (buat narasi dulu).`); process.exit(1); }
const tl = JSON.parse(readFileSync(resolve(src, 'timeline.json'), 'utf8'));
const dur = +tl.duration.toFixed(3);

rmSync(out, { recursive: true, force: true });
mkdirSync(resolve(out, 'fonts'), { recursive: true });
// dasar.js tanpa baris putar-otomatis (requestAnimationFrame + jam dinding); HyperFrames yang memegang waktu
const dasar = readFileSync(resolve(ROOT, '_bersama/dasar.js'), 'utf8').split('\n').filter(l => !l.includes('requestAnimationFrame')).join('\n')
  // HyperFrames memuat skrip satu per satu; tunda persiapan sampai video.js (yang berisi GAYA) selesai dimuat
  .replace('window.ready = (async () => {', 'window.__videoSiap = new Promise(r => window.__lepasVideo = r);\nwindow.ready = (async () => { await window.__videoSiap;');
writeFileSync(resolve(out, 'dasar.js'), dasar);
copyFileSync(resolve(ROOT, 'hyperframes/lib/gsap.min.js'), resolve(out, 'gsap.min.js'));
// pustaka bersama lain yang dipakai video (three.js, anatomi3d.js, kosmik3d.js, …) ikut disalin
for (const [, f] of html.matchAll(/<script src="\.\.\/_bersama\/([^"]+)"><\/script>/g)) if (f !== 'dasar.js') {
  mkdirSync(dirname(resolve(out, 'lib', f)), { recursive: true }); copyFileSync(resolve(ROOT, '_bersama', f), resolve(out, 'lib', f)); }
for (const f of readdirSync(resolve(ROOT, '_bersama/fonts'))) copyFileSync(resolve(ROOT, '_bersama/fonts', f), resolve(out, 'fonts', f));

// suara: audio campuran (narasi + musik + efek) dari audio.py, kalau sudah ada
const audio = ['audio.wav', 'audio_final.wav'].find(f => existsSync(resolve(src, f)));
if (audio) copyFileSync(resolve(src, audio), resolve(out, 'audio.wav'));

// skrip animasi video dipindah ke video.js: HyperFrames membungkus skrip di dalam halaman, sehingga GAYA dll.
// tidak lagi terlihat oleh dasar.js; skrip dari file terpisah tetap global
html = html.replace(/<script>([\s\S]*?)<\/script>/, (_, js) => { writeFileSync(resolve(out, 'video.js'), js); return '<script src="video.js"></script>'; });

html = html
  .replaceAll('../_bersama/fonts/', 'fonts/')
  .replace(/<script src="\.\.\/_bersama\/(?!dasar\.js)([^"]+)"><\/script>/g, '<script src="lib/$1"></script>')
  .replace('<script src="../_bersama/dasar.js"></script>', '<script>window.HF_MODE = true;</script>\n<script src="gsap.min.js"></script>\n<script src="dasar.js"></script>')
  .replace('</style>', '\n/* HyperFrames */ html,body{background:#000} #main{position:relative;width:1080px;height:1920px;overflow:hidden} #main canvas{width:100%;height:100%;margin:0}\n</style>')
  .replace(/<canvas id="c"[^>]*><\/canvas>/, `<div id="main" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1080" data-height="1920">
<canvas id="c" width="1080" height="1920"></canvas>${audio ? `
<audio id="suara" class="clip" src="audio.wav" data-start="0" data-track-index="1" data-volume="1"></audio>` : ''}
</div>`)
  .replace(/<\/body>/, `<script>
// Waktu video dipegang timeline GSAP milik HyperFrames; setiap seek menggambar frame lewat renderAt(t) dari dasar.js.
const TL_JSON = ${JSON.stringify(tl)};
window.__timelines = window.__timelines || {};
window.__lepasVideo();
window.ready.then(() => {
  setTL(TL_JSON);
  const jam = { t: 0 }, tl = gsap.timeline({ paused: true });
  tl.fromTo(jam, { t: 0 }, { t: ${dur}, duration: ${dur}, ease: 'none', onUpdate: () => renderAt(jam.t) }, 0);
  renderAt(0);
  window.__timelines["main"] = tl;
});
</script>
</body>`);
writeFileSync(resolve(out, 'index.html'), html);
console.log(`✓ ${nama}/hf/index.html (${dur} s, 1080x1920${audio ? ', dengan audio.wav' : ', TANPA suara: jalankan audio.py dulu kalau perlu'})`);
