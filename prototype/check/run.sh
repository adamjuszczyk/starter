#!/usr/bin/env bash
# Lifted from Overload's prototype/check/run.sh: build the kit, inline it into one page, then open every DEMO state in a real browser and report
# anything cut off, any state that is not what it says, and any overlay that leaves the phone frame (check/clipping.mjs). Both widths (phone 390 px,
# desktop 1280 px), both themes; 80 screenshots in check/shots/ (not committed). Publish only on a clean run, and look at the screenshots.
# From the repo root: npm run proto:check (which also typechecks the kit and runs check/kit.test.mjs first).
set -e
cd "$(dirname "$0")/.."
LOG="$(mktemp)"
rm -rf dist
if ! npx vite build >"$LOG" 2>&1; then
  cat "$LOG"
  echo "the kit did not build"
  exit 1
fi
OUT="${PROTOTYPE_OUT:-$PWD/starter-prototype.html}"
node inline.mjs dist "$OUT" >/dev/null
{ printf '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; cat "$OUT"; echo '</body></html>'; } > check/page.html
rm -rf check/shots
timeout 600 node check/clipping.mjs "$PWD/check/page.html" check/shots
