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
| `portal-ar.js` | Halo + tap logic; asks for an HD (720p) camera feed |
| `vendor/mindar-image-aframe-1.2.5-hmane.js` | MindAR 1.2.5, patched: 2× larger detection window; tracks from 256 px images (MindAR default 128 px); realistic phone field of view; skips extra views of an object already tracked |
| `assets/video/intro-phone.mp4` | 720×1280, 2.5 Mbps, 7.3 MB (was 27 MB) |
| `assets/video/intro-tablet.mp4` | 1920×1080, 4 Mbps, 8.6 MB (was 22 MB) |
| `assets/targets/targets.mind` | 10 compiled tracking views: 0–4 Rosetta, 5–9 Dream Stela (6.6 MB, loads during the intro) |
| `assets/targets/views/*.jpg` | The gallery photos/frames each view was compiled from (for recompiling) |

Landscape screens (museum tablets) get the 16:9 video and splash; portrait screens get 9:16. Only one video is downloaded.

## To-dos for you
- **Font:** Apercu Pro is included in `fonts/` (WOFF2, all six styles). Keep the repo's licence terms in mind, since the repo is public.
- **Rosetta "done" signal (optional):** to send visitors back to the portal automatically at the end of the Rosetta experience, add this line on its final screen:
  ```js
  if (window.parent !== window) window.parent.postMessage({ type: 'hmane:experience-complete' }, '*');
  ```
  The Rosetta page also receives `?from=portal`, so it can hide its own exit or menu if needed.
- **Museum tablets:** set `idleResetMinutes` in `config.js` (e.g. 3) to return loaner tablets to the splash between visitors.

## Tracking notes
- Each object has 5 views from your Nov 2 gallery captures (front, angles, close-ups, and for the Rosetta Stone a side-on view including the wall panels). Each view carries the full outline in its own coordinates, so the halo lands on the object's edges whichever view is recognised.
- Measured on your walk-through videos, with the share of frames where the object is recognised before → after:
  - Dream Stela arc: 47% → 84%
  - Dream Stela close-ups: 28% → 71%
  - Rosetta walk-in: 68% → 91%
  - Rosetta close-ups: 27% → 64%
  - No frame was ever matched to the wrong object.
- Still hard: almost fully side-on views, heavy motion blur, and very far away.
- To add a view: add the photo to `assets/targets/views/`, recompile all views in order into `targets.mind`, and add an entry (with its outline) under the object's `targets` in `config.js`.
- If a halo jitters, raise `smoothing.stillMs` in `config.js`. If it lags when moving, lower `smoothing.movingMs`.

## Testing
- Add **`?debug=1`** to the URL (e.g. `…/portal/?debug=1`) to show a small readout: camera resolution, plus each object's status: `searching`, `locking…` or `TRACKED`.
- **Desk testing:** pointing the phone at the Matterport tour on a laptop is much harder than the real gallery. Screen blur, the warm colour cast and the tour's hotspot labels painted over the stone all hurt recognition. For a desk test, open `assets/targets/ref-dream-stela.jpg` or `ref-rosetta.jpg` full-screen and fill most of the phone's view with it.

