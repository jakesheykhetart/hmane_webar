# HMANE Central Portal — prototype v1 (2026-10-19)

## Where to put it
Copy this whole `hmane-portal` folder into the repo as `HMANE_WEBAR/portal/` and push.
It will then be live at:

    https://jakesheykhetart.github.io/hmane_webar/portal/

**Write that URL to the NFC tags.** Keeping the portal on the same site as the Rosetta Stone experience lets the Rosetta experience open inside the portal without a second camera prompt.

## Flow
1. **Splash** (your facade stills, portrait/landscape) → "TAP TO BEGIN". That tap is what allows audio.
2. **Intro video** with sound. "SKIP INTRO" appears bottom-right after 3 s. Skipping ends only the video, so the visitor still sees the Welcome card.
3. **Coded cards**: "Welcome to the HMANE Digital Museum" → "In the Galleries" → **BEGIN**. Tapping a card skips its hold time.
4. **BEGIN** asks for camera permission and starts live AR. This is the first moment the camera is requested.
5. **Halos** appear on the Rosetta Stone (full stela outline) and the Dream Stela as soon as each is recognised. Tap anywhere on an object:
   - Rosetta → opens *inside* the portal. "← PORTAL" (top-left) returns to live AR, with no intro.
   - Dream Stela → Snap lens in a new tab. The portal releases the camera and restarts it when the visitor comes back.
6. The "?" button (top-right) re-shows the instructions at any time.

`?start=ar` on the URL skips straight to the camera (e.g. for a "back to portal" link).

## Files
| File | What it is |
|---|---|
| `config.js` | **Edit here**: all copy, timings, object links, halo look, tracking tuning |
| `index.html`, `portal.css`, `portal.js` | Flow + UI |
| `portal-ar.js` | Halo + tap logic (A-Frame 1.5.0 + MindAR 1.2.5 from jsDelivr) |
| `assets/video/intro-phone.mp4` | 720×1280, 2.5 Mbps, 7.3 MB (was 27 MB) |
| `assets/video/intro-tablet.mp4` | 1920×1080, 4 Mbps, 8.6 MB (was 22 MB) |
| `assets/targets/targets.mind` | Compiled tracking targets: 0 = Rosetta, 1 = Dream Stela |
| `assets/targets/ref-*.jpg` | The reference images the targets and outlines came from |

Landscape screens (museum tablets) get the 16:9 video and splash; portrait screens get 9:16. Only one video is downloaded.

## To-dos for you
- **Font:** Apercu Pro is included in `fonts/` (WOFF2, all six styles). Keep the repo's licence terms in mind, since the repo is public.
- **Rosetta "done" signal (optional):** to send visitors back to the portal automatically at the end of the Rosetta experience, add this line on its final screen:
  ```js
  if (window.parent !== window) window.parent.postMessage({ type: 'hmane:experience-complete' }, '*');
  ```
  The Rosetta page also receives `?from=portal`, so it can hide its own exit or menu if needed.
- **Museum tablets:** set `idleResetMinutes` in `config.js` (e.g. 3) to return loaner tablets to the splash between visitors.

## Tracking notes (to check on site)
- The Dream Stela target is built from your gallery photo, rectified onto the render. It was detected in every gallery shot tested, and the outline locks tightly.
- Rosetta was detected in all four gallery shots. Its outline fits best straight-on; at steep side angles the fit loosens.
- If a halo jitters, lower `filterBeta` in `config.js`. If it lags behind when moving, raise it.
- Visitors need to be a few steps from each object. Neither object gets recognised from the gallery doorway.
- Exact dimensions aren't needed for tracking. The halo is drawn in the reference image's own proportions.
