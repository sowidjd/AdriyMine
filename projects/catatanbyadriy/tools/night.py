"""Membuat banner versi malam (tema gelap) dari banner siang:
banner_dash_night.png: langit malam, bulan bercahaya, bintang, kelelawar.
banner_ai_night.png:   langit malam, bulan, bintang, Adriy berbaju tidur & penutup mata tidur, "Zzz"."""
import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

IMG = sys.argv[1] if len(sys.argv) > 1 else 'www/img'
SS = 4  # supersampling untuk gambar vektor

def hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx

def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114

def grade(a):
    """Warna malam: bayangan biru tua, cahaya bulan biru-perak."""
    L = lum(a)[..., None]
    navy, mid, hi = np.array([.035, .06, .15]), np.array([.17, .27, .50]), np.array([.80, .86, .97])
    t = np.clip(L / .62, 0, 1)
    c = navy * (1 - t) + mid * t
    t2 = np.clip((L - .62) / .38, 0, 1)
    c = c * (1 - t2) + hi * t2
    return np.clip(c * .82 + a * .18 * .55, 0, 1)

def soft(mask, r=1.2): return np.asarray(Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(r)), dtype=float) / 255

def layer(size): return Image.new('RGBA', (size[0] * SS, size[1] * SS), (0, 0, 0, 0))

def down(l, size): return l.resize(size, Image.LANCZOS)

