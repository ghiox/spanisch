#!/bin/sh
# Selbsttest Sprachclips: index.html + test_audio.js headless laden, <title> pruefen.
#   sh test_audio.sh   ->  "PASS" oder "FAIL ..."
DIR=$(cd "$(dirname "$0")" && pwd)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$DIR/_test_audio.tmp.html"
sed 's#</body>#<script src="test_audio.js"></script></body>#' "$DIR/index.html" > "$TMP"
RES=$("$CHROME" --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 --autoplay-policy=no-user-gesture-required --window-size=900,700 \
  --dump-dom "file://$TMP" 2>/dev/null | sed -n 's#.*<title>\(.*\)</title>.*#\1#p')
rm -f "$TMP"
echo "$RES"
case "$RES" in PASS*) exit 0;; *) exit 1;; esac
