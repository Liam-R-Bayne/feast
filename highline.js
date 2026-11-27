/* ============================================================
   HIGHLINE BAND  (home page, under the photos)
   A stick figure walks a sagging highline across the band and loops.
   The main line dips under the walker and sways slowly; the backup
   hangs below in uneven loops. Now and then the walker stops and
   fights for balance: bigger lean, arms working, knees softer.
   Plain SVG + JS, no libraries. Tunables are in CFG below.
   ============================================================ */
(function () {
  const svg = document.getElementById("highline");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const params = new URLSearchParams(location.search);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- tunables ----------
  const CFG = {
    staticSag: 34,          // sag of the unloaded line at mid-span (desktop)
    loadSag: 36,            // extra sag from the walker's weight at mid-span
    tapeGap: [80, 155],     // spacing between backup tie-in points (uneven)
    backupDrop: [12, 34],   // how far each backup loop hangs (uneven)
    stepLen: [22, 32],      // length of each step
    stepTime: [0.8, 1.45],  // seconds per step (uneven tempo)
    pauseChance: 0.15,      // chance of stopping to fight for balance after a step
    pauseTime: [1.3, 3.2],  // how long a stop lasts, seconds
    // body, in px at full size
    thigh: 25, shin: 25, torso: 33, neck: 3.5, headR: 8.5,
    upperArm: 18, foreArm: 16, foot: 9,
  };

  // ---------- small helpers ----------
  function el(tag, cls, parent) {
    const e = document.createElementNS(NS, tag);
    if (cls) e.setAttribute("class", cls);
    (parent || svg).appendChild(e);
    return e;
  }
  // Seeded random numbers, so the rigging looks the same on every visit.
  function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  const between = (r, [a, b]) => a + r() * (b - a);
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = deg => deg * Math.PI / 180;
  const f1 = v => v.toFixed(1);
  const pts = arr => arr.map(p => f1(p[0]) + "," + f1(p[1])).join(" ");
  // Smooth, never-repeating wobble (sum of sines at odd ratios), roughly -1..1.
  const noise = (t, s) => Math.sin(t * 0.73 + s) * 0.55 + Math.sin(t * 1.37 + s * 2.1) * 0.3 + Math.sin(t * 2.71 + s * 3.7) * 0.15;

  // ---------- scene ----------
  const ridgeBack = el("path", "hl-ridge hl-ridge-back");
  const ridgeFront = el("path", "hl-ridge hl-ridge-front");
  const backupPath = el("path", "hl-backup");
  const mainPath = el("path", "hl-main");
  const leash = el("path", "hl-leash");
  const ring = el("circle", "hl-ring");
  const fig = el("g", "hl-figure");
  const farLeg = el("polyline", "hl-limb", fig);
  const farFoot = el("line", "hl-limb", fig);
  const farArm = el("polyline", "hl-limb", fig);
  const nearLeg = el("polyline", "hl-limb", fig);
  const nearFoot = el("line", "hl-limb", fig);
  const torso = el("line", "hl-torso", fig);
  const head = el("circle", "hl-head", fig);
  const nearArm = el("polyline", "hl-limb", fig);

  // ---------- layout (runs on load and resize) ----------
  let W = 0, H = 0, S = 1, sag = 1, anchorY = 0, tapes = [], drops = [];
  const spanA = () => -0.18 * W - 80;   // anchors sit off-screen
  const spanB = () => 1.18 * W + 80;

  function layout() {
    const w = svg.clientWidth || 1200;
    if (w === W) return;
    W = w;
    S = W < 640 ? 0.82 : 1;                 // figure scale
    sag = clamp(W / 1100, 0.5, 1);          // less sag on narrow screens
    anchorY = 96 * S;
    H = Math.round(anchorY + (CFG.staticSag + CFG.loadSag) * sag + 6 + CFG.backupDrop[1] + 18);
    svg.style.height = H + "px";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    fig.style.setProperty("--s", S);

    // Backup tie-ins are fixed along the webbing, unevenly spaced.
    tapes = []; drops = [];
    const r = rng(7);
    for (let x = spanA(); x < spanB(); x += between(r, CFG.tapeGap)) {
      tapes.push(x);
      drops.push(between(r, CFG.backupDrop));
    }

    // Two faint mountain ridges behind the line.
    ridgeBack.setAttribute("d", ridge(rng(3), H * 0.52, 34, 90));
    ridgeFront.setAttribute("d", ridge(rng(5), H * 0.72, 26, 60));

    if (reduced && plants) render();
  }
  function ridge(r, base, amp, gap) {
    let d = `M0,${H} L0,${f1(base)}`;
    for (let x = 0; x <= W + gap; x += between(r, [gap * 0.6, gap * 1.4])) {
      d += ` L${f1(x)},${f1(base - r() * amp)}`;
    }
    return d + ` L${W},${H} Z`;
  }

  // ---------- line shape ----------
  // Unloaded: a parabola. Loaded: a V with its apex at the walker, rounded
  // off so the webbing between the feet isn't a sharp kink.
  function lineY(x, xw, d) {
    const A = spanA(), B = spanB(), u = (x - A) / (B - A);
    const stat = CFG.staticSag * sag * 4 * u * (1 - u);
    const l = (x - A) / (xw - A), r = (B - x) / (B - xw), k = 0.035;
    const soft = -k * Math.log(Math.exp(-l / k) + Math.exp(-r / k));
    return anchorY + stat + d * Math.max(0, Math.min(1, soft / (1 - k * Math.LN2)));
  }

  // Two-bone IK for the legs; knees bend forward (direction of travel).
  function knee(hip, ankle) {
    const a = CFG.thigh * S, b = CFG.shin * S;
    const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
    const d = Math.min(Math.hypot(dx, dy), a + b - 0.01);
    const t = Math.atan2(dy, dx) - Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
    return [hip[0] + a * Math.cos(t), hip[1] + a * Math.sin(t)];
  }

  // ---------- state ----------
  const gaitRnd = rng(11);
  let plants, n, p, stepDur, hold;   // plants[k] = where footfall k lands
  let s = 0;                         // hip x
  let t = 0, tau = 0;                // clock, and a balance clock that runs faster when fighting
  let fight = 0;                     // 0 = calm walking, 1 = stopped and fighting
  let sway = 0, swayV = 0;           // slow vertical swing of the whole line
  const OMEGA = 2 * Math.PI * 0.42, ZETA = 0.12;

  function startCrossing(x0) {
    plants = [x0 - 30 * S, x0 - 4 * S];
    n = 1; p = 0; hold = 0; s = x0;
    stepDur = between(gaitRnd, CFG.stepTime);
  }
  function plant(k) {
    while (plants.length <= k) plants.push(plants[plants.length - 1] + between(gaitRnd, CFG.stepLen) * S);
    return plants[k];
  }

  function update(dt) {
    t += dt;
    // Gait: walk a step, sometimes stop and fight for balance, repeat.
    if (hold > 0) hold -= dt;
    else {
      p += dt / stepDur;
      if (p >= 1) {
        p -= 1; n += 1;
        stepDur = between(gaitRnd, CFG.stepTime);
        swayV += between(gaitRnd, [1.5, 4]);          // gentle nudge on footfall
        if (gaitRnd() < CFG.pauseChance) { hold = between(gaitRnd, CFG.pauseTime); p = 0; }
      }
    }
    const target = hold > 0.35 ? 1 : 0.12;               // settle a moment before walking on
    fight += (target - fight) * Math.min(1, dt * 2.2);
    tau += dt * (1 + 1.4 * fight);

    const pe = smooth(p) * 0.6 + p * 0.4;               // hips surge a little mid-step
    s = (plant(n - 1) + plant(n)) / 2 + ((plant(n + 1) - plant(n - 1)) / 2) * pe;
    if (s > W + 70) startCrossing(-70);

    // Fighting shakes the line a little too.
    swayV += fight * dt * 5 * noise(tau * 2.3, 8.8);
    const acc = -OMEGA * OMEGA * sway - 2 * ZETA * OMEGA * swayV;
    swayV += acc * dt; sway += swayV * dt;
  }

  function render() {
    // Fade the load in and out at the edges so the loop restart can't be seen.
    const onScreen = smooth((s + 70) / 160) * smooth((W + 70 - s) / 160);
    const A = spanA(), B = spanB(), u = (s - A) / (B - A);
    const d = (CFG.loadSag * sag * 4 * u * (1 - u) + 6 + sway) * onScreen;
    const Y = x => lineY(x, s, d);
    const slope = x => (Y(x + 1) - Y(x - 1)) / 2;

    // Balance. lean > 0 = leaning forward. Calm walking = small, slow
    // corrections; fighting = bigger, quicker ones with the hips countering.
    const amp = 2.5 + 10 * fight;
    const lean = amp * noise(tau, 1.3) + 3;
    const ln = (lean - 3) / 12.5;                        // about -1..1 when fighting hard
    const hipX = s - 3.5 * S * ln * fight;
    const hipY = Y(s) - (47 - 4 * fight) * S + 1.2 * S * Math.cos(2 * Math.PI * p);
    const hip = [hipX, hipY];
    const L = rad(lean);
    const up = (from, len, ang) => [from[0] + len * Math.sin(ang), from[1] - len * Math.cos(ang)];
    const neck = up(hip, CFG.torso * S, L);
    const shoulder = up(hip, (CFG.torso - 4) * S, L);
    const headC = up(neck, (CFG.neck + CFG.headR) * S, L * 1.3 - rad(4));

    // Arms. Angles are from straight up, + = forward. Like the reference
    // silhouettes, one arm tends to go high while the other works out wide,
    // and they trade places. Both throw back against a forward lean.
    const swap = noise(tau * 0.55, 5.5) * (0.75 + 0.6 * fight);
    const jerk = fight * 16 * noise(tau * 3.4, 2.9);
    const counter = -40 * ln * fight;
    const nUp = 74 - 50 * swap + counter + jerk - 4 * noise(tau * 1.4, 4.1);
    const fUp = -74 - 50 * swap + counter - jerk * 0.7 + 4 * noise(tau * 1.4, 4.1);
    // Elbows hinge on their own: bend more when the arm is out, open up when it's high.
    const nEl = -(12 + 0.25 * Math.abs(nUp)) + (18 + 10 * fight) * noise(tau * 0.9, 7.3) + 6 * noise(tau * 2.8, 2.2);
    const fEl = (12 + 0.25 * Math.abs(fUp)) + (18 + 10 * fight) * noise(tau * 0.8, 9.1) + 6 * noise(tau * 3.1, 5.6);
    const arm = (a, rel) => { const e = up(shoulder, CFG.upperArm * S, rad(a)); return [shoulder, e, up(e, CFG.foreArm * S, rad(a + rel))]; };
    const near = arm(nUp, nEl), far = arm(fUp, fEl);

    // Feet: the stance foot is planted; the other swings low along the line.
    const q = smooth((p - 0.12) / 0.76);
    const swingX = plant(n - 1) + (plant(n + 1) - plant(n - 1)) * q;
    const stanceX = plant(n);
    const lift = 4.5 * S * Math.sin(Math.PI * q);
    const footY = x => Y(x) - 2.5 * S;
    function leg(ax, ay) {
      const ank = [ax, ay];
      const sl = slope(ax), fl = CFG.foot * S;
      return { pts: [hip, knee(hip, ank), ank], foot: [ax - 0.3 * fl, ay + 1.5 * S - 0.3 * fl * sl, ax + 0.7 * fl, ay + 1.5 * S + 0.7 * fl * sl] };
    }
    const legA = leg(stanceX, footY(stanceX));
    const legB = leg(swingX, footY(swingX) - lift);
    const nearIsStance = n % 2 === 0;
    const legNear = nearIsStance ? legA : legB, legFar = nearIsStance ? legB : legA;

    // ---------- draw ----------
    let dMain = "";
    const dx = Math.max(6, W / 160);
    for (let x = -10; x <= W + 10 + dx; x += dx) dMain += (dMain ? "L" : "M") + f1(x) + "," + Y(x).toFixed(2);
    mainPath.setAttribute("d", dMain);

    let dB = "";
    for (let i = 0; i < tapes.length - 1; i++) {
      const x0 = tapes[i], x1 = tapes[i + 1];
      if (x1 < -20 || x0 > W + 20) continue;
      const y0 = Y(x0), y1 = Y(x1);
      dB += `M${f1(x0)},${f1(y0)} Q${f1((x0 + x1) / 2)},${f1((y0 + y1) / 2 + 2 * drops[i])} ${f1(x1)},${f1(y1)} `;
    }
    backupPath.setAttribute("d", dB);

    // Leash: harness to a ring that slides on the line behind the walker.
    const hx = hip[0] - 1, hy = hip[1] + 2 * S;
    const rx = s - 26 * S, ry = Y(rx) + 2.4 * S;
    ring.setAttribute("cx", f1(rx)); ring.setAttribute("cy", f1(ry)); ring.setAttribute("r", f1(2.8 * S));
    leash.setAttribute("d", `M${f1(hx)},${f1(hy)} Q${f1((hx + rx) / 2 - 2)},${f1(Math.max(hy, ry) + 12 * S)} ${f1(rx)},${f1(ry)}`);

    farLeg.setAttribute("points", pts(legFar.pts));
    setLine(farFoot, legFar.foot);
    farArm.setAttribute("points", pts(far));
    nearLeg.setAttribute("points", pts(legNear.pts));
    setLine(nearFoot, legNear.foot);
    setLine(torso, [hip[0], hip[1], neck[0], neck[1]]);
    head.setAttribute("cx", f1(headC[0])); head.setAttribute("cy", f1(headC[1])); head.setAttribute("r", f1(CFG.headR * S));
    nearArm.setAttribute("points", pts(near));
  }
  function setLine(node, [x1, y1, x2, y2]) {
    node.setAttribute("x1", f1(x1)); node.setAttribute("y1", f1(y1));
    node.setAttribute("x2", f1(x2)); node.setAttribute("y2", f1(y2));
  }

  // ---------- run ----------
  layout();
  window.addEventListener("resize", layout);

  if (reduced) {
    // No motion: one calm frame, walker partway across.
    startCrossing(W * 0.42);
    update(0.4);
    render();
    return;
  }

  startCrossing(params.has("hl-start") ? +params.get("hl-start") : -70);

  // ?hl-manual lets a script step frames one at a time (used for recordings).
  if (params.has("hl-manual")) {
    window.highlineStep = dt => { update(dt); render(); };
    render();
    return;
  }

  let visible = true, last = performance.now(), running = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    if (visible) requestAnimationFrame(frame); else running = false;
  }
  function run() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  // Only animate while the band is on screen.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) run();
    }).observe(svg);
  }
  run();
})();
