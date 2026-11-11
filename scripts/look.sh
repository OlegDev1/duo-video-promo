#!/usr/bin/env bash
# Render stills at the given seconds and tile them into out/sheet.jpg.
# Usage: scripts/look.sh <cols> <scale> <seconds> [<seconds> ...]
set -euo pipefail
cd "$(dirname "$0")/.."
cols=$1; scale=$2; shift 2
rm -f out/stills/*.jpg
node scripts/stills.mjs --scale="$scale" "$@"
python3 scripts/sheet.py out/sheet.jpg "$cols" $(ls out/stills/*.jpg | sort -V)