def moon(base, cx, cy, r):
    w, h = base.size
    glow = Image.new('RGBA', base.size, (0, 0, 0, 0)); d = ImageDraw.Draw(glow)
    for k, a in [(4.2, 26), (2.8, 45), (1.8, 70)]:
        d.ellipse([cx - r * k, cy - r * k, cx + r * k, cy + r * k], fill=(255, 244, 205, a))
    base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(r * 1.1)))
    l = layer(base.size); d = ImageDraw.Draw(l); s = SS
    d.ellipse([(cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s], fill=(250, 244, 222, 255))
    for ox, oy, rr in [(-.35, -.25, .22), (.3, .15, .28), (-.1, .45, .14), (.45, -.4, .1), (-.5, .2, .1)]:
        x, y, q = cx + ox * r, cy + oy * r, rr * r
        d.ellipse([(x - q) * s, (y - q) * s, (x + q) * s, (y + q) * s], fill=(226, 218, 190, 255))
    base.alpha_composite(down(l, base.size))

def stars(base, n, ok, seed):
    rnd = random.Random(seed); l = layer(base.size); d = ImageDraw.Draw(l); w, h = base.size; s = SS; placed = 0; tries = 0
    while placed < n and tries < n * 60:
        tries += 1; x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        if not ok(int(x), int(y)): continue
        r = rnd.choice([.55, .7, .9, 1.1, 1.5]); a = rnd.randint(150, 255)
        d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=(255, 255, 240, a))
        if r >= 1.1:  # bintang berkilau
            q = r * 3.2; d.line([((x - q) * s, y * s), ((x + q) * s, y * s)], fill=(255, 255, 240, a // 2), width=s)
            d.line([(x * s, (y - q) * s), (x * s, (y + q) * s)], fill=(255, 255, 240, a // 2), width=s)
        placed += 1
    base.alpha_composite(down(l, base.size))

BAT = [(0, -.28), (.06, -.42), (.1, -.26), (.2, -.3), (.42, -.42), (.7, -.4), (1, -.18), (.86, -.1), (.78, .04), (.64, -.02), (.55, .14), (.42, .05), (.3, .2), (.18, .06), (.08, .2), (0, .3)]
def bat(base, cx, cy, size, ang, col=(8, 11, 26, 255)):
    pts = BAT + [(-x, y) for x, y in reversed(BAT)]
    c, s_ = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    l = layer(base.size); d = ImageDraw.Draw(l)
    P = [((cx + (x * c - y * s_) * size) * SS, (cy + (x * s_ + y * c) * size) * SS) for x, y in pts]
    d.polygon(P, fill=col)
    base.alpha_composite(down(l, base.size))

def night_dash(src, out):
    im = Image.open(src).convert('RGB'); a = np.asarray(im, dtype=float) / 255; h, w = a.shape[:2]
    H, S, V = hsv(a); L = lum(a)
    yy, xx = np.mgrid[0:h, 0:w]
    text = (L > .80) & (S < .18) & (xx > 140) & (xx < 640) & (yy > 20) & (yy < 135)
    keep = soft(text.astype(float), .6)[..., None]
    g = grade(a); outa = g * (1 - keep) + np.clip(a * 1.0, 0, 1) * keep
    base = Image.fromarray((outa * 255).astype('uint8')).convert('RGBA')
    sky = (yy < 150) & ~((xx > 130) & (xx < 660) & (yy > 8) & (yy < 150)) & ~((xx > 770)) & ~((xx < 140) & (yy > 30) & (yy < 125))
    Lg = lum(outa)
    stars(base, 70, lambda x, y: sky[y, x] and Lg[y, x] < .30, 3)
    moon(base, 700, 52, 23)
    for x, y, s_, an in [(650, 30, 13, -12), (752, 96, 16, 14), (605, 168, 9, 6), (528, 150, 12, -10), (965, 20, 11, 8), (790, 24, 8, -6)]:
        bat(base, x, y, s_, an)
    base.convert('RGB').save(out)

def night_ai(src, out):
    im = Image.open(src).convert('RGB'); a = np.asarray(im, dtype=float) / 255; h, w = a.shape[:2]
    H, S, V = hsv(a); L = lum(a)
    yy, xx = np.mgrid[0:h, 0:w]
    charbox = ((xx > 735) & (xx < 1025)) | ((xx > 560) & (xx < 790) & (yy > 150)) | ((xx > 735) & (xx < 800) & (yy > 80))
    bg = ((H > 185) & (H < 240) & (S > .22)) | ((H > 70) & (H < 170) & (S > .2)) | (~charbox & (S < .25))
    text = (L > .8) & (S < .18) & (xx < 560) & (yy > 20) & (yy < 125)
    bgw = soft(bg.astype(float), 1.0)
    keep = soft(text.astype(float), .6)
    g = grade(a)
    dim = np.clip(a * .66 + np.array([.03, .05, .13]), 0, 1)  # karakter: sedikit gelap & kebiruan (cahaya malam)
    wf = bgw[..., None]; kf = keep[..., None]
    outa = (g * wf + dim * (1 - wf)) * (1 - kf) + a * kf
    # --- baju tidur: sweter abu-abu → biru muda bermotif bintang & bulan ---
    sw = (S < .14) & (L > .42) & (L < .92) & (xx > 752) & (xx < 1020) & (yy > 112)
    sw &= ~((xx < 790) & (yy > 200))  # jangan kena laptop
    swm = soft(sw.astype(float), .8)[..., None]
    shade = np.clip((L - .45) / .4, 0, 1)[..., None]
    pj = np.array([.42, .55, .86]) * (1 - shade) + np.array([.70, .80, .98]) * shade
    pj = pj * .78 + np.array([.03, .05, .13])  # tetap dalam suasana malam
    outa = outa * (1 - swm) + pj * swm
    base = Image.fromarray((np.clip(outa, 0, 1) * 255).astype('uint8')).convert('RGBA')
    # motif bintang & bulan sabit di baju tidur
    pat = layer(base.size); d = ImageDraw.Draw(pat); s = SS
    def star5(x, y, r, fill):
        P = []
        for k in range(10):
            rr = r if k % 2 == 0 else r * .45; t = -math.pi / 2 + k * math.pi / 5
            P.append(((x + rr * math.cos(t)) * s, (y + rr * math.sin(t)) * s))
        d.polygon(P, fill=fill)
    rnd = random.Random(9)
    for j, y in enumerate(range(118, 266, 17)):
        for x in range(752 + (j % 2) * 13, 1020, 26):
            x2, y2 = x + rnd.uniform(-3, 3), y + rnd.uniform(-3, 3)
            if (j + x // 26) % 3 == 0:  # bulan sabit
                r = 3.2; d.ellipse([(x2 - r) * s, (y2 - r) * s, (x2 + r) * s, (y2 + r) * s], fill=(255, 246, 200, 235))
                d.ellipse([(x2 - r + 1.6) * s, (y2 - r - .8) * s, (x2 + r + 1.6) * s, (y2 + r - .8) * s], fill=(0, 0, 0, 0))
            else:
                star5(x2, y2, 2.8, (255, 255, 255, 225))
    pat = down(pat, base.size); pa = np.asarray(pat, dtype=float)
    # motif hanya di area baju dan tidak menutupi tulisan ADRIY
    txt = ((H > 205) & (H < 240) & (S > .45) & (L < .45)).astype(float)
    txt = soft(np.clip(txt, 0, 1), 2.5)
    pa[..., 3] *= swm[..., 0] * np.clip(1 - txt * 3, 0, 1)
    base.alpha_composite(Image.fromarray(pa.astype('uint8'), 'RGBA'))
    # --- penutup mata tidur menggantikan kacamata hitam ---
    l = layer(base.size); d = ImageDraw.Draw(l)
    cx, cy, ang = 801, 47, -21
    c, s_ = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    def T(x, y): return ((cx + x * c - y * s_) * SS, (cy + x * s_ + y * c) * SS)
    # tali di belakang kepala
    d.line([T(46, -2), T(70, 2), T(84, 8)], fill=(58, 52, 120, 255), width=4 * SS, joint='curve')
    d.line([T(-48, 2), T(-60, 6)], fill=(58, 52, 120, 255), width=4 * SS)
    # bentuk masker: dua lengkung, lekuk di tengah atas hidung
    P = []
    for k in range(0, 361, 6):
        t = math.radians(k); rx, ry = 50, 19
        x, y = rx * math.cos(t), ry * math.sin(t)
        if y > 0: y += 4 * math.exp(-(x / 10) ** 2) * -1.6  # lekuk hidung di bawah tengah
        if y < 0: y *= 1 + .12 * (abs(x) / rx)
        P.append(T(x, y))
    d.polygon(P, fill=(82, 74, 160, 255))
    P2 = [T(x * .9, y * .78 - 1) for x, y in [(50 * math.cos(math.radians(k)), 19 * math.sin(math.radians(k))) for k in range(0, 361, 6)]]
    d.line(P2 + [P2[0]], fill=(140, 130, 220, 255), width=int(1.4 * SS))  # jahitan tepi
    # mata terpejam bordir (bulu mata)
    for ex in (-22, 22):
        arc = [T(ex + 11 * math.cos(math.radians(t)), 1 + 5 * math.sin(math.radians(t))) for t in range(0, 181, 15)]
        d.line(arc, fill=(255, 255, 255, 255), width=int(1.7 * SS))
        for t in (35, 90, 145):
            bx, by = ex + 11 * math.cos(math.radians(t)), 1 + 5 * math.sin(math.radians(t))
            d.line([T(bx, by), T(bx + 2.2 * math.cos(math.radians(t)), by + 4.5)], fill=(255, 255, 255, 255), width=int(1.4 * SS))
    base.alpha_composite(down(l, base.size))
    # --- langit malam: bulan, bintang, Zzz ---
    Lg = lum(np.asarray(base.convert('RGB'), dtype=float) / 255)
    skym = bg & (yy < 150) & ~((xx < 575) & (yy > 8) & (yy < 150)) & ~((xx < 140))
    stars(base, 55, lambda x, y: skym[y, x] and Lg[y, x] < .32, 5)
    moon(base, 655, 46, 22)
    z = layer(base.size); d = ImageDraw.Draw(z)
    try: f = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', n * SS)
    except Exception: f = lambda n: ImageFont.load_default()
    for x, y, n in [(868, 20, 10), (884, 8, 13), (904, -6, 17)]:
        d.text((x * SS, y * SS), 'z' if n < 15 else 'Z', font=f(n), fill=(220, 230, 255, 235))
    base.alpha_composite(down(z, base.size))
    base.convert('RGB').save(out)

if __name__ == '__main__':
    night_dash(f'{IMG}/banner_dash.png', f'{IMG}/banner_dash_night.png')
    night_ai(f'{IMG}/banner_ai.png', f'{IMG}/banner_ai_night.png')
    print('ok')
