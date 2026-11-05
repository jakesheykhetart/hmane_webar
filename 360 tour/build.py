#!/usr/bin/env python3
"""Builds one language-picker page per object.

Edit OBJECTS below, then run:  python3 build.py
Standalone pages for the Panoply 360 tour (not part of the AR portal).
Each object becomes  panoply-360-tour/<slug>/index.html, plus the list page  panoply-360-tour/index.html.
Buttons appear in the order listed; an object gets exactly as many buttons as it has links.
"""
import html, json, os

Y = "https://youtu.be/"

# (slug, title, [(language, region or "", url), ...])
OBJECTS = [
    ("dream-stela", "Dream Stela of Thutmose IV", [
        ("English", "", Y + "mcKUPP5EMxs"),
        ("Spanish", "", Y + "9B6MPW1ATGM"),
        ("Italian", "", Y + "HsmAk3ec_3I"),
        ("German", "", Y + "vTIYjG9IOq0"),
        ("Chinese", "", Y + "9rC8-zpQ8LU"),
        ("Arabic", "", Y + "r1ld_sMxQBo"),
        ("French", "", Y + "-kGYNAeml_I"),
    ]),
    ("hetepheres-throne", "Hetepheres Throne", [
        ("English", "", Y + "LFE2q7n-USk"),
        ("Spanish", "Spain", Y + "L2OgqzgosOw"),
        ("Spanish", "Mexico", Y + "XN2c06jqB7c"),
        ("Italian", "", Y + "ZHWfoMqar-E"),
        ("German", "", Y + "z2pMQmS4FCs"),
        ("German", "Germany", Y + "YYi3HTtrqfc"),
        ("Chinese", "Mandarin", Y + "XS2skYx4eoQ"),
        ("Chinese", "Simplified Mandarin", Y + "qp-ngTc9rOY"),
        ("Arabic", "Egypt", Y + "XeKf3kDOHjw"),
        ("French", "", Y + "VsYqtRGte7A"),
        ("French", "France", Y + "_bxBmwr_lQc"),
        ("Dutch", "", Y + "HzLP_ZoVYgo"),
    ]),
    ("ituerneheh-stela", "Ituerneheh Stela", [
        ("English", "", Y + "AGsc4hSd9wg"),
        ("Spanish", "", Y + "682OqePRW4E"),
        ("Italian", "", Y + "fdaPn_KRMz4"),
        ("German", "", Y + "YmKyG5RrMmY"),
        ("Chinese", "", Y + "gZA9-69NDnY"),
        ("Arabic", "", Y + "gX-Frngak7Y"),
        ("French", "", Y + "DTl7Q7ddHqI"),
    ]),
    ("ankh-khonsu-coffin", "Ankh-khonsu Coffin", [
        ("English", "", Y + "G5tuKnXvmWs"),
        ("Spanish", "", Y + "juTd9Yk_K48"),
        ("Italian", "", Y + "dKacs8nQfqU"),
        ("German", "", Y + "GlK9BvUhFd0"),
        ("Chinese", "", Y + "HVp99jMXexs"),
        ("Arabic", "", Y + "w0jlxrm70b4"),
        ("French", "", Y + "mc37yEDwTDQ"),
    ]),
    ("menkaure-triad", "Menkaure Triad", [
        ("English", "", Y + "btplbny1SRw"),
        ("Spanish", "", Y + "poP2zj-Nrcw"),
        ("Italian", "", Y + "neQhqac2RXE"),
        ("German", "", Y + "-8SnulLdiSM"),
        ("Chinese", "", Y + "7WefV6iV6P0"),
        ("Arabic", "", Y + "Tr3JBRfezXM"),
        ("French", "", Y + "QKHGzADWF0I"),
    ]),
    ("karnak-relief", "Karnak Relief of Ramesses II", [
        ("English", "", Y + "07l5gxAlTkA"),
        ("Spanish", "", Y + "hHlvKY8iZrU"),
        ("Italian", "", Y + "28RYAHUpWdU"),
        ("German", "", Y + "aR8TxJnBUZo"),
        ("Chinese", "", Y + "6dbYISbjseA"),
        ("Arabic", "", Y + "2jHRTB1WpPg"),
        ("French", "", Y + "F7zNXxk79eA"),
    ]),
    ("padimut-cartonnage", "Cartonnage of Padimut", [
        ("English", "", Y + "58wWKwyylA8"),
        ("Spanish", "", Y + "4MwNpiXAVX4"),
        ("Italian", "", Y + "ruecO2H_S4k"),
        ("German", "", Y + "0Y0oj9YKbiE"),
        ("Chinese", "", Y + "NuyX1e-dAP8"),
        ("Arabic", "", Y + "y2h7PvBWVyY"),
    ]),
    ("tutankhamun-throne", "Throne of Tutankhamun", [
        ("English", "", Y + "x129gs7QkBU"),
        ("Spanish", "", Y + "BzL0yy1M7Eg"),
        ("Italian", "", Y + "rDjxCyR0uZ8"),
        ("German", "", Y + "LwY3G-smN_0"),
        ("Chinese", "", Y + "CyRL1UJ8I10"),
        ("Arabic", "", Y + "mM5itU8FuPw"),
        ("French", "", Y + "lOyWvCtl_4w"),
    ]),
    ("userhet-canopic-jar", "Canopic Jar of Userhet", [
        ("English", "", Y + "2XVAE6eqzx8"),
        ("Spanish", "", Y + "Cnnlxnc8RGk"),
        ("Italian", "", Y + "TQQbQki9MwY"),
        ("German", "", Y + "Vz4PAkthL70"),
        ("Chinese", "", Y + "wobhzzH8tbo"),
        ("Arabic", "", Y + "dJKl3f11xqY"),
        ("French", "", Y + "6tlQsovyu1Q"),
    ]),
    ("egyptomania", "Egyptomania", [
        ("English", "", Y + "XXZGb7lVboY"),
        ("Spanish", "", Y + "1VgOmR8Fshs"),
        ("Italian", "", Y + "D0vKCz5eK18"),
        ("German", "", Y + "hHVzsu39Vh0"),
        ("Chinese", "", Y + "dHMs6YGBx98"),
        ("Arabic", "", Y + "mJgyvGkaI5s"),
        ("French", "", Y + "qPUvTHs2OCg"),
    ]),
    ("idu-painting", "Joseph Lindon Smith Painting of Idu", [
        ("English", "", Y + "ltNrUrT4HxA"),
        ("Spanish", "", Y + "FSnAxqhHJiw"),
        ("Italian", "", Y + "45ehseMXtVE"),
        ("German", "", Y + "EZWAuf5iNZA"),
        ("Chinese", "", Y + "wQKVOkApMGU"),
        ("Arabic", "", Y + "YAqyaIcPzGg"),
        ("French", "", Y + "SLpKDpNM1pk"),
    ]),
    ("directors-tour", "Director’s Highlights Tour", [
        ("English", "", Y + "NC-3L28jKRY"),
        ("Spanish", "Spain", Y + "-cCErl3Kc3o"),
        ("Chinese", "", Y + "CZmNneGihrs"),
        ("Arabic", "Egypt", Y + "pXl9nDZHctw"),
        ("French", "", Y + "g_wE53JymBM"),
    ]),
]

