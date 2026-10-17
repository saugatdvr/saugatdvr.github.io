/* Portfolio interactions — plain JS, no build step. Text lives in content.js, work list in works.js. */
(() => {
  const SITE = window.SITE || {};
  const info = SITE.workInfo || {};
  const WORKS = (window.WORKS || []).map((w, i) => ({ ...w, ...(info[w.slug] || {}), _i: i }))
    .sort((a, b) => (info[a.slug]?.order ?? 1e3 + a._i) - (info[b.slug]?.order ?? 1e3 + b._i));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const finePointer = matchMedia("(pointer: fine)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isVertical = (w) => (w.h || 16) >= (w.w || 9);

  function makeVideo(src, poster, { autoplay = false } = {}) {
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.preload = autoplay ? "auto" : "none";
    if (poster) v.poster = poster;
    if (src) v.dataset.src = src;
    return v;
  }
  const load = (v) => { if (v.dataset.src && !v.src) v.src = v.dataset.src; };
  const play = (v) => { load(v); const p = v.play(); if (p) p.catch(() => {}); };

  /* ── Text from content.js ── */
  const fill = (attr, obj) => $$(`[data-${attr}]`).forEach((n) => {
    const key = n.dataset[attr];
    const val = Array.isArray(obj) ? obj[+key] : obj?.[key];
    if (val != null) n.textContent = val;
  });
  fill("site", SITE); fill("hero", SITE.hero); fill("cta", SITE.cta); fill("services", SITE.services);
  fill("skills", SITE.skillsTitle); fill("about", SITE.about?.title);
  $(".year").textContent = new Date().getFullYear();
  if (SITE.fullName) document.title = `${SITE.fullName} — ${SITE.role || "Video Editor"}`;

  /* ── Loader ── */
  const loader = { num: $(".loader__num"), bar: $(".loader__bar span") };
  const t0 = performance.now();
  // wait for fonts (not the videos) so the loader never hangs on a slow connection
  let pageLoaded = false;
  (document.fonts?.ready || Promise.resolve()).then(() => (pageLoaded = true));
  setTimeout(() => (pageLoaded = true), 2200);
  if (/[?&]skip\b/.test(location.search)) { document.body.classList.add("is-loaded"); document.body.classList.remove("is-loading"); $(".loader").style.display = "none"; }
  else (function tick() {
    const t = clamp((performance.now() - t0) / 1300);
    const shown = pageLoaded ? t : Math.min(t, 0.9);
    const pct = Math.round(ease(shown) * 100);
    loader.num.textContent = pct; loader.bar.style.width = pct + "%";
    if (shown < 1) return requestAnimationFrame(tick);
    document.body.classList.add("is-loaded");
    document.body.classList.remove("is-loading");
    introStart = performance.now();
  })();
  let introStart = document.body.classList.contains("is-loaded") ? -1e4 : Infinity;

  /* ── Clients marquee ── */
  const clients = SITE.clients || [];
  if (clients.length) {
    const track = $(".clients__track");
    const row = clients.map((c) => `<span>${esc(c)}</span>`).join("");
    track.innerHTML = row.repeat(Math.max(2, Math.ceil(8 / clients.length)) * 2);
  } else $(".clients").remove();

  /* ── Kinetic word tiles on a curved wall ── */
  const STYLES = { cut: "k-cut", rise: "k-rise", captions: "k-captions", glow: "k-glow", kinetic: "k-kinetic",
    colour: "k-colour", color: "k-colour", sound: "k-sound", story: "k-story", shine: "k-shine", motion: "k-motion" };
  const FALLBACK = ["k-rise", "k-glow", "k-kinetic", "k-colour", "k-story", "k-shine", "k-motion", "k-cut"];
  const chars = (w) => [...w].map((c, i) => `<span class="ch" style="--i:${i}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
  function tileHTML(word, i) {
    const cls = STYLES[word.toLowerCase()] || FALLBACK[i % FALLBACK.length];
    if (cls === "k-sound") return `<span class="kw k-sound">${esc(word)}<span class="eq">${"<i></i>".repeat(5).replace(/<i>/g, (m, o) => `<i style="--i:${o}">`)}</span></span>`;
    const inner = ["k-rise", "k-kinetic", "k-story"].includes(cls) ? chars(word) : esc(word);
    return `<span class="kw ${cls}" data-t="${esc(word)}">${inner}</span>`;
  }
  const curve = $(".curve"), curveTrack = $(".curve__track");
  const words = SITE.skills?.length ? SITE.skills : ["Edit"];
  let tiles = [], tileW = 0, gap = 18, loopW = 0, curveX = 0;
  function buildTiles() {
    curveTrack.innerHTML = "";
    const probe = el("div", "tile"); curveTrack.append(probe); tileW = probe.offsetWidth; probe.remove();
    const per = tileW + gap;
    const reps = Math.max(1, Math.ceil((innerWidth * 1.6) / (words.length * per)));
    const list = Array.from({ length: reps }, () => words).flat();
    loopW = list.length * per;
    tiles = list.map((w, i) => { const t = el("div", "tile", tileHTML(w, i % words.length)); curveTrack.append(t); return t; });
  }
  buildTiles();

  /* ── Stats ── */
  const stats = $(".stats");
  (SITE.stats || []).forEach((s) => stats.append(el("div", "stat", `<b><span class="num" data-to="${esc(s.value)}">0</span>${s.plus ? "<sup>+</sup>" : ""}</b><span>${esc(s.label)}</span>`)));

  /* ── Services bento ── */
  const ICONS = {
    reel: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M3 16h18M8 3v5M16 3v5M8 16v5M16 16v5"/></svg>',
    motion: '<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5" opacity=".5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0"/></svg>',
  };
  const bento = $(".bento");
  const svc = SITE.services?.items || [];
  svc.forEach((s, i) => {
    const c = el("button", "bento__card",
      `<div><div class="bento__label">${esc(s.label)}</div><div class="bento__value">${esc(s.value)}</div></div>
       <div class="bento__foot"><span class="bento__icon">${ICONS[s.icon] || ICONS.spark}</span><p class="bento__text">${esc(s.text)}</p></div>`);
    c.type = "button";
    const activate = () => $$(".bento__card").forEach((x) => x.classList.toggle("is-active", x === c));
    c.addEventListener("mouseenter", activate); c.addEventListener("focus", activate); c.addEventListener("click", activate);
    bento.append(c);
  });
  bento.children[Math.min(2, svc.length - 1)]?.classList.add("is-active");

  /* ── About: scrubbed paragraph, experience, tools ── */
  const scrub = $(".scrub");
  scrub.innerHTML = (SITE.about?.text || "").split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  const scrubWords = $$(".w", scrub);
  const xp = $(".xp");
  (SITE.experience || []).forEach((x) => {
    const li = el("li", "", `<span class="xp__period">${esc(x.period)}</span><h3 class="xp__role">${esc(x.role)} <span>· ${esc(x.company)}</span></h3><p class="xp__text">${esc(x.text)}</p>`);
    li.setAttribute("data-reveal", ""); xp.append(li);
  });
  $(".tools").innerHTML = (SITE.tools || []).map((t) => `<span>${esc(t)}</span>`).join("");
  const portrait = $(".portrait");
  if (SITE.photo) { const img = new Image(); img.src = SITE.photo; img.alt = SITE.fullName || ""; portrait.prepend(img); $(".portrait__initial").remove(); $(".orb--c")?.remove(); }
  else $(".portrait__initial").textContent = (SITE.name || "S")[0];

  /* ── CTA links + form ── */
  const links = [];
  if (SITE.email) links.push(`<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`);
  if (SITE.whatsapp) links.push(`<a href="https://wa.me/${esc(SITE.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (SITE.instagram) links.push(`<a href="${esc(SITE.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  if (SITE.linkedin) links.push(`<a href="${esc(SITE.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
  $(".cta__links").innerHTML = links.join("");
  $(".cta__form").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = e.target.msg.value.trim();
    location.href = `mailto:${SITE.email || ""}?subject=${encodeURIComponent("New project enquiry")}&body=${encodeURIComponent(msg)}`;
  });

  /* ── Lightbox ── */
  const lb = $(".lightbox"), lbMedia = $(".lightbox__media"), lbCap = $(".lightbox__caption");
  function openWork(w) {
    if (!w) return;
    lbMedia.innerHTML = "";
    if (w.type === "video") {
      const v = document.createElement("video");
      v.src = w.src; v.poster = w.poster || ""; v.controls = true; v.autoplay = true; v.playsInline = true;
      lbMedia.append(v); v.play().catch(() => {});
    } else { const img = new Image(); img.src = w.src; img.alt = w.title || ""; lbMedia.append(img); }
    lbCap.innerHTML = `${w.client ? `<em>${esc(w.client)}</em>` : ""}${esc(w.title || "")}`;
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.style.overflow = "hidden";
  }
  function closeWork() {
    lb.classList.remove("is-open"); document.body.style.overflow = "";
    setTimeout(() => { lb.hidden = true; lbMedia.innerHTML = ""; }, 400);
  }
  $(".lightbox__close").addEventListener("click", closeWork);
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === lbMedia) closeWork(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeWork(); });

  /* ── Hero: fanned 3D cards ── */
  const fan = $(".fan");
  const heroWorks = [...WORKS.filter(isVertical), ...WORKS.filter((w) => !isVertical(w))].slice(0, 5);
  const POSES = [
    { x: -1.12, y: 0.3, rz: -12, ry: 18, z: -140 },
    { x: -0.5, y: 0.1, rz: -5, ry: 10, z: -50 },
    { x: 0.14, y: -0.06, rz: 2, ry: 0, z: 30 },
    { x: 0.76, y: -0.2, rz: 8, ry: -10, z: -40 },
    { x: 1.36, y: -0.36, rz: 14, ry: -18, z: -130 },
  ];
  const fanCards = heroWorks.map((w, i) => {
    const c = el("figure", "fan__card");
    if (w.type === "video") c.append(makeVideo(w.loop || w.src, w.poster, { autoplay: true }));
    else { const img = new Image(); img.src = w.src; img.alt = ""; c.append(img); }
    c.dataset.cursor = "Play";
    c.addEventListener("click", () => openWork(w));
    fan.append(c);
    return { node: c, pose: POSES[i + Math.floor((5 - heroWorks.length) / 2)] || POSES[2] };
  });

  /* ── Work coverflow ── */
  const stage = $(".flow__stage"), flow = $(".flow");
  let slides = [], active = 0;
  if (WORKS.length) {
    const reps = Math.ceil(7 / WORKS.length);
    const list = Array.from({ length: Math.max(1, reps) }, () => WORKS).flat();
    slides = list.map((w, i) => {
      const s = el("div", "slide");
      s.style.aspectRatio = `${w.w || 9} / ${w.h || 16}`;
      if (!isVertical(w)) s.style.height = "56%";
      const media = w.type === "video" ? makeVideo(w.loop || w.src, w.poster) : Object.assign(new Image(), { src: w.src, alt: w.title || "" });
      s.append(media);
      s.append(el("span", "slide__tag", w.type === "video" ? (isVertical(w) ? "Reel" : "Film") : "Design"));
      stage.append(s);
      return { node: s, media, work: w, real: i % WORKS.length };
    });
    $(".flow__total").textContent = String(WORKS.length).padStart(2, "0");
  } else {
    $(".flow").innerHTML = '<p class="work__hint">Add videos to the "best work" folder and run "Update my work" to fill this section.</p>';
    $(".flow__info").remove();
  }
  function layoutFlow(swap = true) {
    const n = slides.length; if (!n) return;
    const unit = (flow.offsetHeight * 0.92 * 9) / 16;
    slides.forEach((s, i) => {
      let d = i - active;
      if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      const a = Math.abs(d), sgn = Math.sign(d);
      const x = a === 0 ? 0 : sgn * (unit * 0.78 + (a - 1) * unit * 0.5);
      s.node.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${-a * 170}px) rotateY(${-sgn * Math.min(a, 1) * 36}deg)`;
      s.node.style.opacity = a > 3 ? 0 : 1;
      s.node.style.visibility = a > 4 ? "hidden" : "";
      s.node.style.setProperty("--dim", a === 0 ? 0 : Math.min(0.8, 0.38 + (a - 1) * 0.2));
      s.node.style.zIndex = 10 - a;
      s.node.style.pointerEvents = a > 2 ? "none" : "";
      s.node.classList.toggle("is-center", a === 0);
      s.node.dataset.cursor = a === 0 ? "Play" : "";
      if (s.media.tagName === "VIDEO") { if (a === 0 && flowVisible) play(s.media); else s.media.pause(); }
    });
    const w = slides[active].work;
    $(".flow__index").textContent = String(slides[active].real + 1).padStart(2, "0");
    const text = $(".flow__text");
    $(".flow__client").textContent = w.client || (w.type === "video" ? (isVertical(w) ? "Short-form reel" : "Brand film") : "Design");
    $(".flow__title").textContent = w.title || "";
    if (swap) { text.classList.remove("swap"); void text.offsetWidth; text.classList.add("swap"); }
  }
  let flowVisible = false;
  const go = (step) => { if (!slides.length) return; active = (active + step + slides.length) % slides.length; layoutFlow(); };
  $(".flow__arrow--prev")?.addEventListener("click", () => go(-1));
  $(".flow__arrow--next")?.addEventListener("click", () => go(1));
  $(".flow__play")?.addEventListener("click", () => openWork(slides[active]?.work));
  addEventListener("keydown", (e) => {
    if (!flowVisible || !lb.hidden) return;
    if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1);
  });
  // drag / swipe
  let dragX = null, dragged = false;
  flow.addEventListener("pointerdown", (e) => { dragX = e.clientX; dragged = false; });
  addEventListener("pointermove", (e) => {
    if (dragX == null) return;
    const dx = e.clientX - dragX;
    if (Math.abs(dx) > 60) { go(dx < 0 ? 1 : -1); dragX = e.clientX; dragged = true; }
  });
  addEventListener("pointerup", () => { dragX = null; });
  slides.forEach((s, i) => s.node.addEventListener("click", () => {
    if (dragged) return;
    if (i === active) openWork(s.work); else { active = i; layoutFlow(); }
  }));
  layoutFlow(false);

  /* ── CTA phone ── */
  const phoneVideo = $(".phone video");
  const phoneWork = WORKS.filter(isVertical)[1] || WORKS[0];
  if (phoneWork?.type === "video") { phoneVideo.dataset.src = phoneWork.loop || phoneWork.src; phoneVideo.poster = phoneWork.poster || ""; phoneVideo.muted = true; }
  else $(".phone").style.display = "none";

  /* ── 3D editing timeline ── */
  const tl = $(".tl"), rig = $(".tl__rig"), tracksEl = $(".tl__tracks"), playhead = $(".tl__playhead");
  const monImg = $(".tl__screen img"), monCap = $(".tl__caption"), monTc = $(".tl__tc");
  const posters = WORKS.filter((w) => w.poster).map((w) => w.poster);
  const pick = (i) => posters.length ? posters[i % posters.length] : "";
  const TRACKS = [
    { name: "V3 TITLE", type: "title", clips: [[2, 16, "HOOK", "Stop <em>scrolling.</em>"], [30, 20, "CAPTION", "Every cut <em>on beat</em>"], [62, 14, "STAT", "<em>3×</em> watch time"], [82, 16, "CTA", "Link in <em>bio</em>"]] },
    { name: "V2 MOTION", type: "fx", clips: [[8, 22, "Kinetic type"], [44, 18, "UI cards"], [70, 26, "Logo reveal"]] },
    { name: "V1 VIDEO", type: "video", clips: [[0, 26, "A-roll"], [26, 18, "B-roll"], [44, 24, "Product"], [68, 32, "Talking head"]] },
    { name: "A1 VOICE", type: "audio", clips: [[0, 58], [60, 40]] },
    { name: "A2 MUSIC", type: "music", clips: [[0, 100]] },
  ];
  const wave = (n, seed) => Array.from({ length: n }, (_, i) => `<b style="--a:${(0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 + seed) * Math.cos(i * 0.31 + seed * 2))).toFixed(2)}"></b>`).join("");
  const ruler = $(".tl__ruler");
  ruler.innerHTML = [0, 5, 10, 15, 20, 25, 30].map((t) => `<span style="left:${(t / 30) * 100}%">00:${String(t).padStart(2, "0")}</span>`).join("");
  const liveClips = [];
  TRACKS.forEach((t, ti) => {
    const row = el("div", "tl__track", `<span class="tl__name">${t.name}</span>`);
    const lane = el("div", "tl__lane");
    t.clips.forEach(([start, len, label, caption], ci) => {
      const c = el("div", `clip clip--${t.type === "music" ? "audio clip--music" : t.type}`);
      c.style.left = start + "%"; c.style.width = `calc(${len}% - 3px)`;
      if (t.type === "title") c.textContent = label;
      else if (t.type === "fx") c.innerHTML = `<i></i>${esc(label)}<i></i>`;
      else if (t.type === "video") { c.innerHTML = `<span>${esc(label)}</span>`; const img = pick(ci); if (img) c.style.backgroundImage = `url("${img}")`; }
      else c.innerHTML = wave(Math.round(len * 1.1), ti * 3 + ci);
      lane.append(c);
      liveClips.push({ node: c, start, end: start + len, type: t.type, caption, poster: t.type === "video" ? pick(ci) : null });
    });
    row.append(lane); tracksEl.append(row);
  });
  let tlP = 0, tlHover = null, lastPoster = "", lastCap = "", tlLaneW = 0;
  const measureLane = () => (tlLaneW = tracksEl.querySelector(".tl__lane").offsetWidth);
  function setPlayhead(p) {
    tlP = clamp(p);
    playhead.style.transform = `translateX(${tlP * (tlLaneW || measureLane())}px)`;
    const pct = tlP * 100;
    let cap = "", poster = "";
    liveClips.forEach((c) => {
      const live = pct >= c.start && pct < c.end;
      c.node.classList.toggle("is-live", live);
      if (live && c.type === "title") cap = c.caption;
      if (live && c.type === "video") poster = c.poster;
    });
    if (poster && poster !== lastPoster) { monImg.src = poster; lastPoster = poster; }
    if (cap !== lastCap) {
      monCap.classList.add("is-off");
      setTimeout(() => { monCap.innerHTML = cap; monCap.classList.toggle("is-off", !cap); }, 120);
      lastCap = cap;
    }
    const frames = Math.round(tlP * 30 * 25);
    monTc.textContent = `00:00:${String(Math.floor(frames / 25)).padStart(2, "0")}:${String(frames % 25).padStart(2, "0")}`;
  }
  tl.addEventListener("pointermove", (e) => {
    const lane = tracksEl.querySelector(".tl__lane").getBoundingClientRect();
    if (e.pointerType === "mouse") tlHover = (e.clientX - lane.left) / lane.width;
  });
  tl.addEventListener("pointerleave", () => (tlHover = null));
  liveClips.forEach((c) => c.node.addEventListener("click", () => setPlayhead((c.start + 0.5) / 100)));
  setPlayhead(0.1);

  /* ── Graph editor (drag the bezier handles) ── */
  const svg = $(".graph__svg"), curvePath = $(".graph__curve"), handles = $$(".graph__handle"), arms = $$(".graph__arm");
  const ball = $(".graph__ball"), gVal = $(".graph__val"), presets = $$(".graph__presets button");
  $(".graph__grid").innerHTML = [0, 50, 100, 150, 200].map((v) => `<line x1="${v}" y1="0" x2="${v}" y2="200"/><line x1="0" y1="${v}" x2="200" y2="${v}"/>`).join("")
    + '<line class="graph__axis" x1="0" y1="200" x2="200" y2="200"/><line class="graph__axis" x1="0" y1="0" x2="0" y2="200"/>';
  let bez = [0.7, 0, 0.2, 1];
  const fmt = (n) => +n.toFixed(2);
  function drawGraph() {
    const [x1, y1, x2, y2] = bez, P1 = [x1 * 200, 200 - y1 * 200], P2 = [x2 * 200, 200 - y2 * 200];
    curvePath.setAttribute("d", `M0 200 C${P1} ${P2} 200 0`);
    handles[0].setAttribute("cx", P1[0]); handles[0].setAttribute("cy", P1[1]);
    handles[1].setAttribute("cx", P2[0]); handles[1].setAttribute("cy", P2[1]);
    arms[0].setAttribute("x1", 0); arms[0].setAttribute("y1", 200); arms[0].setAttribute("x2", P1[0]); arms[0].setAttribute("y2", P1[1]);
    arms[1].setAttribute("x1", 200); arms[1].setAttribute("y1", 0); arms[1].setAttribute("x2", P2[0]); arms[1].setAttribute("y2", P2[1]);
    gVal.textContent = `cubic-bezier(${bez.map(fmt).join(", ")})`;
    ball.style.transitionTimingFunction = `cubic-bezier(${bez.join(",")})`;
  }
  let dragH = null;
  const toGraph = (e) => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const g = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [clamp(g.x / 200), clamp((200 - g.y) / 200, -0.3, 1.3)];
  };
  handles.forEach((h, i) => {
    h.addEventListener("pointerdown", (e) => { dragH = i; h.classList.add("is-drag"); h.setPointerCapture(e.pointerId); e.preventDefault(); });
    h.addEventListener("pointermove", (e) => {
      if (dragH !== i) return;
      const [x, y] = toGraph(e);
      bez[i * 2] = x; bez[i * 2 + 1] = y;
      presets.forEach((b) => b.classList.remove("is-on"));
      drawGraph();
    });
    h.addEventListener("pointerup", () => { dragH = null; h.classList.remove("is-drag"); });
    h.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
      if (!step) return; e.preventDefault();
      bez[i * 2] = clamp(bez[i * 2] + step[0]); bez[i * 2 + 1] = clamp(bez[i * 2 + 1] + step[1], -0.3, 1.3); drawGraph();
    });
  });
  presets.forEach((b) => b.addEventListener("click", () => {
    bez = b.dataset.p.split(",").map(Number);
    presets.forEach((x) => x.classList.toggle("is-on", x === b)); drawGraph();
  }));
  drawGraph();
  // the ball ping-pongs between two keyframes using the current curve
  let ballSide = false, graphVisible = false;
  ball.style.transition = "transform 1.1s";
  setInterval(() => {
    if (!graphVisible || document.hidden) return;
    ballSide = !ballSide;
    const travel = ball.parentElement.offsetWidth - 34;
    ball.style.transform = `translateX(${ballSide ? travel : 0}px)`;
  }, 1500);

  /* ── Play/pause videos by visibility ── */
  const inView = new Map();
  const vis = new IntersectionObserver((entries) => entries.forEach((en) => {
    const t = en.target;
    inView.set(t, en.isIntersecting);
    if (t === flow) { flowVisible = en.isIntersecting; layoutFlow(false); return; }
    if (t === tl || t === curve || t === scrub || t === $(".graph")) { if (t.classList.contains("graph")) graphVisible = en.isIntersecting; return; }
    $$("video", t).forEach((v) => (en.isIntersecting ? play(v) : v.pause()));
  }), { rootMargin: "100px" });
  [$(".hero__stage"), $(".cta__visual"), flow, tl, curve, scrub, $(".graph")].forEach((n) => n && vis.observe(n));
  document.addEventListener("visibilitychange", () => $$("video").forEach((v) => {
    if (document.hidden) v.pause(); else if (v.closest(".lightbox") || inView.get(v.closest(".hero__stage, .cta__visual")) || v.closest(".slide.is-center")) play(v);
  }));

  /* ── Reveal on scroll + count-up ── */
  const rev = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("is-in"); rev.unobserve(en.target);
    $$(".num", en.target).forEach((n) => {
      const to = parseFloat(n.dataset.to) || 0, start = performance.now();
      if (!/^\d+(\.\d+)?$/.test(n.dataset.to)) { n.textContent = n.dataset.to; return; }
      (function step(now) { const t = clamp((now - start) / 1600); n.textContent = Math.round(to * ease(t)); if (t < 1) requestAnimationFrame(step); })(start);
    });
  }), { threshold: 0.15 });
  $$("[data-reveal]").forEach((n) => rev.observe(n));

  /* ── Nav: active link + mobile menu ── */
  const navLinks = $$(".nav__links a");
  const secObs = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["work", "services", "about", "contact"].forEach((id) => document.getElementById(id) && secObs.observe(document.getElementById(id)));
  const burger = $(".nav__burger");
  const toggleMenu = (open) => { document.body.classList.toggle("menu-open", open); burger.setAttribute("aria-expanded", open); $(".menu").setAttribute("aria-hidden", !open); };
  burger.addEventListener("click", () => toggleMenu(!document.body.classList.contains("menu-open")));
  $$(".menu a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ── Cursor ── */
  const cursor = $(".cursor"), cLabel = $(".cursor__label");
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  let nx = 0, ny = 0; // normalised mouse for parallax
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    nx = (mx / innerWidth) * 2 - 1; ny = (my / innerHeight) * 2 - 1;
    if (!finePointer) return;
    cursor.classList.add("is-on");
    const hit = e.target.closest?.("[data-cursor]");
    const label = hit?.dataset.cursor;
    cursor.classList.toggle("is-big", !!label);
    if (label) cLabel.textContent = label;
  });
  document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));

  /* ── Main animation loop (only works on what's on screen) ── */
  const heroInner = $(".hero__inner"), heroStage = $(".hero__stage"), phone = $(".phone"), ctaVisual = $(".cta__visual");
  let fanW = 200, curveW = 1000, desktop = innerWidth > 1000;
  const measure = () => {
    fanW = fanCards[0]?.node.offsetWidth || 200; curveW = curve.offsetWidth; desktop = innerWidth > 1000;
    measureLane();
    if (!desktop) { heroInner.style.transform = ""; heroInner.style.opacity = ""; }
  };
  measure();
  let pnx = 0, pny = 0, last = performance.now(), lastOn = -1, tlTarget = 0.1;
  function frame(now) {
    const dt = Math.min(64, now - last); last = now;
    const vh = innerHeight, sy = scrollY;
    pnx = lerp(pnx, nx, 0.06); pny = lerp(pny, ny, 0.06);
    if (finePointer) { cx = lerp(cx, mx, 0.2); cy = lerp(cy, my, 0.2); cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; }

    // hero: shrink as the next panel slides over it (desktop, where it's sticky) + fanned cards
    const heroP = clamp(sy / vh);
    const introDone = now - introStart > 2200;
    if (heroP < 1 && (inView.get(heroStage) !== false || !introDone)) {
      if (desktop) {
        heroInner.style.transform = `scale(${1 - heroP * 0.08}) translateY(${heroP * 4}%)`;
        heroInner.style.opacity = 1 - heroP * 0.55;
      }
      const W = fanW, H = W * 16 / 9, sp = desktop ? heroP : 0;
      fanCards.forEach(({ node, pose }, i) => {
        const intro = reduced ? 1 : ease(clamp((now - introStart - 250 - i * 110) / 1300));
        const f = reduced ? 0 : Math.sin(now / 1100 + i * 1.3) * 7;
        const x = pose.x * W * (1 + sp * 0.35) + pnx * (14 + Math.abs(pose.z) * 0.08);
        const y = pose.y * H - sp * 48 * (i - 2) + f + (1 - intro) * vh * 0.9 + pny * 10;
        const rz = pose.rz * (1 + sp * 0.6) + (1 - intro) * pose.rz * 2.5;
        node.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${pose.z}px) rotateZ(${rz}deg) rotateY(${pose.ry + pnx * 10}deg) rotateX(${-pny * 8}deg)`;
        node.style.opacity = intro;
      });
    }

    // curved kinetic wall
    if (inView.get(curve) && tiles.length) {
      curveX = (curveX + dt * 0.045) % loopW;
      const mid = curveW / 2, per = tileW + gap;
      for (let i = 0; i < tiles.length; i++) {
        let x = i * per - curveX;
        if (x < -per * 2) x += loopW;
        const n = (x + tileW / 2 - mid) / mid;
        if (Math.abs(n) > 1.4) { tiles[i].style.opacity = 0; continue; }
        tiles[i].style.opacity = 1;
        tiles[i].style.transform = `translate3d(${x}px, 0, ${n * n * 220 - 60}px) rotateY(${clamp(-n * 42, -60, 60)}deg)`;
      }
    }

    // 3D timeline: tilt with the mouse, scrub with scroll (or hover)
    if (inView.get(tl)) {
      const r = tl.getBoundingClientRect();
      tlTarget = tlHover != null ? tlHover : clamp((vh - r.top) / (vh + r.height) * 1.25 - 0.1);
      const p = lerp(tlP, tlTarget, 0.12);
      if (Math.abs(p - tlP) > 0.0005) setPlayhead(p);
      const rx = (desktop ? 50 : 46) - pny * 6, rz = 9 + pnx * 5;
      rig.style.transform = `translate(-50%, -36%) rotateX(${rx}deg) rotateZ(${rz}deg)`;
    }

    // scrubbed about paragraph
    if (inView.get(scrub)) {
      const r = scrub.getBoundingClientRect();
      const on = Math.round(clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3)) * scrubWords.length);
      if (on !== lastOn) { scrubWords.forEach((w, i) => w.classList.toggle("on", i < on)); lastOn = on; }
    }

    // CTA phone parallax
    if (phone && inView.get(ctaVisual)) {
      const pr = phone.getBoundingClientRect();
      const p = (pr.top + pr.height / 2 - vh / 2) / vh;
      phone.style.transform = `rotateY(${-18 + pnx * 8}deg) rotateX(${6 - pny * 6}deg) rotateZ(${4 + p * 6}deg) translateY(${p * 40}px)`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { buildTiles(); layoutFlow(false); measure(); setPlayhead(tlP); }, 150); });
})();
