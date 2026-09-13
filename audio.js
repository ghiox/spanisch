'use strict';
/* Vorgerenderte Sprachclips: audio/<stimme>/<key>.mp3, erzeugt von build/tts.js (Google TTS).
   iOS gibt Web-Apps nur die schlechten Kompaktstimmen - deshalb Clips statt Live-Sprachausgabe.
   audioKey() ist die einzige Verbindung zwischen Build und App: hier definiert, dort geladen.
   Kein Clip (Eigener Text, offline nie gehoert) -> fallback() = Browser-Sprachausgabe. */

var AUDIO_DIR = 'audio/n2f/'; // es-ES-Neural2-F; neue Stimme = neuer Ordner, sonst bleibt der alte Cache

/* FNV-1a 32 Bit mit zwei Startwerten -> 16 Hex. Whitespace-tolerant, sonst exakt. */
function audioKey(t) {
  var s = String(t == null ? '' : t).trim().replace(/\s+/g, ' '), out = '';
  [0x811c9dc5, 0x050c5d1f].forEach(function (seed) {
    var h = seed >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    out += ('0000000' + h.toString(16)).slice(-8);
  });
  return out;
}

/* Ein einziges Audio-Element: iOS erlaubt play() ohne Geste nur auf einem Element, das
   schon einmal per Geste gespielt hat. rate = Abspielgeschwindigkeit, Tonhoehe bleibt. */
var AUD = null, audioMissing = {};
function audioPlay(t, rate, onend, fallback) {
  var k = audioKey(t);
  if (audioMissing[k]) return fallback(t, rate, onend);
  if (!AUD) { AUD = new Audio(); AUD.preload = 'auto'; }
  AUD.onended = function () { if (onend) onend(); };
  AUD.onerror = function () { audioMissing[k] = 1; fallback(t, rate, onend); };
  AUD.src = AUDIO_DIR + k + '.mp3';
  AUD.defaultPlaybackRate = AUD.playbackRate = rate || 1;
  var p = AUD.play();
  if (p && p['catch']) p['catch'](function () {});
}
function audioStop() { if (AUD) { AUD.onended = null; AUD.pause(); } }
