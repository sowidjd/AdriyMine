// butterfly.js: "Clawd and the butterfly", 15 s. See STORYBOARD.md.
//   Shot A (0–5 s):  meadow. A butterfly lands on a flower beside a bored Clawd; Clawd pounces, misses, dizzy. Brush wipe.
//   Shot B (5–15 s): the chase (two missed jumps), Clawd gives up, and the butterfly lands on Clawd's head. Iris out.
(() => {
  const G = 860;                                  // ground line
  const GRASS = ['#7FB069', '#5E9450'];           // wipe colours, the same on both sides of the cut
  const WARM = '#F7CF97';

  // ---------- helpers ----------
  // Catmull-Rom path through timed keys [[t, [x, y]], ...]: smooth flight with no stops at the keys.
  function path(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    const n = keys.length; if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (t >= keys[i + 1][0]) i++;
    const p0 = keys[Math.max(0, i - 1)][1], p1 = keys[i][1], p2 = keys[i + 1][1], p3 = keys[Math.min(n - 1, i + 2)][1];
    const s = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]), s2 = s * s, s3 = s2 * s;
    return [0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s3));
  }
  const tilt = (keys, t) => { const a = path(keys, t - .03), b = path(keys, t + .03); return clamp((b[0] - a[0]) * .004, -.35, .35); };

  // The butterfly: flat, seen from above, wings fold toward the body as they flap. open 0..1.
  function butterfly(x, y, r, open, rot, key = 'bfly') {
    boilSeed(key);
    const s = lerp(.14, 1, clamp(open)), sw = clamp(r / 40, .45, 1.1);
    push(); translate(x, y); rotate(rot);
    for (const side of [-1, 1]) {
      const sx = p => p.map(([px, py]) => [px * s, py]);
      paint(sx(ellPts(side * .42 * r, .4 * r, .42 * r, .34 * r, 14, 0, side * .6)), { wash: '#E27A92', ink: PAL.ink, sw });
      paint(sx(ellPts(side * .62 * r, -.28 * r, .64 * r, .48 * r, 16, 0, -side * .5)), { wash: '#F2994A', ink: PAL.ink, sw });
      paint(sx(ellPts(side * .82 * r, -.42 * r, .17 * r, .13 * r, 10)), { wash: PAL.cream, ink: null });
      paint(sx(ellPts(side * .45 * r, .45 * r, .1 * r, .08 * r, 8)), { wash: PAL.cream, ink: null });
      inkLine([[side * .04 * r, -.42 * r], [side * .2 * r, -.75 * r], [side * .3 * r, -.92 * r]], sw * .7, PAL.ink, 'inkfine', .6);
    }
    paint(ellPts(0, 0, .1 * r, .5 * r, 12), { wash: PAL.ink, ink: null });
    pop();
  }
  const flapFast = t => .5 + .5 * Math.sin(t * TAU * 6.5);
  const flapSlow = t => .55 + .45 * Math.sin(t * TAU * .9);

  // A flower: stem from the ground, bending by `bend` (radians, + = toward the right). Returns its head point.
  function flower(x, gy, h, col, bend, key) {
    boilSeed('flower' + key);
    const hx = x + Math.sin(bend) * h, hy = gy - Math.cos(bend) * h;
    const mx = x + Math.sin(bend * .5) * h * .55, my = gy - Math.cos(bend * .5) * h * .55;
    inkLine([[x, gy], [mx, my], [hx, hy]], 1.6, '#4E7F3E', 'ink', .7);
    paint(ellPts(lerp(x, mx, .5) + 14, lerp(gy, my, .5), 16, 7, 10, 0, -.6), { wash: '#6E9F58', ink: PAL.ink, sw: .5 });
    const pr = h * .1;
    for (let i = 0; i < 5; i++) {
      const a = bend + i * TAU / 5;
      paint(ellPts(hx + Math.sin(a) * pr * .95, hy - Math.cos(a) * pr * .95, pr * .62, pr * .45, 12, 0, a + Math.PI / 2), { wash: col, ink: PAL.ink, sw: .6 });
    }
    paint(ellPts(hx, hy, pr * .45, pr * .45, 12), { wash: PAL.ochre, ink: PAL.ink, sw: .6 });
    return [hx, hy];
  }

  // The meadow: sky, sun, clouds, far hills (parallax), ground and tufts. warm 0..1 shifts it toward golden hour.
  function meadow(t, camX, warm = 0, x0 = -900, x1 = 3300) {
    boilSeed('sky');
    paint(rectPts(x0, -700, x1 - x0, G + 700), { wash: mixCol(PAL.sky, '#FBE3B8', warm * .6), ink: null });
    const px = (camX - 960) * .85;   // the sun and clouds barely move: far away
    glow(px + 330, 170, 260, '#FFE6A8', .7);
    paint(ellPts(px + 330, 170, 62, 62, 24), { wash: mixCol('#FFF1C9', '#FFD98A', warm), ink: null });
    for (let i = 0; i < 4; i++) {
      boilSeed('cloud' + i);
      const cx = px + 700 + i * 520 + 60 * hash(i) + 18 * Math.sin(t * .3 + i), cy = 140 + 110 * hash(i + 7);
      for (let k = 0; k < 3; k++) paint(ellPts(cx + (k - 1) * 70, cy - (k === 1 ? 26 : 0), 80 - 10 * Math.abs(k - 1), 44, 18), { wash: mixCol(PAL.cream, WARM, warm * .5), ink: null });
    }
    const hp = (camX - 960) * .5;    // far hills move at half speed
    for (let i = 0; i < 4; i++) {
      boilSeed('hill' + i);
      const hx = hp - 300 + i * 900 + 200 * hash(i + 3);
      paint(ellPts(hx, G + 40, 620, 230 + 60 * hash(i + 9), 36), { wash: mixCol(mixCol('#9CC9A0', PAL.sky, .35), WARM, warm * .4), ink: mixCol(PAL.ink, PAL.sky, .5), sw: .6 });
    }
    boilSeed('ground');
    paint(rectPts(x0, G - 14, x1 - x0, 700), { wash: mixCol('#7FB069', WARM, warm * .25), ink: null });
    for (let k = 0; k < 4; k++) inkLine([[x0 + k * (x1 - x0) / 4, G - 12], [x0 + (k + 1) * (x1 - x0) / 4 + 2, G - 12]], 1, PAL.ink, 'ink', .5);
    boilSeed('tufts');
    for (let i = 0; i < 46; i++) {
      const x = x0 + 200 + i * 95 + 40 * hash(i), y = G + 30 + 150 * hash(i + 50), sw = wob(t, .45, hash(i) * 3) * 4;
      for (const k of [-1, 0, 1]) inkLine([[x + k * 6, y], [x + k * 10 + sw, y - 16 - 8 * hash(i + k)]], .6, '#4E7F3E', 'inkfine', .4);
    }
  }

  // ---------- shot A: the pounce ----------
  const A = { cx: 760, fx: 1120, fh: 170, u: 24, tLand: 2.05, tLift: 3.25, tJump: 3.3, tHit: 3.9 };
  const flowerBendA = t => .07 * Math.sin(t * 1.4) + (t > A.tHit ? 1.15 * Math.exp(-(t - A.tHit) * .9) * Math.cos((t - A.tHit) * 2.2) : 0)
                         + (t > A.tLand && t < A.tLift ? .05 * Math.exp(-(t - A.tLand) * 5) * Math.sin((t - A.tLand) * 20) : 0);
  const headA = t => [A.fx + Math.sin(flowerBendA(t)) * A.fh, G - Math.cos(flowerBendA(t)) * A.fh];

  function shotPounce(t, lt, dur) {
    const shake = t > A.tHit ? shakeXY(t, 9 * Math.exp(-(t - A.tHit) * 8)) : [0, 0];
    const cx = 960 + 14 * Math.sin(lt * .5) + shake[0], cy = 560 + shake[1], zoom = kf(lt, [[0, 1.04], [2.0, 1.04], [3.0, 1.1], [4.2, 1.08]]);
    camBegin(cx, cy, zoom);
    meadow(t, cx);
    flower(380, G + 10, 120, PAL.rose, .05 * Math.sin(t * 1.2 + 1), 'a1');
    flower(1550, G + 20, 140, PAL.cream, .06 * Math.sin(t * 1.1 + 2), 'a2');
    const head = flower(A.fx, G, A.fh, '#B78AD6', flowerBendA(t), 'a0');

    // Clawd: bored → notices → sly → crouch and pounce → face-plant, dizzy → determined, turns to chase
    const u = A.u;
    const mood = emotions(t, [[0, 'bored'], [A.tLand + .05, 'surprised', { lookX: .9, lookY: -.4 }], [2.7, 'mischief', { lookX: .9, lookY: -.3 }],
                             [A.tHit + .05, 'dizzy'], [4.45, 'determined', { lookX: 1 }]]);
    const hop = jump(t, A.tJump, A.tHit, 3.2);
    const x = lerp(A.cx, 1030, ease(seg(t, A.tJump, A.tHit)));
    let pose = {};
    if (t < 2.75) pose = {};
    else if (t < A.tHit) pose = { ...turn(t, 2.75, 2.9, 0, .125), aL: t > A.tJump ? 1.1 : -.3, aR: t > A.tJump ? .7 : -.4 };
    else if (t < 4.5) pose = turn(t, A.tHit, A.tHit + .1, .125, 0);
    else pose = turn(t, 4.5, 4.65, 0, .25);
    const crouch = .14 * ease(seg(t, 2.95, 3.15)) * (t < A.tJump ? 1 : 0);
    const land = t > A.tHit ? .35 * Math.exp(-(t - A.tHit) * 6) * Math.cos((t - A.tHit) * 14) : 0;
    clawd(x, G, u, { ...mood, ...pose, dy: (mood.dy || 0) + hop.dy, sq: (mood.sq || 0) + hop.sq + crouch + land });

    // the butterfly: flies in, lands on the flower, rests, lifts off just before the pounce, flutters away right
    const inKeys = [[.7, [-120, 380]], [1.15, [260, 300]], [1.55, [640, 450]], [1.85, [980, 520]], [A.tLand, [head[0], head[1] - 20]]];
    const outKeys = [[A.tLift, [head[0], head[1] - 20]], [3.55, [1180, 520]], [3.95, [1330, 470]], [4.4, [1520, 520]], [4.85, [1780, 380]], [5.0, [1900, 330]]];
    if (t > .7 && t < A.tLand) { const p = path(inKeys, t); butterfly(p[0], p[1] + 10 * Math.sin(t * 9), 34, flapFast(t), tilt(inKeys, t)); }
    else if (t >= A.tLand && t < A.tLift) {
      const k = seg(t, A.tLand, A.tLand + .3);
      butterfly(head[0], head[1] - 20, 34, lerp(flapFast(t), flapSlow(t - A.tLand), k), .1 * Math.sin(t * 1.3));
    } else if (t >= A.tLift) { const p = path(outKeys, t); butterfly(p[0], p[1] + 12 * Math.sin(t * 8), 34, flapFast(t), tilt(outKeys, t)); }

    const eye = toScreen(A.cx, G - 4 * u);
    camEnd();
    if (lt < .6) iris(...eye, lerp(0, 1500, easeIn(lt / .6)));
    boilSeed('transition');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, GRASS);
  }

  // ---------- shot B: the chase and the gift ----------
  // times are shot-local (lt): 0 = 5.0 s of video
  const B = { u: 24, j1: [1.3, 1.9], j2: [2.6, 3.35], tSad: 3.65, tPush: [3.7, 5.0], tDown: [6.0, 7.4], tLook: 7.45, tLove: 8.15, tIris: 8.85 };
  const xB = lt => {
    if (lt < B.j1[0]) return lerp(250, 860, easeIn(seg(lt, 0, B.j1[0])) * .35 + seg(lt, 0, B.j1[0]) * .65);
    if (lt < B.j1[1]) return lerp(860, 1180, ease(seg(lt, ...B.j1)));
    if (lt < B.j2[0]) return 1180 + 40 * easeOut(seg(lt, B.j1[1], B.j2[0]));
    return lerp(1220, 1680, ease(seg(lt, ...B.j2)));
  };
  const BFLY = [[0, [520, 560]], [.6, [800, 610]], [1.2, [1100, 600]], [1.6, [1190, 790]], [2.0, [1360, 640]], [2.55, [1520, 560]],
                [2.95, [1440, 330]], [3.3, [1290, 430]], [3.75, [1500, 300]], [4.4, [1900, 250]], [5.2, [2250, 420]], [6.0, [2150, 470]]];

  function shotChase(t, lt, dur) {
    const u = B.u, x = xB(lt);
    const hop = lt < B.j2[0] - .2 ? jump(lt, ...B.j1, 3.2) : jump(lt, ...B.j2, 5.5);
    const thud = lt > B.j2[1] ? shakeXY(lt, 8 * Math.exp(-(lt - B.j2[1]) * 8)) : [0, 0];
    const push = ease(seg(lt, ...B.tPush));
    const cx = lerp(x + 220, 1720, push) + thud[0], cy = lerp(560, 690, push) + thud[1];
    const zoom = lerp(1, 2.05, push) + .08 * ease(seg(lt, B.tLove, dur));
    camBegin(cx, cy, zoom);
    const warm = ease(seg(lt, B.tLove - .2, B.tLove + 1.2));
    meadow(t, cx, warm);
    for (let i = 0; i < 12; i++) {   // flowers along the way, swaying
      const fx = -200 + i * 260 + 90 * hash(i + 40);
      if (fx > 1520 && fx < 1900) continue;
      flower(fx, G + 10 + 30 * hash(i + 20), 100 + 60 * hash(i + 30), [PAL.rose, PAL.cream, '#B78AD6', PAL.ochre][i % 4], .07 * Math.sin(t * 1.2 + i), 'b' + i);
    }
    glow(1690, G - 150, 420, '#FFD27A', .55 * warm);

    // Clawd
    const mood = emotions(lt, [[0, 'determined', { lookX: 1, lookY: -.4 }], [B.j1[1] + .05, 'confused', { lookX: 1, lookY: -.7 }],
                               [2.3, 'determined', { lookX: 1, lookY: -.6 }], [B.tSad, 'sad'],
                               [B.tLook, 'surprised', { lookX: .15, lookY: -1, emote: null }], [B.tLove, 'love', { lookY: -.6 }]], { take: .8 });
    let pose;
    const running = lt < B.j1[0] || (lt > B.j1[1] + .05 && lt < B.j2[0]);
    if (lt < B.tSad) {
      pose = { view: 'side', walk: running ? (x - 250) / (4 * u) : undefined, aL: lt > B.j1[0] - .05 && lt < B.j1[1] || lt > B.j2[0] - .05 && lt < B.j2[1] ? 1.2 : .3 };
      if (lt < B.j1[0]) pose.dy = -Math.abs(Math.sin((x - 250) / (4 * u) * Math.PI)) * .5;
    } else pose = turn(lt, B.tSad, B.tSad + .15, .25, 0);
    const slam = lt > B.j2[1] ? .4 * Math.exp(-(lt - B.j2[1]) * 5) * Math.cos((lt - B.j2[1]) * 13) : 0;
    const cl = { ...mood, ...pose, dy: (mood.dy || 0) * (lt < B.tSad ? .3 : 1) + hop.dy + (pose.dy || 0), sq: (mood.sq || 0) + hop.sq + slam };
    if (lt > B.tSad && lt < B.tLook) cl.sq += .1 * ease(seg(lt, B.tSad, B.tSad + .5));   // slumps down, tired
    clawd(x, G, u, cl);

    // the butterfly: ahead of Clawd, dips under jump 1, loops over jump 2, wanders off, then drifts down onto the head
    const headTop = [x + 1.4 * u, G + (cl.dy || 0) * u - 8 * u * (1 - (cl.sq || 0)) - 14];
    const r = 34;
    if (lt < B.tDown[0]) {
      const p = path(BFLY, lt); butterfly(p[0], p[1] + 10 * Math.sin(lt * 8), r, flapFast(lt), tilt(BFLY, lt));
    } else if (lt < B.tDown[1]) {
      const k = seg(lt, ...B.tDown), e = ease(k);
      const p = [lerp(2150, headTop[0], e) + 50 * Math.sin(k * Math.PI * 2) * (1 - k), lerp(470, headTop[1], e) - 40 * Math.sin(k * Math.PI)];
      butterfly(p[0], p[1], r, k > .9 ? lerp(flap, flapSlow(lt), (k - .9) / .1) : .5 + .5 * Math.sin(lt * TAU * 3.5), -.25 * (1 - k) + .1 * Math.sin(lt * 2));
    } else {
      const a = lt - B.tDown[1], settle = .12 * Math.exp(-a * 4) * Math.sin(a * 14);
      butterfly(headTop[0], headTop[1], r, flapSlow(lt) * (lt > B.tLove ? 1 : .9), .08 * Math.sin(lt * 1.5) + settle);
    }

    const eye = toScreen(x + .7 * u, G - 6 * u);
    camEnd();
    boilSeed('transition');
    if (lt < .3) brushWipe(.5 + lt / .6, GRASS);
    if (lt > B.tIris) {
      const r2 = lt < B.tIris + .5 ? lerp(1500, 430, ease(seg(lt, B.tIris, B.tIris + .5))) : lt < dur - .3 ? lerp(430, 400, seg(lt, B.tIris + .5, dur - .3)) : lerp(400, 0, easeIn(seg(lt, dur - .3, dur - .05)));
      iris(...eye, r2);
    }
  }

  shots([[0, shotPounce], [5.0, shotChase]]);
})();
