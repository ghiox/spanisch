/* Selbsttest Hoeren-Modul - wird von test_listen.sh in eine Kopie von
   index.html injiziert und headless geladen. Ergebnis steht im <title>.
   TTS ist headless ein No-op (lSpeak steigt ohne speechSynthesis aus). */
setTimeout(function () {
  var out = [], ok = true;
  function t(c, m) { if (!c) { ok = false; out.push('FAIL ' + m); } }
  function noThrow(m, fn) {
    try { fn(); return true; }
    catch (e) { t(false, m + ' wirft: ' + ((e && e.message) || e)); return false; }
  }

  /* --- a) Wort-Diff --- */
  var d = listenDiff('la casa', 'la casa');
  t(d.words.length === 2 && d.words[0].s === 'ok' && d.words[1].s === 'ok' &&
    d.score === 1 && d.ok === true && !d.extra.length, 'diff/exakt-richtig');

  d = listenDiff('esta aqui', 'está aquí');
  t(d.words.length === 2 && d.words[0].s === 'acc' && d.words[1].s === 'acc' &&
    d.words[0].w === 'está' && d.score === 1, 'diff/nur-akzent');

  d = listenDiff('mi hermana', 'mi hermano');
  t(d.words.length === 2 && d.words[0].s === 'ok' && d.words[1].s === 'bad' &&
    d.words[1].w === 'hermano' && d.words[1].typed === 'hermana' &&
    d.ok === false && d.score === 0.5, 'diff/falsches-wort');

  d = listenDiff('mi casa', 'mi gran casa');
  t(d.words.length === 3 && d.words[1].s === 'miss' && d.words[1].w === 'gran' &&
    d.words[1].typed === '' && !d.extra.length && d.ok === false, 'diff/fehlendes-wort');

  d = listenDiff('mi gran casa', 'mi casa');
  t(d.words.length === 2 && d.words[0].s === 'ok' && d.words[1].s === 'ok' &&
    d.extra.length === 1 && d.extra[0] === 'gran' && d.ok === false, 'diff/zu-viel-getippt');

  /* --- b) Betonungspaare --- */
  var sp = listenStressPairs();
  t(sp.length >= 10, 'stresspaare/mindestens 10 (sind ' + sp.length + ')');
  var badPair = 0, sameNorm = 0;
  sp.forEach(function (p) {
    if (!p.a || !p.b || p.a === p.b) badPair++;
    if (norm(p.a) !== norm(p.b)) sameNorm++;
  });
  t(badPair === 0, 'stresspaare/zwei verschiedene Schreibweisen (' + badPair + ' kaputt)');
  t(sameNorm === 0, 'stresspaare/gleich ohne Akzente (' + sameNorm + ' kaputt)');
  t(sp.some(function (p) { return /[áéíóú]/.test(p.a + p.b); }), 'stresspaare/akzentuiert');

  /* --- c) Menue --- */
  if (noThrow('listenHome()', listenHome)) {
    var btns = [].slice.call(document.querySelectorAll('#app [data-d]'));
    t(btns.length === 5, 'menue/5 Drill-Buttons (sind ' + btns.length + ')');
    ['dik', 'mp', 'sin', 'dec', 'sha'].forEach(function (id) {
      t(btns.some(function (b) { return b.getAttribute('data-d') === id; }), 'menue/Eintrag ' + id);
    });
  }

  /* --- d) Alle 5 Drills betretbar --- */
  [['dik', lDiktat], ['mp', lMinPairs], ['sin', lSinalefa], ['dec', lDecode], ['sha', lShadow]]
    .forEach(function (p) {
      if (!noThrow('drill/' + p[0], function () { p[1](); })) return;
      t(!!document.querySelector('#app .lmenu'), 'drill/' + p[0] + ' rendert Rahmen');
      t(!/Daten fehlen/.test(document.getElementById('app').textContent), 'drill/' + p[0] + ' ohne "Daten fehlen"');
    });

  document.title = (ok ? 'PASS' : 'FAIL') + ' ' + out.join('; ');
}, 900);
