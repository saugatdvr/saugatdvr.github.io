# Saugat — portfolio website

A fast, single-page portfolio. No installs or build tools needed: it's plain HTML, CSS and JavaScript.

---

## 1. See it on your Mac

Double-click **`index.html`**. It opens in your browser.

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

You only do this setup once.

1. Make a free account at **github.com**.
2. Click the **+** (top right) → **New repository**.
   - Name it exactly: `yourusername.github.io` (use your real GitHub username).
   - Keep it **Public** and click **Create repository**.
3. On the next page click **"uploading an existing file"**.
4. Open the **`upload to github`** folder (inside `website`), press **Cmd + A** to select everything, and drag it into the browser window.
   (This folder has everything the site needs and leaves out your huge originals in `best work`.)
5. Wait for the upload to finish, then click **Commit changes**.
6. Go to **Settings → Pages**. Under *Branch*, choose **main** and **/(root)**, then **Save**.
7. Wait 1–2 minutes and open **https://yourusername.github.io**. Your site is live 🎉

### Updating the live site later
Make your changes on your Mac → double-click **Update my work.command** (it refreshes the `upload to github` folder) → go to your repository on github.com → **Add file → Upload files** → drag in everything from `upload to github` → **Commit changes**. It updates in about a minute.

> If you don't see your change, do a hard refresh (Cmd + Shift + R).
> Each video copy is kept under 25 MB so the browser upload always works.

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
| `tools/build_work.py` | The script behind "Update my work" |
