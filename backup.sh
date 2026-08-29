#!/bin/bash
# Saves a dated copy of the LIVE data into backups/. Run before any risky change.
set -e
cd "$(dirname "$0")"
source .app-secret
OUT="backups/$(date +%Y-%m-%d-%H%M).json"
curl -fsS "https://coffee-shelf-smoky.vercel.app/api/bags?k=$EDIT_KEY" -o "$OUT"
python3 -c "
import json; d=json.load(open('$OUT'))
print('saved $OUT —', len(d['bags']), 'bags')"
