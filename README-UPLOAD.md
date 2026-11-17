# New audio: how to upload (Round 3, 2026-11-17)

1. Unzip and open CHECK-AUDIO.html in a browser. Play every clip.
2. Copy the `experiences` folder from this zip over the `experiences` folder in your `hmane_webar` repo.
   Say yes to "Replace files". Only the files listed below change.
3. Commit and push to GitHub, for example with the message "AUDIO RE-RECORD 261117".
4. Wait about a minute for GitHub Pages to rebuild, then test on the phone.

No file names changed, so nothing else needs editing. The code files carry a new version tag
(`?v=20261117`) so phones fetch the new clips instead of cached old ones.

## Files in this zip
Audio (edited: trimmed, light noise reduction, matched loudness, AAC .m4a, 44.1 kHz mono):
- assets/chapter4/AUDIO/Ptolemis.m4a   ← PTOLEMY.m4a
- assets/chapter4/AUDIO/Djet.m4a       ← Recording.m4a ("ankh djet")
- assets/chapter4/AUDIO/Ptah.m4a       ← Recording (2).m4a
- assets/chapter4/AUDIO/Mehr.m4a       ← Recording (3).m4a ("merry")
- assets/audio/HMANE_SHEHAO.m4a        ← Recording (4).m4a
- assets/audio/HMANE_WEDJ_SOUND.m4a    ← Recording (5).m4a

Code (version tag only):
- index.html, scripts/chapter3.js, scripts/chapter4.js

## Still to record
The single sign sounds in `assets/chapter4/AUDIO/glyph sounds/`: P, T, L, M, Y, S.
The current P/T/L/M are temporary cuts from the old recordings.
