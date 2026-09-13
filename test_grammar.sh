#!/bin/sh
# Selbsttest Grammatik-Renderer (it.img): index.html + test_grammar.js headless laden, <title> pruefen.
#   sh test_grammar.sh   ->  "PASS" oder "FAIL ..."
DIR=$(cd "$(dirname "$0")" && pwd)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$DIR/_test_grammar.tmp.html"
sed 's#</body>#<script src="test_grammar.js"></script></body>#' "$DIR/index.html" > "$TMP"
RES=$("$CHROME" --headless --disable-gpu --no-sandbox --virtual-time-budget=5000 --window-size=900,700 \
  --dump-dom "file://$TMP" 2>/dev/null | sed -n 's#.*<title>\(.*\)</title>.*#\1#p')
rm -f "$TMP"
echo "$RES"
case "$RES" in PASS*) exit 0;; *) exit 1;; esac
