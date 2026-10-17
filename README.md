# Saugat — portfolio website

A fast, single-page portfolio. No installs or build tools needed: it's plain HTML, CSS and JavaScript.

---

## 1. See it on your Mac

Double-click **`Preview website.command`**. It opens the site in your browser at http://localhost:5173 (keep its window open while you look).

(Double-clicking `index.html` also works, but the 3D splat portrait needs the preview above.)

> Tip: add `?skip` to the end of the address (e.g. `index.html?skip`) to skip the intro animation while you're checking things.

---

## 2. Change your text

Open **`content.js`** in any text editor (TextEdit works, but **VS Code** is nicer and free).

- Change anything between the quotes `"like this"`, save, then refresh the browser.
- Lines marked **✏️** are placeholders I made up. Please replace them: your email, WhatsApp, Instagram, your real numbers, jobs and bio.
- `workInfo` holds the name and order of each video. Change `client` and `title` there.
- Want a photo of yourself? Put it in `assets/img/` (e.g. `me.jpg`) and set `photo: "assets/img/me.jpg"`.

---

## 3. Add or remove videos

1. Put videos (or images) into the **`best work`** folder.
   Naming tip: `01 Client - Project title.mp4` sets the order and the labels automatically.
2. Double-click **`Update my work.command`**.
   It makes small, fast web copies in `assets/work/` (your originals are never touched).
   *First time only:* if your Mac says it can't be opened, right-click it → **Open** → **Open**.
3. Refresh the website.

The first 5 videos appear in the big 3D card fan at the top.

---

## 4. Put it online for free (GitHub Pages)

Your site lives at **https://saugatdvr.github.io** (repository `saugatdvr/saugatdvr.github.io`).
The `upload to github` folder is already set up as a Git repository linked to it.

**First time**
1. Install **GitHub Desktop** from desktop.github.com and sign in with your GitHub account.
2. **File → Add Local Repository…** → choose `Documents/website/upload to github` → **Add Repository**.
3. Click **Publish branch** (or **Push origin**) at the top.
4. On github.com: repository **Settings → Pages** → Branch **main**, **/(root)** → **Save**.

**Every update after that**
1. Change text in `content.js` and/or add videos to `best work`.
2. Double-click **Update my work.command** (it refreshes the `upload to github` folder).
3. In GitHub Desktop, type a short note (e.g. "new reels") → **Commit to main** → **Push origin**.
4. The live site updates in about a minute. Hard refresh with Cmd + Shift + R if needed.

---

## What's in the folder

| File / folder | What it is |
|---|---|
| `index.html` | The page |
| `content.js` | **All your text**. Edit this one |
| `works.js` | List of your videos (made automatically, don't edit) |
| `best work/` | Your original videos (stays on your Mac) |
| `assets/work/` | Small web copies of your videos |
| `css/style.css` | Colours, fonts, layout |
| `js/main.js` | Animations and interactions |
| `css/fx.css`, `js/fx.js` | Editing effects: 3D tools, render queue, pop-out, colour page, splat portrait |
| `backups/` | Earlier versions of the site, to roll back if needed |
| `tools/build_work.py` | The script behind "Update my work" |

---

## Older versions (roll back)

- `backups/before-effects`: the site before any editing-software effects.
- `backups/effects-v1`: the version with 3D tools, colour page, pop-out and splat portrait.

To use one: copy its `index.html` and the `css` and `js` folders into the `website` folder (replace when asked), then double-click **Update my work.command**. Your text in `content.js` and your videos stay as they are.
