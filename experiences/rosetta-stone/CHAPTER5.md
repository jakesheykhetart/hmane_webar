# Chapter 5 — implementation and handoff

Built against main commit `62d583b8d3baef7a8cc2c256c3a633d63e972b03` using the September 22 technical storyboard and September 27 approvals. Chapter 5 remains untitled in the contents menu.

## Install

Merge the update package's `experiences/rosetta-stone/` directory into the same location in the repository. Replace `index.html` and `scripts/navigation.js`; add `scripts/chapter5.js`, `styles/chapter5.css`, `assets/chapter5/`, and this document. Keep the existing Chapter 1–4 files and shared assets. The update is not a complete standalone repository.

Chapter 4's existing NEXT handoff automatically detects `Chapter5.start`. The contents menu now enables Chapter 5. Direct route: `?chapter=5`. Camera access requires HTTPS (or localhost). Serve the repository rather than opening HTML with `file://`.

## Approved decisions

- The supplied three-card composition governs the layout; Demotic's center stays at 46.5% of viewport height. Equal outer frames and white padding preserve original letter proportions. Responsive widths and a top clearance keep the contents button accessible.
- Contact animations use measured frame positions, decelerating upward impulses, brief holds, and simultaneous settling. On compact layouts, the second impulse is constrained to avoid overlapping cards.
- The name-to-strip swap crossfades over 300 ms.
- **Final direction decision:** Jake selected “Short adjacent pans” after the source-coordinate conflict was identified. Egyptian strip artwork moves left; Greek artwork moves right. Demotic and Greek wrap for the initial move from Ptolemy to Greek-script references. The wrap seam is a one-pixel black vertical line.
- Before a later pan, any previous fit scaling returns to the name-card baseline over 500 ms. The rest of the pan is shortened to preserve total duration. A new shrink-to-fit also reserves 500 ms. For the 500 ms pans, reset, translation, and any new fit run together.
- Use “three scripts,” not “three languages.” The letters-versus-writing interpretation is retained from the source the user identified as Ilona Regulski. Visitor copy is a paraphrase, not a verified direct quotation.
- Explanation overlays retain the whole hieroglyphic frame and use an internal gold highlight. NEXT becomes available after one second of the explanation.
- Chapter 2's original 960×520 plates and its determinative/phonogram coordinates are reused. The existing stela-filled plate supplies the half-second reveal.
- Beat 15 uses actual strip images, continuously tightening their crops and moving them onto the supplied `rosetta-phone.jpg`. Total 2.5 seconds; navy background fades in 1.25 seconds. The five flattened reference JPEGs are not shipped.
- Greek stela captions consistently say “Greek word for stela—missing here.”
- Beat 16 label order: stela → three scripts → Ptolemy. All outlines stay visible. One compact topic panel at a time prevents overlapping tiny labels on a phone; portrait labels use three columns and landscape labels use a side panel.

## Beat sequence

| Beat | Behavior |
|---|---|
| 1 | Hieroglyphic name card; 0.5-second hold. |
| 2 | Demotic slides up over 1.25 seconds; 0.75-second collision/settle; 0.5-second hold. |
| 3 | Greek slides up over 0.7 seconds; controlled collision/settle; name captions for 2 seconds. |
| 4 | 0.3-second crossfade into registered strip crops. |
| 5 | All strips pan to Greek-script references over 3 seconds; 1-second hold. |
| 6 | Short Greek-script labels for 2.5 seconds. |
| 7 | User-paced “Letters, not writing” explanation, including the decree's three-script requirement. |
| 8 | 0.5-second pan to Demotic, 0.5-second pause, labels for 2.5 seconds. |
| 9 | User-paced “Native writing” explanation and writing-sign highlight. |
| 10 | 0.5-second pan to hieroglyphic, 0.5-second pause, labels for 2 seconds; user-paced “Sacred writing” explanation. |
| 11 | 2-second pan to stela; 1-second hold. |
| 12 | Stela labels for 2.5 seconds, including missing Greek text. |
| 13 | Stela definition, then determinative highlight/explanation. NEXT fills its outline with the existing Chapter 2 stela plate for 0.5 seconds. |
| 14 | Phonogram highlight and user-paced explanation. |
| 15 | 2.5-second animated return to the stone, stela highlights, 1-second pause, labels for 2 seconds. |
| 16 | All nine outlines; sequential topic labels, each after 1 second and held for 2 seconds. NEXT begins the camera interaction. |
| 17 | Loose outline alignment or static fallback, then the finale. |

## AR and fallback

The existing MindAR target is reused. `mapping.json` stores photo-space polygons and a photo-to-target homography. The homography was fitted against the existing target image using 2,374 inlier feature matches. This is image-based calibration, not a substitute for in-gallery verification.

The supplied photo stays visible while the camera starts. Once video is ready, a dashed outline marks the former position of the surviving stone fragment. Recognition plus a loose center/scale check must remain stable for 700 ms. The visitor does not align individual text boxes. Tracking automatically positions them after success.

The existing 3D model is hidden for this chapter. The camera layer is raised above retired chapter layers, below Chapter 5 and navigation. “Continue without camera” is immediately available. Denial or camera errors trigger immediate fallback. Ten seconds without successful alignment also triggers fallback, even if a permission prompt remains unanswered. Late camera-start completion is stopped after fallback. During the tracked finale, overlays hide when tracking is lost; after 1.5 seconds of loss, the finale restarts on the static photo. Camera resources stop on exit, finish, replay, and page hide.

Finale: pulse Ptolemy, stela, and three-script references; softly illuminate the surviving hieroglyphic, Demotic, and Greek sections; clear annotations and display “Three scripts. One decree.” FINISH stops the camera and offers replay.

## Navigation and testing routes

`?ch5=1`, `7`, `9`, `10`, `13`, `14`, `16`, or `17` opens a stable checkpoint. Add `&preview=1` to bypass the existing orientation guard for desktop testing. Back moves to the preceding checkpoint. The contents menu pauses the shared narrative clock; chapter selection reloads a clean document. Tab hiding also pauses the narrative clock.

## Files and mapping

- `assets/chapter5/mapping.json`: strip crops, stone highlight polygons, outline, large script polygons, and AR mapping. Coordinates refer to their explicitly named images, not viewport pixels.
- Name cards and the three clean strips are supplied originals, renamed for unambiguous paths. Annotated JPEGs are not used as visitor-facing artwork.
- Chapter 5 keeps the newly supplied 1365×2048 phone photo in its own directory so Chapters 1–4 keep their existing images and calibrations.
- Existing `assets/images/stela-zoomed.jpg` and `stela-zoomed-overlay.jpg` are required.

Real-device camera permission behavior, lighting-dependent recognition, pose registration, and museum alignment tolerance still require an in-gallery phone/tablet check.

## Verification completed

Automated Chromium checks used the production A-Frame 1.6.0 and MindAR 1.2.5 dependencies and the actual repository assets. Phone (390×844), compact phone (375×667), and landscape tablet (1024×768) renderings were inspected.

Passed: complete static beat sequence; opening collisions and circular initial pans; menu pause/resume; deterministic Back checkpoints; stela fill; zoom-out; topic order; static finale and Finish; camera denial; unresolved permission request with ten-second timeout; simulated recognized pose and loose alignment; simulated tracking loss with static fallback; and Chapter 4 NEXT handoff. No missing local assets or uncaught JavaScript errors occurred. Syntax checks and `git diff --check` passed.

Camera outcomes and tracked poses were simulated in Chromium. Live camera recognition, iOS Safari, Android Chrome, and real museum lighting have not been validated by these checks. Nothing has been pushed or deployed by this update package.
