#!/usr/bin/env python3
"""Turn everything in "best work/" into web-ready files + works.js.

Name files like:  01 Client - Project title.mp4
  - the number sets the order (optional)
  - "Client - Title" become the card labels
  - add a .txt with the same name for a one-line description (optional).
    A line like "start: 0" in that .txt makes the preview loop start at that second.

Videos are compressed so the site loads fast and fits on GitHub (100 MB/file limit).
"""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARGS = [a for a in sys.argv[1:] if a != "--force"]
FORCE = "--force" in sys.argv  # re-encode everything, e.g. after changing quality settings
SRC = Path(ARGS[0]) if ARGS else ROOT / "best work"
OUT = ROOT / "assets" / "work"
VIDEO = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}
IMAGE = {".png", ".jpg", ".jpeg", ".webp"}
MAX_BYTES = 24_000_000


def tool(name):
    for p in (shutil.which(name), f"/opt/homebrew/bin/{name}", f"/usr/local/bin/{name}"):
        if p and Path(p).exists():
            return p
    sys.exit(f"Could not find {name}. Install it with:  brew install ffmpeg")


FFMPEG, FFPROBE = tool("ffmpeg"), tool("ffprobe")


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "work"


def parse_name(stem):
    m = re.match(r"^\s*(\d+)[\s._-]+(.*)$", stem)
    order, rest = (int(m.group(1)), m.group(2)) if m else (999, stem)
    rest = re.sub(r"\s+v\d+(\.\d+)*\b", "", rest, flags=re.I).strip(" ._-")  # drop "v2.1" etc.
    client, _, title = rest.partition(" - ")
    if not title:
        client, title = "", rest
    tidy = lambda s: " ".join(w[:1].upper() + w[1:] for w in s.split())
    return order, tidy(client.strip()), tidy(title.strip())


def probe(path):
    out = subprocess.run([FFPROBE, "-v", "error", "-select_streams", "v:0",
                          "-show_entries", "stream=width,height:stream_tags=rotate:format=duration",
                          "-of", "json", str(path)], capture_output=True, text=True).stdout
    d = json.loads(out or "{}")
    st = (d.get("streams") or [{}])[0]
    w, h = st.get("width", 1080), st.get("height", 1920)
    if str(st.get("tags", {}).get("rotate", "0")) in ("90", "270"):
        w, h = h, w
    return w, h, float(d.get("format", {}).get("duration", 0) or 0)


def stale(out, src):
    return FORCE or not out.exists() or out.stat().st_mtime < src.stat().st_mtime


def run(args):
    subprocess.run([FFMPEG, "-v", "error", "-y", *args], check=True)


def best_moment(src, dur):
    """Pick the busiest-looking moment (biggest JPEG = most detail) for the poster and preview loop."""
    if dur <= 8:
        return 0.0
    tmp = OUT / ".probe.jpg"
    best, best_size = dur * 0.15, -1
    for k in range(10):
        t = dur * (0.1 + 0.75 * k / 9)
        run(["-ss", f"{t:.2f}", "-i", str(src), "-frames:v", "1", "-vf", "scale=240:-2", "-q:v", "5", str(tmp)])
        size = tmp.stat().st_size if tmp.exists() else 0
        if size > best_size:
            best, best_size = t, size
    tmp.unlink(missing_ok=True)
    return max(0.0, min(best - 1, dur - 7))


