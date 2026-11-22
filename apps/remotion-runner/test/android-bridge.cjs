// Uji jalur APK: meniru window.SakuAndroid seperti MainActivity.java
const { chromium, devices } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const html = fs.readFileSync(path.resolve(__dirname, '../dist/remotion-saku.html'));
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(html); }).listen(0);
const URL_ = `http://localhost:${srv.address().port}/index.html`;
const SHARED = `import { AbsoluteFill, useCurrentFrame } from 'remotion';
export const DariWA = () => { const f = useCurrentFrame(); return <AbsoluteFill style={{background:'radial-gradient(circle at 30% 20%, #ff5e7e, #1b1036 70%)', color:'white', fontSize:120, justifyContent:'center', alignItems:'center'}}>Bagikan {f}</AbsoluteFill>; };
export const durationInFrames = 30;`;
const CLIP = `import { AbsoluteFill } from 'remotion';\nexport const DariClipboard = () => <AbsoluteFill style={{background:'teal'}} />;`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(({ SHARED, CLIP }) => {
    const files = {}; let n = 0; let shared = SHARED;
    window.__saved = [];
    window.SakuAndroid = {
      readClipboard: () => CLIP,
      takeSharedText: () => { const t = shared; shared = null; return t; },
      keepScreenOn: (on) => { window.__screen = on; },
      openUrl: () => {},
      beginFile: (name, mime) => { const id = 'f' + (++n); files[id] = { name, mime, parts: [] }; return id; },
      appendChunk: (id, b64) => { files[id].parts.push(atob(b64).length); return true; },
      finishFile: (id) => { const f = files[id]; window.__saved.push({ name: f.name, mime: f.mime, bytes: f.parts.reduce((a, c) => a + c, 0) }); return 'Movies/Remotion Saku/' + f.name; },
      shareLast: () => true,
    };
  }, { SHARED, CLIP });
  const page = await ctx.newPage();
  const res = [];
  const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  page.on('pageerror', (e) => res.push('PAGEERROR ' + e.message));
  await page.goto(URL_);
  await page.waitForTimeout(1500);
  const code = await page.inputValue('#kode');
  ok('menerima kode yang dibagikan dari aplikasi lain', code.includes('DariWA'));
  await page.click('.run');
  await page.waitForSelector('.stage');
  await page.click('.tabs button:nth-child(3)');
  await page.click('.seg button:has-text("50% (cepat)")');
  await page.click('button:has-text("Buat video")');
  await page.waitForSelector('.sheet video', { timeout: 300000 });
  const blobSize = await page.evaluate(async () => (await (await fetch(document.querySelector('.sheet video').src)).blob()).size);
  ok('layar tetap menyala saat render lalu dilepas', (await page.evaluate(() => window.__screen)) === false);
  await page.click('.sheet button:has-text("Simpan ke HP")');
  await page.waitForFunction(() => window.__saved.length > 0, null, { timeout: 30000 });
  const saved = await page.evaluate(() => window.__saved[0]);
  ok('simpan video lewat jembatan Android (utuh)', saved.bytes === blobSize && saved.name.endsWith('.mp4'), JSON.stringify(saved) + ' blob=' + blobSize);
  const b64 = await page.evaluate(async () => { const bl = await (await fetch(document.querySelector('.sheet video').src)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(bl); }); });
  if (process.env.SHOTS) fs.writeFileSync(process.env.SHOTS + '/radial.mp4', Buffer.from(b64, 'base64'));
  await page.click('.sheet button[aria-label="Tutup pratinjau"]');
  ok('pratinjau hasil bisa ditutup', !(await page.$('.sheet')));
  await page.click('.tabs button:nth-child(1)');
  await page.click('button:has-text("Tempel")');
  await page.waitForTimeout(300);
  ok('tombol Tempel membaca clipboard HP', (await page.inputValue('#kode')).includes('DariClipboard'));
  console.log(res.join('\n'));
  await b.close(); srv.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
