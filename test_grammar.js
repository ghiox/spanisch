/* Selbsttest fuer den Grammatik-Renderer (optionales it.img) - wird von
   test_grammar.sh in eine Kopie von index.html injiziert und headless geladen.
   Ergebnis steht im <title>. */
setTimeout(function () {
  var out = [], ok = true;
  function t(c, m) { if (!c) { ok = false; out.push('FAIL ' + m); } }
  var SVG = '<svg id="tsvg" viewBox="0 0 20 10"><rect width="20" height="10" fill="#b4460f"/></svg>';
  var ITEMS = {
    mc: { id: 'test-mc', type: 'mc', sentence: 'Mi problema es difícil.', q: 'Genus?', options: ['maskulin', 'feminin'], answer: 0, expl: 'x' },
    choice: { id: 'test-choice', type: 'choice', sentence: '___ casa es blanca.', options: ['La', 'El'], answer: 0, expl: 'x' },
    cloze: { id: 'test-cloze', type: 'cloze', sentence: 'Yo ___ aquí.', hint: 'estar', answers: ['estoy'], expl: 'x' }
  };
  function render(it) { gs = { q: [{ it: it }], p: GRAMMAR[0], rev: 0, ok: 0 }; gNext(); }

  Object.keys(ITEMS).forEach(function (k) {
    var withImg = {}, key;
    for (key in ITEMS[k]) withImg[key] = ITEMS[k][key];
    withImg.img = SVG;

    render(withImg);
    var g = document.querySelector('#app .gimg');
    t(!!g, k + ': .gimg fehlt');
    t(!!document.getElementById('tsvg'), k + ': SVG nicht im DOM');
    if (g) {
      t(g.parentNode.className === 'card', k + ': .gimg nicht in der Karte');
      t(g.parentNode.firstElementChild === g, k + ': .gimg nicht ueber dem Satz');
      t(g.getBoundingClientRect().width <= 361, k + ': .gimg breiter als 360px');
    }
    t(document.querySelectorAll('#app .gimg').length === 1, k + ': mehr als ein .gimg');
    t(!!document.querySelector('#app .card .es'), k + ': Satz fehlt');

    render(ITEMS[k]);
    t(!document.querySelector('#app .gimg'), k + ': .gimg trotz fehlendem img');
    t(document.querySelectorAll('#app svg').length === 0, k + ': SVG trotz fehlendem img');
    withImg.img = '';
    render(withImg);
    t(!document.querySelector('#app .gimg'), k + ': .gimg bei leerem img');
  });
  document.title = (ok ? 'PASS' : 'FAIL') + ' ' + out.join('; ');
}, 900);
