/* "How I edit" — a DaVinci Resolve-style timeline pinned to the screen.
   Scrolling moves the playhead left → right: clips light up, the blade cuts a clip and the gap ripples closed,
   the step text changes, and at the end the playhead opens into a wipe that carries you into the next section. */
(() => {
  const SITE = window.SITE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sec = $(".dvr"); if (!sec) return;
  const pin = $(".dvr__pin", sec), stage = $(".dvr__stage", sec), rig = $(".dvr__rig", sec), ph = $(".dvr__ph", sec);
  const tracksEl = $(".dvr__tracks", sec), ruler = $(".dvr__ruler", sec), wipe = $(".dvr__wipe", sec), hint = $(".dvr__hint", sec);
  const tcEl = $(".dvr__tc span", sec), nEl = $(".dvr__n", sec), t1 = $(".dvr__t1", sec), t2 = $(".dvr__t2", sec), txt = $(".dvr__text", sec);
  const title = $(".dvr__title", sec), dotsEl = $(".dvr__dots", sec), toolsEl = $(".dvr__tools", sec);
  const STEPS = SITE.editSteps?.length ? SITE.editSteps : [{ word: "Edit", rest: "", tool: "select", text: "" }];
  const N = STEPS.length, RIG_W = 1300, HEAD = 150, LANE = RIG_W - HEAD, SECONDS = 30;
  $(".dvr__total", sec).textContent = String(N).padStart(2, "0");

  /* toolbar */
  const ICONS = {
    select: '<path d="M5 3v13l3.5-3 2.5 5 2-1-2.5-5H15z"/>',
    blade: '<rect x="3" y="6" width="14" height="8" rx="1.5"/><path d="M7 10h6"/>',
    fusion: '<circle cx="5" cy="10" r="2.2"/><circle cx="15" cy="5" r="2.2"/><circle cx="15" cy="15" r="2.2"/><path d="M7 9l6-3M7 11l6 3"/>',
    color: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2"/><path d="M10 3v3M17 10h-3"/>',
    audio: '<path d="M3 10h1M6 6v8M9 3v14M12 7v6M15 5v10M17 10h0"/>',
    render: '<path d="M10 3v10M6 9l4 4 4-4M4 16h12"/>',
  };
  const toolNames = Object.keys(ICONS);
  toolsEl.innerHTML = toolNames.map((k) => `<span data-tool="${k}"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg></span>`).join("");
  dotsEl.innerHTML = STEPS.map(() => "<i></i>").join("");
  const dots = $$("i", dotsEl), tools = $$("span", toolsEl);

  /* ruler: a label every 5 seconds, a marker at the start of each step */
  let rh = "";
  for (let s = 0; s <= SECONDS; s += 5) rh += `<span style="left:${(s / SECONDS) * LANE}px">01:00:${String(s).padStart(2, "0")}:00</span>`;
  STEPS.forEach((_, i) => (rh += `<i class="mk" style="left:${((i + 0.12) / N) * LANE}px"></i>`));
  ruler.innerHTML = rh;
  const markers = $$(".mk", ruler);

  /* tracks — clip positions are fractions of the timeline (0 → 1) */
  const poster = (slug) => `assets/work/${slug}.jpg`;
  const CUT = 0.24, CLOSE = 0.29;
  const TRACKS = [
    { name: "V3", sub: "Text+", clips: [[0.01, 0.15, "t", "HOOK · Stop scrolling"], [0.36, 0.5, "t", "CAPTION · on beat"], [0.84, 0.98, "t", "CTA · Link in bio"]] },
    { name: "V2", sub: "Fusion", clips: [[0.33, 0.48, "f", "Kinetic type"], [0.5, 0.63, "f", "UI cards"], [0.86, 0.97, "f", "Logo reveal"]] },
    { name: "V1", sub: "Video", cls: "is-v1", clips: [
      [0, 0.16, "v", "eSewa_A-roll.mp4", "e-sewa"], [0.16, CUT, "v is-left", "Yolo_talk.mp4", "yolo-v2-1"], [CUT, 0.33, "v is-right", "Yolo_talk.mp4", "yolo-v2-1"],
      [0.33, 0.5, "v", "Ultima_B-roll.mp4", "ultima-cine-3"], [0.5, 0.66, "v", "Babal_host.mp4", "babal-host-v1"],
      [0.66, 0.83, "v", "Car_grade.mp4", "insta-v2"], [0.83, 1, "v", "Nest_promo.mp4", "nest-nepal-v2-1"]] },
    { name: "A1", sub: "Voice", cls: "is-a", clips: [[0, CUT, "au is-left"], [CUT, 0.64, "au is-right"], [0.69, 0.96, "au"]] },
    { name: "A2", sub: "Music", cls: "is-a", clips: [[0, 1, "au mu"]] },
  ];
  const wave = (w, seed) => { let h = ""; for (let i = 0; i < w / 4.5; i++) h += `<b style="height:${(22 + 70 * Math.abs(Math.sin(i * 0.9 + seed) * Math.cos(i * 0.23 + seed * 2))).toFixed(0)}%"></b>`; return h; };
  const clips = [];
  TRACKS.forEach((t, ti) => {
    const row = document.createElement("div");
    row.className = "dvr__track " + (t.cls || "");
    row.innerHTML = `<div class="dvr__head">${t.name} <small>${t.sub}</small><i></i></div><div class="dvr__lane"></div>`;
    const lane = $(".dvr__lane", row);
    t.clips.forEach(([a, b, cls, label, slug], ci) => {
      const c = document.createElement("div");
      c.className = "dclip " + cls;
      const w = (b - a) * LANE - 3;
      c.style.left = a * LANE + "px"; c.style.width = w + "px";
      if (cls.startsWith("v")) c.innerHTML = `<span>${esc(label)}</span><i style="background-image:url('${poster(slug)}')${cls.includes("is-right") ? ";background-position:-60px 0" : ""}"></i>`;
      else if (cls.startsWith("au")) c.innerHTML = wave(w, ti * 3 + ci);
      else c.textContent = label;
      lane.append(c);
      clips.push({ el: c, a, b, v: cls.startsWith("v"), music: cls.includes("mu"), cut: cls.includes("is-left") || cls.includes("is-right") });
    });
    if (t.name === "V1" || t.name === "A1") { const cut = document.createElement("i"); cut.className = "dcut"; cut.style.left = CUT * LANE + "px"; lane.append(cut); }
    tracksEl.append(row);
  });
  const cutLines = $$(".dcut", tracksEl);

  /* step text */
  let step = -1;
  function setStep(i) {
    if (i === step) return;
    step = i;
    const s = STEPS[i];
    nEl.textContent = String(i + 1).padStart(2, "0");
    t1.textContent = s.word; t2.textContent = s.rest; txt.textContent = s.text;
    for (const el of [title, txt]) { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
    dots.forEach((d, k) => { d.classList.toggle("on", k === i); d.classList.toggle("done", k < i); });
    markers.forEach((m, k) => m.classList.toggle("on", k <= i));
    tools.forEach((t) => t.classList.toggle("on", t.dataset.tool === s.tool));
  }
  setStep(0);

  /* layout */
  let stageW = 0, scale = 1;
  const measure = () => {
    stageW = stage.clientWidth;
    scale = stageW > 1000 ? Math.min(0.95, (stageW * 0.84) / RIG_W) : Math.max(0.62, (stageW * 1.25) / RIG_W);
  };
  measure();
  addEventListener("resize", measure);

  let visible = false;
  new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting))).observe(sec);

  let shown = 0, lastKey = "";
  function frame() {
    if (visible) {
      const vh = innerHeight, r = sec.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      const target = clamp(p / 0.84);
      const w = clamp((p - 0.86) / 0.12); // wipe progress
      shown = reduced || p > 0.84 ? target : lerp(shown, target, 0.18); // snap to the end before the wipe
      const x = shown * LANE * 0.985;

      // keep the playhead on screen when the timeline is wider than the phone
      const wide = RIG_W * scale;
      let tx = (stageW - wide) / 2;
      if (wide > stageW) tx = clamp(stageW * 0.55 - (HEAD + x) * scale, stageW - wide, 0);
      rig.style.transform = `translateX(${tx.toFixed(1)}px) rotateX(${(30 * (1 - w)).toFixed(2)}deg) scale(${(scale * (1 + w * 0.12)).toFixed(3)})`;
      rig.style.transformOrigin = "0 0";
      rig.style.left = "0";
      ph.style.transform = `translateX(${x.toFixed(1)}px)`;

      setStep(Math.min(N - 1, Math.floor(shown * N)));
      tcEl.textContent = (() => { const f = Math.round(shown * SECONDS * 25); return `01:00:${String(Math.floor(f / 25)).padStart(2, "0")}:${String(f % 25).padStart(2, "0")}`; })();
      hint.style.opacity = clamp(1 - shown * 5).toFixed(2);

      const key = shown.toFixed(3);
      if (key !== lastKey) {
        lastKey = key;
        const colourFrom = 3 / N; // from the Colour step on, the footage looks graded
        for (const c of clips) {
          c.el.classList.toggle("is-live", shown >= c.a && shown < c.b && !c.music);
          if (c.v) c.el.classList.toggle("is-graded", shown >= colourFrom && c.a < shown);
          if (c.music) c.el.classList.toggle("is-live", shown >= 4 / N && shown < 5 / N);
          if (c.cut) { c.el.classList.toggle("is-cut", shown >= CUT); c.el.classList.toggle("is-closed", shown >= CLOSE); }
        }
        cutLines.forEach((l) => l.classList.toggle("is-on", shown >= CUT && shown < CLOSE + 0.03));
      }

      // the wipe opens out from the playhead until it covers the screen
      if (w > 0) {
        const pr = ph.getBoundingClientRect(), pinR = pin.getBoundingClientRect();
        const px = pr.left + pr.width / 2 - pinR.left, W = pinR.width;
        const width = w * 2 * Math.max(px, W - px) + 4;
        wipe.style.left = (px - width / 2).toFixed(1) + "px";
        wipe.style.width = width.toFixed(1) + "px";
        wipe.style.setProperty("--edge", (1 - w).toFixed(2));
      } else wipe.style.width = "0px";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
