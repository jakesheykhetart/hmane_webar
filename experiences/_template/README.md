# Experience Title

Short description of the experience and where it is installed.

## Target images

| # | Source file | Physical size | Notes |
|---|-------------|---------------|-------|
| 0 | `assets/targets/source-01.jpg` | 20 × 11 cm | Printed label card |

Compiled with the [MindAR image compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
to `assets/targets/targets.mind`.

## Assets

- **Models** — `assets/models/` · GLB, Draco-compressed, target < 5 MB each
- **Audio** — `assets/audio/` · MP3 128 kbps mono, target < 2 MB each
- **Images** — `assets/images/` · PNG with alpha, or WebP where alpha isn't needed

## Sizing note

In MindAR, the tracked target is **1 unit wide**. Height is `1 × (image height ÷ image width)`.
A 20 × 11 cm card is therefore `width="1" height="0.55"`. Size every child entity
relative to that, not in metres.

## Testing

Camera access requires HTTPS. See the root `SETUP.md` for the two ways to get a
testable HTTPS URL.

## Credits and rights

Assets supplied by … · Narration recorded by … · Any usage restrictions go here.
