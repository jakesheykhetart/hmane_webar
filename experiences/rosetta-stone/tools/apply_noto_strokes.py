"""Replace the Chapter 3 quill strokes with clean Noto Sans Egyptian Hieroglyphs shapes.

Usage:  python tools/apply_noto_strokes.py   (run from experiences/rosetta-stone/)
Run it again after build_animation.py, which regenerates the strokes from the Rhino file.

tools/noto-ch3-strokes-px.json holds the six stroke paths in sacred-hieroglyph.jpg pixels
(1708 x 1317), 257 points each, closed. They are the centre lines of the Noto glyph outlines,
fitted over the carved signs:
  0 N35 water ripple U+13216 · 1 R8 flagstaff U+132B9 (mirrored to face like the stone)
  2 S43 staff U+13303 · 3-5 Z3 plural strokes U+133EA, top to bottom.
Noto Sans Egyptian Hieroglyphs © Google / Notofonts, SIL Open Font License 1.1.

Image pixels are mapped onto the stroke plane with the same registration chapter3.js uses to lay
sacred-hieroglyph.jpg over the ink at the beat 11 reveal (writingView: 0.745 m across the image
width, image x = 2.5% at z = 0.509, image y = 18% at y = 0.214). The original Rhino strokes sat
about 15-20 px right of and below the carving at the reveal; these land on it.
The stylus poses for each stroke (frames 6..17) are shifted by the same amount the stroke's start
and end points moved, so the pen still lands on the first point and lifts off from the last.
"""
import json, pathlib
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE.parent / 'assets/data/scribal-animation.json'
PX = HERE / 'noto-ch3-strokes-px.json'

# Must match writingView() in scripts/chapter3.js.
IMG_W, IMG_H, SPAN = 1708, 1317, 0.745
K = SPAN / IMG_W                       # metres per image pixel
az, bz = -K, 0.509 + 0.025 * SPAN      # screen right is -z
ay, by = -K, 0.214 + 0.18 * IMG_H * K

d = json.loads(DATA.read_text())
if d.get('strokeSource') == 'noto':
    raise SystemExit('Strokes are already Noto. Re-run build_animation.py first if you need to re-apply.')

old = [np.array(s['points']) for s in d['strokes']]
plane_x = float(np.mean([p[:, 0].mean() for p in old]))

px = json.loads(PX.read_text())
for i, s in enumerate(d['strokes']):
    P = np.array(px[str(i)])
    W = np.c_[np.full(len(P), plane_x), ay * P[:, 1] + by, az * P[:, 0] + bz]
    o = old[i]
    for frame, delta in ((6 + 2 * i, W[0] - o[0]), (7 + 2 * i, W[-1] - o[-1])):
        st = d['frames'][str(frame)]['stylus']
        st['pivot'] = (np.array(st['pivot']) + delta).tolist()
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(W, axis=0), axis=1))]
    s.update(points=W.tolist(), closed=True, length=float(seg[-1]))

d['strokeSource'] = 'noto'
DATA.write_text(json.dumps(d, separators=(',', ':')))
print(f'z = {az:.6f}*x + {bz:.4f}   y = {ay:.6f}*y + {by:.4f}   plane x = {plane_x:.4f}')
