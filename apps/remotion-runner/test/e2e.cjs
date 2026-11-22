// Uji otomatis: node test/e2e.cjs  (butuh Playwright + Chromium)
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const OUT = process.env.SHOTS || path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const CASES = {
  multiRoot: `// src/index.ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);

// src/Root.tsx
import React from 'react';
import { Composition, Folder } from 'remotion';
import { z } from 'zod';
import { Main, mainSchema } from './components/Main';
export const RemotionRoot: React.FC = () => (
  <Folder name="Video">
    <Composition id="Utama" component={Main} schema={mainSchema} durationInFrames={90} fps={30} width={1080} height={1920}
      defaultProps={{ title: 'Halo Transisi' }}
      calculateMetadata={async ({ props }) => ({ durationInFrames: 120, props: { ...props, title: props.title + '!' } })} />
    <Composition id="Kedua" component={Main} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{ title: 'B' }} />
  </Folder>
);

// src/components/Main.tsx
import { AbsoluteFill, useCurrentFrame, Img, staticFile } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Circle } from '@remotion/shapes';
import { loadFont } from '@remotion/google-fonts/BebasNeue';
import { z } from 'zod';
const { fontFamily } = loadFont();
export const mainSchema = z.object({ title: z.string() });
type Props = z.infer<typeof mainSchema>;
const Scene = ({ c, t }: { c: string; t: string }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: c, justifyContent: 'center', alignItems: 'center', fontFamily, fontSize: 150, color: 'white' }}>
    <Circle radius={100 + f} fill="rgba(255,255,255,.2)" />{t}</AbsoluteFill>;
};
export const Main: React.FC<Props> = ({ title }) => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}><Scene c="#c0392b" t={title} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={75}><Scene c="#2c3e50" t="Dua" /></TransitionSeries.Sequence>
  </TransitionSeries>
);`,
  fenced: "Berikut kodenya:\n\n**Komposisi.tsx**\n```tsx\nimport { AbsoluteFill, useCurrentFrame } from 'remotion';\nexport default function Komposisi() {\n  const f = useCurrentFrame();\n  return <AbsoluteFill style={{background:'navy', color:'white', fontSize:90}}>Frame {f}</AbsoluteFill>;\n}\n```\n\nJalankan dengan:\n```bash\nnpx remotion studio\n```\n",
  syntax: `import { AbsoluteFill } from 'remotion';\nexport const A = () => {\n  return <AbsoluteFill style={{background:'red'}}>\n    <div>halo</div>\n  </AbsoluteFill>;\n// kurung kurawal hilang\n`,
  runtime: `import { AbsoluteFill, useCurrentFrame } from 'remotion';\nexport const Rusak = () => {\n  const f = useCurrentFrame();\n  const data: any = null;\n  return <AbsoluteFill>{data.judul}</AbsoluteFill>;\n};\n`,
  missingImport: `import { AbsoluteFill } from 'remotion';\nexport const X = () => {\n  const f = useCurrentFrame();\n  return <AbsoluteFill>{f}</AbsoluteFill>;\n};\n`,
};
// Kode sangat panjang: 400 komponen, ~4000 baris
let long = "import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';\n";
for (let i = 0; i < 400; i++) long += `\nconst S${i} = () => {\n  const f = useCurrentFrame();\n  const o = interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' });\n  // adegan ${i}\n  return (\n    <AbsoluteFill style={{ background: 'hsl(${i % 360} 60% 40%)', opacity: o, color: 'white', fontSize: 80 }}>Adegan ${i}</AbsoluteFill>\n  );\n};\n`;
long += `\nexport const Panjang = () => (<AbsoluteFill>${Array.from({ length: 400 }, (_, i) => `<Sequence from={${i * 3}} durationInFrames={3}><S${i} /></Sequence>`).join('')}</AbsoluteFill>);\n`;
CASES.long = long;

