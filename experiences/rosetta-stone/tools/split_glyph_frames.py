"""Split the PT and LM morph sequences into single-letter sequences (P, T, L, M).

Round 2 of the Chapter 4 guessing game uses six buttons instead of four. The
source animations show both letters together, so each frame is masked to one
letter. Each letter's position changes from one script to the next:

  hieroglyph  stacked      P / L on top,   T / M below
  Demotic     side by side P / L on the right (Demotic reads right to left)
  Greek       side by side P / L on the left  (Greek reads left to right)

At the key frames (first, Demotic hold, Greek hold, last) the mask is a soft
split at the measured gap between the letters. Frames in between, where the
morph is smeared, cross-fade between the neighbouring key masks.

Every letter frame is re-centred on that letter's ink and scaled up by one
fixed factor, so the bank buttons and the flight show the letter centred
and large. placed.png is the masked final frame with no re-centring, so it
drops into the cartouche column exactly where the full PT / LM image did.
split-glyphs.json records the centre and scale that chapter4.js needs to
land the flight on the placed position.

Run from experiences/rosetta-stone:  python3 tools/split_glyph_frames.py
"""
import json, os
import numpy as np
from PIL import Image

ROOT = 'assets/chapter4/GUESSING GAME/ANIMATION'
SIZE = 500
FEATHER = 5.0
SPLITS = {
    # group: frame count, (demotic hold, greek hold), hieroglyph row split y,
    #        demotic column split x, greek column split x, (first, second)
    'PT': dict(count=28, holds=(11, 19), row=265, demotic=157, greek=258, parts=('P', 'T')),
    'LM': dict(count=25, holds=(9, 16), row=260, demotic=190, greek=234, parts=('L', 'M')),
}

yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(float)
sig = lambda v, f=FEATHER: 1 / (1 + np.exp(-v / f))


def first_mask(kind, cfg):
    """Mask of the FIRST letter (P or L) at a key frame."""
    if kind == 'rows':
        return sig(cfg['row'] - yy)          # top
    if kind == 'demotic':
        return sig(xx - cfg['demotic'], 4)   # right
    return sig(cfg['greek'] - xx, 2)         # left; the Greek letters nearly touch


def mask_for(frame, cfg):
    h0, h1 = cfg['holds']
    keys = [(1, 'rows'), (h0, 'demotic'), (h1, 'greek'), (cfg['count'], 'rows')]
    for (fa, ka), (fb, kb) in zip(keys, keys[1:]):
        if fa <= frame <= fb:
            u = (frame - fa) / (fb - fa)
            u = u * u * (3 - 2 * u)
            return (1 - u) * first_mask(ka, cfg) + u * first_mask(kb, cfg)
    raise ValueError(frame)


def ink(rgba):
    a = rgba[..., 3] / 255
    return a * (255 - rgba[..., :3].mean(2)) / 255


def centroid(w):
    t = w.sum() or 1
    return np.array([(w * xx).sum() / t, (w * yy).sum() / t])


def smooth(track, k=2):
    out = track.copy()
    for i in range(len(track)):
        lo, hi = max(0, i - k), min(len(track), i + k + 1)
        out[i] = track[lo:hi].mean(0)
    out[0], out[-1] = track[0], track[-1]     # hieroglyph ends are exact
    return out


meta = {}
for group, cfg in SPLITS.items():
    src = [np.array(Image.open(f'{ROOT}/{group} GLYPH/{n}.png').convert('RGBA')).astype(float)
           for n in range(1, cfg['count'] + 1)]
    for idx, part in enumerate(cfg['parts']):
        masked = []
        for n, im in enumerate(src, 1):
            m = mask_for(n, cfg)
            if idx == 1:
                m = 1 - m
            out = im.copy()
            out[..., 3] *= m
            masked.append(out)
        cents = smooth(np.array([centroid(ink(f)) for f in masked]))
        # One fixed scale per letter: the hieroglyph fills ~62% of the canvas,
        # and no frame is allowed to spill past the edge.
        def extent(f, c):
            b = Image.fromarray((ink(f) > .3).astype(np.uint8) * 255).getbbox()
            return max(abs(b[0] - c[0]), abs(b[2] - c[0]), abs(b[1] - c[1]), abs(b[3] - c[1]))
        hier = extent(masked[0], cents[0])
        # Only the readable key frames must fit; the smeared in-between frames may clip.
        keys = [0, cfg['holds'][0] - 1, cfg['holds'][1] - 1]
        worst = max(extent(masked[k], cents[k]) for k in keys)
        scale = float(min(155 / hier, 240 / worst, 2.4))
        os.makedirs(f'{ROOT}/{part} GLYPH', exist_ok=True)
        ink_bottom = {}
        for n, (f, c) in enumerate(zip(masked, cents), 1):
            img = Image.fromarray(np.clip(f, 0, 255).astype(np.uint8), 'RGBA')
            # p' = (p - c) * scale + 250  ->  affine inverse for PIL
            inv = (1 / scale, 0, c[0] - 250 / scale, 0, 1 / scale, c[1] - 250 / scale)
            img = img.transform((SIZE, SIZE), Image.AFFINE, inv, resample=Image.BICUBIC)
            img.save(f'{ROOT}/{part} GLYPH/{n}.png', optimize=True)
            if n in cfg['holds']:
                b = Image.fromarray((ink(np.array(img).astype(float)) > .2).astype(np.uint8) * 255).getbbox()
                ink_bottom[f'{part}/{n}'] = round(b[3] / SIZE, 3)
        Image.fromarray(np.clip(masked[-1], 0, 255).astype(np.uint8), 'RGBA').save(
            f'{ROOT}/{part} GLYPH/placed.png', optimize=True)
        meta[part] = dict(cx=round(float(cents[-1][0]), 2), cy=round(float(cents[-1][1]), 2),
                          scale=round(scale, 4), inkBottom=ink_bottom)
        print(part, meta[part])

with open('assets/chapter4/split-glyphs.json', 'w') as fh:
    json.dump(meta, fh, indent=1)
