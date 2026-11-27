// Render foto profil & banner Adriy World ke PNG. Jalankan dari folder repo: node projects/akun/render.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  // sajikan file repo lewat route (tanpa server terpisah)
  await p.route('http://akun.local/**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    r.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.js') ? 'text/javascript' : f.endsWith('.woff2') ? 'font/woff2' : 'text/html' }); });
  const out = { profil: 'foto-profil-adriy-world.png', banner: 'banner-youtube-adriy-world.png' };
  for (const m of Object.keys(out)) {
    await p.goto(`http://akun.local/projects/akun/akun.html?render&${m}`); await p.waitForFunction('window.done');
    const data = await p.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(path.join(__dirname, out[m]), Buffer.from(data, 'base64'));
    if (m === 'banner') console.log('lebar judul:', await p.evaluate('window.TW'));
  }
  await b.close();
})();
