#!/usr/bin/env bash
# Lifted from Overload's prototype/check/run.sh: build, inline into one page,
# then open every DEMO state in a real browser and report anything cut off.
# New: both widths (phone 390 px, desktop 1280 px). Publish only on a clean run.
set -e
cd "$(dirname "$0")/.."
rm -rf dist && npx vite build >/dev/null 2>&1
OUT="${PROTOTYPE_OUT:-$PWD/starter-prototype.html}"
node inline.mjs dist "$OUT" >/dev/null
{ printf '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; cat "$OUT"; echo '</body></html>'; } > check/page.html
rm -rf check/shots
timeout 600 node check/clipping.mjs "$PWD/check/page.html" check/shots
