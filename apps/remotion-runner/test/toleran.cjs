// Uji mode toleran: kode dengan 1-2 kesalahan tetap memutar animasi.
const { chromium, devices } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const OK = "<div style={{ fontSize: 120, color: 'white' }}>SELAMAT</div>";
const CASES = {
  'baris salah di tengah + koma hilang': `import { AbsoluteFill, useCurrentFrame } from 'remotion';
export const A = () => {
  const frame = useCurrentFrame();
  const gaya = { background: 'navy' color: 'white' };
  const x = ;
  return <AbsoluteFill style={gaya}>${OK}</AbsoluteFill>;
};`,
  'kode terpotong di akhir': `import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
export const B = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: 'teal', opacity: Math.max(0.5, o) }}>
      ${OK}
    </AbsoluteFill>
  );`,
  'komponen & fungsi tidak dikenal': `import { AbsoluteFill } from 'remotion';
export const C = () => {
  const n = hitungSkor(5);
  return <AbsoluteFill style={{ background: 'purple' }}><JudulKeren teks="x" />${OK}<Ikon.Bintang /></AbsoluteFill>;
};`,
  'satu komponen error saat diputar': `import { AbsoluteFill } from 'remotion';
const Rusak = () => { const data: any = null; return <div>{data.judul}</div>; };
export const D = () => <AbsoluteFill style={{ background: 'maroon' }}><Rusak />${OK}</AbsoluteFill>;`,
  'import file & paket yang tidak ada': `import { AbsoluteFill } from 'remotion';
import { Latar } from './TidakAda';
import gila from 'paket-yang-tidak-pernah-ada-xyz';
export const E = () => <AbsoluteFill style={{ background: 'darkgreen' }}><Latar />${OK}</AbsoluteFill>;`,
  'error di bagian atas file': `import { AbsoluteFill } from 'remotion';
const cfg = JSON.parse('{rusak');
export const F = () => <AbsoluteFill style={{ background: 'black' }}>${OK}</AbsoluteFill>;`,
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  const res = [];
  for (const [name, code] of Object.entries(CASES)) {
    await page.click('.tabs button:nth-child(1)');
    await page.evaluate((t) => navigator.clipboard.writeText(t), code);
    await page.click('button:has-text("Tempel")');
    await page.click('.run');
    await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 60000 });
    await page.waitForTimeout(1200);
    const st = await page.evaluate(() => ({ stage: document.querySelector('.stage')?.innerText || '', tab: document.querySelector('.tabs .on')?.innerText, issues: [...document.querySelectorAll('.issues li')].map((l) => l.innerText.replace(/\n/g, ' ')) }));
    const pass = /SELAMAT/.test(st.stage);
    res.push(`${pass ? 'LULUS' : 'GAGAL'}  ${name} → ${st.issues.length} laporan${st.issues.length ? ': ' + st.issues.slice(0, 3).join(' | ').slice(0, 260) : ''}${pass ? '' : ' | stage=' + st.stage.slice(0, 80) + ' tab=' + st.tab}`);
  }
  console.log(res.join('\n'));
  if (errs.length) console.log('PAGEERROR:', errs.slice(0, 3).join(' / '));
  await b.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
