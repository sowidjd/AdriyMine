// Uji video sangat panjang (32,5 menit, 130 adegan) + ganti rasio + ekspor per bagian
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const OUT = process.env.SHOTS || path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const SCENES = 130, PER = 450; // 15 detik @30fps
let code = "// src/Root.tsx\nimport { Composition } from 'remotion';\nimport { Kuliah } from './Kuliah';\n";
code += `export const RemotionRoot = () => <Composition id="KuliahPanjang" component={Kuliah} durationInFrames={${SCENES * PER}} fps={30} width={1080} height={1920} />;\n\n// src/Kuliah.tsx\n`;
code += "import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';\n";
for (let i = 0; i < SCENES; i++) {
  code += `
const Adegan${i} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const masuk = spring({ frame, fps, config: { damping: 14 } });
  const geser = interpolate(frame, [0, ${PER}], [0, -200]);
  const poin = ['Poin pertama adegan ${i + 1}', 'Poin kedua adegan ${i + 1}', 'Poin ketiga adegan ${i + 1}'];
  return (
    <AbsoluteFill style={{ background: 'hsl(${(i * 37) % 360} 55% 18%)', padding: 90, justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ fontSize: 110, fontWeight: 900, color: 'white', transform: \`scale(\${masuk}) translateX(\${geser}px)\` }}>Bab ${i + 1}</div>
      {poin.map((p, k) => (
        <div key={k} style={{ fontSize: 54, color: '#dde6f3', marginTop: 30, opacity: interpolate(frame, [30 + k * 40, 50 + k * 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{p}</div>
      ))}
    </AbsoluteFill>
  );
};
`;
}
code += `\nexport const Kuliah = () => (\n  <AbsoluteFill>\n${Array.from({ length: SCENES }, (_, i) => `    <Sequence from={${i * PER}} durationInFrames={${PER}}><Adegan${i} /></Sequence>`).join('\n')}\n  </AbsoluteFill>\n);\n`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const logs = []; page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  await page.click('.tabs button:nth-child(1)');
  await page.evaluate((t) => navigator.clipboard.writeText(t), code);
  await page.click('button:has-text("Tempel")');
  const t0 = Date.now();
  await page.click('.run');
  await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 60000 });
  await page.waitForTimeout(800);
  let t = await page.evaluate(() => document.querySelector('.pane:not([hidden])').innerText);
  ok(`kode ${code.split('\n').length} baris, video ${SCENES * PER / 30 / 60} menit dijalankan`, /32 mnt 30 dtk/.test(t) && await page.locator('.stage').isVisible(), `${Date.now() - t0}ms`);
  // Lompat ke dekat akhir video lewat bilah waktu pemutar
  await require('./seek.js')(page, 0.995); await page.waitForTimeout(1500);
  t = await page.evaluate(() => document.querySelector('.stage').innerText);
  ok('lompat ke menit terakhir (Bab 130 tampil)', /Bab 130/.test(t), t.replace(/\n/g, ' ').slice(0, 80));
  await page.screenshot({ path: OUT + '/panjang-akhir.png' });
  // Ganti rasio ke YouTube 16:9 (mode Pas)
  await page.click('.fmt-chip:has-text("YouTube")');
  await page.waitForTimeout(800);
  const ar = await page.evaluate(() => { const r = document.querySelector('.stage').getBoundingClientRect(); return +(r.width / r.height).toFixed(3); });
  t = await page.evaluate(() => document.querySelector('.pane:not([hidden])').innerText);
  ok('rasio YouTube 16:9 diterapkan ke pratinjau', Math.abs(ar - 16 / 9) < 0.02 && /1920×1080/.test(t), 'rasio=' + ar);
  await page.screenshot({ path: OUT + '/rasio-youtube.png' });
  // Ekspor per bagian 5 menit: tunggu bagian pertama selesai, lalu batalkan
  await page.click('.tabs button:nth-child(3)');
  await page.click('.seg button:has-text("50%")');
  await page.click('.seg button:has-text("5 mnt")');
  const btn = await page.locator('button:has-text("file video")').innerText();
  ok('pilihan dibagi per 5 menit', /Buat 7 file video/.test(btn), btn);
  await page.click('button:has-text("file video")');
  const tr = Date.now();
  try {
    await page.waitForSelector('.results li', { timeout: 1500000 });
    const name = await page.locator('.results li b').first().innerText();
    const b64 = await page.evaluate(async () => { const v = document.querySelector('.results video'); const bl = await (await fetch(v.src.split('#')[0])).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(bl); }); });
    fs.writeFileSync(OUT + '/bagian1.mp4', Buffer.from(b64, 'base64'));
    ok('bagian 1 dari 7 selesai', /bagian-01/.test(name), `${name} · ${Math.round((Date.now() - tr) / 1000)} dtk`);
    await page.click('button:has-text("Batalkan")').catch(() => {});
  } catch (e) { ok('bagian 1 dari 7 selesai', false, e.message.slice(0, 120)); }
  console.log(res.join('\n')); console.log(logs.slice(0, 5).join('\n'));
  await b.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
