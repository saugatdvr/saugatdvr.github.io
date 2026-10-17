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

  /* ── Depth portrait: turns in 3D as you scroll through the About section (layers move at different depths) ── */
  const portrait = $(".portrait"), aboutSec = $(".about");
  const layers = portrait ? $$(".pd", portrait).map((el) => ({ el, z: +el.dataset.z || 0 })) : [];
  let depthOn = false;
  if (portrait && SITE.photo) {
    const cut = new Image();
    cut.onload = () => { portrait.classList.add("has-depth"); depthOn = true; watch(aboutSec || portrait); };
    cut.src = $(".pd--subject")?.getAttribute("src") || "";
  }
  let px = 0, py = 0, mx = 0, my = 0, lastPx = 99;
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

    if (depthOn && seen.get(aboutSec || portrait)) {
      // the photo sticks while you scroll the About section, so use the section's progress (-1 → 1)
      const b = (aboutSec || portrait).getBoundingClientRect();
      const c = clamp((vh - b.top) / (vh + b.height)) * 2 - 1;
      const tx = (reduced ? 0 : c) + mx * 0.25, ty = (reduced ? 0 : -c * 0.6) + my * 0.2;
      px = lerp(px, tx, 0.1); py = lerp(py, ty, 0.1);
      if (Math.abs(px - lastPx) > 0.0008 || Math.abs(py) > 0.0008) {
        lastPx = px;
        portrait.style.transform = `rotateY(${(px * 18).toFixed(2)}deg) rotateX(${(-py * 10).toFixed(2)}deg)`;
        for (const { el, z } of layers) el.style.transform = `translateZ(${z}px) translate(${(px * z * -0.3).toFixed(1)}px, ${(py * z * -0.2).toFixed(1)}px)`;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
