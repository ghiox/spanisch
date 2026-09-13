/* Selbsttest Lektion & Serie - wird von test_lesson.sh in eine Kopie von index.html
   injiziert und headless geladen (leerer localStorage). Ergebnis steht im <title>. */
setTimeout(function () {
  var out = [], ok = true;
  function t(c, m) { if (!c) { ok = false; out.push('FAIL ' + m); } }
  function noThrow(m, fn) {
    try { fn(); return true; }
    catch (e) { t(false, m + ' wirft: ' + ((e && e.message) || e)); return false; }
  }
  function dk(off) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return dateKey(d); }

  /* --- a) Lektion: Text + Schritte --- */
  var L = lessonToday();
  t(L.date === today(), 'lektion/datum heute');
  t(L.textId === TEXTS[0].id, 'lektion/erster ungelesener Text (' + L.textId + ')');
  var steps = lessonSteps();
  t(steps.map(function (s) { return s.id; }).join(',') === 'vocab,read,dik,gram,sha', 'lektion/schritte ' + steps.map(function (s) { return s.id; }).join(','));
  t(steps[4].opt === true && !steps[0].opt, 'lektion/nur shadowing optional');
  t(/Stufe 1/.test(steps[1].sub), 'lektion/lesen-untertitel (' + steps[1].sub + ')');

  /* --- b) Pool + Vokabel-Priorisierung aus den Zielwoertern --- */
  var T = TEXTS[0], pool = lessonPool(T);
  t(pool && pool.length >= 5, 'pool/>=5 Saetze aus dem Text (' + (pool && pool.length) + ')');
  t(pool && pool.every(function (x) { return x.ej && x.ej.es && T.text.indexOf(x.ej.es) >= 0; }), 'pool/Saetze stammen aus dem Text');
  var seen = {}, dupe = false, stq = { n: 0, ok: 0, pool: pool, max: 5 };
  for (var di = 0; di < 5; di++) { var w = lDraw(stq, pool); if (seen[w.ej.es]) dupe = true; seen[w.ej.es] = 1; }
  t(!dupe, 'diktat/5 Ziehungen ohne Wiederholung');
  var pref = newWords(5, T.targets);
  t(pref.length === 5, 'newWords/5 Woerter');
  var tg = {}; T.targets.forEach(function (x) { tg[norm(x)] = 1; });
  t(tg[norm(pref[0].es)], 'newWords/Zielwort zuerst (' + pref[0].es + ')');
  t(newWords(3).length === 3 && newWords(3)[0].r === 1, 'newWords/ohne prefer nach Rang');

  /* --- b2) Signal "nicht gekannt": boost + Tageslast-Bremse --- */
  var fam = readLookup('familia');
  t(fam && fam.r, 'boost/familia im Wortschatz');
  boostWord('familia');
  t(S.boost[fam.r] === 1, 'boost/ohne Karte -> vorgemerkt');
  t(newWords(1)[0].r === fam.r, 'boost/kommt als naechstes neues Wort');
  S.cards['w:' + fam.r + ':r'] = fsrsInit(3, Date.now()); S.cards['w:' + fam.r + ':r'].due = Date.now() + 5 * DAY;
  S.cards['w:' + fam.r + ':p'] = fsrsInit(3, Date.now());
  boostWord('familia');
  t(S.cards['w:' + fam.r + ':r'].due <= Date.now(), 'boost/mit Karte -> sofort faellig');
  t(newWordQuota() === 15, 'last/0 faellig -> 15 neu (' + newWordQuota() + ')');
  for (var bi = 0; bi < 60; bi++) { S.cards['w:' + (5000 + bi) + ':p'] = fsrsInit(3, Date.now()); S.cards['w:' + (5000 + bi) + ':p'].due = Date.now() - 1; }
  t(newWordQuota() === 6, 'last/60 faellig -> 6 neu (' + newWordQuota() + ')');
  for (bi = 60; bi < 90; bi++) { S.cards['w:' + (5000 + bi) + ':p'] = fsrsInit(3, Date.now()); S.cards['w:' + (5000 + bi) + ':p'].due = Date.now() - 1; }
  t(newWordQuota() === 0, 'last/90 faellig -> 0 neu');
  Object.keys(S.cards).forEach(function (k) { if (+k.split(':')[1] >= 5000) delete S.cards[k]; });
  t(/~\d+ min/.test(lessonCard(lessonSteps())), 'lektion/zeitschaetzung sichtbar');

  /* --- c) Abschluss + Serie --- */
  var s0 = streak();
  t(s0.cur === 0 && s0.best === 0, 'serie/leer = 0');
  S.lessonLog[dk(-2)] = 1; S.lessonLog[dk(-1)] = 1;
  t(streak().cur === 2, 'serie/heute offen zaehlt bis gestern (' + streak().cur + ')');
  lessonMark('vocab'); lessonMark('read'); lessonMark('dik');
  t(!S.lessonLog[today()], 'serie/unvollstaendig nicht geloggt');
  lessonMark('gram');
  t(S.lessonLog[today()] === 1, 'serie/alle Pflichtschritte -> heute geloggt');
  t(streak().cur === 3 && streak().best === 3, 'serie/3 in Folge (' + JSON.stringify(streak()) + ')');
  S.lessonLog[dk(-10)] = 1; S.lessonLog[dk(-9)] = 1; S.lessonLog[dk(-8)] = 1; S.lessonLog[dk(-7)] = 1;
  t(streak().cur === 3 && streak().best === 4, 'serie/rekord ueber Luecke (' + JSON.stringify(streak()) + ')');

  /* --- d) Home-Render --- */
  if (noThrow('home()', home)) {
    var app = document.getElementById('app');
    t(app.querySelectorAll('[data-ls]').length === 5, 'home/5 Schritt-Buttons');
    t(app.querySelectorAll('.heat i').length === 7 * HEAT_WEEKS, 'home/heatmap zellen');
    t(app.querySelectorAll('.heat i.on').length === 7, 'home/7 Lektionstage markiert (' + app.querySelectorAll('.heat i.on').length + ')');
    t(app.querySelectorAll('.heat i.now').length === 1, 'home/heute markiert');
    t(/Lektion geschafft/.test(app.textContent), 'home/Status geschafft');
    t(/3 Tage/.test(app.textContent) && /Rekord 4/.test(app.textContent), 'home/serie + rekord sichtbar');
    t(app.querySelectorAll('[data-ls]')[4].className === 'primary', 'home/shadowing als naechster Schritt');
    t(app.querySelectorAll('[data-ls]')[0].textContent.indexOf('✓') === 0, 'home/vokabeln abgehakt');
  }

  /* --- e) Diktat/Shadowing mit Lektions-Pool und Ende nach max --- */
  var fin = 0;
  if (noThrow('lDiktat(pool)', function () { lDiktat({ n: 4, ok: 4, pool: pool, max: 5, onDone: function () { fin++; } }); })) {
    t(/Satz 5\/5/.test(document.getElementById('app').textContent), 'diktat/zaehler 5/5');
    document.getElementById('ans').value = 'x';
    document.getElementById('go').click();
    t(/Fertig \(Enter\)/.test(document.getElementById('app').textContent), 'diktat/letzter Satz -> Fertig');
    document.getElementById('go').click();
    t(fin === 1, 'diktat/onDone nach max');
  }
  if (noThrow('lShadow(pool)', function () { lShadow({ n: 2, step: 2, w: pool[0], pool: pool, max: 3, onDone: function () { fin++; } }); })) {
    t(/Fertig \(Enter\)/.test(document.getElementById('app').textContent), 'shadow/letzter Satz -> Fertig');
    document.getElementById('go').click();
    t(fin === 2, 'shadow/onDone nach max');
  }

  document.title = (ok ? 'PASS' : 'FAIL') + ' ' + out.join('; ');
}, 900);
