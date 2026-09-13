'use strict';
/* Spanisch-Lern-App - vanilla JS, kein Build, laeuft ueber file://
   Screens werden komplett in #app gerendert; keyHandler pro Screen. */

var KEY = 'esapp-v1';
var DAY = 86400000;
var app, keyHandler = null, S;

/* ---------- Speicher ---------- */
function defState() {
  return { cards: {}, notes: {}, settings: { newPerDay: 15 }, introDates: {}, gramIntroDates: {}, reviewLog: {}, seenRules: {}, listen: {}, read: {}, lesson: {}, lessonLog: {} };
}
function load() {
  S = defState();
  try {
    var o = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (var k in S) if (o && o[k] && typeof o[k] === 'object') S[k] = o[k];
    if (!(S.settings.newPerDay > 0)) S.settings.newPerDay = 15;
  } catch (e) { S = defState(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- Helfer ---------- */
function p2(n) { return (n < 10 ? '0' : '') + n; }
function dateKey(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function today() { return dateKey(new Date()); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function norm(s) { return String(s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' '); }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function haveWords() { return typeof WORDS !== 'undefined' && WORDS && WORDS.length > 0; }
function haveGrammar() { return typeof GRAMMAR !== 'undefined' && GRAMMAR && GRAMMAR.length > 0; }
function haveVerbs() { return typeof VERBS !== 'undefined' && VERBS && Object.keys(VERBS).length > 0; }
function haveHouse() { return typeof HOUSE !== 'undefined' && HOUSE && HOUSE.length > 0; }

function $(s) { return app.querySelector(s); }
function $$(s) { return [].slice.call(app.querySelectorAll(s)); }
function on(sel, ev, fn) { $$(sel).forEach(function (n) { n.addEventListener(ev, fn); }); }
function show(html) {
  keyHandler = null;
  app.innerHTML = html;
  on('.spk', 'click', function () { speak(this.getAttribute('data-t')); });
  on('[data-home]', 'click', home);
  window.scrollTo(0, 0);
}
function keys(map) {
  keyHandler = function (e) {
    if (e.target && e.target.tagName === 'TEXTAREA') return;
    var f = map[e.key];
    if (f) { e.preventDefault(); f(); }
  };
}
/* Chrome/Safari ignorieren u.lang oft und nehmen die Systemstimme (deutsch),
   solange u.voice nicht gesetzt ist. Stimmen laden asynchron -> onvoiceschanged.
   Feste Wahl: "Google español"; Fallback es-ES / irgendeine es-Stimme, falls sie fehlt. */
var esVoice = null;
function vLang(v) { return (v.lang || '').replace('_', '-'); }
function esVoices() {
  if (!window.speechSynthesis) return [];
  return (speechSynthesis.getVoices() || []).filter(function (v) { return /^es(-|$)/i.test(vLang(v)); });
}
function pickVoice() {
  var es = esVoices();
  esVoice = null;
  for (var i = 0; i < es.length && !esVoice; i++) if (/^google español$/i.test(es[i].name.trim())) esVoice = es[i];
  for (var j = 0; j < es.length && !esVoice; j++) if (/^es-ES/i.test(vLang(es[j]))) esVoice = es[j];
  if (!esVoice) esVoice = es[0] || null;
}
function speak(t) {
  if (!t || !window.speechSynthesis) return;
  if (!esVoice) pickVoice();
  var u = new SpeechSynthesisUtterance(t);
  u.lang = 'es-ES'; u.rate = (S && S.settings && S.settings.ttsRate) || 0.9;
  if (esVoice) u.voice = esVoice;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function spk(t, label) { return '<button class="spk" data-t="' + esc(t) + '">&#128266; ' + esc(label || 'Anhören') + '</button>'; }
function boldWord(sent, word) {
  var re = new RegExp('(' + String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
  return esc(sent).replace(re, '<b>$1</b>');
}
function gapHtml(sent) { return esc(sent).replace(/___+/g, '<span class="gap">&nbsp;</span>'); }
function backBtn() { return '<button data-home style="width:auto;min-height:40px;padding:8px 12px;font-size:14px">&larr; Menü</button>'; }

var POS = { 'art': 'Artikel', 'pron': 'Pronomen', 'prep': 'Präposition', 'conj': 'Konjunktion', 'adv': 'Adverb', 'adj': 'Adjektiv', 'noun-m': 'Nomen (m)', 'noun-f': 'Nomen (f)', 'verb': 'Verb', 'num': 'Zahlwort', 'intj': 'Ausruf', 'other': '' };
function posLabel(p) { return POS[p] !== undefined ? POS[p] : (p || ''); }

/* Akzent-Leiste */
var ACC = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];
function accBar() {
  return '<div class="acc">' + ACC.map(function (c) { return '<button type="button" data-ch="' + c + '">' + c + '</button>'; }).join('') + '</div>';
}
function wireAcc(inp) {
  on('.acc button', 'click', function () {
    var ch = this.getAttribute('data-ch'), s = inp.selectionStart, e = inp.selectionEnd;
    inp.value = inp.value.slice(0, s) + ch + inp.value.slice(e);
    inp.selectionStart = inp.selectionEnd = s + ch.length;
    inp.focus();
  });
}

/* ---------- Karten / FSRS ---------- */
function isDue(id) { var c = S.cards[id]; return !!c && c.due <= Date.now(); }
function doGrade(id, g) {
  var c = S.cards[id];
  S.cards[id] = c ? fsrsReview(c, g, Date.now()) : fsrsInit(g, Date.now());
  var t = today();
  S.reviewLog[t] = (S.reviewLog[t] || 0) + 1;
  save();
}
function dueIds(prefix) {
  return Object.keys(S.cards).filter(function (id) { return id.indexOf(prefix) === 0 && S.cards[id].due <= Date.now(); });
}

/* ---------- HOME ---------- */
function newWordQuota() { return Math.max(0, (S.settings.newPerDay | 0) - (S.introDates[today()] || 0)); }
function newWords(limit, prefer) {
  if (!haveWords()) return [];
  var out = [], pref = {};
  (prefer || []).forEach(function (x) { pref[norm(x)] = 1; });
  // bevorzugte Woerter (Zielwoerter des Lektionstexts) zuerst, dann nach Haeufigkeit
  var ws = WORDS.slice().sort(function (a, b) { return (pref[norm(b.es)] || 0) - (pref[norm(a.es)] || 0) || a.r - b.r; });
  for (var i = 0; i < ws.length && out.length < limit; i++) if (!S.cards['w:' + ws[i].r + ':p']) out.push(ws[i]);
  return out;
}
/* ---------- LEKTION & SERIE ---------- */
/* Tageslektion = Checkliste aus den bestehenden Modulen, in fester Reihenfolge.
   Ein Text pro Tag (naechster ungelesener); seine Zielwoerter steuern neue Vokabeln,
   Diktat und Shadowing. Die Module bleiben frei nutzbar - jeder Abschluss zaehlt. */
function textById(id) {
  if (typeof TEXTS === 'undefined' || !TEXTS) return null;
  for (var i = 0; i < TEXTS.length; i++) if (TEXTS[i].id === id) return TEXTS[i];
  return null;
}
function lessonText() {
  if (typeof TEXTS === 'undefined' || !TEXTS || !TEXTS.length) return null;
  var done = (S.read && S.read.done) || {};
  for (var i = 0; i < TEXTS.length; i++) if (!done[TEXTS[i].id]) return TEXTS[i];
  return TEXTS[Math.floor(Math.random() * TEXTS.length)]; // alles gelesen: wiederholen
}
function lessonToday() {
  var L = S.lesson;
  if (!L || L.date !== today()) {
    var t = lessonText();
    L = S.lesson = { date: today(), textId: t ? t.id : null, done: {} };
    save();
  }
  return L;
}
/* Beispielsaetze der Zielwoerter - haben deutsche Uebersetzung, Textsaetze nicht. */
function lessonPool(t) {
  var want = {};
  (t.targets || []).forEach(function (x) { want[norm(x)] = 1; });
  var out = WORDS.filter(function (w) { return want[norm(w.es)] && w.ej && w.ej.es; });
  return out.length >= 3 ? out : null; // null -> Modul nimmt seinen Standard-Pool
}
function lessonGramPoint() {
  var best = null, bestDue = 0;
  GRAMMAR.forEach(function (p) {
    var d = p.items.filter(function (it) { return isDue('g:' + it.id); }).length;
    if (d > bestDue) { best = p; bestDue = d; }
  });
  if (best) return { p: best, due: bestDue };
  for (var i = 0; i < GRAMMAR.length; i++)
    if (GRAMMAR[i].items.some(function (it) { return !S.cards['g:' + it.id]; })) return { p: GRAMMAR[i], due: 0 };
  return { p: GRAMMAR[0], due: 0 };
}
function lessonBack(id) { return function () { lessonMark(id); home(); }; }
function lessonSteps() {
  var L = lessonToday(), t = textById(L.textId), steps = [], pool = t && haveWords() ? lessonPool(t) : null;
  if (haveWords()) steps.push({ id: 'vocab', label: 'Vokabeln', sub: dueIds('w:').length + ' fällig + ' + newWords(newWordQuota()).length + ' neu',
    go: function () { startVocab(t ? t.targets : null); } });
  if (t) steps.push({ id: 'read', label: 'Lesen', sub: t.title + ' · Stufe ' + (t.level || 1), go: function () { rReader(t); } });
  if (t && typeof lDiktat === 'function') steps.push({ id: 'dik', label: 'Diktat', sub: '5 Sätze mit Wörtern aus dem Text',
    go: function () { lDiktat({ n: 0, ok: 0, pool: pool, max: 5, onDone: lessonBack('dik') }); } });
  if (haveGrammar()) {
    var g = lessonGramPoint();
    steps.push({ id: 'gram', label: 'Grammatik', sub: g.p.title + ' · ' + (g.due ? g.due + ' fällig' : 'neue Aufgaben'), go: function () { gramOpen(g.p.id); } });
  }
  if (t && typeof lShadow === 'function') steps.push({ id: 'sha', label: 'Shadowing', sub: '3 Sätze · optional', opt: true,
    go: function () { lShadow({ n: 0, step: 0, w: null, pool: pool, max: 3, onDone: lessonBack('sha') }); } });
  return steps;
}
function lessonMark(id) {
  var L = lessonToday();
  L.done[id] = 1;
  var open = lessonSteps().filter(function (s) { return !s.opt && !L.done[s.id]; });
  if (!open.length) S.lessonLog[L.date] = 1;
  save();
}
/* Serie: Tage in Folge mit abgeschlossener Lektion. Heute noch offen -> zaehlt bis gestern. */
function streak() {
  var log = S.lessonLog || {}, d = new Date(), cur = 0;
  d.setHours(12, 0, 0, 0);
  if (!log[dateKey(d)]) d.setDate(d.getDate() - 1);
  while (log[dateKey(d)]) { cur++; d.setDate(d.getDate() - 1); }
  var best = cur, run = 0, prev = null;
  Object.keys(log).sort().forEach(function (k) {
    run = (prev && Date.parse(k) - Date.parse(prev) === DAY) ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  });
  return { cur: cur, best: best };
}
var HEAT_WEEKS = 16;
function heatHtml() {
  var log = S.lessonLog || {}, tk = today(), cells = [], d = new Date(), i;
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (d.getDay() + 6) % 7 - 7 * (HEAT_WEEKS - 1)); // Montag der ersten Spalte
  for (i = 0; i < 7 * HEAT_WEEKS; i++) {
    var k = dateKey(d), cls = k > tk ? 'fut' : (log[k] ? 'on' : (S.reviewLog[k] ? 'part' : ''));
    cells.push('<i class="' + cls + (k === tk ? ' now' : '') + '" title="' + k + '"></i>');
    d.setDate(d.getDate() + 1);
  }
  return '<div class="heat">' + cells.join('') + '</div>' +
    '<p class="muted small"><i class="hk on"></i> Lektion geschafft · <i class="hk part"></i> nur Karten geübt</p>';
}
function lessonCard(steps) {
  if (!steps.length) return '';
  var L = lessonToday(), st = streak();
  var left = steps.filter(function (s) { return !s.opt && !L.done[s.id]; }).length;
  var cur = steps.filter(function (s) { return !L.done[s.id]; })[0];
  return '<h2>Heutige Lektion</h2><div class="card">' +
    '<div class="bar-row"><b>' + (left ? 'Noch ' + left + ' Schritt' + (left > 1 ? 'e' : '') : 'Lektion geschafft ✓') + '</b>' +
    '<span>&#128293; ' + st.cur + ' Tag' + (st.cur === 1 ? '' : 'e') +
    (st.best > st.cur ? ' <span class="muted small">· Rekord ' + st.best + '</span>' : '') + '</span></div>' +
    heatHtml() +
    '<div class="stack" style="margin-top:12px">' + steps.map(function (s, i) {
      var done = !!L.done[s.id], isCur = s === cur;
      return '<button data-ls="' + i + '"' + (isCur ? ' class="primary"' : '') + (done ? ' style="opacity:.6"' : '') + '>' +
        (done ? '✓ ' : (i + 1) + ' · ') + esc(s.label) + '<br><span class="small' + (isCur ? '' : ' muted') + '">' + esc(s.sub) + '</span></button>';
    }).join('') + '</div>' +
    (cur ? '<p class="muted small">Enter startet den nächsten Schritt.</p>' : '') + '</div>';
}

function chartHtml() {
  var days = [], max = 1, i, d;
  for (i = 29; i >= 0; i--) { d = new Date(); d.setDate(d.getDate() - i); var v = S.reviewLog[dateKey(d)] || 0; if (v > max) max = v; days.push([dateKey(d), v]); }
  return '<div class="chart">' + days.map(function (x) {
    return '<div class="bar" title="' + x[0] + ': ' + x[1] + '"><i style="height:' + Math.round(x[1] / max * 100) + '%"></i></div>';
  }).join('') + '</div><p class="muted small">Letzte 30 Tage · Maximum ' + max + ' Karten/Tag</p>';
}
function home() {
  if (location.hash) location.hash = '';
  var vDue = dueIds('w:').length;
  var vNew = newWords(newWordQuota()).length;
  var gDue = dueIds('g:').length;
  var seen = 0, learned = 0;
  Object.keys(S.cards).forEach(function (id) {
    if (id.slice(-2) !== ':p') return;
    seen++;
    var c = S.cards[id];
    // "gelernt": mind. 3 Wiederholungen und kein frischer Lapse (Intervall >= 1 Woche)
    if (c.reps >= 3 && c.S >= 7) learned++;
  });
  var h = '<h1>¡Hola! Spanisch lernen</h1><p class="muted">Vokabeln &amp; Grammatik mit FSRS-Wiederholung.</p>';
  var steps = lessonSteps();
  h += lessonCard(steps);

  h += '<h2>Frei üben</h2>';
  if (!haveWords()) {
    h += '<div class="card"><b>Vokabeldaten fehlen.</b><p class="muted">Die Datei <code>data/words.js</code> wurde noch nicht erzeugt. Lade die Seite neu, sobald sie da ist.</p></div>';
  } else {
    h += '<div class="stack"><button class="primary" id="bv">Vokabeln üben (' + vDue + ' fällig + ' + vNew + ' neu)</button></div>';
  }
  if (!haveGrammar()) {
    h += '<div class="card"><b>Grammatikdaten fehlen.</b><p class="muted">Die Datei <code>data/grammar.js</code> wurde noch nicht erzeugt. Lade die Seite neu, sobald sie da ist.</p></div>';
  } else {
    h += '<div class="stack"><button class="primary" id="bg">Grammatik üben (' + gDue + ' fällig)</button></div>';
  }
  if (haveHouse()) h += '<div class="stack"><button class="primary" id="bh">La casa &#127968;</button></div>';
  if (typeof listenHome === 'function') h += '<div class="stack"><button class="primary" id="bl">Hören &amp; Aussprache &#127911;</button></div>';
  if (typeof readHome === 'function') h += '<div class="stack"><button class="primary" id="br">Lesen &#128214;</button></div>';

  h += '<h2>Statistik</h2><div class="card"><p>Wörter gesehen: <b>' + seen + '</b><br>Wörter gelernt: <b>' + learned + '</b><br>Wiederholungen heute: <b>' + (S.reviewLog[today()] || 0) + '</b></p>' + chartHtml() + '</div>';

  var rate = +S.settings.ttsRate || 0.9;
  h += '<h2>Einstellungen</h2><div class="card"><label class="bar-row"><span>Neue Wörter pro Tag</span>' +
       '<input id="npd" type="number" min="0" max="100" step="1" value="' + (S.settings.newPerDay | 0) + '" style="width:110px"></label>' +
       '<label class="bar-row"><span>Sprechtempo</span><span><input id="rate" type="range" min="0.7" max="1.5" step="0.1" value="' + rate + '" style="width:150px;vertical-align:middle"> <b id="rateV">' + rate.toFixed(1) + '×</b></span></label>' +
       '<label class="bar-row"><span>Mündlich üben<br><span class="muted small">produktive Karten laut sprechen statt tippen</span></span>' +
       '<input id="oral" type="checkbox"' + (S.settings.oral ? ' checked' : '') + ' style="width:auto;min-height:0"></label>' +
       '<p class="muted small">Heute schon eingeführt: ' + (S.introDates[today()] || 0) + '</p></div>';

  h += '<footer>Frequenzliste: hermitdave/FrequencyWords (CC BY-SA 3.0) · Verben: Fred Jehle via ghidinelli (CC BY-NC-SA 3.0)</footer>';
  show(h);
  on('[data-ls]', 'click', function () { steps[+this.getAttribute('data-ls')].go(); });
  var cur = steps.filter(function (s) { return !lessonToday().done[s.id]; })[0];
  if (cur) keyHandler = function (e) {
    if (e.key === 'Enter' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); cur.go(); }
  };
  on('#bv', 'click', function () { startVocab(); });
  on('#bg', 'click', gramList);
  on('#bh', 'click', casaHome);
  on('#npd', 'change', function () { S.settings.newPerDay = Math.max(0, parseInt(this.value, 10) || 0); save(); home(); });
  on('#bl', 'click', function () { listenHome(); });
  on('#br', 'click', function () { readHome(); });
  on('#rate', 'input', function () { S.settings.ttsRate = +this.value; save(); $('#rateV').textContent = (+this.value).toFixed(1) + '×'; });
  on('#oral', 'change', function () { S.settings.oral = this.checked; save(); });
}

/* ---------- VOKABEL-SESSION ---------- */
var vs = null; // {q, rev, ok}
function wordByR(r) {
  for (var i = 0; i < WORDS.length; i++) if (WORDS[i].r === r) return WORDS[i];
  return null;
}
function startVocab(prefer) {
  if (!haveWords()) return home();
  var q = shuffle(dueIds('w:').map(function (id) {
    var parts = id.split(':');
    return { t: parts[2], id: id, r: +parts[1] };
  }).filter(function (it) { return wordByR(it.r); }));
  newWords(newWordQuota(), prefer).forEach(function (w) {
    q.splice(Math.floor(Math.random() * (q.length + 1)), 0, { t: 'new', r: w.r });
  });
  vs = { q: q, rev: 0, ok: 0 };
  vNext();
}
function vNext() {
  if (!vs.q.length) return vSummary();
  var it = vs.q[0];
  var w = wordByR(it.r);
  if (!w) { vs.q.shift(); return vNext(); }
  if (it.t === 'new') return vIntro(w);
  if (it.t === 'p') return vProductive(w, it.id);
  return vReceptive(w, it.id);
}
function vDone(requeue) {
  var it = vs.q.shift();
  if (requeue) vs.q.push(it);
  vNext();
}
function vHdr() {
  return '<div class="hdr">' + backBtn() + '<span class="muted small">noch ' + vs.q.length + ' · ' + vs.rev + ' geübt</span></div>';
}
function noteBox(w) {
  return '<textarea id="note" rows="2" placeholder="Eselsbrücke (optional)">' + esc(S.notes[w.r] || '') + '</textarea>';
}
function wireNote(w) {
  on('#note', 'input', function () { S.notes[w.r] = this.value; save(); });
}
function wordCard(w, extra) {
  return '<div class="card"><div class="big">' + esc(w.es) + '</div>' +
    (extra || '') +
    '<p class="muted">' + esc(w.de) + (posLabel(w.pos) ? ' · ' + esc(posLabel(w.pos)) : '') + '</p>' +
    '<p class="es">' + boldWord(w.ej.es, w.es) + '</p>' +
    '<p class="muted">' + esc(w.ej.de) + '</p>' +
    spk(w.es, 'Wort') + ' ' + spk(w.ej.es, 'Satz') + '</div>';
}

function vIntro(w) {
  show(vHdr() + '<p class="muted small">Neues Wort · Rang ' + w.r + '</p>' + wordCard(w) + noteBox(w) +
    '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>');
  wireNote(w);
  function go() {
    S.cards['w:' + w.r + ':p'] = fsrsInit(3, Date.now());
    S.cards['w:' + w.r + ':r'] = fsrsInit(3, Date.now());
    S.introDates[today()] = (S.introDates[today()] || 0) + 1;
    save();
    vs.q.shift();
    // produktive Karte spaeter in dieser Session abfragen
    vs.q.splice(Math.min(vs.q.length, 3 + Math.floor(Math.random() * 6)), 0, { t: 'p', id: 'w:' + w.r + ':p', r: w.r });
    vNext();
  }
  on('#go', 'click', go);
  keys({ 'Enter': go });
}

function vProductive(w, id) {
  if (S.settings.oral) return vOral(w, id);
  show(vHdr() + '<div class="card"><p class="muted small">Schreib das spanische Wort</p><div class="big">' + esc(w.de) + '</div>' +
    (posLabel(w.pos) ? '<p class="muted small">' + esc(posLabel(w.pos)) + '</p>' : '') + '</div>' +
    '<input id="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="auf Spanisch …">' +
    accBar() + '<div class="row"><button class="primary" id="go">Prüfen (Enter)</button></div>');
  var inp = $('#ans'); inp.focus(); wireAcc(inp);
  function submit() {
    var val = inp.value;
    var exact = val.trim().toLowerCase() === w.es.toLowerCase();
    var ok = norm(val) === norm(w.es);
    vs.rev++;
    if (ok) { vs.ok++; vFeedback(w, id, false, ok && !exact ? val : null); }
    else { doGrade(id, 1); vFeedback(w, id, true, null, val); }
  }
  on('#go', 'click', submit);
  keys({ 'Enter': submit });
}

/* Audio zuerst: Wort bleibt verdeckt, bis "Zeigen" gedrückt wird. */
/* Mündlicher Modus: selbst laut sagen, dann Modell hören und selbst bewerten. */
function vOral(w, id) {
  show(vHdr() + '<div class="card"><p class="muted small">Sag es laut auf Spanisch</p><div class="big">' + esc(w.de) + '</div>' +
    (posLabel(w.pos) ? '<p class="muted small">' + esc(posLabel(w.pos)) + '</p>' : '') + '</div>' +
    '<div class="row"><button class="primary" id="go">Aufdecken (Enter)</button></div>');
  function go() { vFeedback(w, id, false, null, null, true); speak(w.es); }
  on('#go', 'click', go);
  keys({ 'Enter': go });
}

function vReceptive(w, id) {
  show(vHdr() + '<div class="card"><p class="muted small">Hör zu – was heißt das?</p>' +
    '<div class="big">&#128266; Was hörst du?</div>' + spk(w.es, 'Nochmal') + '</div>' +
    '<div class="row"><button class="primary" id="go">Zeigen (Enter)</button></div>');
  speak(w.es); // Session laeuft -> User-Gesture war schon da, Autoplay ok
  function go() { vFeedback(w, id, false, null, null, true); }
  on('#go', 'click', go);
  keys({ 'Enter': go });
}

/* wrong=true: Note bereits als "Nochmal" gespeichert, nur weiter.
   withAgain=true: rezeptive Karte, Selbsteinschaetzung inkl. Nochmal. */
function vFeedback(w, id, wrong, accentOnly, typed, withAgain) {
  var status = '';
  if (wrong) status = '<p class="bad">Leider falsch' + (typed && typed.trim() ? ' – du hast „' + esc(typed.trim()) + '“ geschrieben' : '') + '.</p>';
  else if (accentOnly) status = '<p class="ok">Richtig – aber achte auf die Akzente:</p><p class="big">' + esc(w.es) + '</p>';
  else if (!withAgain) status = '<p class="ok">Richtig!</p>';

  var btns = wrong
    ? '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>'
    : gradeRow(withAgain);
  show(vHdr() + status + wordCard(w) + noteBox(w) + btns);
  wireNote(w);
  if (wrong) {
    var go = function () { vDone(true); };
    on('#go', 'click', go);
    keys({ 'Enter': go });
  } else {
    wireGrades(function (g) {
      doGrade(id, g);
      vs.rev += withAgain ? 1 : 0;
      if (withAgain && g >= 3) vs.ok++;
      vDone(g === 1);
    }, withAgain);
  }
}
function gradeRow(withAgain) {
  var b = [];
  if (withAgain) b.push('<button data-g="1">Nochmal<br><span class="small muted">1</span></button>');
  b.push('<button data-g="2">Schwer<br><span class="small muted">2</span></button>');
  b.push('<button data-g="3" class="primary sel">Gut<br><span class="small">3</span></button>');
  b.push('<button data-g="4">Leicht<br><span class="small muted">4</span></button>');
  return '<div class="row">' + b.join('') + '</div>';
}
function wireGrades(fn, withAgain) {
  on('[data-g]', 'click', function () { fn(+this.getAttribute('data-g')); });
  var m = { 'Enter': function () { fn(3); }, '2': function () { fn(2); }, '3': function () { fn(3); }, '4': function () { fn(4); } };
  if (withAgain) m['1'] = function () { fn(1); };
  keys(m);
}
function vSummary() {
  lessonMark('vocab');
  var pct = vs.rev ? Math.round(vs.ok / vs.rev * 100) : 0;
  show('<h1>Session fertig</h1><div class="card"><p>Karten geübt: <b>' + vs.rev + '</b><br>Richtig: <b>' + pct + '%</b></p></div>' +
    '<div class="row"><button class="primary" data-home>Zum Menü (Enter)</button></div>');
  keys({ 'Enter': home });
}

/* ---------- GRAMMATIK ---------- */
var gs = null; // {q, p, rev, ok}
var GRAM_NEW_PER_DAY = 10;
function gramQuota() { return Math.max(0, GRAM_NEW_PER_DAY - (S.gramIntroDates[today()] || 0)); }
function gramList() {
  if (!haveGrammar()) return home();
  var h = '<div class="hdr">' + backBtn() + '<span class="muted small">Grammatik</span></div><h1>Grammatik</h1>';
  GRAMMAR.forEach(function (p) {
    var done = p.items.filter(function (it) { return S.cards['g:' + it.id]; }).length;
    var due = p.items.filter(function (it) { return isDue('g:' + it.id); }).length;
    h += '<div class="stack"><button data-p="' + esc(p.id) + '"><b>' + esc(p.title) + '</b><br>' +
      '<span class="small muted">' + done + '/' + p.items.length + ' begonnen · ' + due + ' fällig</span></button></div>';
  });
  h += '<h2>Extra</h2><div class="stack"><button id="conj">Konjugation üben (endlos)</button></div>';
  show(h);
  on('[data-p]', 'click', function () { gramOpen(this.getAttribute('data-p')); });
  on('#conj', 'click', conjDrill);
}
function pointById(id) { for (var i = 0; i < GRAMMAR.length; i++) if (GRAMMAR[i].id === id) return GRAMMAR[i]; return null; }
function gramOpen(id) {
  var p = pointById(id);
  if (!p) return gramList();
  if (!S.seenRules[p.id]) { S.seenRules[p.id] = 1; save(); return ruleCard(p, function () { gramStart(p); }); }
  gramStart(p);
}
function ruleCard(p, back) {
  var h = '<div class="hdr">' + backBtn() + '<span class="muted small">Regel</span></div><h1>' + esc(p.title) + '</h1><div class="card">' +
    '<ul>' + (p.rule.lines || []).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
    (p.rule.examples || []).map(function (e) {
      return '<p class="es">' + esc(e.es) + ' ' + spk(e.es, '') + '<br><span class="muted small">' + esc(e.de) + '</span></p>';
    }).join('') + '</div><div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>';
  show(h);
  on('#go', 'click', back);
  keys({ 'Enter': back });
}
function gramStart(p) {
  var q = shuffle(p.items.filter(function (it) { return isDue('g:' + it.id); }).map(function (it) { return { it: it }; }));
  var quota = gramQuota(), fresh = [];
  p.items.slice().sort(function (a, b) { return (a.stage || 1) - (b.stage || 1); }).forEach(function (it) {
    if (fresh.length < quota && !S.cards['g:' + it.id]) fresh.push({ it: it, isNew: true });
  });
  fresh.forEach(function (x) { q.splice(Math.floor(Math.random() * (q.length + 1)), 0, x); });
  gs = { q: q, p: p, rev: 0, ok: 0 };
  gNext();
}
function gNext() {
  if (!gs.q.length) return gSummary();
  var x = gs.q[0], it = x.it;
  var img = it.img ? '<div class="gimg">' + it.img + '</div>' : '';
  var h = '<div class="hdr">' + backBtn() + '<span class="muted small">noch ' + gs.q.length + ' · <button id="rule" style="display:inline;width:auto;min-height:0;padding:2px 8px;font-size:13px">Regel</button></span></div>';
  if (it.type === 'mc') {
    h += '<div class="card">' + img + '<p class="es">' + esc(it.sentence) + ' ' + spk(it.sentence, '') + '</p><p><b>' + esc(it.q) + '</b></p></div>' +
      '<div class="stack">' + it.options.map(function (o, i) { return '<button data-o="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div>';
    show(h); wireRule(it);
    on('[data-o]', 'click', function () { gAnswer(it, +this.getAttribute('data-o') === it.answer, it.options[it.answer]); });
    keys({ '1': pick(0), '2': pick(1), '3': pick(2), '4': pick(3) });
  } else if (it.type === 'choice') {
    h += '<div class="card">' + img + '<p class="es">' + gapHtml(it.sentence) + '</p></div>' +
      '<div class="row">' + it.options.map(function (o, i) { return '<button data-o="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div>';
    show(h); wireRule(it);
    on('[data-o]', 'click', function () { gAnswer(it, +this.getAttribute('data-o') === it.answer, it.options[it.answer]); });
    keys({ '1': pick(0), '2': pick(1) });
  } else {
    h += '<div class="card">' + img + '<p class="es">' + gapHtml(it.sentence) + '</p><p class="muted">' + esc(it.hint || '') + '</p></div>' +
      '<input id="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Lücke füllen …">' + accBar() +
      '<div class="row"><button class="primary" id="go">Prüfen (Enter)</button></div>';
    show(h); wireRule(it);
    var inp = $('#ans'); inp.focus(); wireAcc(inp);
    var submit = function () {
      var v = inp.value, ok = it.answers.some(function (a) { return norm(a) === norm(v); });
      var exact = it.answers.some(function (a) { return a.trim().toLowerCase() === v.trim().toLowerCase(); });
      gAnswer(it, ok, it.answers[0], ok && !exact);
    };
    on('#go', 'click', submit);
    keys({ 'Enter': submit });
  }
  function pick(i) {
    return function () { var b = $('[data-o="' + i + '"]'); if (b) b.click(); };
  }
}
function wireRule(it) {
  on('#rule', 'click', function () { ruleCard(gs.p, gNext); });
}
function gAnswer(it, ok, correct, accentOnly) {
  var id = 'g:' + it.id;
  var isNew = !S.cards[id];
  gs.rev++;
  if (ok) gs.ok++;
  if (isNew) { S.gramIntroDates[today()] = (S.gramIntroDates[today()] || 0) + 1; }
  var info = '<div class="card">' +
    (ok ? (accentOnly ? '<p class="ok">Richtig – Schreibweise: <b>' + esc(correct) + '</b></p>' : '<p class="ok">Richtig!</p>')
        : '<p class="bad">Falsch. Richtig: <b>' + esc(correct) + '</b></p>') +
    '<p>' + esc(it.expl || '') + '</p>' +
    (it.ruleTag ? '<span class="tag">' + esc(it.ruleTag) + '</span>' : '') + '</div>';
  var hdr = '<div class="hdr">' + backBtn() + '<span class="muted small">noch ' + gs.q.length + '</span></div>';
  if (!ok) {
    doGrade(id, 1);
    show(hdr + info + '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>');
    var go = function () { var x = gs.q.shift(); gs.q.push(x); gNext(); };
    on('#go', 'click', go);
    keys({ 'Enter': go });
  } else {
    show(hdr + info + gradeRow(false));
    wireGrades(function (g) { doGrade(id, g); gs.q.shift(); gNext(); }, false);
  }
}
function gSummary() {
  lessonMark('gram');
  var pct = gs.rev ? Math.round(gs.ok / gs.rev * 100) : 0;
  show('<h1>Fertig: ' + esc(gs.p.title) + '</h1><div class="card"><p>Aufgaben: <b>' + gs.rev + '</b><br>Richtig: <b>' + pct + '%</b></p></div>' +
    '<div class="row"><button class="primary" data-home>Menü (Enter)</button><button id="back">Zur Übersicht</button></div>');
  on('#back', 'click', gramList);
  keys({ 'Enter': home });
}

/* ---------- KONJUGATIONS-DRILL (nicht FSRS) ---------- */
var PERSONS = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas'];
var TENSES = { presente: 'Präsens', preterito: 'Indefinido', imperfecto: 'Imperfecto' };
function pastUnlocked() {
  if (!haveGrammar()) return false;
  var p = pointById('pasado');
  return !!p && p.items.some(function (it) { var c = S.cards['g:' + it.id]; return c && c.reps > 0; });
}
function conjDrill(stats) {
  if (!haveVerbs()) {
    show('<div class="hdr">' + backBtn() + '</div><div class="card"><b>Verbdaten fehlen.</b><p class="muted">Die Datei <code>data/verbs.js</code> wurde noch nicht erzeugt.</p></div>');
    return;
  }
  stats = stats || { n: 0, ok: 0 };
  var names = Object.keys(VERBS);
  var inf, v, tenses = pastUnlocked() ? ['presente', 'preterito', 'imperfecto'] : ['presente'], tense, pi, forms;
  for (var tries = 0; tries < 50; tries++) {
    inf = names[Math.floor(Math.random() * names.length)];
    v = VERBS[inf];
    tense = tenses[Math.floor(Math.random() * tenses.length)];
    forms = v && v[tense];
    if (forms && forms.length === 6) break;
    forms = null;
  }
  if (!forms) return gramList();
  do { pi = Math.floor(Math.random() * 6); } while (pi === 4 && Math.random() < 0.5);

  show('<div class="hdr">' + backBtn() + '<span class="muted small">' + stats.ok + '/' + stats.n + ' richtig</span></div>' +
    '<div class="card"><p class="muted small">Konjugation · ' + esc(TENSES[tense]) + '</p>' +
    '<div class="big">' + esc(inf) + '</div>' +
    '<p class="muted">' + esc(v.en || '') + '</p>' +
    '<p class="es">' + esc(PERSONS[pi]) + ' <span class="gap">&nbsp;</span></p></div>' +
    '<input id="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Form eingeben …">' + accBar() +
    '<div class="row"><button class="primary" id="go">Prüfen (Enter)</button></div>');
  var inp = $('#ans'); inp.focus(); wireAcc(inp);
  function submit() {
    var v2 = inp.value, target = forms[pi];
    var ok = norm(v2) === norm(target);
    var exact = v2.trim().toLowerCase() === String(target).toLowerCase();
    stats.n++; if (ok) stats.ok++;
    show('<div class="hdr">' + backBtn() + '<span class="muted small">' + stats.ok + '/' + stats.n + ' richtig</span></div>' +
      '<div class="card">' + (ok ? (exact ? '<p class="ok">Richtig!</p>' : '<p class="ok">Richtig – Schreibweise:</p>') : '<p class="bad">Falsch.</p>') +
      '<div class="big">' + esc(PERSONS[pi]) + ' ' + esc(target) + '</div>' +
      '<p class="muted">' + esc(inf) + ' · ' + esc(TENSES[tense]) + '</p>' + spk(target, 'Form') + '</div>' +
      '<div class="row"><button class="primary" id="go">Nächste (Enter)</button></div>');
    var nx = function () { conjDrill(stats); };
    on('#go', 'click', nx);
    keys({ 'Enter': nx });
  }
  on('#go', 'click', submit);
  keys({ 'Enter': submit });
}


/* ---------- LA CASA (Post-its) ---------- */
var casa = null; // {r, sel, all}
function roomById(id) { for (var i = 0; i < HOUSE.length; i++) if (HOUSE[i].id === id) return HOUSE[i]; return null; }
function itemById(r, id) { for (var i = 0; i < r.items.length; i++) if (r.items[i].id === id) return r.items[i]; return null; }

function casaHome() {
  if (!haveHouse()) return home();
  casa = null;
  location.hash = 'casa';
  show('<div class="hdr">' + backBtn() + '<span class="muted small">La casa</span></div>' +
    '<h1>La casa</h1><p class="muted">Zimmer wählen, dann auf die Dinge tippen – wie Post-its in der Wohnung.</p>' +
    '<div class="scene">' + HOUSE_OVERVIEW + '</div>' +
    '<div class="stack">' + HOUSE.map(function (r) {
      return '<button data-r="' + esc(r.id) + '"><b>' + esc(r.es) + '</b><br><span class="small muted">' + esc(r.de) + ' · ' + r.items.length + ' Wörter</span></button>';
    }).join('') + '</div>');
  function go() { casaRoom(roomById(this.getAttribute('data-r') || this.getAttribute('data-room'))); }
  on('[data-r]', 'click', go);
  on('[data-room]', 'click', go);
}

function casaRoom(r) {
  if (!r) return casaHome();
  casa = { r: r, sel: null, all: false };
  location.hash = 'casa/' + r.id;
  show('<div class="hdr"><button id="back" style="width:auto;min-height:40px;padding:8px 12px;font-size:14px">&larr; Haus</button>' +
    '<span class="muted small">' + esc(r.de) + '</span></div>' +
    '<h1>' + esc(r.es) + '</h1>' +
    '<div class="scene" id="scene">' + r.svg + '<div id="pins"></div></div>' +
    '<div class="row"><button id="all">Alle Post-its zeigen</button>' + backBtn() + '</div>' +
    '<p class="muted small">Tipp: Gegenstand antippen – der Post-it zeigt Artikel, Wort und Übersetzung.</p>');
  on('#back', 'click', casaHome);
  on('#all', 'click', function () {
    casa.all = !casa.all;
    this.textContent = casa.all ? 'Alle Post-its verstecken' : 'Alle Post-its zeigen';
    renderPins();
  });
  on('#scene', 'click', function (e) {
    var sp = e.target.closest && e.target.closest('.spk');
    if (sp) { speak(sp.getAttribute('data-t')); return; }
    var g = e.target.closest && e.target.closest('[data-item]');
    casa.sel = g ? g.getAttribute('data-item') : null;
    renderPins();
  });
}

function renderPins() {
  var scene = $('#scene'), pins = $('#pins');
  if (!casa || !scene || !pins) return;
  var sr = scene.getBoundingClientRect(), h = '';
  function box(id) {
    var el = scene.querySelector('[data-item="' + id + '"]');
    if (!el) return null;
    var b = el.getBoundingClientRect();
    return { x: b.left - sr.left + b.width / 2, top: b.top - sr.top, bot: b.bottom - sr.top, mid: b.top - sr.top + b.height / 2 };
  }
  if (casa.all) casa.r.items.forEach(function (it) {
    var b = box(it.id);
    if (b) h += '<div class="postit mini" style="left:' + Math.round(b.x) + 'px;top:' + Math.round(b.mid) + 'px">' +
      '<b>' + esc(it.es) + '</b></div>';
  });
  var s = casa.sel && itemById(casa.r, casa.sel), b2 = s && box(s.id);
  if (b2) {
    var below = b2.top < 96; // passt nicht darueber -> auf das Objekt kleben
    h += '<div class="postit' + (below ? ' below' : '') + '" style="left:' + Math.round(b2.x) + 'px;top:' + Math.round(below ? b2.top + 8 : b2.top - 6) + 'px">' +
      '<b>' + esc(s.es) + '</b><i>' + esc(s.de) + '</i>' + spk(s.es, 'Hören') + '</div>';
  }
  pins.innerHTML = h;
  clampPins(pins, sr);
  if (casa.all) deoverlap(pins, sr);
}

/* Post-its sitzen mit translate/rotate am Pin -> echte Groesse erst nach dem
   Rendern bekannt. getBoundingClientRect messen und per left/top ganz in die
   Szene schieben (PIN_PAD Rand, damit nichts am Rahmen klebt). */
var PIN_PAD = 3;
function clampPins(pins, sr) {
  [].slice.call(pins.children).forEach(function (n) {
    var r = n.getBoundingClientRect(), dx = 0, dy = 0;
    if (r.right > sr.right - PIN_PAD) dx = sr.right - PIN_PAD - r.right;
    if (r.left + dx < sr.left + PIN_PAD) dx = sr.left + PIN_PAD - r.left;
    if (r.bottom > sr.bottom - PIN_PAD) dy = sr.bottom - PIN_PAD - r.bottom;
    if (r.top + dy < sr.top + PIN_PAD) dy = sr.top + PIN_PAD - r.top;
    if (dx) n.style.left = (parseFloat(n.style.left) + dx) + 'px';
    if (dy) n.style.top = (parseFloat(n.style.top) + dy) + 'px';
  });
}

/* Greedy: jedes Mini-Post-it um ganze Zeilen nach oben/unten schieben, bis es frei liegt.
   ponytail: erstes freies von 7 Slots, kein echter Solver - reicht fuer ~14 Labels. */
function deoverlap(pins, sr) {
  var placed = [];
  [].slice.call(pins.querySelectorAll('.postit.mini')).forEach(function (n) {
    var r = n.getBoundingClientRect(), s = r.height + 3, pick = null, i, dy, t, b;
    var cand = [0, s, -s, 2 * s, -2 * s, 3 * s, -3 * s, 4 * s, -4 * s];
    for (i = 0; i < cand.length; i++) {
      dy = cand[i]; t = r.top + dy; b = r.bottom + dy;
      if (t < sr.top + PIN_PAD || b > sr.bottom - PIN_PAD) continue;
      var clash = placed.some(function (p) { return r.left < p.r && r.right > p.l && t < p.b && b > p.t; });
      if (!clash) { pick = dy; break; }
    }
    if (pick === null) pick = 0;
    placed.push({ l: r.left, r: r.right, t: r.top + pick, b: r.bottom + pick });
    if (pick) n.style.top = (parseFloat(n.style.top) + pick) + 'px';
  });
}

/* ---------- Start ---------- */
document.addEventListener('keydown', function (e) { if (keyHandler) keyHandler(e); });
window.addEventListener('resize', renderPins);
app = document.getElementById('app');
load();
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
var hash = location.hash;
if (hash.indexOf('#casa') === 0 && haveHouse()) {
  var rid = hash.slice(6);
  if (rid) casaRoom(roomById(rid)); else casaHome();
} else home();
