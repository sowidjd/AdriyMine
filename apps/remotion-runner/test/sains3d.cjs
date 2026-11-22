// Uji contoh 3D sains: pratinjau, cuplikan, ekspor + pratinjau hasil
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../dist/remotion-saku.html');
const OUT = process.env.SHOTS || path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ ...devices['Pixel 7'] })).newPage();
  const logs = []; page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
  const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'LULUS' : 'GAGAL'}  ${n} ${x}`);
  await page.goto(FILE);
  await page.waitForSelector('.stage', { timeout: 30000 });
  await page.click('.tabs button:nth-child(1)');
  await page.click('summary:has-text("Contoh")');
  await page.click('button:has-text("penampang Bumi")');
  await page.click('.run');
  await page.waitForFunction(() => !document.querySelector('.run.busy'), null, { timeout: 30000 });
  await page.waitForTimeout(3000);
  const t = await page.evaluate(() => document.querySelector('.pane:not([hidden])').innerText);
  ok('3D sains tampil tanpa error', !/error/i.test(t) && await page.evaluate(() => !!document.querySelector('.stage canvas')), t.slice(0, 80).replace(/\n/g, ' '));
  await page.click('.tabs button:nth-child(3)');
  await page.click('summary:has-text("Cek cuplikan")');
  await page.fill('#frame-cek', '240').catch(() => {});
  await page.evaluate(() => { const r = document.querySelector('#frame-cek'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '240'); r.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('button:has-text("Lihat cuplikan")');
  await page.waitForSelector('img.still', { timeout: 120000 }).catch(() => {});
  const still = await page.evaluate(async () => { const i = document.querySelector('img.still'); if (!i) return null; const bl = await (await fetch(i.src)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(bl); }); });
  if (still) fs.writeFileSync(OUT + '/sains-still.jpg', Buffer.from(still, 'base64'));
  ok('cuplikan hasil ekspor (frame 240)', !!still);
  if (!process.env.NO_EXPORT) {
    await page.click('.seg button:has-text("50%")');
    await page.click('button:has-text("Buat video")');
    try {
      const tick = setInterval(async () => { try { console.log('  kemajuan:', (await page.evaluate(() => (document.querySelector('.prog-row') || {}).innerText || '')).replace(/\n/g, ' ')); } catch {} }, 60000);
      await page.waitForSelector('.sheet video, .card.err.inner', { timeout: 2400000 });
      clearInterval(tick);
      if (!(await page.$('.sheet video'))) throw new Error(await page.locator('.card.err.inner').innerText());
      ok('pratinjau hasil terbuka otomatis setelah render', true, await page.locator('.sheet-info').innerText());
      await page.waitForTimeout(1500);
      await page.screenshot({ path: OUT + '/sains-sheet.png' });
      const b64 = await page.evaluate(async () => { const v = document.querySelector('.sheet video'); const bl = await (await fetch(v.src)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(bl); }); });
      fs.writeFileSync(OUT + '/sains.mp4', Buffer.from(b64, 'base64'));
    } catch { ok('pratinjau hasil terbuka otomatis setelah render', false, (await page.evaluate(() => document.querySelector('.pane:not([hidden])').innerText)).slice(0, 300)); }
  }
  console.log(res.join('\n')); console.log(logs.slice(0, 8).join('\n'));
  await b.close();
  process.exit(res.some((r) => !r.startsWith('LULUS')) ? 1 : 0);
})();
