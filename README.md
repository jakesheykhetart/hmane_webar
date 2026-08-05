# hmane-ar

Web AR experiences built with [MindAR](https://hiukim.github.io/mind-ar-js-doc/)
and [A-Frame](https://aframe.io/). One repository, many experiences, versioned
`.zip` bundles for hand-off.

## Layout

```
hmane-ar/
├── index.html              landing page linking every experience
├── shared/                 UI chrome reused by all experiences
│   ├── css/ar-ui.css
│   └── js/ar-ui.js
├── experiences/
│   └── _template/          duplicate this to start a new one
│       ├── index.html
│       ├── experience.json metadata: targets, assets, test status
│       ├── README.md       target sizes, credits, rights
│       └── assets/
│           ├── targets/    .mind files + the source images they came from
│           ├── models/     .glb
│           ├── audio/      .mp3
│           └── images/     .png / .webp
├── tools/build-bundle.sh   makes a standalone zip for one experience
└── .github/workflows/      builds + publishes those zips automatically
```

## Starting a new experience

1. Copy `experiences/_template/` to `experiences/<name>/`.
2. Compile your target image(s) with the
   [MindAR compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
   and save the result as `assets/targets/targets.mind`. Commit the source
   images alongside it — future you will need to recompile.
3. Drop models, audio and images into their folders.
4. Edit `index.html` (title, entity sizes, instruction copy) and fill in
   `experience.json` and `README.md`.
5. Add a link on the root `index.html`.

## Sizing cheat sheet

MindAR normalises each target to **1 unit wide**. Height is
`1 × (imageHeight ÷ imageWidth)`. Position and scale everything relative to
that — not in metres.

| Target aspect | `width` | `height` |
|---------------|---------|----------|
| Square        | 1       | 1        |
| 4:3 landscape | 1       | 0.75     |
| 3:4 portrait  | 1       | 1.333    |
| 16:9          | 1       | 0.563    |

## Asset budget

Everything downloads over a museum wifi network on a phone. Aim for a total
page weight under 15 MB.

| Type | Format | Budget |
|------|--------|--------|
| 3D model | `.glb`, Draco-compressed | < 5 MB |
| Audio | `.mp3` 128 kbps mono | < 2 MB |
| Texture | `.webp` or `.png` with alpha | < 1 MB, max 2048 px |
| `.mind` target | — | < 1 MB per target |

## Releasing a zip

Tag the commit `<experience>-v<version>`:

```
git tag rosetta-stone-v1.0.0
git push origin rosetta-stone-v1.0.0
```

GitHub Actions builds a self-contained bundle and attaches it to a Release.
See `SETUP.md` for the full walkthrough.

## Testing

Camera access requires HTTPS — `file://` and plain `http://` will not work.
`SETUP.md` covers the two ways to get a testable HTTPS URL.
