#!/usr/bin/env bash
# Build a self-contained, distributable bundle for one experience.
#
#   ./tools/build-bundle.sh rosetta-stone [version]
#
# Produces dist/<experience>-<version>.zip containing the experience plus a
# local copy of shared/, with the ../../shared/ paths rewritten to ./shared/
# so the unzipped folder runs from any web root without modification.

set -euo pipefail

EXP="${1:?usage: build-bundle.sh <experience-folder> [version]}"
VERSION="${2:-dev}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/experiences/$EXP"
STAGE="$ROOT/dist/$EXP"
OUT="$ROOT/dist/${EXP}-${VERSION}.zip"

[ -d "$SRC" ] || { echo "::error::No such experience: experiences/$EXP"; exit 1; }
[ -f "$SRC/index.html" ] || { echo "::error::experiences/$EXP/index.html is missing"; exit 1; }

rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"

# 1. copy the experience
cp -R "$SRC/." "$STAGE/"

# 2. vendor the shared assets so the bundle stands alone
if [ -d "$ROOT/shared" ]; then
  mkdir -p "$STAGE/shared"
  cp -R "$ROOT/shared/." "$STAGE/shared/"
fi

# 3. rewrite repo-relative paths to bundle-relative ones
#    (temp-file swap rather than sed -i, which differs between GNU and BSD sed)
while IFS= read -r -d '' f; do
  sed 's|\.\./\.\./shared/|./shared/|g' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done < <(find "$STAGE" -name '*.html' -type f -print0)

# 4. strip development cruft
find "$STAGE" \( -name '.DS_Store' -o -name '.gitkeep' -o -name 'Thumbs.db' \) -type f -delete

# 5. a note for whoever unzips it
cat > "$STAGE/HOW-TO-HOST.txt" <<TXT
${EXP} — version ${VERSION}

This folder is a complete, self-contained web AR experience.

To host it:
  1. Upload the entire contents of this folder to any web server.
  2. The server MUST serve over HTTPS. Browsers block camera access on
     plain HTTP, so the experience will not start without it.
  3. Open index.html in a mobile browser and allow camera access.

Requires an internet connection: the A-Frame and MindAR libraries load
from a public CDN. To run fully offline, download those two scripts into
this folder and update the <script> tags in index.html.

Tested on iOS Safari and Android Chrome.
TXT

# 6. zip it
( cd "$ROOT/dist" && zip -rq "$(basename "$OUT")" "$EXP" -x '*.DS_Store' )
rm -rf "$STAGE"

echo "Built: dist/$(basename "$OUT")  ($(du -h "$OUT" | cut -f1))"
