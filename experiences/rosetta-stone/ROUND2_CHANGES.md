# Rosetta Stone — Round 2, first pass (2026-11-02)

The first set of second-draft revisions after the visitor tests. Copy the changed files over the repo; the folder structure matches.

## Changed files

| File | Change |
| --- | --- |
| `index.html` | Ch 1–2 timing (`CFG.t`, `CH2.t`) and copy |
| `scripts/chapter3.js` | Lid lift, framing, timing, copy |
| `scripts/chapter4.js` | Timing, copy |
| `scripts/chapter5.js` | Timing, copy, "Sound signs" / "Sense sign" titles |
| `assets/data/scribal-animation.json` | Lid peak lowered (frames 3–17 only; nothing else changed) |
| `tools/build_animation.py` | Same lid override, so regenerating the data keeps it |

## 1. Pacing

Animated moves and pauses with nothing to read are shorter. Screens with text either keep their hold or still wait for NEXT. About 50 seconds come out across the five chapters (rough estimate):

- **Ch 1:** stone fade-in and hold 3.5 → 2 s. The three-script tour goes from about 25 to 16 s: each band zooms faster, and the zoomed hold is 2 s. NEXT appears 1 s after the text, down from 2 s, and still waits for the tap.
- **Ch 2:** zoom into the line 2.5 → 1.8 s, with shorter holds before and after it. Reading delays are unchanged.
- **Ch 3:** zooms, moves, and the white-out are about 20% faster, and the 1 s pause after each one is now 0.3 s. Lid and reed 2.0 + 1.5 → 1.2 + 1.2 s. Moves between writing strokes 1.5 → 0.9 s, and each stroke takes 0.85 s. The 1.5 s "EGYPTIAN SCRIBAL KIT" title hold is unchanged.
- **Ch 4:** the opening pan across the line 4 → 2.5 s. The DEMOTIC / GREEK labels during each glyph flight 1 → 0.7 s. The "name hidden" line and the right-to-left demo keep their timing.
- **Ch 5:** pauses with nothing to read are no longer doubled by `READING_TIME_SCALE`. The first pan 3 → 2.2 s, the zoom-out 2.5 → 1.8 s, and the finale's three script highlights 2.8 → 1.8 s each. Caption holds are still doubled.
- Correct/incorrect flashes 1.0 → 0.8 s in every chapter.

## 2. Wording

- Phonogram → **sound sign**. Determinative → **sense sign**. This covers the Ch 2 question, titles, body text, and audio button ("Hear these sound signs"), and the Ch 5 titles and body text. Code identifiers keep their old names.
- Long sentences are split, and harder words are replaced: decree is explained the first time it appears; deciphered → crack the code; mandated / inscribed → had to be carved; alphabetic / distinguishes → uses an alphabet; resembles / scribal → looks like / scribe; upright slab bearing an inscription → tall stone slab with writing carved on it.
- No new facts. Two phrasings need a curator to check: Demotic as "the everyday writing of Egypt's own people," and Ptah as a god "who made the world and watched over craftspeople."
- Every changed screen was checked on a 375 × 667 (iPhone SE) layout and fits. Ch 2 "Sound signs" is the tightest.

## 3. Pen-case lid (Ch 3)

- The lid no longer spins: the three turns applied during the lift are removed. It lifts straight up.
- Its peak drops from 1.78 m to 1.38 m, which keeps its rim about 8 cm above the top of the reed when the reed is fully raised. The lift is 1.2 s.
- The full-kit framing is tighter, so the kit reads slightly larger and the lid stops clear of the menu button. Checked in headless renders at 390 × 844 and 1194 × 834.

## Not yet verified on a device

Timing feel, the lid framing on a real phone, and text fit on the largest system font size.

---

# Round 2, second pass (2026-11-10)

This zip includes every first-pass change too, so it can be applied directly over the current repo.

## Chapter 4: faster repeat flights
- The first glyph flight of a game plays as before (12 fps, with the DEMOTIC / GREEK labels held 0.7 s).
- Every flight after that plays at 30 fps, with the labels held 0.25 s.
- Backing out after a wrong answer is also faster after the first time.
- Measured in a headless browser: the first attempt takes about 5.6 s, and later attempts take about 3 s, including the correct/incorrect flash.

## Chapter 4: six sign buttons instead of four
- The bank is now P, T, II, S, L, M, laid out as a 3 × 2 grid.
- P/T and L/M each share a cartouche column (stacked), so each column has a top slot and a bottom slot. The right-to-left start cue now points at P.
- `GUESSING GAME/ANIMATION/{P,T,L,M} GLYPH/` holds new single-sign frames, generated from the PT and LM animations by `tools/split_glyph_frames.py`. At the hieroglyph, Demotic and Greek frames, each letter is masked at the gap between the two letters. The smeared in-between frames cross-fade between those masks.
  - Demotic is split with P and L on the right, because Demotic reads right to left.
  - Greek is split with P and L on the left.
  - **Please confirm the Demotic split with HMANE.**
- Each letter is centred and enlarged in its button. `placed.png` drops into the cartouche at the original position.
- **Audio, a stopgap:** `glyph sounds/P, T, L, M.m4a` are cut from the existing `Pt` and `Lm` recordings. Pt has a clean gap between the two sounds; Lm is one continuous sound, so its cut point is a judgment call. Replace them with the new recordings. File names: P, T, L, M.
- The old `PT GLYPH`, `LM GLYPH`, `Pt.m4a` and `Lm.m4a` are no longer used, but are left in place.

## Chapter 5: stronger highlights
- Each highlight is now a padded, rounded box at least 26 px tall, with a glow, a thick white outline and a coloured inner line.
  - The stela highlight is light blue instead of navy.
  - The script-name highlight is white with a navy line, instead of near-black. Both colours were nearly invisible on the dark stone.
- The rest of the stone is dimmed by 50% while highlights are on screen.
- The per-script tint in the finale is stronger and has a gold outline.
- The overview labels sit below the larger boxes.