(async () => {
  const browser = await chromium.launch(process.env.https_proxy ? { proxy: { server: process.env.https_proxy } } : {});
  const ctx = await browser.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console ' + m.text()); });
  const results = [];
  const ok = (name, cond, extra = '') => { results.push(`${cond ? 'LULUS' : 'GAGAL'}  ${name} ${extra}`); };

  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  await page.waitForTimeout(800);
  ok('contoh bawaan otomatis jalan', await page.locator('.stage').isVisible());
  await page.screenshot({ path: OUT + '/1-putar.png' });

  const pasteRun = async (text) => {
    await page.click('.tabs button:nth-child(1)');
    await page.evaluate((t) => navigator.clipboard.writeText(t), text);
    await page.click('text=Tempel');
    await page.waitForTimeout(150);
    await page.click('.run');
    await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 30000 });
    await page.waitForTimeout(700);
  };
  const visibleText = () => page.evaluate(() => [...document.querySelectorAll('.pane:not([hidden])')].map((p) => p.innerText).join('\n'));

  await pasteRun(CASES.multiRoot);
  let t = await visibleText();
  ok('banyak file + registerRoot + Composition + calculateMetadata', /Utama/.test(t) && /4 dtk/.test(t) && await page.locator('.stage').isVisible(), JSON.stringify(t.slice(0, 160)));
  ok('pilih video kedua tersedia', (await page.locator('#pilihvideo option').count()) === 2);
  await page.screenshot({ path: OUT + '/2-multi.png' });

  await pasteRun(CASES.fenced);
  t = await visibleText();
  ok('blok markdown ``` dibersihkan', /Komposisi/.test(t) && await page.locator('.stage').isVisible(), JSON.stringify(t.slice(0, 120)));

  await pasteRun(CASES.syntax);
  t = await visibleText();
  ok('error sintaks tampil ramah', /belum bisa dibaca/.test(t) && /baris \d+/.test(t), JSON.stringify(t.slice(0, 200)));
  await page.screenshot({ path: OUT + '/3-error.png' });

  await pasteRun(CASES.missingImport);
  await page.waitForTimeout(500);
  t = await visibleText();
  ok('lupa import -> otomatis tersedia, tanpa error', !/error/i.test(t) && await page.locator('.stage').isVisible(), JSON.stringify(t.slice(0, 120)));

  // Rapikan (Prettier offline)
  await page.click('.tabs button:nth-child(1)');
  await page.evaluate((t) => navigator.clipboard.writeText(t), "import {AbsoluteFill} from 'remotion'\nexport const R=()=>{return <AbsoluteFill style={{background:'red'}}><div>hai</div></AbsoluteFill>}");
  await page.click('text=Tempel');
  await page.click('button:has-text("Rapikan")');
  await page.waitForTimeout(2500);
  const tidied = await page.inputValue('#kode');
  ok('tombol Rapikan', tidied.includes("style={{ background: 'red' }}") && tidied.split('\n').length > 4, JSON.stringify(tidied.slice(0, 120)));

  // AI memperbaiki error sintaks (memanggil AI gratis sungguhan)
  if (!process.env.NO_AI) {
    await pasteRun(CASES.syntax);
    await page.click('button:has-text("Perbaiki dengan AI")');
    const tAi = Date.now();
    try {
      await page.waitForFunction(() => document.querySelector('.stage') && !document.querySelector('.pane:not([hidden]) .card.err') && !document.querySelector('.aibox'), null, { timeout: 300000 });
      const toast = await page.locator('.toast').innerText().catch(() => '');
      ok('AI gratis memperbaiki error', true, `${Math.round((Date.now() - tAi) / 1000)} dtk · ${toast.slice(0, 160)}`);
    } catch {
      ok('AI gratis memperbaiki error', false, (await visibleText()).slice(0, 500));
    }
    await page.screenshot({ path: OUT + '/6-ai.png' });
  }

  await pasteRun(CASES.runtime);
  await page.waitForTimeout(800);
  t = await visibleText();
  ok('error saat diputar tidak membuat aplikasi crash', /error/i.test(t) && await page.locator('.tabs').isVisible(), JSON.stringify(t.slice(0, 200)));
  await page.screenshot({ path: OUT + '/4-runtime.png' });

  // Tempel sungguhan lewat keyboard (event paste) ke kolom kosong: 20.000+ baris
  let huge = CASES.long;
  while (huge.split('\n').length < 20000) huge += '\n' + CASES.long.replace(/\bS(\d+)\b/g, (m, d) => 'S' + d + '_' + huge.length).replace(/export const Panjang/, 'export const Panjang' + huge.length);
  await page.click('.tabs button:nth-child(1)');
  await page.click('button:has-text("Kosongkan")'); await page.click('button:has-text("Yakin")');
  await page.evaluate((t) => navigator.clipboard.writeText(t), huge);
  await page.focus('#kode');
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(800);
  const pastedLen = (await page.inputValue('#kode')).length;
  const tH = Date.now();
  await page.click('.run');
  await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 60000 });
  await page.waitForTimeout(500);
  t = await visibleText();
  ok(`tempel sungguhan ${huge.split('\n').length} baris (${(huge.length / 1e6).toFixed(1)} MB)`, pastedLen >= huge.length - 5 && await page.locator('.stage').isVisible(), `${Date.now() - tH}ms`);

  const t0 = Date.now();
  await pasteRun(CASES.long);
  t = await visibleText();
  ok(`kode panjang (${CASES.long.split('\n').length} baris)`, /Panjang/.test(t) && await page.locator('.stage').isVisible(), `${Date.now() - t0}ms`);

  // 3D
  await page.click('.tabs button:nth-child(1)');
  await page.click('summary:has-text("Contoh")');
  await page.click('button:has-text("3D (Three.js)")');
  await page.click('.run');
  await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = document.querySelector('.stage button'); }); 
  const has3d = await page.evaluate(() => !!document.querySelector('.stage canvas'));
  t = await visibleText();
  ok('3D tampil (ThreeCanvas + drei)', has3d && !/error/i.test(t), JSON.stringify(t.slice(0, 100)));
  await page.screenshot({ path: OUT + '/7-3d.png' });
  await page.click('.tabs button:nth-child(3)');
  await page.click('.seg button:has-text("50%")');
  await page.click('text=Buat video');
  try {
    await page.waitForSelector('text=Video siap', { timeout: 240000 });
    const b64 = await page.evaluate(async () => { const v = document.querySelector('video.result'); const b = await (await fetch(v.src)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(b); }); });
    fs.writeFileSync(OUT + '/3d.mp4', Buffer.from(b64, 'base64'));
    ok('ekspor video 3D', true, (await page.locator('.pane:not([hidden]) .card:last-of-type .muted').first().innerText()));
  } catch (e) { ok('ekspor video 3D', false, (await visibleText()).slice(0, 300)); }
  await page.click('.tabs button:nth-child(1)');

  // Ekspor video pendek
  await pasteRun(`import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
export const Pendek = () => { const f = useCurrentFrame(); return <AbsoluteFill style={{ background: '#123', justifyContent:'center', alignItems:'center' }}>
<div style={{ width: 300, height: 300, borderRadius: 40, background: 'orange', transform: \`rotate(\${f*6}deg)\`, opacity: interpolate(f,[0,30],[0.3,1]) }} /></AbsoluteFill>; };
export const durationInFrames = 45;`);
  await page.click('.tabs button:nth-child(3)');
  await page.click('.seg button:has-text("50%")');
  await page.click('text=Buat video');
  try {
    await page.waitForSelector('text=Video siap', { timeout: 120000 });
    const info = await page.locator('.pane:not([hidden]) .card:last-of-type .muted').first().innerText();
    ok('ekspor video di browser', true, info);
    await page.screenshot({ path: OUT + '/5-ekspor.png' });
  } catch (e) {
    ok('ekspor video di browser', false, (await visibleText()).slice(0, 400));
  }
  console.log(results.join('\n'));
  console.log('--- log browser ---\n' + logs.slice(0, 20).join('\n'));
  await browser.close();
  process.exit(results.some((r) => r.startsWith('GAGAL')) ? 1 : 0);
})();
