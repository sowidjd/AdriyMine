// node render.mjs --sheet=1,5,9 [--out=sheet.jpg]   |   node render.mjs   (video-tanpa-suara.mp4 + cues.json)
// Uses timeline.json (narration timing) when it exists, else the page's estimate.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const here = new URL('.', import.meta.url).pathname, fps = 24;
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.log('page error:', e.message));
await page.goto(pathToFileURL(resolve(here, 'index.html')).href + '?render');
await page.evaluate(() => window.ready);
if (existsSync(resolve(here, 'timeline.json'))) await page.evaluate(tl => setTL(tl), JSON.parse(readFileSync(resolve(here, 'timeline.json'))));
const dur = await page.evaluate(() => TL.duration);
const frame = async t => { const u = await page.evaluate(t => renderAt(t), t); return Buffer.from(u.split(',')[1], 'base64'); };
if (args.sheet) {
  const ts = String(args.sheet).split(',').map(Number);
  for (const t of ts) writeFileSync(resolve(here, `still_${t}.jpg`), await frame(t));
  console.log('stills', ts.join(','), 'dur', dur.toFixed(1));
} else {
  writeFileSync(resolve(here, 'cues.json'), JSON.stringify(await page.evaluate(() => CUES)));
  const n = Math.round(dur * fps), out = resolve(here, 'video-tanpa-suara.mp4'), t0 = Date.now();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) { const b = await frame(i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 240 === 0) console.log(`frame ${i}/${n}`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out} (${dur.toFixed(1)} s) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
