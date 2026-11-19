# HMANE Portal — tracking + close-up fix (2026-11-19)

Copy everything in `portal/` over `HMANE_WEBAR/portal/` (same paths), then push.

This package also contains the visitor-analytics files from 2026-11-10 (`analytics.js` and the analytics
additions to `config.js`, `index.html`, `portal.js`). With `analytics.key` empty, nothing is sent.

## What was wrong
Tested in headless Chrome with a fake camera: the search recognised the Rosetta in about 100% of frames,
but the halo appeared only after 4 steady tracked frames in a row. Two things made that hard:

1. `maxTrack: 2`. Once the Rosetta was found, the phone kept searching for the Dream Stela on *every*
   frame. Matching the 5 Dream Stela views takes ~80 ms per frame on a desktop CPU (more on a phone),
   so tracking ran at a few frames a second. MindAR's tracker only looks about 10 px around where
   the stone was in the previous frame, so ordinary hand movement lost the lock before the halo
   could show. The Rosetta experience uses 1 target and stops searching once it's found.
2. The UI waited for that steady lock before telling the visitor anything.

## Changes
- **Tracking:** `maxTrack: 1`. Once an object is found, all the work goes into following it.
- **Targets (`assets/targets/targets.mind`):** Rosetta view 0 is now the *exact* target the
  Rosetta experience uses (`source-01.jpg`, full drawn stela + replica; outline mapped by SIFT
  homography). The old "left angle" view was dropped (the other views cover it). Dream Stela is
  unchanged.
  | index | object | view |
  |---|---|---|
  | 0 | Rosetta | full stela (Rosetta experience target) — NEW |
  | 1 | Rosetta | front (fragment) |
  | 2 | Rosetta | close-up text |
  | 3 | Rosetta | right angle |
  | 4 | Rosetta | side-on with panels |
  | 5–9 | Dream Stela | unchanged |
- **Found immediately:** an object counts as found the moment the search recognises it, without
  waiting for the halo lock. It stays found for 2.5 s (`closeUp.stickyMs`).
- **"Tap to explore" button:** while an object is found, a gold-bordered button with its thumbnail
  and name sits above the hint. Tapping it opens the experience.
- **Close-up:** if less than 80% of the outline fits on screen (`closeUp.fullOutlineOnScreen`), or
  the halo hasn't locked yet and the object is too big for the screen, the screen edges glow like
  the halo. The hint changes to "Tap anywhere on the screen to explore".
- **Tap anywhere:** when exactly one object is found, a tap anywhere on the camera opens it (taps
  on the halo work as before).
- **Analytics:** close-up sightings now count as `object_recognized` / `object_viewed`.
- **Debug (`?debug=1`):** shows searches per second, % of searches that recognised something,
  % of tracking frames that held, the tracking keyframe size, and FOUND [halo | found | close].

## On-site checks (phone, `?debug=1`)
- **"track ok" percentage:** if it stays low while you hold the phone fairly still, try `&kf=128`.
  That tracks like the Rosetta experience does, with a coarser 128 px template that tolerates more
  movement.
- File size: `targets.mind` is 7.0 MB (was 6.6 MB).
