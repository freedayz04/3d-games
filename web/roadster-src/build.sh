#!/bin/sh
# Concatenate the source parts into the single-file playable page.
cd "$(dirname "$0")"
cat 00-head.html 10-data.js 20-engine.js 30-models.js 40-game.js 50-ui.js 99-tail.html > ../roadster-survive.html
echo "built ../roadster-survive.html ($(wc -c < ../roadster-survive.html) bytes)"
