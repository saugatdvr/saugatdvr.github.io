/* Extra effects on top of main.js: manifesto words that light up on scroll,
   sign-off marquee rows + hand-drawn signature, and the depth portrait (mouse tilt + x-ray reveal). */
(() => {
  const SITE = window.SITE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  const seen = new Map();
  const io = new IntersectionObserver((es) => es.forEach((e) => seen.set(e.target, e.isIntersecting)), { rootMargin: "100px" });
  const watch = (el) => { if (el) { seen.set(el, false); io.observe(el); } return el; };

  /* ── Manifesto: *word* = lime italic accent ── */
  const man = watch($(".manifesto")), manText = $(".manifesto__text");
  let manWords = [], manLines = [], wordHTML = "";
  if (man && manText) {
    const src = SITE.manifesto || "";
    // split into words; punctuation right after an accent word sticks to it (no stray space)
    const tokens = [];
    src.split(/(\*[^*]+\*)/).filter(Boolean).forEach((part) => {
      const accent = part.startsWith("*");
      part.replace(/\*/g, "").split(/\s+/).filter(Boolean).forEach((w, i) => {
        if (!accent && i === 0 && /^[,.;:!?]/.test(w) && tokens.length) {
          const punct = w.match(/^[,.;:!?]+/)[0];
          tokens[tokens.length - 1].tail = punct; w = w.slice(punct.length);
          if (!w) return;
        }
        tokens.push({ w, accent });
      });
    });
    manText.innerHTML = tokens.map((t) => `<span class="w${t.accent ? " w--accent" : ""}">${esc(t.w)}${t.tail ? `<span class="w__p">${esc(t.tail)}</span>` : ""}</span>`).join(" ");
    manWords = $$(".w", manText);
    buildLines();
    document.fonts?.ready.then(buildLines);
    let rl; addEventListener("resize", () => { clearTimeout(rl); rl = setTimeout(buildLines, 200); });
  }

  // group the words into the lines the browser actually wrapped them onto, and give each line a lime block
  function buildLines() {
    if (!manText) return;
    if (!wordHTML) wordHTML = manText.innerHTML;
    manText.innerHTML = wordHTML;
    const words = $$(":scope > .w", manText), rows = [];
    let top = null;
    words.forEach((w) => {
      const t = Math.round(w.offsetTop);
      if (top === null || Math.abs(t - top) > 4) { rows.push([]); top = t; }
      rows[rows.length - 1].push(w.outerHTML);
    });
    manText.innerHTML = rows.map((r) => `<span class="ln"><span class="ln__in">${r.join(" ")}</span><i class="ln__block"></i></span>`).join("");
    manLines = $$(".ln", manText).map((el) => ({ inner: $(".ln__in", el), block: $(".ln__block", el), q: -1 }));
  }

  /* ── Sign-off: rows, signature ── */
  const sign = watch($(".signoff"));
  const rows = $$(".signoff__row span");
  const so = SITE.signoff || {};
  if (rows[0]) rows[0].textContent = (" " + (so.rowOne || "") + " ").repeat(4);
  if (rows[1]) rows[1].textContent = (" " + (so.rowTwo || "") + " ").repeat(4);
  const sigText = $(".signoff__sig text");
  if (sigText) sigText.textContent = so.signature || SITE.name || "";
  if (sign) {
    const once = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { sign.classList.add("is-signed"); once.disconnect(); }
    }), { rootMargin: "-30% 0px -30% 0px" });
    once.observe(sign);
  }

  /* ── Depth portrait: tilts with the page scroll, soft splat particles drift off the edges ── */
  const portrait = $(".portrait");
  const layers = portrait ? $$(".pd", portrait).map((el) => ({ el, z: +el.dataset.z || 0 })) : [];
  const splatCv = $(".pd--splats"), sctx = splatCv?.getContext("2d");
  let depthOn = false, splats = [];
  if (portrait && SITE.photo) {
    const cut = new Image();
    cut.onload = () => {
      portrait.classList.add("has-depth"); depthOn = true; watch(portrait);
      if (sctx) splats = makeSplats(cut);
      sizeSplats();
    };
    cut.src = "assets/img/me-cutout.png";
    const name = $(".pd--name"); if (name) name.textContent = SITE.name || "";
  }
  // pick points along the edge of the cut-out (hair, shoulders) and give each a drift direction
  function makeSplats(img) {
    const W = 200, H = 250, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, W, H);
    let d; try { d = x.getImageData(0, 0, W, H).data; } catch (e) { return []; }
    const a = (i, j) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : d[(j * W + i) * 4 + 3]);
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out = [], n = innerWidth < 700 ? 70 : 130;
    for (let k = 0; k < 60000 && out.length < n; k++) {
      const i = (rnd() * W) | 0, j = (rnd() * H * 0.9) | 0;
      if (a(i, j) < 150) continue;
      if (a(i - 4, j) > 40 && a(i + 4, j) > 40 && a(i, j - 4) > 40 && a(i, j + 4) > 40) continue; // only edges
      const o = (j * W + i) * 4;
      const dx = i / W - 0.5, dy = j / H - 0.45, len = Math.hypot(dx, dy) || 1;
      out.push({ u: i / W, v: j / H, ox: dx / len, oy: dy / len, far: 0.25 + rnd() * 1.1, ph: rnd() * 6.28,
        s: 0.8 + rnd() * 1.9, c: `${Math.min(255, d[o] + 60)},${Math.min(255, d[o + 1] + 60)},${Math.min(255, d[o + 2] + 70)}`, tint: rnd() < 0.07 ? "200,242,140" : null });
    }
    return out;
  }
  let sw = 0, sh = 0, sdpr = 1;
  function sizeSplats() {
    if (!splatCv) return;
    sdpr = Math.min(devicePixelRatio || 1, 2);
    sw = splatCv.clientWidth; sh = splatCv.clientHeight;
    splatCv.width = Math.round(sw * sdpr); splatCv.height = Math.round(sh * sdpr);
  }
  addEventListener("resize", sizeSplats);
  let px = 0, py = 0, mx = 0, my = 0, lastSy = scrollY, vel = 0;
  if (portrait && finePointer) {
    portrait.addEventListener("pointermove", (e) => {
      const b = portrait.getBoundingClientRect();
      mx = ((e.clientX - b.left) / b.width) * 2 - 1; my = ((e.clientY - b.top) / b.height) * 2 - 1;
    });
    portrait.addEventListener("pointerleave", () => { mx = 0; my = 0; });
  }

  /* ── One loop ── */
  let lastOn = -1;
  const t0 = performance.now();
  function frame(now) {
    const vh = innerHeight, t = (now - t0) / 1000;

    if (seen.get(man) && manLines.length) {
      const b = man.getBoundingClientRect();
      const p = clamp(-b.top / Math.max(1, b.height - vh));
      const L = manLines.length;
      manLines.forEach((ln, i) => {
        // each line: a solid lime bar first, then the bar retracts left → right to reveal the words
        const q = reduced ? 1 : clamp((p - (i / L) * 0.7) / 0.24);
        if (Math.abs(q - ln.q) < 0.002) return;
        ln.q = q;
        ln.inner.style.clipPath = `inset(-0.2em ${((1 - q) * 100).toFixed(2)}% -0.2em 0)`;
        ln.block.style.transform = `scaleX(${(1 - q).toFixed(4)})`;
      });
      manText.style.transform = `translateY(${((0.5 - p) * 22).toFixed(2)}vh)`;
    }

    if (seen.get(sign) && rows.length) {
      const b = sign.getBoundingClientRect();
      const c = clamp((vh - b.top) / (vh + b.height)); // 0 entering → 1 leaving
      const drift = reduced ? 0 : t * 1.2;
      rows[0].parentElement.style.transform = `translateX(${(-12 - c * 28 - drift % 30).toFixed(2)}vw)`;
      rows[1].parentElement.style.transform = `translateX(${(-58 + c * 28 + drift % 30).toFixed(2)}vw)`;
    }

    vel = lerp(vel, clamp((scrollY - lastSy) / 16, -3, 3), 0.1); lastSy = scrollY;
    if (depthOn && seen.get(portrait)) {
      // c: -1 when the portrait is low on screen → 1 when it has scrolled up past the middle
      const b = portrait.getBoundingClientRect();
      const c = clamp((vh / 2 - (b.top + b.height / 2)) / (vh / 2), -1, 1);
      const tx = (reduced ? 0 : c * 0.85) + mx * 0.35, ty = (reduced ? 0 : -c * 0.7) + my * 0.3;
      px = lerp(px, tx, 0.09); py = lerp(py, ty, 0.09);
      portrait.style.transform = `rotateY(${(px * 16).toFixed(2)}deg) rotateX(${(-py * 12).toFixed(2)}deg)`;
      for (const { el, z } of layers) el.style.transform = `translateZ(${z}px) translate(${(px * z * -0.1).toFixed(1)}px, ${(py * z * -0.08).toFixed(1)}px)`;

      if (sctx && splats.length) {
        sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
        sctx.clearRect(0, 0, sw, sh);
        // the portrait occupies the middle of the canvas (canvas is 160% × 140% of it)
        const pw = sw / 1.6, ph = sh / 1.4, ox = sw * 0.1875, oy = sh * 0.157;
        const spread = 0.35 + Math.abs(c) * 0.9 + Math.abs(vel) * 0.35;
        for (const p of splats) {
          const drift = (reduced ? 0.4 : spread) * p.far * 60;
          const wob = reduced ? 0 : Math.sin(t * 0.8 + p.ph) * 4;
          const x = ox + p.u * pw + p.ox * drift + wob;
          const y = oy + p.v * ph + p.oy * drift - vel * 10 * p.far + Math.cos(t * 0.7 + p.ph) * 3;
          const alpha = clamp(0.55 - drift / 200, 0.08, 0.55);
          sctx.fillStyle = `rgba(${p.tint || p.c},${alpha.toFixed(2)})`;
          sctx.beginPath(); sctx.ellipse(x, y, p.s * 1.4, p.s, p.ph, 0, 6.283); sctx.fill();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
