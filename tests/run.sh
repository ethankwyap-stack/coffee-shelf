#!/bin/bash
# Runs the browser tests against a LOCAL copy of the data. Never touches production.
# Usage: bash tests/run.sh [test-save-safety.js]
set -e
cd "$(dirname "$0")/.."
TEST="${1:-test-save-safety.js}"

# Work on a copy of the newest backup so a test can never damage real data.
LATEST=$(ls -t backups/*.json 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  python3 -c "
import json,sys
d=json.load(open('$LATEST'))
json.dump(d['bags'] if isinstance(d,dict) else d, open('bags.json','w'))"
  echo "seeded bags.json from $LATEST"
fi

node server.js > /tmp/coffee-test-server.log 2>&1 &
SRV=$!
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --remote-debugging-port=9222 --disable-gpu --no-first-run \
  --user-data-dir=/tmp/coffee-test-chrome > /dev/null 2>&1 &
CHR=$!
trap 'kill $SRV $CHR 2>/dev/null' EXIT
sleep 4

node "tests/$TEST"