def build_video(src, slug, start_at=None, note=None):
    w, h, dur = probe(src)
    full, loop, poster = OUT / f"{slug}.mp4", OUT / f"{slug}-loop.mp4", OUT / f"{slug}.jpg"
    long_side = "1280"
    scale = f"scale='if(gt(iw,ih),{long_side},-2)':'if(gt(iw,ih),-2,{long_side})'"
    if stale(full, src):
        print(f"  compressing  {src.name}")
        # GitHub's drag-and-drop upload takes files up to 25 MB, so squeeze harder until it fits
        for crf in (23, 26, 29, 32, 35):
            run(["-i", str(src), "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
                 "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(full)])
            if full.stat().st_size < MAX_BYTES:
                break
            print(f"  still {full.stat().st_size / 1e6:.0f} MB, compressing more…")
    # editing the .txt (e.g. a new "start:") remakes the loop and poster too
    newer_note = lambda out: note is not None and note.exists() and out.exists() and out.stat().st_mtime < note.stat().st_mtime
    loop_stale, poster_stale = stale(loop, src) or newer_note(loop), stale(poster, src) or newer_note(poster)
    if start_at is not None:
        start = min(start_at, max(0.0, dur - 6))
    else:
        start = best_moment(src, dur) if loop_stale or poster_stale else 0
    if loop_stale:
        print(f"  preview loop {src.name}")
        small = scale.replace(long_side, "720")
        run(["-ss", f"{start:.2f}", "-t", "6", "-i", str(src), "-vf", small, "-an", "-c:v", "libx264",
             "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(loop)])
    if poster_stale:
        run(["-ss", f"{start + 0.3:.2f}", "-i", str(src), "-frames:v", "1",
             "-vf", scale.replace(long_side, "900"), "-q:v", "3", str(poster)])
    return {"type": "video", "w": w, "h": h, "duration": round(dur, 1),
            "src": f"assets/work/{full.name}", "loop": f"assets/work/{loop.name}",
            "poster": f"assets/work/{poster.name}"}, {full.name, loop.name, poster.name}


def build_image(src, slug):
    out = OUT / f"{slug}.jpg"
    if stale(out, src):
        print(f"  resizing     {src.name}")
        run(["-i", str(src), "-vf", "scale='min(1600,iw)':-2", "-q:v", "3", str(out)])
    w, h, _ = probe(out)
    return {"type": "image", "w": w, "h": h, "src": f"assets/work/{out.name}",
            "poster": f"assets/work/{out.name}"}, {out.name}


def main():
    if not SRC.exists():
        sys.exit(f"Folder not found: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in SRC.iterdir() if p.suffix.lower() in VIDEO | IMAGE and not p.name.startswith("."))
    if not files:
        print(f'No videos or images in "{SRC.name}" yet. Add some and run this again.')
        return
    works, keep, used = [], set(), set()
    print(f"Building {len(files)} item(s) from {SRC.name}/ ...")
    for src in files:
        order, client, title = parse_name(src.stem)
        # slug keeps the version ("yolo-v6") so each file has its own stable name for content.js
        slug = slugify(re.sub(r"^\s*\d+[\s._-]+", "", src.stem))
        while slug in used:
            slug += "-2"
        used.add(slug)
        note = src.with_suffix(".txt")
        lines = note.read_text().splitlines() if note.exists() else []
        starts = [l.split(":", 1)[1] for l in lines if l.lower().startswith("start:")]
        desc = "\n".join(l for l in lines if not l.lower().startswith("start:")).strip()
        if src.suffix.lower() in VIDEO:
            item, names = build_video(src, slug, float(starts[0]) if starts else None, note)
        else:
            item, names = build_image(src, slug)
        item.update({"order": order, "slug": slug, "client": client, "title": title, "description": desc})
        works.append(item)
        keep |= names
    for old in OUT.iterdir():
        if old.name not in keep and not old.name.startswith("."):
            old.unlink()
    works.sort(key=lambda x: (x["order"], x["slug"]))
    (ROOT / "works.js").write_text(
        "// Generated by tools/build_work.py — don't edit by hand, re-run the script instead.\n"
        "window.WORKS = " + json.dumps(works, indent=2, ensure_ascii=False) + ";\n")
    size = sum(f.stat().st_size for f in OUT.iterdir()) / 1e6
    print(f"Done. {len(works)} item(s), {size:.0f} MB in assets/work. Refresh the site to see them.")


if __name__ == "__main__":
    main()
