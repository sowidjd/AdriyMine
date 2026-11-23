// Uji AI gratis SUNGGUHAN (butuh internet): file 450+ baris dengan 2 kesalahan.
const { chromium, devices } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
let code = "import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';\n\n";
for (let i = 0; i < 40; i++) {
  code += `const Adegan${i} = () => {\n  const frame = useCurrentFrame();\n  const o = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });\n`;
  if (i === 14) code += `  const gaya = { fontSize: 90 color: 'white' };\n`; else code += `  const gaya = { fontSize: 90, color: 'white' };\n`;
  if (i === 25) code += `  const latar = ambilWarna(${i});\n`; else code += `  const latar = 'hsl(${i * 9} 60% 30%)';\n`;
  code += `  return (\n    <AbsoluteFill style={{ background: latar, opacity: o, justifyContent: 'center', alignItems: 'center' }}>\n      <div style={gaya}>Adegan ${i + 1}</div>\n    </AbsoluteFill>\n  );\n};\n\n`;
}
code += `export const Panjang = () => (\n  <AbsoluteFill>\n${Array.from({ length: 40 }, (_, i) => `    <Sequence from={${i * 20}} durationInFrames={20}><Adegan${i} /></Sequence>`).join('\n')}\n  </AbsoluteFill>\n);\n`;
(async () => {
  const b = await chromium.launch(process.env.https_proxy ? { proxy: { server: process.env.https_proxy } } : {});
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  await page.click('.tabs button:nth-child(1)');
  await page.evaluate((t) => navigator.clipboard.writeText(t), code);
  await page.click('button:has-text("Tempel")');
  await page.click('.run');
  await page.waitForSelector('.issues', { timeout: 30000 });
  const n0 = await page.locator('.issues li').count();
  ok(`file ${code.split('\n').length} baris dengan 2 kesalahan tetap diputar`, await page.locator('.stage').isVisible(), `${n0} laporan`);
  await page.click('button:has-text("Perbaiki semuanya dengan AI")');
  const t0 = Date.now();
  let toast = '';
  try {
    await page.waitForFunction(() => (document.querySelector('.toast') && /Diperbaiki oleh/.test(document.querySelector('.toast').innerText)) || document.querySelector('.aibox.fail'), null, { timeout: 420000 });
    toast = await page.locator('.toast').innerText().catch(() => '');
  } catch { /* waktu habis */ }
  const fail = await page.locator('.aibox.fail').innerText().catch(() => '');
  const log = await page.evaluate(() => [...document.querySelectorAll('.attempts li')].map((l) => l.innerText.replace(/\n/g, ' ')).join(' | '));
  ok('AI gratis sungguhan memperbaiki', /Diperbaiki oleh/.test(toast), `${Math.round((Date.now() - t0) / 1000)} dtk · ${(toast || fail).replace(/\n/g, ' ').slice(0, 220)}`);
  const after = await page.inputValue('#kode');
  ok('kode tidak diringkas', after.split('\n').length >= code.split('\n').length - 2 && (after.match(/const Adegan\d+/g) || []).length === 40, `${after.split('\n').length} baris`);
  await page.waitForTimeout(2000);
  const n1 = await page.locator('.issues li').count();
  ok('laporan berkurang setelah diperbaiki', n1 < n0, `${n0} -> ${n1}`);
  console.log(res.join('\n'));
  if (log) console.log('percobaan:', log.slice(0, 600));
  await b.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
