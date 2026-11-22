// Uji router AI: penyedia pertama kuota habis, kedua rusak, ketiga berhasil.
const { chromium, devices } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const BROKEN = "import { AbsoluteFill } from 'remotion';\nexport const A = () => {\n  return <AbsoluteFill style={{background:'red'}}>\n    <div>halo</div>\n  </AbsoluteFill>;\n";
const FIXED = "import { AbsoluteFill } from 'remotion';\nexport const A = () => {\n  return (\n    <AbsoluteFill style={{ background: 'red' }}>\n      <div>halo</div>\n    </AbsoluteFill>\n  );\n};\n";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(({ FIXED }) => {
    window.__calls = [];
    const real = window.fetch.bind(window);
    window.fetch = async (url, opts) => {
      const u = String(url);
      const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...h } });
      if (u.includes('text.pollinations.ai')) { window.__calls.push('pollinations'); return json({ error: { message: 'Rate limit exceeded' } }, 429, { 'retry-after': '600' }); }
      if (u.includes('gen.pollinations.ai')) { window.__calls.push('pollinations-gen'); return json({ error: 'server down' }, 503); }
      if (u.includes('api.llm7.io')) {
        const body = JSON.parse(opts.body);
        window.__calls.push('llm7:' + body.model);
        if (body.model === 'default') return json({ error: { message: 'model not found' } }, 404);
        return json({ choices: [{ message: { content: 'Ini perbaikannya:\n```tsx\n' + FIXED + '```\nMenambahkan kurung kurawal penutup.' } }] });
      }
      return real(url, opts);
    };
  }, { FIXED });
  const page = await ctx.newPage();
  const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  await page.click('.tabs button:nth-child(1)');
  await page.evaluate((t) => navigator.clipboard.writeText(t), BROKEN);
  await page.click('text=Tempel');
  await page.click('.run');
  await page.waitForSelector('button:has-text("Perbaiki dengan AI")');
  await page.click('button:has-text("Perbaiki dengan AI")');
  await page.waitForFunction(() => !document.querySelector('.aibox') && document.querySelector('.toast'), null, { timeout: 60000 });
  const toast = await page.locator('.toast').innerText();
  const calls = await page.evaluate(() => window.__calls);
  ok('pindah otomatis: kuota habis -> rusak -> model lain -> berhasil', /LLM7/.test(toast) && calls.join(',') === 'pollinations,pollinations-gen,llm7:default,llm7:fast', calls.join(',') + ' | ' + toast.replace(/\n/g, ' '));
  ok('kode diganti hasil AI', (await page.inputValue('#kode')).includes('</AbsoluteFill>\n    );') || (await page.inputValue('#kode')).includes(');\n};'));
  await page.click('.tabs button:nth-child(4)');
  await page.click('summary:has-text("AI gratis")');
  await page.waitForTimeout(800);
  const panel = await page.locator('.prov').innerText();
  ok('Pollinations ditandai istirahat (kuota habis)', /Pollinations\s*\n?\s*istirahat/.test(panel), panel.split('\n').slice(0, 6).join(' | '));
  // kedua kali: Pollinations dilewati karena masih istirahat
  await page.evaluate(() => { window.__calls = []; });
  await page.click('.tabs button:nth-child(1)');
  await page.evaluate((t) => navigator.clipboard.writeText(t), BROKEN);
  await page.click('text=Tempel'); await page.click('.run');
  await page.waitForSelector('button:has-text("Perbaiki dengan AI")'); await page.click('button:has-text("Perbaiki dengan AI")');
  await page.waitForFunction(() => !document.querySelector('.aibox') && document.querySelector('.toast'), null, { timeout: 60000 });
  const calls2 = await page.evaluate(() => window.__calls);
  ok('penyedia yang kuotanya habis tidak dicoba lagi sementara', !calls2.includes('pollinations'), calls2.join(','));
  await page.screenshot({ path: (process.env.SHOTS || '.') + '/8-ai-panel.png' });
  console.log(res.join('\n'));
  await b.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
