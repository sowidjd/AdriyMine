// Pembantu uji: lompat ke posisi (0..1) di bilah waktu pemutar Remotion. Diulang sampai waktunya berubah.
module.exports = async function seek(page, frac) {
  const timeText = () => page.evaluate(() => (document.querySelector('.stage').innerText.match(/\d+:\d\d(:\d\d)? \/ /) || [''])[0]);
  const before = await timeText();
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.waitForTimeout(700);
    const bar = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.stage div')].find((d) => { const r = d.getBoundingClientRect(); return getComputedStyle(d).cursor === 'pointer' && r.height >= 10 && r.height < 30 && r.width > 150; });
      if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!bar) continue;
    const x = bar.x + bar.w * frac, y = bar.y + bar.h / 2;
    await page.mouse.move(x, y - 60); await page.mouse.move(x, y);
    await page.mouse.down(); await page.waitForTimeout(100); await page.mouse.up();
    await page.waitForTimeout(500);
    if ((await timeText()) !== before) return true;
  }
  return false;
};
