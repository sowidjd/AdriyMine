// node render.mjs [--sheet=1,3,6] [--out=video.mp4]  (juga menulis cues.json untuk audio.py)   (butuh Playwright + ffmpeg)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;
const here = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.log('page error:', e.message));
await page.goto(pathToFileURL(resolve(here, 'index.html')).href + '?render');
const frame = async t => { const url = await page.evaluate(t => window.renderAt(t), t); return Buffer.from(url.split(',')[1], 'base64'); };

if (args.sheet) {
  for (const t of String(args.sheet).split(',').map(Number)) writeFileSync(resolve(here, `still_${t}.jpg`), await frame(t));
} else {
  const fps = 30, n = Math.round((await page.evaluate(() => window.DUR)) * fps), out = resolve(here, args.out || 'video-tanpa-suara.mp4');
  writeFileSync(resolve(here, 'cues.json'), JSON.stringify(await page.evaluate(() => window.CUES)));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) { const b = await frame(i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await browser.close();
