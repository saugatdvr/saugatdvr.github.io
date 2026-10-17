/* Editing-software effects layered on top of main.js:
   3D tools + blade cut + render queue (hero), 3D cursor, turbulent displace (work carousel),
   pop-out parallax, DaVinci-style colour page, Gaussian splat portrait (WebGL). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // pointer, normalised to -1..1 (shared by every effect below)
  let nx = 0, ny = 0, sx = 0, sy = 0;
  addEventListener("pointermove", (e) => { nx = (e.clientX / innerWidth) * 2 - 1; ny = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  // one IntersectionObserver for "is this on screen?"
  const seen = new Map();
  const io = new IntersectionObserver((es) => es.forEach((e) => seen.set(e.target, e.isIntersecting)), { rootMargin: "120px" });
  const watch = (el) => { if (el) { seen.set(el, false); io.observe(el); } return el; };

  /* ── Fake-3D extruded SVG icons ─────────────────────────────── */
  const SHAPES = {
    arrow: { d: "M0 0 L0 62 L15 49 L26 74 L37 69 L26 45 L46 45 Z", depth: 12,
      top: ["#ffffff", "#e9ecf5", "#b9c0d6"], side: ["#6b7290", "#2b2f40"],
      extra: '<path d="M3 6 L3 40 L10 34" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>' },
    blade: { d: "M8 0 H116 a8 8 0 0 1 8 8 V24 a6 6 0 0 0 0 12 V66 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 V36 a6 6 0 0 0 0 -12 V8 a8 8 0 0 1 8 -8 Z M30 31 a6 6 0 0 0 0 12 H94 a6 6 0 0 0 0 -12 Z",
      depth: 10, evenodd: true, top: ["#f4f6fb", "#bfc6d6", "#eef1f8", "#8d95ab"], side: ["#5a6077", "#22252f"],
      extra: '<path d="M6 70 H118" stroke="#c8f28c" stroke-width="3" stroke-linecap="round"/><text x="62" y="20" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="700" font-size="9" fill="#5a6077" letter-spacing="2">EDIT · CUT</text>' },
    pen: { d: "M32 0 C48 20 62 44 56 66 L39 98 L32 108 L25 98 L8 66 C2 44 16 20 32 0 Z", depth: 11,
      top: ["#f4ffd9", "#c8f28c", "#6fa53a"], side: ["#4f7a24", "#1f330b"],
      extra: '<line x1="32" y1="62" x2="32" y2="106" stroke="#2c4a12" stroke-width="2.2"/><circle cx="32" cy="58" r="6" fill="#2c4a12"/><path d="M20 22 C26 12 30 8 32 5" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>' },
    diamond: { d: "M20 0 L40 20 L20 40 L0 20 Z", depth: 8, side: ["#333", "#0c0c10"],
      extra: '<path d="M20 4 L8 16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>' },
  };
  SHAPES["arrow-sm"] = { ...SHAPES.arrow, depth: 6 };
  SHAPES["blade-sm"] = { ...SHAPES.blade, depth: 5, extra: '<path d="M6 70 H118" stroke="#c8f28c" stroke-width="4" stroke-linecap="round"/>' };
  let uid = 0;
  function extrude(svg) {
    const shape = SHAPES[svg.dataset.tool]; if (!shape) return;
    const id = "x" + uid++;
    const topStops = shape.top || ["#ffffff", svg.dataset.color, svg.dataset.color];
    const stops = (arr) => arr.map((c, i) => `<stop offset="${i / (arr.length - 1)}" stop-color="${c}"/>`).join("");
    let html = `<defs><linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="1">${stops(topStops)}</linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1">${stops(shape.side)}</linearGradient></defs>`;
    const rule = shape.evenodd ? ' fill-rule="evenodd"' : "";
    for (let i = shape.depth; i > 0; i--) html += `<path d="${shape.d}" fill="url(#${id}s)"${rule} transform="translate(${(i * 0.55).toFixed(2)} ${(i * 0.75).toFixed(2)})"/>`;
    html += `<path d="${shape.d}" fill="url(#${id}t)"${rule} stroke="rgba(255,255,255,.85)" stroke-width=".8"/>` + (shape.extra || "");
    svg.innerHTML = html;
  }
  $$("svg[data-tool]").forEach(extrude);

  /* ── Hero: floating tools, blade cut ─────────────────────────── */
  const heroStage = watch($(".hero__stage"));
  const tools = $$(".hero__stage .tool").map((el, i) => { el.style.setProperty("--i", i); return { el, depth: +el.dataset.depth || 1, i }; });
  const blade = $(".tool--blade");
  const fanCards = $$(".fan__card");
  const target = fanCards[3] || fanCards[fanCards.length - 1];
  if (target) {
    const poster = target.querySelector("video")?.poster || target.querySelector("img")?.src || "";
    const split = document.createElement("div");
    split.className = "fan__split";
    split.innerHTML = `<i style="background-image:url('${poster}')"></i><i style="background-image:url('${poster}')"></i><b></b>`;
    target.append(split);
  }
  function slice() {
    if (!blade || !target || reduced || document.hidden || !seen.get(heroStage)) return;
    blade.classList.add("is-slicing");
    setTimeout(() => target.classList.add("is-cut"), 380);
    setTimeout(() => target.classList.add("is-apart"), 520);
    setTimeout(() => blade.classList.remove("is-slicing"), 950);
    setTimeout(() => target.classList.remove("is-apart"), 1700);
    setTimeout(() => target.classList.remove("is-cut"), 2100);
  }
  const startSlicing = () => { setTimeout(slice, 2600); setInterval(slice, 6000); };
  if (document.body.classList.contains("is-loaded")) startSlicing();
  else new MutationObserver((m, o) => { if (document.body.classList.contains("is-loaded")) { o.disconnect(); startSlicing(); } })
    .observe(document.body, { attributes: true, attributeFilter: ["class"] });

  /* ── Render queues (hero card + colour page) ─────────────────── */
  const fmtTC = (f) => `00:00:${String(Math.floor(f / 25)).padStart(2, "0")}:${String(f % 25).padStart(2, "0")}`;
  $$("[data-render]").forEach((box) => {
    const btn = $(".render-btn", box), bar = $(".render-bar i", box), pct = $("[data-render-pct]", box);
    const tc = $("[data-render-tc]", box), eta = $("[data-render-eta]", box);
    const frames = box.classList.contains("render-card") ? 700 : 572;
    const label = btn.textContent;
    let running = false;
    const run = () => {
      if (running) return;
      running = true; btn.disabled = true; box.classList.remove("is-done");
      const t0 = performance.now(), dur = reduced ? 300 : 2800;
      (function step(now) {
        const t = clamp((now - t0) / dur), f = Math.round(t * frames);
        bar.style.width = (t * 100).toFixed(1) + "%";
        pct.textContent = Math.round(t * 100) + "%";
        tc.textContent = frames === 700 ? `Rendering ${fmtTC(f)} of ${fmtTC(frames)}` : `Rendering · frame ${f} / ${frames}`;
        if (eta) eta.textContent = t < 1 ? `ETA ${Math.ceil((1 - t) * dur / 1000)}s` : "";
        if (t < 1) return requestAnimationFrame(step);
        running = false; box.classList.add("is-done");
        btn.textContent = "✓ Done"; tc.textContent = frames === 700 ? "Exported · 28s · 1080×1920" : "Exported · 572 frames";
        setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 2200);
      })(t0);
    };
    btn.addEventListener("click", run);
    if (box.classList.contains("render-card") && !reduced) {
      const auto = () => setTimeout(run, 1800);
      if (document.body.classList.contains("is-loaded")) auto();
      else new MutationObserver((m, o) => { if (document.body.classList.contains("is-loaded")) { o.disconnect(); auto(); } })
        .observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  });

  /* ── 3D cursor: arrow by default, blade over the timeline ────── */
  const cursor = $(".cursor");
  if (cursor && finePointer) {
    addEventListener("pointermove", (e) => {
      const overTimeline = !!e.target.closest?.(".tl") && !e.target.closest("[data-cursor]");
      cursor.classList.toggle("is-blade", overTimeline);
    }, { passive: true });
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup", () => cursor.classList.remove("is-down"));
  }

  /* ── Work carousel: turbulent displace + RGB split on every change ── */
  const holder = document.createElement("div");
  holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="fxTurb" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feTurbulence type="turbulence" baseFrequency="0.006 0.022" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
    <feOffset in="r" dx="0" dy="0" result="r2"/>
    <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
    <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
    <feOffset in="b" dx="0" dy="0" result="b2"/>
    <feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/></filter></svg>`;
  document.body.append(holder.firstElementChild);
  const fTurb = $("#fxTurb feTurbulence"), fDisp = $("#fxTurb feDisplacementMap"), [fR, fB] = $$("#fxTurb feOffset");
  const flow = $(".flow");
  let chip;
  if (flow) { chip = document.createElement("span"); chip.className = "fx-chip"; chip.innerHTML = "<em>fx</em> Turbulent Displace <b>0.0</b>"; flow.append(chip); }
  let fxNode = null, fxStart = 0;
  document.addEventListener("flowchange", (e) => {
    if (reduced) return;
    if (fxNode && fxNode !== e.detail) fxNode.style.filter = "";
    fxNode = e.detail; fxStart = performance.now();
    fTurb.setAttribute("seed", String((Math.random() * 90) | 0));
    fxNode.style.filter = "url(#fxTurb)";
    chip?.classList.add("is-on");
    (function step(now) {
      const t = clamp((now - fxStart) / 850), k = Math.sin(Math.PI * t);
      fDisp.setAttribute("scale", (k * 38).toFixed(1));
      fR.setAttribute("dx", (-k * 7).toFixed(1)); fB.setAttribute("dx", (k * 7).toFixed(1));
      fTurb.setAttribute("baseFrequency", `${(0.006 + t * 0.002).toFixed(4)} ${(0.022 - t * 0.006).toFixed(4)}`);
      if (chip) chip.querySelector("b").textContent = (k * 38).toFixed(1);
      if (t < 1 && now - fxStart >= 0) return requestAnimationFrame(step);
      if (fxNode) fxNode.style.filter = "";
      chip?.classList.remove("is-on");
    })(fxStart);
  });

  /* ── Pop-out section parallax ────────────────────────────────── */
  const pop = watch($(".popout__scene"));
  const popRig = $(".popout__rig"), popBack = $(".popout__back"), popWord = $(".popout__word"), popSand = $(".popout__sandwich"), popStage = $(".popout__stage");

  /* ── Colour page ─────────────────────────────────────────────── */
  const viewer = $(".resolve__viewer");
  if (viewer) {
    const after = $(".resolve__after img", viewer);
    const tints = { lift: $(".tint--lift", viewer), gamma: $(".tint--gamma", viewer), gain: $(".tint--gain", viewer), offset: $(".tint--offset", viewer), vig: $(".tint--vig", viewer) };
    const WHEELS = [
      { key: "lift", name: "Lift", v: [-0.3, 0.05], s: 46, filter: (s) => `brightness(${(0.78 + s / 100 * 0.32).toFixed(2)})` },
      { key: "gamma", name: "Gamma", v: [-0.16, 0.04], s: 55, filter: (s) => `contrast(${(0.9 + s / 100 * 0.8).toFixed(2)})` },
      { key: "gain", name: "Gain", v: [0.27, -0.16], s: 52, filter: (s) => `saturate(${(0.7 + s / 100 * 1.6).toFixed(2)})` },
      { key: "offset", name: "Offset", v: [0, 0], s: 50, filter: (s) => `hue-rotate(${Math.round((s - 50) * 0.7)}deg)` },
    ];
    const nodes = { balance: true, look: true, vignette: true };
    $$(".node").forEach((n) => { nodes[n.dataset.node] = n.classList.contains("is-on") || n.dataset.node === "balance"; });
    $(".node[data-node='balance']")?.classList.add("is-on");
    const wrap = $(".wheels");
    const hsl = (h, s, l) => { const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; };
    function apply() {
      const f = WHEELS.map((w) => w.filter(w.s)).join(" ");
      after.style.setProperty("--grade", nodes.balance ? `${f} sepia(0.12)` : "none");
      WHEELS.forEach((w) => {
        const [x, y] = w.v, len = Math.min(1, Math.hypot(x, y)), hue = ((Math.atan2(-y, x) * 180) / Math.PI + 360) % 360;
        const [r, g, b] = hsl(hue, 0.9, 0.55);
        const op = { lift: 0.14, gamma: 0.42, gain: 0.95, offset: 0.22 }[w.key] * len * (nodes.look ? 1 : 0);
        tints[w.key].style.background = `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`;
        tints[w.key].style.opacity = Math.min(0.9, op * 1.6).toFixed(2);
        const vals = w.el.querySelectorAll(".wheel__vals b"), m = len * 0.12;
        [r, g, b].forEach((c, i) => { const v = (c - 0.55) * m * 2; vals[i].textContent = (v >= 0 ? "+" : "") + v.toFixed(2); });
        w.puck.style.left = 50 + x * 42 + "%"; w.puck.style.top = 50 + y * 42 + "%";
      });
      tints.vig.style.opacity = nodes.vignette ? 1 : 0;
    }
    WHEELS.forEach((w) => {
      const el = document.createElement("div");
      el.className = "wheel";
      el.innerHTML = `<div class="wheel__t">${w.name}</div><div class="wheel__ring" role="slider" aria-label="${w.name} colour wheel" tabindex="0"><div class="wheel__in"><span class="wheel__puck"></span></div></div>
        <div class="wheel__vals"><b class="r"></b><b class="g"></b><b class="b"></b></div>
        <input class="wheel__slider" type="range" min="0" max="100" value="${w.s}" aria-label="${w.name} master">`;
      wrap.append(el);
      w.el = el; w.puck = $(".wheel__puck", el);
      const ring = $(".wheel__ring", el);
      const setFrom = (e) => {
        const r = ring.getBoundingClientRect();
        let x = ((e.clientX - r.left) / r.width - 0.5) / 0.42, y = ((e.clientY - r.top) / r.height - 0.5) / 0.42;
        const L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; }
        w.v = [x, y]; apply();
      };
      ring.addEventListener("pointerdown", (e) => { ring.setPointerCapture(e.pointerId); setFrom(e); });
      ring.addEventListener("pointermove", (e) => { if (ring.hasPointerCapture(e.pointerId)) setFrom(e); });
      ring.addEventListener("dblclick", () => { w.v = [0, 0]; apply(); });
      ring.addEventListener("keydown", (e) => {
        const d = { ArrowLeft: [-0.08, 0], ArrowRight: [0.08, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key];
        if (!d) return; e.preventDefault(); w.v = [clamp(w.v[0] + d[0], -1, 1), clamp(w.v[1] + d[1], -1, 1)]; apply();
      });
      $(".wheel__slider", el).addEventListener("input", (e) => { w.s = +e.target.value; apply(); });
    });
    $$(".node").forEach((n) => n.addEventListener("click", () => {
      nodes[n.dataset.node] = !nodes[n.dataset.node]; n.classList.toggle("is-on", nodes[n.dataset.node]); apply();
    }));
    apply();
    // before/after wipe
    const wipe = $(".resolve__wipe", viewer);
    const setWipe = (pct) => { pct = clamp(pct, 0, 100); viewer.style.setProperty("--wipe", pct + "%"); wipe.setAttribute("aria-valuenow", Math.round(pct)); };
    const fromEvent = (e) => { const r = viewer.getBoundingClientRect(); setWipe(((e.clientX - r.left) / r.width) * 100); };
    viewer.addEventListener("pointerdown", (e) => { viewer.setPointerCapture(e.pointerId); fromEvent(e); });
    viewer.addEventListener("pointermove", (e) => { if (viewer.hasPointerCapture(e.pointerId)) fromEvent(e); });
    wipe.addEventListener("keydown", (e) => {
      const cur = parseFloat(getComputedStyle(viewer).getPropertyValue("--wipe")) || 46;
      if (e.key === "ArrowLeft") setWipe(cur - 4); if (e.key === "ArrowRight") setWipe(cur + 4);
    });
    // a gentle hint: the wipe sweeps once when the panel first scrolls into view
    const hint = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting || reduced) return; hint.disconnect();
      const t0 = performance.now();
      (function sweep(now) { const t = clamp((now - t0) / 1600); setWipe(46 + Math.sin(t * Math.PI * 2) * 22); if (t < 1) requestAnimationFrame(sweep); })(t0);
    }), { threshold: 0.6 });
    hint.observe(viewer);
  }

  /* ── Gaussian splat portrait (WebGL) ─────────────────────────── */
  const portrait = $(".portrait"), canvas = $(".splat");
  let splat = null;
  if (portrait && canvas) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    const img = new Image();
    img.onload = () => { try { splat = gl && initSplat(gl, img); if (splat) { portrait.classList.add("has-splat"); watch(canvas); resizeSplat(); } } catch (err) { splat = null; } };
    img.src = "assets/img/me-splat.png";
  }
  function initSplat(gl, img) {
    const SW = img.width, SH = img.height;
    const c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const cx = c.getContext("2d"); cx.drawImage(img, 0, 0);
    const px = cx.getImageData(0, 0, SW, SH).data;
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const noise = (x, y) => (Math.sin(x * 0.06 + Math.sin(y * 0.045) * 2.2) * Math.cos(y * 0.07 - x * 0.02)) * 0.5 + 0.5;
    const step = innerWidth < 700 ? 2.5 : 1.9;
    const pts = [];
    for (let y = 0; y < SH; y += step) for (let x = 0; x < SW; x += step) {
      const jx = x + (rnd() - 0.5) * step, jy = y + (rnd() - 0.5) * step;
      const i = (Math.min(SH - 1, jy | 0) * SW + Math.min(SW - 1, jx | 0)) * 4;
      if (px[i + 3] < 140) continue;
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255, lum = 0.3 * r + 0.59 * g + 0.11 * b;
      const xm = 1 - jx / SW; // dissolve sweeps in from the left and drifts left/up, away from the text
      const v = xm * 1.25 + (noise(jx, jy) - 0.5) * 0.55 + (jy / SH) * 0.08;
      const lime = rnd() < 0.55;
      pts.push([
        jx - SW / 2, jy - SH / 2, (lum - 0.5) * 32 - Math.abs(jx - SW / 2) * 0.16,          // base xyz (image px)
        -(100 + rnd() * 170), -(40 + rnd() * 100) + (rnd() - 0.5) * 40, (rnd() - 0.5) * 450, // drift offset
        v, rnd(), rnd(),                                                                    // dissolve threshold, size rand, keep rand
        r, g, b, lime ? 1 : 0,
      ]);
    }
    pts.sort((p, q) => q[2] - p[2]);
    const STRIDE = 13, data = new Float32Array(pts.length * STRIDE);
    pts.forEach((p, i) => data.set(p, i * STRIDE));
    const vs = `
      attribute vec3 aBase; attribute vec3 aOff; attribute vec3 aRnd; attribute vec4 aCol;
      uniform float uD, uYaw, uPitch, uScale, uTime, uDpr; uniform vec2 uRes, uCenter;
      varying vec3 vCol; varying float vA, vRot, vAsp;
      void main() {
        float d = smoothstep(0.0, 1.0, aRnd.x - 1.0 + uD);
        vec3 p = aBase + aOff * d * d;
        p.y += sin(uTime * 0.9 + aRnd.y * 6.283) * 3.0 * d;
        float cy = cos(uYaw), sy = sin(uYaw), cp = cos(uPitch), sp = sin(uPitch);
        vec3 q = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
        q = vec3(q.x, q.y * cp - q.z * sp, q.y * sp + q.z * cp);
        float k = 800.0 / (800.0 + q.z);
        vec2 scr = q.xy * k * uScale + uCenter;
        gl_Position = vec4(scr.x / (uRes.x * 0.5), -scr.y / (uRes.y * 0.5), 0.0, 1.0);
        float rx = (2.1 + d * 4.5 + aRnd.y * 0.9);
        gl_PointSize = rx * 3.2 * k * uScale * uDpr;
        vec3 pal = aCol.a > 0.5 ? vec3(0.784, 0.949, 0.549) : vec3(0.376, 0.502, 1.0);
        vCol = mix(aCol.rgb, pal, d * 0.55);
        vA = (0.92 - d * 0.45) * step(d * 0.62, aRnd.z);
        vRot = aRnd.y * 3.1416; vAsp = (0.7 + d * 0.5 * aRnd.z) / (1.0 + d * 0.9);
      }`;
    const fs = `
      precision mediump float;
      varying vec3 vCol; varying float vA, vRot, vAsp;
      void main() {
        if (vA <= 0.0) discard;
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float c = cos(vRot), s = sin(vRot);
        p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        p.y /= max(vAsp, 0.35);
        float r2 = dot(p, p);
        if (r2 > 1.0) discard;
        float a = vA * min(1.0, exp(-r2 * 4.2) * 0.95 + exp(-r2 * 1.6) * 0.18);
        gl_FragColor = vec4(min(vCol * 1.08, 1.0) * a, a);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const attr = (name, size, off) => { const l = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, STRIDE * 4, off * 4); };
    attr("aBase", 3, 0); attr("aOff", 3, 3); attr("aRnd", 3, 6); attr("aCol", 4, 9);
    const u = {}; ["uD", "uYaw", "uPitch", "uScale", "uTime", "uDpr", "uRes", "uCenter"].forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
    const count = $("[data-splat-count]"); if (count) count.textContent = pts.length.toLocaleString();
    return { gl, u, n: pts.length, SH, scale: 1, center: [0, 0], D: 1.1 };
  }
  function resizeSplat() {
    if (!splat) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const cr = canvas.getBoundingClientRect(), pr = portrait.getBoundingClientRect();
    splat.center = [pr.left + pr.width / 2 - (cr.left + w / 2), pr.top + pr.height * 0.52 - (cr.top + h / 2)];
    splat.scale = (pr.height * 0.98) / splat.SH;
    splat.gl.viewport(0, 0, canvas.width, canvas.height);
    splat.dpr = dpr; splat.w = w; splat.h = h;
  }
  let rs; addEventListener("resize", () => { clearTimeout(rs); rs = setTimeout(resizeSplat, 150); });

  /* ── One loop for everything above ───────────────────────────── */
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, vh = innerHeight;
    sx = lerp(sx, nx, 0.07); sy = lerp(sy, ny, 0.07);

    if (seen.get(heroStage) && !reduced) {
      for (const { el, depth, i } of tools) {
        const fy = Math.sin(t * 0.9 + i * 1.7) * 7 * depth;
        el.style.transform = `translate3d(${(sx * 16 * depth).toFixed(1)}px, ${(sy * 12 * depth + fy).toFixed(1)}px, 0) rotate(${(Math.sin(t * 0.6 + i) * 3).toFixed(2)}deg)`;
      }
    }

    if (seen.get(pop) && popRig) {
      const r = pop.getBoundingClientRect();
      const c = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1); // -1 above .. 1 below
      const small = innerWidth < 640;
      popRig.style.transform = `rotateY(${((small ? -8 : -16) + sx * 8).toFixed(2)}deg) rotateX(${((small ? 3 : 5) - sy * 5).toFixed(2)}deg)`;
      popBack.style.transform = `translate3d(${(sx * -10).toFixed(1)}px, ${(c * 90).toFixed(1)}px, -160px)`;
      popWord.style.transform = `translate3d(${(sx * -6).toFixed(1)}px, ${(c * 150).toFixed(1)}px, -60px)`;
      popStage.style.transform = `translateX(-50%) translate3d(0, ${(c * -30).toFixed(1)}px, 0)`;
      popSand.style.transform = `translateX(${(c * -90).toFixed(1)}px)`;
    }

    if (splat && seen.get(canvas)) {
      const pr = portrait.getBoundingClientRect();
      const p = clamp((vh - pr.top) / (vh * 0.9 + pr.height * 0.5));
      const targetD = reduced ? 0.15 : lerp(1.15, 0.18, ease(p)) + Math.max(0, Math.sin(t * 0.35)) * 0.06;
      splat.D = lerp(splat.D, targetD, 0.08);
      const { gl, u } = splat;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.uD, splat.D);
      gl.uniform1f(u.uYaw, 0.22 + (finePointer ? sx * 0.35 : Math.sin(t * 0.4) * 0.15));
      gl.uniform1f(u.uPitch, 0.04 + (finePointer ? sy * 0.18 : 0));
      gl.uniform1f(u.uScale, splat.scale); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uDpr, splat.dpr);
      gl.uniform2f(u.uRes, splat.w, splat.h); gl.uniform2f(u.uCenter, splat.center[0], splat.center[1]);
      gl.drawArrays(gl.POINTS, 0, splat.n);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
