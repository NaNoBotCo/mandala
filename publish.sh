#!/bin/bash
# Build the site into docs/, checked. GitHub Pages serves docs/ from main.
#   ./publish.sh          (cards need tools/serve.py running on :9113)
set -euo pipefail
cd "$(dirname "$0")"
STYLE="$HOME/.claude/bin/stylecheck.py"
python3 "$STYLE" tools src README.md NOTICE.txt || { echo "REFUSED: style. See ~/.claude/STYLE.md"; exit 4; }
python3 tools/build.py
python3 tools/card.py
python3 "$STYLE" docs/index.html docs/*/index.html || { echo "REFUSED: style in built pages"; exit 4; }
if grep -rl "/Users/" docs >/dev/null 2>&1; then echo "REFUSED: host paths in docs/"; exit 2; fi
echo "docs/ ← $(find docs -name 'index.html' | wc -l | tr -d ' ') pages, $(du -sh docs | cut -f1)"
