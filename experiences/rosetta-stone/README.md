# HMANE Rosetta Stone — Chapters 1–3

Static MindAR/A-Frame experience for GitHub Pages. Chapter 3 uses screen-framed 3D on branded gray (#D9DDDC); it does not require image tracking. No build step or new runtime dependencies are required.

## Upload

Keep the repository structure intact. The root of this ZIP is `hmane_webar-main`; copy its contents into your repository, not into a second nested folder. Review the changed files before committing. This package has not been pushed or published.

Changes under `experiences/rosetta-stone/`:

| File | Purpose |
| --- | --- |
| `index.html` | Chapter 2 → 3 connection, navigation integration, chapter-entry handling and presentation-clock integration |
| `scripts/chapter3.js` | All 16 Chapter 3 beats, media/audio, quiz, and curve-driven 3D |
| `scripts/navigation.js` | Contents, Back, shared pause/resume clock |
| `styles/chapter3.css` | Chapter 3 and navigation styling |
| `assets/data/scribal-animation.json` | Generated 17 poses and six ordered stroke paths |
| `tools/build_animation.py` | Optional source-data regeneration utility; not loaded by the website |
| `README.md` | These instructions |

All images, models, audio and video already in your updated ZIP retain their filenames and bytes. The page uses your `glyph-to-3dm-video.mp4` as supplied.

## Behavior

- A correct Chapter 2 answer enters Chapter 3.
- Contents selects Chapters 1–3. Chapters 4–5 have plain labels and are inert.
- Selecting Chapter 1 or 2 restarts the document at that chapter's entry gate. Returning to legacy reading/game screens through Back uses the existing direct-entry routes, with corrected explanation framing. These document restarts ensure legacy callbacks cannot leak into a restored screen.
- Chapter 3 Back and Replay operate within the current document. Back is hidden during automatic animation and live AR, and available at reading/game prompts.
- Contents, wrong orientation and background tabs pause the presentation clock. Closing Contents resumes the sequence. Camera/tracking engine internals are not altered by the presentation clock.
- Beat 10 begins with a phone-motion trigger and a tap alternative. Safari may ask for motion permission from the optional button. No camera is required for Chapter 3.
- Keyframe 4 holds until the black inkwell is tapped. Then the stylus dips and draws six complete strokes, with ink disabled between strokes.
- Correct Chapter 3 feedback returns to the final quiz. It never advances into Chapter 4.

## Runtime assets

- `images/sacred-hieroglyph.jpg`
- `images/writing-hieroglyph-isolated.png`
- `images/glyph-to-3d-final-frame.png`
- `models/scribal-implement.glb`
- `audio/HMANE_SHEHAO.m4a`
- `video/glyph-to-3dm-video.mp4`
- `data/scribal-animation.json`

These paths are relative to `assets/`. Existing Chapter 1–2 assets are reused.

## Verification and remaining device review

JavaScript syntax checks and automated DOM interaction checks passed. The checks exercised Chapter 3 from its beginning through the final quiz, including the mandatory ink tap, six completed ink paths, Back, Replay, menu pause, inactive Chapter 4, wrong/correct answers and cancellation when leaving an animation. The test renderer and media playback were mocked; these are not visual or real-device tests.

Generated-data verification confirms 17 poses, six paths, and exact agreement between all 12 writing endpoints and their corresponding nib poses. Locator transforms fit source markers to within 0.00007 mm. Curve paths are sampled at approximately constant arc-length spacing; closed paths wrap at the corrected contact point.

The supplied video was verified as H.264, 928×1104, 10 fps, 3.1 seconds. Artwork proportions are preserved at its transition from the isolated PNG. The line crop references were registered against the existing runtime line image.

**Not visually verified:** the local preview browser blocked both local-server and local-file access. Before public use, check on an iPhone and a landscape tablet: image/model crossfade registration, 3D lighting and framing, overlay fit, audio playback, motion permission/gesture sensitivity, and Chapter 1–2 live camera tracking. The writing-view framing is a first implementation and may need visual calibration on device. Do not treat the automated checks as an on-device sign-off.

## Direct testing routes

Append these to the experience URL:

| Query | Entry |
| --- | --- |
| `?chapter=2` | Chapter 2 entry gate |
| `?chapter=3` | Chapter 3 entry gate |
| `?ch3=1&preview=1` | Chapter 3 beginning, bypassing gate/orientation guard for development |
| `?ch3=7&preview=1` | Writing explanation |
| `?ch3=10&preview=1` | 3D interaction |
| `?ch3=16&preview=1` | Final quiz |
| `?ch2=10&preview=1` | Chapter 2 quiz and handoff |

Keep normal visitor links free of development queries. Serve over HTTP locally for inspection, or HTTPS for phone camera/motion tests; do not open `index.html` directly as a file because its model/data fetches require a served origin.

## Source-data regeneration

Only needed if the authored poses or strokes change. Requires Python with numpy, scipy and rhino3dm:

```text
python tools/build_animation.py CHAPTER_3_ASSETS.zip UPDATED_STROKES.3dm HMANE_Aligned_Writing_Keyframes.zip assets/data/scribal-animation.json
```

Source ZIPs, Rhino files, annotated reference images and PSDs are not runtime dependencies. The authored six stroke curves are preserved; runtime path samples and corrected nib positions are generated from them. Locator helper geometry is excluded from the rendered model.
