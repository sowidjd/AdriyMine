// Tambalan kecil untuk @remotion/web-renderer: gradien radial dengan posisi/ukuran
// (mis. "circle at 50% 30%") ikut tergambar di video hasil ekspor, sama seperti di pratinjau.
// Aman dijalankan berulang kali.
import fs from 'node:fs';
import path from 'node:path';
const file = path.resolve(import.meta.dirname, '../node_modules/@remotion/web-renderer/dist/esm/index.mjs');
let s = fs.readFileSync(file, 'utf8');
if (s.includes('/*saku-radial*/')) { console.log('tambalan radial: sudah ada'); process.exit(0); }
const start = s.indexOf('    const radialMatch = /^radial-gradient\\((.*)\\)$/.exec(backgroundImage);');
const endMarker = '    const gradientInfo = parseLinearGradient(backgroundImage);';
const end = s.indexOf(endMarker, start);
if (start < 0 || end < 0) { console.error('tambalan radial: pola tidak ditemukan (versi web-renderer berubah?)'); process.exit(1); }
const patched = `    /*saku-radial*/
    const radialMatch = /^radial-gradient\\((.*)\\)$/.exec(backgroundImage);
    if (radialMatch) {
      const parts = radialMatch[1].split(/,(?![^(]*\\))/);
      const firstPart = parts[0].trim();
      const hasShape = parseLinearGradient(\`linear-gradient(\${firstPart})\`) === null;
      const m = /^(circle|ellipse)?\\s*(farthest-corner|closest-side|closest-corner|farthest-side)?\\s*(?:at\\s+(.+))?$/.exec(hasShape ? firstPart : "");
      if (!hasShape || m) {
        const stops = parseLinearGradient(\`linear-gradient(\${parts.slice(hasShape ? 1 : 0).join(",")})\`);
        if (stops) {
          const rect = getBackgroundImageRect({ backgroundPosition, backgroundSize, positioningArea: boundingRect, intrinsicSize: null });
          const w = rect.width, h = rect.height;
          const circle = !!(m && m[1] === "circle");
          const sizeKw = (m && m[2]) || "farthest-corner";
          const toks = ((m && m[3]) || "center").trim().split(/\\s+/);
          const val = (t, len) => t === "left" || t === "top" ? 0 : t === "right" || t === "bottom" ? len : t === "center" ? len / 2 : t.endsWith("%") ? parseFloat(t) / 100 * len : t.endsWith("px") ? parseFloat(t) : len / 2;
          let tx = toks[0], ty = toks[1] ?? "center";
          if (toks.length === 1 && (tx === "top" || tx === "bottom")) { ty = tx; tx = "center"; }
          if (toks.length === 2 && (tx === "top" || tx === "bottom" || ty === "left" || ty === "right")) { const t = tx; tx = ty; ty = t; }
          const cx = val(tx, w), cy = val(ty, h);
          const dxs = [cx, w - cx], dys = [cy, h - cy];
          const corners = [Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)];
          let rx, ry;
          if (circle) {
            rx = ry = sizeKw === "closest-side" ? Math.min(...dxs, ...dys) : sizeKw === "farthest-side" ? Math.max(...dxs, ...dys) : sizeKw === "closest-corner" ? Math.min(...corners) : Math.max(...corners);
          } else if (sizeKw === "closest-side") { rx = Math.min(...dxs); ry = Math.min(...dys); }
          else if (sizeKw === "farthest-side") { rx = Math.max(...dxs); ry = Math.max(...dys); }
          else if (sizeKw === "closest-corner") { rx = Math.min(...dxs) * Math.SQRT2; ry = Math.min(...dys) * Math.SQRT2; }
          else { rx = Math.max(...dxs) * Math.SQRT2; ry = Math.max(...dys) * Math.SQRT2; }
          if (rx > 0 && ry > 0 && w > 0 && h > 0) {
            const canvas = new OffscreenCanvas(Math.ceil(w), Math.ceil(h));
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get radial gradient context");
            ctx.translate(cx, cy);
            ctx.scale(rx, ry);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
            for (const stop of stops.colorStops) gradient.addColorStop(Math.min(1, Math.max(0, stop.position)), stop.color);
            ctx.fillStyle = gradient;
            ctx.fillRect(-cx / rx, -cy / ry, w / rx, h / ry);
            const pattern = contextToDraw.createPattern(canvas, "no-repeat");
            pattern?.setTransform(new DOMMatrix().translate(rect.left - offsetLeft, rect.top - offsetTop));
            return pattern;
          }
        }
      }
    }
`;
s = s.slice(0, start) + patched + s.slice(end);
fs.writeFileSync(file, s);
console.log('tambalan radial: dipasang');
