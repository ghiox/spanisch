/* Selbsttest Sprachclips - wird von test_audio.sh in eine Kopie von index.html injiziert
   und headless geladen. Ergebnis steht im <title>. Braucht mindestens einen gerenderten
   Clip in audio/n2f (build/tts.js); ohne den Ordner wird der Abspielteil uebersprungen. */
setTimeout(function () {
  var out = [], ok = true;
  function t(c, m) { if (!c) { ok = false; out.push('FAIL ' + m); } }

  /* --- a) Schluessel: stabil, whitespace-tolerant, sonst exakt --- */
  t(/^[0-9a-f]{16}$/.test(audioKey('hola')), 'key/16 hex');
  t(audioKey('  El perro   es grande. ') === audioKey('El perro es grande.'), 'key/whitespace egal');
  t(audioKey('casa') !== audioKey('Casa'), 'key/gross-klein zaehlt');
  t(audioKey('El perro es grande.') === '0d6d920db6fc0ccb', 'key/fester Wert (Build und App gleich)');

  /* --- b) Fallback: kein Clip -> Browser-Sprachausgabe, genau einmal --- */
  var calls = [];
  ttsSpeak = function (txt, rate, onend) { calls.push(txt); };
  playText('xyzzy frobnitz nicht gerendert', 1.0);
  setTimeout(function () {
    t(calls.length === 1 && calls[0] === 'xyzzy frobnitz nicht gerendert', 'fallback/einmal aufgerufen (' + calls.length + ')');
    t(audioMissing[audioKey('xyzzy frobnitz nicht gerendert')] === 1, 'fallback/als fehlend gemerkt');

    /* --- c) Clip vorhanden -> Audio-Element, kein Fallback --- */
    calls = [];
    playText('El perro es grande.', 0.9);
    t(AUD && /audio\/n2f\/0d6d920db6fc0ccb\.mp3$/.test(AUD.src), 'clip/src gesetzt (' + (AUD && AUD.src) + ')');
    t(AUD && AUD.playbackRate === 0.9, 'clip/tempo = 0.9');
    setTimeout(function () {
      t(calls.length === 0, 'clip/kein Fallback (' + calls.length + ')');
      /* --- d) Stale-Kette: onend eines alten Texts feuert nicht mehr --- */
      var fired = 0;
      playText('El perro es grande.', 1.0, function () { fired++; });
      playText('Voy a casa.', 1.0);
      AUD.onended && AUD.onended();
      t(fired === 0, 'kette/altes onend unterdrueckt');
      document.title = (ok ? 'PASS' : 'FAIL') + ' ' + out.join('; ');
    }, 700);
  }, 700);
}, 900);
