// Pembantu uji: lompat ke posisi (0..1) di bilah waktu pemutar Remotion
module.exports = async function seek(page, frac) {
  const bar = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.stage div')].find((d) => { const r = d.getBoundingClientRect(); return getComputedStyle(d).cursor === 'pointer' && r.height >= 10 && r.height < 30 && r.width > 150; });
    if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!bar) return false;
  const x = bar.x + bar.w * frac, y = bar.y + bar.h / 2;
  await page.mouse.move(x, y - 40); await page.mouse.move(x, y);
  await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up();
  return true;
};