SUBTITLE = "Choose your language"
NOTE = ("Videos were translated from the original English using AI. "
        "Please be patient with caption mistakes, mispronounced words, or other issues.")

e = html.escape
HERE = os.path.dirname(os.path.abspath(__file__))


def head(title, css):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000127">
<title>{e(title)} · HMANE</title>
<link rel="preload" href="{css}fonts/ApercuPro-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{css}videos.css">
</head>
"""


def object_page(slug, title, langs):
    buttons = []
    for i, (lang, region, url) in enumerate(langs):
        sub = f'<span class="lang__region">{e(region)}</span>' if region else ""
        label = lang + (f" ({region})" if region else "")
        buttons.append(
            f'    <a class="lang" href="{e(url)}" target="_blank" rel="noopener" '
            f'data-key="{i}" data-yt="{e(url.rsplit("/", 1)[-1])}" data-label="{e(label)}" '
            f'aria-label="Watch in {e(label)}">'
            f'<span class="lang__name">{e(lang)}</span>{sub}</a>')
    n = len(langs)
    return head(title, "../") + f"""<body>
<main class="page">
  <h1 class="title">{e(title)}</h1>
  <p class="subtitle">{SUBTITLE}</p>
  <p class="note">{NOTE}</p>
  <nav class="grid" data-count="{n}" aria-label="Languages">
{chr(10).join(buttons)}
  </nav>
</main>
<section class="player" id="player" hidden aria-label="Video">
  <div class="player__bar">
    <button class="back" type="button" id="back">Languages</button>
    <p class="player__lang" id="playerLang"></p>
  </div>
  <div class="player__frame" id="frame"></div>
</section>
<script src="../videos.js"></script>
</body>
</html>
"""


def index_page():
    items = "\n".join(
        f'    <a class="lang lang--object" href="{slug}/"><span class="lang__name">{e(t)}</span>'
        f'<span class="lang__region">{len(l)} languages</span></a>'
        for slug, t, l in OBJECTS)
    return head("Director’s Videos", "") + f"""<body>
<main class="page">
  <h1 class="title">Director’s Videos</h1>
  <p class="subtitle">Choose an object</p>
  <nav class="grid grid--objects" aria-label="Objects">
{items}
  </nav>
</main>
</body>
</html>
"""


if __name__ == "__main__":
    for slug, title, langs in OBJECTS:
        os.makedirs(os.path.join(HERE, slug), exist_ok=True)
        with open(os.path.join(HERE, slug, "index.html"), "w", encoding="utf-8") as f:
            f.write(object_page(slug, title, langs))
    with open(os.path.join(HERE, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_page())
    with open(os.path.join(HERE, "links.json"), "w", encoding="utf-8") as f:
        json.dump([{"slug": s, "title": t, "videos": [{"language": l, "region": r, "url": u} for l, r, u in v]}
                   for s, t, v in OBJECTS], f, ensure_ascii=False, indent=2)
    print(f"Built {len(OBJECTS)} object pages + index")
