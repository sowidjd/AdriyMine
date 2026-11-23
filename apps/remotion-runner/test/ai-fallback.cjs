// Uji router AI: ramai ≠ habis, kode terlalu panjang -> model lain, jawaban meringkas ditolak, patch baris diterapkan.
const { chromium, devices } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const BROKEN = "import { AbsoluteFill } from 'remotion';\nexport const A = () => {\n  return <AbsoluteFill style={{background:'red'}}>\n    <div>halo</div>\n  </AbsoluteFill>;\n";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => {
    window.__calls = [];
    const real = window.fetch.bind(window);
    window.fetch = async (url, opts) => {
      const u = String(url);
      const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...h } });
      const body = opts && opts.body ? JSON.parse(opts.body) : {};
      if (u.endsWith('/models')) return json(u.includes('ovh') ? { data: [{ id: 'gpt-oss-120b', context_length: 131072 }] } : [{ name: 'openai', tier: 'anonymous' }, { name: 'openai-fast', tier: 'anonymous' }]);
      if (u.includes('text.pollinations.ai')) {
        window.__calls.push('pollinations:' + body.model);
        if (body.model === 'openai') return json({ error: { message: 'Rate limit exceeded. Please slow down.' } }, 429, { 'retry-after': '600' });
        return json({ error: { message: 'This model maximum context length is 8192 tokens' } }, 400);
      }
      if (u.includes('api.llm7.io')) {
        window.__calls.push('llm7:' + body.model);
        return json({ choices: [{ message: { content: 'GANTI 1-6\n// ... sisanya sama\nSELESAI' } }] });
      }
      if (u.includes('kepler.ai.cloud.ovh.net')) {
        window.__calls.push('ovh:' + body.model);
        return json({ choices: [{ message: { content: 'GANTI 5-5\n  </AbsoluteFill>;\n};\nSELESAI\nMenambahkan penutup fungsi.' } }] });
      }
      return real(url, opts);
    };
  });
  const page = await ctx.newPage();
  const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  await page.click('.tabs button:nth-child(1)');
  await page.evaluate((t) => navigator.clipboard.writeText(t), BROKEN);
  await page.click('button:has-text("Tempel")');
  await page.click('.run');
  await page.waitForSelector('.issues', { timeout: 30000 });
  ok('kode salah tetap diputar + laporan muncul', await page.locator('.stage').isVisible());
  await page.click('button:has-text("Perbaiki semuanya dengan AI")');
  await page.waitForFunction(() => document.querySelector('.toast') && /Diperbaiki oleh/.test(document.querySelector('.toast').innerText), null, { timeout: 60000 }).catch(() => {});
  const toast = await page.locator('.toast').innerText().catch(() => '');
  const calls = await page.evaluate(() => window.__calls);
  ok('router pindah sendiri sampai berhasil', /OVHcloud/.test(toast), calls.join(',') + ' | ' + toast.replace(/\n/g, ' '));
  const code = await page.inputValue('#kode');
  ok('patch baris diterapkan, kode tidak diringkas', code.includes('</AbsoluteFill>;\n};') && code.includes("import { AbsoluteFill } from 'remotion';") && !code.includes('sisanya'), JSON.stringify(code.slice(-60)));
  ok('jawaban yang meringkas ditolak', calls.some((c) => c.startsWith('llm7')) && /OVHcloud/.test(toast));
  await page.waitForTimeout(1500);
  ok('setelah diperbaiki tidak ada laporan lagi', !(await page.$('.issues')));
  await page.click('.tabs button:nth-child(4)');
  await page.click('summary:has-text("AI gratis")');
  await page.waitForTimeout(800);
  const panel = await page.locator('.prov').innerText();
  ok('Pollinations "sedang ramai", bukan "kuota habis"', !/kuota habis/.test(panel) && /Pollinations\s*\n?\s*siap|ramai/.test(panel), panel.split('\n').slice(0, 8).join(' | '));
  console.log(res.join('\n'));
  await b.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
