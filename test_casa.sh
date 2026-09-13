#!/bin/sh
# Selbsttest Casa-Modus: index.html + test_casa.js headless laden, <title> pruefen.
#   sh test_casa.sh   ->  "PASS" oder "FAIL ..."
DIR=$(cd "$(dirname "$0")" && pwd)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$DIR/_test_casa.tmp.html"
sed 's#</body>#<script src="test_casa.js"></script></body>#' "$DIR/index.html" > "$TMP"
RES=$("$CHROME" --headless --disable-gpu --no-sandbox --virtual-time-budget=5000 --window-size=900,700 \
  --dump-dom "file://$TMP#casa/cocina" 2>/dev/null | sed -n 's#.*<title>\(.*\)</title>.*#\1#p')
rm -f "$TMP"
echo "$RES"
case "$RES" in PASS*) exit 0;; *) exit 1;; esac
