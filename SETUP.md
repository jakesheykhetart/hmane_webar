# Setup walkthrough

Written for: a GitHub account that already exists, nothing installed locally,
one public monorepo, zip bundles delivered through GitHub Releases.

Work through it once. After that, day-to-day use is steps 6 and 7 only.

---

## 1. Install GitHub Desktop

Download from **https://desktop.github.com** and install it. This gives you Git
and a visual interface in one install — you never have to touch the command
line.

On first launch it asks you to sign in to GitHub. Do that, and let it configure
your name and email when prompted.

> GitHub Desktop bundles its own copy of Git, so there is nothing else to
> install.

---

## 2. Create the repository

In GitHub Desktop: **File → New repository**

| Field | Value |
|-------|-------|
| Name | `hmane-ar` |
| Description | `Web AR experiences built with MindAR` |
| Local path | wherever you keep projects, e.g. `Documents\GitHub` |
| Initialize with a README | **unchecked** — the scaffold has one |
| Git ignore | **None** — the scaffold has one |
| License | **None** — the scaffold has one |

Click **Create repository**. You now have an empty folder at
`<local path>\hmane-ar`.

---

## 3. Drop in the scaffold

**Where you're copying to.** In step 2, GitHub Desktop created a real folder on
your PC. To find it, go to **Repository → Show in Explorer** — that opens it.
The path is whatever you chose, e.g.:

```
C:\Users\jshey\Documents\GitHub\hmane-ar\
```

Right now that folder looks empty. It isn't quite — there's a hidden `.git`
folder inside doing the version tracking. Leave it alone; you'll be adding
files *next to* it, not replacing anything.

**What you're copying.** Download `hmane-ar-scaffold.zip`, then:

1. Right-click the zip → **Extract All…**
2. In the destination box, paste the path to your repo folder from above and
   **delete the `\hmane-ar-scaffold` that Windows adds to the end** — otherwise
   everything lands one folder too deep.
3. Click **Extract**.

**Check you got it right.** Open the repo folder. You should see these items
sitting directly inside it:

```
hmane-ar\
├── .github\          ← may be hidden; that's fine
├── .gitignore
├── .gitattributes
├── LICENSE
├── README.md
├── SETUP.md
├── index.html
├── experiences\
├── shared\
└── tools\
```

If instead you see a single `hmane-ar-scaffold` folder, you extracted one level
too deep. Open it, select everything inside (Ctrl+A), cut (Ctrl+X), go up one
level, and paste (Ctrl+V). Then delete the now-empty folder.

**Commit it.** Switch back to GitHub Desktop. All those files now appear in the
**Changes** panel on the left — that's how you know it worked. Type
`Initial scaffold` in the summary box at the bottom left, then click
**Commit to main**.

## 4. Publish it to GitHub

Click **Publish repository** at the top.

- Name: `hmane-ar`
- **Uncheck "Keep this code private"** (public — this is what keeps Pages and
  Actions free)

Click **Publish repository**. Your code is now at
`https://github.com/<your-username>/hmane-ar`.

---

## 5. Turn on GitHub Pages — you will want this

You said zip files are the deliverable, and they are. But you cannot *test* a
MindAR experience without an HTTPS URL: browsers refuse camera access on
`file://` and plain `http://`, so double-clicking `index.html` gets you a black
screen every time. Pages is the cheapest way to get that URL, and it costs one
click on a public repo.

On github.com, in your repo: **Settings → Pages**

- Source: **Deploy from a branch**
- Branch: `main`, folder `/ (root)`
- **Save**

Wait about a minute. Your experiences are then live at:

```
https://<your-username>.github.io/hmane-ar/
https://<your-username>.github.io/hmane-ar/experiences/rosetta-stone/
```

Open that second style of URL on your phone, allow camera access, and you are
testing on a real device. It also doubles as a preview link you can send Peter
and Adam before they commit to hosting anything.

**Alternative if you'd rather not publish work-in-progress:** run a local HTTPS
server instead. `npx serve` plus `npx localtunnel --port 3000` gives you a
temporary public HTTPS URL for phone testing. More friction each session, and
you still need Node installed. Pages is easier.

---

## 6. Everyday workflow

1. Edit files in your `hmane-ar` folder with whatever editor you use.
2. GitHub Desktop shows what changed. Review the diff in the middle panel.
3. Write a short summary, click **Commit to main**.
4. Click **Push origin**.

That's version control. Every commit is a restore point — **History** tab shows
them all, and right-clicking any commit offers **Revert** if something breaks.

If Pages is on, your live URL updates about a minute after each push.

> **A note on binary assets.** Git stores a complete new copy of a `.glb` or
> `.mp3` every time it changes, so a repo full of large models can balloon.
> Keep assets under the budgets in `README.md` and you will stay well inside
> GitHub's 1 GB soft limit. If a single experience ever needs assets over
> ~100 MB, that's the point to look at Git LFS — flag it and I'll set it up.

---

## 7. Cutting a release zip

When an experience is ready to hand over, tag it. GitHub Actions builds the
bundle and publishes it for you.

**In GitHub Desktop:** with your latest work committed and pushed, go to
**History**, right-click the top commit → **Create tag**. Name it:

```
<experience-folder>-v<version>
```

For example `rosetta-stone-v1.0.0`. Then click **Push origin** to send the tag
up.

**What happens next**, automatically:

1. The workflow in `.github/workflows/release-zip.yml` fires.
2. It copies `experiences/rosetta-stone/` plus `shared/` into one folder.
3. It rewrites the `../../shared/` paths to `./shared/` so the unzipped folder
   runs from any web root with no editing.
4. It adds a `HOW-TO-HOST.txt` for whoever receives it.
5. It zips the lot and attaches it to a GitHub Release.

Find it at `https://github.com/<your-username>/hmane-ar/releases`. The download
link on that page is stable and public — that URL is what you send HMANE.

**Building a zip without tagging:** go to the **Actions** tab → **Build release
zip** → **Run workflow**, type the experience folder name, and run it. The zip
lands under the run's **Artifacts** instead of a Release. Useful for sending a
draft.

**Version numbers:** `v1.0.0` for a first delivery, `v1.0.1` for a typo fix,
`v1.1.0` for new content, `v2.0.0` for a rebuild. Tags are permanent — if you
need to redo one, delete the tag and Release on github.com first, then re-tag.

---

## 8. Checking the workflow ran

The **Actions** tab lists every run. Green check = zip published. Red X = click
into the run, expand the failed step, and read the log. The usual cause is a
typo between the tag name and the folder name — the tag `rosetta-v1.0.0`
requires a folder at `experiences/rosetta/`.

---

## Reference

| Thing | Where |
|-------|-------|
| Repo | `https://github.com/<username>/hmane-ar` |
| Live site (if Pages on) | `https://<username>.github.io/hmane-ar/` |
| Releases / zips | `https://github.com/<username>/hmane-ar/releases` |
| Action logs | Repo → Actions tab |
| MindAR target compiler | https://hiukim.github.io/mind-ar-js-doc/tools/compile |
| MindAR docs | https://hiukim.github.io/mind-ar-js-doc/ |

## Versions pinned in the scaffold

- A-Frame **1.5.0** — `https://aframe.io/releases/1.5.0/aframe.min.js`
- MindAR **1.2.5** — `https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js`

Both are pinned deliberately. A CDN URL without a version number can change
under you and break a delivered experience months later.
