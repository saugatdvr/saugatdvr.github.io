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
  let manWords = [];
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

  /* ── Depth portrait ── */
  const portrait = $(".portrait");
  const layers = portrait ? $$(".pd", portrait).map((el) => ({ el, z: +el.dataset.z || 0 })) : [];
  const xray = $(".pd--xray"), lens = $(".pd__lens");
  let depthOn = false;
  if (portrait && SITE.photo && xray) {
    const test = new Image();
    test.onload = () => { portrait.classList.add("has-depth"); depthOn = true; watch(portrait); };
    test.src = "assets/img/me-cutout.png";
    $(".pd--name").textContent = SITE.name || "";
  }
  let px = 0, py = 0, tx = 0, ty = 0, hover = false, mxp = 50, myp = 45, r = 0;
  if (portrait && finePointer) {
    portrait.addEventListener("pointermove", (e) => {
      const b = portrait.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width) * 2 - 1; ty = ((e.clientY - b.top) / b.height) * 2 - 1;
      mxp = ((e.clientX - b.left) / b.width) * 100; myp = ((e.clientY - b.top) / b.height) * 100;
      hover = true;
    });
    portrait.addEventListener("pointerleave", () => { hover = false; tx = 0; ty = 0; });
  }

  /* ── One loop ── */
  let lastOn = -1;
  const t0 = performance.now();
  function frame(now) {
    const vh = innerHeight, t = (now - t0) / 1000;

    if (seen.get(man) && manWords.length) {
      const b = man.getBoundingClientRect();
      const p = clamp(-b.top / Math.max(1, b.height - vh));
      const on = Math.round(clamp(p * 1.2) * manWords.length);
      if (on !== lastOn) { manWords.forEach((w, i) => w.classList.toggle("on", i < on)); lastOn = on; }
      manText.style.transform = `translateY(${((0.5 - p) * 26).toFixed(2)}vh)`;
    }

    if (seen.get(sign) && rows.length) {
      const b = sign.getBoundingClientRect();
      const c = clamp((vh - b.top) / (vh + b.height)); // 0 entering → 1 leaving
      const drift = reduced ? 0 : t * 1.2;
      rows[0].parentElement.style.transform = `translateX(${(-12 - c * 28 - drift % 30).toFixed(2)}vw)`;
      rows[1].parentElement.style.transform = `translateX(${(-58 + c * 28 + drift % 30).toFixed(2)}vw)`;
    }

    if (depthOn && seen.get(portrait)) {
      if (!finePointer && !reduced) { tx = Math.sin(t * 0.6) * 0.5; ty = Math.sin(t * 0.45) * 0.25; }
      px = lerp(px, tx, 0.08); py = lerp(py, ty, 0.08);
      portrait.style.transform = `rotateY(${(px * 14).toFixed(2)}deg) rotateX(${(-py * 10).toFixed(2)}deg)`;
      for (const { el, z } of layers) el.style.transform = `translateZ(${z}px) translate(${(px * z * -0.08).toFixed(1)}px, ${(py * z * -0.06).toFixed(1)}px)`;
      // x-ray lens follows the cursor; on touch it slowly sweeps across the face
      let targetR = hover ? 120 : 0;
      if (!finePointer && !reduced) { targetR = 90; mxp = 48 + Math.cos(t * 0.7) * 14; myp = 55 + Math.sin(t * 0.9) * 10; }
      r = lerp(r, targetR, 0.12);
      for (const n of [xray, lens]) {
        n.style.setProperty("--r", r.toFixed(1) + "px");
        n.style.setProperty("--mx", mxp.toFixed(1) + "%");
        n.style.setProperty("--my", myp.toFixed(1) + "%");
      }
      lens.style.opacity = clamp(r / 60).toFixed(2);
      portrait.classList.toggle("is-xray", r > 30);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
