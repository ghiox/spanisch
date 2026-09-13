/* Selbsttest Lese-Modul - wird von test_read.sh in eine Kopie von index.html
   injiziert und headless geladen. Ergebnis steht im <title>.
   TEXTS wird hier synthetisch gesetzt, falls data/texts.js fehlt - der Test
   haengt also nicht an der Datendatei. */
if (typeof TEXTS === 'undefined') {
  window.TEXTS = [
    { id: 'tt1', topic: 'Testthema', level: 1, title: 'Testtext eins',
      text: 'La casa es grande.\n\nEsta casa tiene una puerta.',
      gloss: { casa: 'Haus', puerta: 'Tür', esta: 'diese' }, folge: [] },
    { id: 'tt2', topic: 'Testthema', level: 2, title: 'Testtext zwei',
      text: 'El perro está en la casa.', gloss: { perro: 'Hund' }, folge: [] }
  ];
}
setTimeout(function () {
  var out = [], ok = true;
  function t(c, m) { if (!c) { ok = false; out.push('FAIL ' + m); } }
  function noThrow(m, fn) {
    try { fn(); return true; }
    catch (e) { t(false, m + ' wirft: ' + ((e && e.message) || e)); return false; }
  }

  /* --- a) Gloss-Lookup --- */
  var T = TEXTS[0];
  t(readGloss(T, 'casa') === T.gloss.casa, 'gloss/bekanntes Wort');
  t(readGloss(T, 'Casa!') === T.gloss.casa, 'gloss/Gross- und Satzzeichen egal');
  t(readGloss(T, 'está') === T.gloss.esta, 'gloss/Akzent-tolerant');
  t(!readGloss(T, 'xyzzy'), 'gloss/unbekanntes Wort falsy');
  t(!readGloss(TEXTS[1], 'puerta'), 'gloss/nur der eigene Text');

  /* --- b) Abdeckung: bekannte Lemmas + ein Fake-Token --- */
  var K = readKnownForms(), lemmas = [];
  Object.keys(K).forEach(function (k) {
    if (lemmas.length < 5 && /^[a-záéíóúüñç]{3,}$/.test(k) && readLookup(k)) lemmas.push(k);
  });
  t(lemmas.length === 5, 'abdeckung/5 bekannte Lemmas gefunden (sind ' + lemmas.length + ')');
  t(!readLookup('xyzzy'), 'abdeckung/xyzzy nicht im Wortschatz');
  var c = readCoverage(lemmas.join(' ') + ' xyzzy.');
  t(c.total === lemmas.length + 1, 'abdeckung/Wortzahl (' + c.total + ')');
  t(c.known === lemmas.length, 'abdeckung/alle Lemmas bekannt (' + c.known + '/' + lemmas.length + ')');
  t(c.unknown.length === 1 && c.unknown[0] === 'xyzzy', 'abdeckung/xyzzy als unbekannt gemeldet');
  t(c.pct < 100, 'abdeckung/unter 100% (' + c.pct + '%)');
  t(c.pct > 0, 'abdeckung/ueber 0% (' + c.pct + '%)');
  var only = readCoverage('xyzzy frobnitz');
  t(only.pct === 0 && only.unknown.length === 2, 'abdeckung/nur Fake-Tokens = 0%');

  /* --- c) Textliste --- */
  if (noThrow('readHome()', readHome)) {
    var btns = [].slice.call(document.querySelectorAll('#app [data-id]'));
    t(btns.length === TEXTS.length, 'home/' + TEXTS.length + ' Text-Buttons (sind ' + btns.length + ')');
    TEXTS.forEach(function (x) {
      t(btns.some(function (b) { return b.getAttribute('data-id') === x.id; }), 'home/Eintrag ' + x.id);
    });
    t(!!document.querySelector('#app #own'), 'home/Button Eigener Text');
    t(!/Textdaten fehlen/.test(document.getElementById('app').textContent), 'home/ohne "Textdaten fehlen"');
  }

  document.title = (ok ? 'PASS' : 'FAIL') + ' ' + out.join('; ');
}, 900);
