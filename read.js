'use strict';
/* Lesen - Narrow-Reading-Texte mit Tipp-Glossen, Absatz-TTS, WPM-Messung und
   Abdeckungs-Check fuer eigene Texte.  Oeffentlich: readHome().
   Daten: data/texts.js (const TEXTS) - fehlt sie, laeuft nur "Eigener Text". */

function haveTexts() { return typeof TEXTS !== 'undefined' && TEXTS && TEXTS.length > 0; }

/* load() in app.js kopiert nur die Keys aus defState() - S.read waere nach dem
   Reload weg. Darum hier einmal direkt aus dem Speicher nachziehen.
   ponytail: Umweg statt app.js anzufassen; faellt weg, sobald defState() read kennt. */
function rState() {
  if (!S.read) {
    var o = null;
    try { o = (JSON.parse(localStorage.getItem(KEY) || '{}') || {}).read; } catch (e) {}
    S.read = (o && typeof o === 'object') ? o : {};
  }
  S.read.done = S.read.done || {};
  S.read.taps = S.read.taps || {};
  S.read.wpm = S.read.wpm || {};
  return S.read;
}

/* Styles fuer den Lesemodus - index.html bleibt unberuehrt, also inline pro Screen. */
var RCSS = '<style>' +
  '.rtext{font-size:20px;line-height:1.95}' +
  '.rtext p{margin:0 0 12px}' +
  '.w{cursor:pointer;border-radius:4px;padding:0 1px}' +
  '.w:hover{background:var(--soft)}' +
  '.w.tap{background:var(--soft);box-shadow:0 1px 0 var(--accent)}' +
  '.w.unk{box-shadow:0 2px 0 var(--bad)}' +
  '#rpop{position:fixed;z-index:50}' +
  '</style>';

/* Saetze eines Texts (fuer Diktat/Shadowing der Lektion). Auch build/tts.js nutzt das -
   die Clips muessen zu genau diesen Strings passen. */
function textSentences(text) {
  var out = [];
  String(text || '').split(/\n+/).forEach(function (p) {
    p.split(/(?<=[.!?…])\s+(?=[¿¡"“(A-ZÁÉÍÓÚÑ])/).forEach(function (x) { x = x.trim(); if (x) out.push(x); });
  });
  return out;
}

/* Wort/Trenner-Split: ungerade Indizes sind Woerter. */
var R_SPLIT = /([0-9A-Za-zÁÉÍÓÚÜÑÇáéíóúüñç]+)/;
function rTokens(s) { return String(s == null ? '' : s).split(R_SPLIT); }
function bare(w) { return String(w == null ? '' : w).toLowerCase().replace(/[^0-9a-záéíóúüñç]/g, ''); }

/* ---------- Gloss (pro Text) ---------- */
function readGloss(t, word) {
  var g = t && t.gloss, b = bare(word), k;
  if (!g || !b) return null;
  if (g[b]) return g[b];
  for (k in g) if (norm(k) === norm(b)) return g[k]; // Autor ohne Akzente geschrieben
  return null;
}

/* ---------- Bekannte Formen (fuer eigene Texte) ---------- */
var R_KNOWN = null;
function readKnownForms() {
  if (R_KNOWN) return R_KNOWN;
  R_KNOWN = {};
  function add(form, entry) { var b = bare(form); if (b && !R_KNOWN[b]) R_KNOWN[b] = entry; }
  if (typeof WORDS !== 'undefined' && WORDS) WORDS.forEach(function (w) {
    String(w.es).split(/[\s\/,;]+/).forEach(function (part) { add(part, w); });
  });
  if (typeof VERBS !== 'undefined' && VERBS) Object.keys(VERBS).forEach(function (inf) {
    var v = VERBS[inf], base = R_KNOWN[bare(inf)] || { es: inf, de: v.en ? v.en + ' (nur englisch in den Daten)' : '' };
    add(inf, base);
    for (var k in v) {
      if (k === 'en') continue;
      var f = v[k];
      if (typeof f === 'string') add(f, base);
      else if (f && f.length) f.forEach(function (x) { add(x, base); });
    }
  });
  return R_KNOWN;
}
/* ponytail: naiver Stemmer (-s/-es, a<->o). Reicht fuer eine Abdeckungs-Schaetzung;
   echte Morphologie erst, wenn die Zahl belastbar sein muss. */
function readLookup(tok) {
  var K = readKnownForms(), b = bare(tok), i, c;
  if (!b) return null;
  c = [b];
  if (/es$/.test(b)) c.push(b.slice(0, -2));
  if (/s$/.test(b)) c.push(b.slice(0, -1));
  c.slice(0).forEach(function (x) {
    if (/a$/.test(x)) c.push(x.slice(0, -1) + 'o');
    else if (/o$/.test(x)) c.push(x.slice(0, -1) + 'a');
  });
  for (i = 0; i < c.length; i++) if (K[c[i]]) return K[c[i]];
  return null;
}
function readCoverage(str) {
  var parts = rTokens(str), total = 0, known = 0, unk = [], seen = {}, i, b;
  for (i = 1; i < parts.length; i += 2) {
    total++;
    b = bare(parts[i]);
    if (readLookup(b)) known++;
    else if (!seen[b]) { seen[b] = 1; unk.push(b); }
  }
  return { total: total, known: known, unknown: unk, pct: total ? Math.round(known / total * 100) : 0, parts: parts };
}

/* ---------- Popup ---------- */
function rPopBox() { return '<div id="rpop" style="display:none"></div>'; }
function rPop(el, html) {
  var d = $('#rpop');
  if (!d) return;
  d.style.cssText = 'position:fixed;z-index:50;max-width:min(280px,70vw);background:var(--card);color:var(--fg);' +
    'border:1px solid var(--accent);border-radius:10px;padding:8px 11px;font-size:15px;line-height:1.35;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer';
  d.innerHTML = html;
  var r = el.getBoundingClientRect(), b = d.getBoundingClientRect();
  var x = Math.max(6, Math.min(r.left + r.width / 2 - b.width / 2, window.innerWidth - b.width - 6));
  var y = (r.bottom + 8 + b.height > window.innerHeight) ? r.top - b.height - 8 : r.bottom + 8;
  d.style.left = Math.round(x) + 'px';
  d.style.top = Math.round(Math.max(6, y)) + 'px';
}
function rHidePop() { var d = $('#rpop'); if (d) d.style.display = 'none'; }
function rPopWord(el, main, sub, cls) {
  rPop(el, '<b>' + esc(el.textContent) + '</b><br><span class="' + (cls || '') + '">' + esc(main) + '</span>' +
    (sub ? '<br><span class="muted small">' + esc(sub) + '</span>' : ''));
}

/* ---------- Textliste ---------- */
function rHdr(label) {
  return '<div class="hdr">' + backBtn() + '<span class="muted small">' + esc(label) + '</span></div>';
}
function readHome() {
  var st = rState(), h = RCSS + rHdr('Lesen') + '<h1>Lesen</h1>';
  if (!haveTexts()) {
    h += '<div class="card"><b>Textdaten fehlen.</b><p class="muted">Die Datei <code>data/texts.js</code> wurde noch nicht erzeugt. Lade die Seite neu, sobald sie da ist.</p></div>';
  } else {
    h += '<p class="muted">Mehrere Texte pro Thema – dieselben Wörter in neuen Sätzen (Narrow Reading). Unbekanntes Wort antippen, Bedeutung erscheint sofort.</p>';
    var topics = [], by = {};
    TEXTS.forEach(function (t) {
      var k = t.topic || 'Texte';
      if (!by[k]) { by[k] = []; topics.push(k); }
      by[k].push(t);
    });
    topics.forEach(function (k) {
      h += '<h2>' + esc(k) + '</h2><div class="stack">' + by[k].map(function (t) {
        var m = [];
        if (st.wpm[t.id]) m.push('Bestwert ' + st.wpm[t.id] + ' WPM');
        if (st.taps[t.id]) m.push(st.taps[t.id] + '× Gloss getippt');
        return '<button data-id="' + esc(t.id) + '"><b>' + (st.done[t.id] ? '✓ ' : '') + esc(t.title) + '</b><br>' +
          '<span class="tag">Stufe ' + (t.level || 1) + '</span>' +
          (m.length ? ' <span class="small muted">' + esc(m.join(' · ')) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    });
  }
  h += '<h2>Extra</h2><div class="stack"><button id="own">Eigener Text – Abdeckung prüfen</button></div>';
  show(h);
  on('[data-id]', 'click', function () {
    var id = this.getAttribute('data-id');
    for (var i = 0; i < TEXTS.length; i++) if (TEXTS[i].id === id) return rReader(TEXTS[i]);
  });
  on('#own', 'click', function () { rPaste(''); });
}

/* ---------- Reader ---------- */
var rd = null; // {t, t0, words}
function rReader(t) {
  if (!t) return readHome();
  var st = rState();
  var paras = String(t.text || '').split(/\n+/).filter(function (p) { return p.trim(); });
  var words = 0;
  var body = paras.map(function (p) {
    var parts = rTokens(p), h = '', i;
    for (i = 0; i < parts.length; i++) {
      if (i % 2) { words++; h += '<span class="w" data-g="' + esc(bare(parts[i])) + '">' + esc(parts[i]) + '</span>'; }
      else h += esc(parts[i]);
    }
    return '<p>' + h + '</p>';
  }).join('');
  rd = { t: t, t0: Date.now(), words: words };

  show(RCSS + rHdr('Stufe ' + (t.level || 1) + ' · ' + (t.topic || '')) +
    '<h1>' + esc(t.title) + '</h1>' +
    '<div class="row">' + paras.map(function (p, i) { return spk(p, 'Absatz ' + (i + 1)); }).join('') + '</div>' +
    '<div class="card rtext" id="rtext">' + body + '</div>' +
    '<p class="muted small">' + words + ' Wörter · Wort antippen zeigt die deutsche Bedeutung. Die Uhr läuft seit dem Öffnen.</p>' +
    '<div class="row"><button class="primary" id="fin">Fertig gelesen</button></div>' + rPopBox());

  on('#rtext', 'click', function (e) {
    var el = e.target.closest && e.target.closest('.w');
    if (!el) return rHidePop();
    var g = readGloss(t, el.getAttribute('data-g'));
    el.className = 'w tap';
    st.taps[t.id] = (st.taps[t.id] || 0) + 1;
    save();
    if (typeof boostWord === 'function') boostWord(el.getAttribute('data-g')); // angetippt = nicht gekannt
    if (g) rPopWord(el, g);
    else rPopWord(el, 'kein Gloss', 'Dieses Wort steht nicht in der Gloss-Liste des Textes.', 'muted');
  });
  on('#rpop', 'click', rHidePop);
  on('#fin', 'click', rFinish);
  keys({ 'Enter': rFinish });
}

function rFinish() {
  if (!rd) return readHome();
  var st = rState(), t = rd.t;
  var secs = (Date.now() - rd.t0) / 1000;
  var wpm = Math.round(rd.words / Math.max(0.05, secs / 60));
  var best = st.wpm[t.id] || 0;
  if (wpm > best) { st.wpm[t.id] = wpm; best = wpm; }
  save();
  var n = (t.folge || []).length;
  show(RCSS + rHdr('Tempo') + '<h1>' + esc(t.title) + '</h1>' +
    '<div class="card"><p class="muted small">Tempo auf DIESEM Text</p>' +
    '<div class="big">' + wpm + ' WPM</div>' +
    '<p class="muted">' + rd.words + ' Wörter in ' + Math.round(secs) + ' s · Bestwert auf diesem Text: <b>' + best + ' WPM</b></p>' +
    (secs < 10 ? '<p class="muted small">Unter 10 Sekunden ist das keine Messung, sondern ein Klick.</p>' : '') +
    '<p class="muted small">Orientierung (Nation): flüssiges Lesen liegt bei 200–250 WPM. Der Wert gilt nur für diesen Text – ein anderer Text, anderes Tempo.</p></div>' +
    '<div class="row">' +
    (n ? '<button class="primary" id="go">' + n + ' Aufgaben zum Text (Enter)</button>' : '<button class="primary" id="go">Fertig (Enter)</button>') +
    '<button id="again">Nochmal lesen</button></div>');
  function go() { rf = { t: t, i: 0, ok: 0 }; rFolge(); }
  on('#go', 'click', go);
  on('#again', 'click', function () { rReader(t); });
  keys({ 'Enter': go });
}

/* ---------- Aufgaben nach dem Lesen ---------- */
var rf = null; // {t, i, ok}
function rAnswerIdx(it) {
  if (typeof it.answer === 'number') return it.answer;
  for (var i = 0; i < it.options.length; i++) if (norm(it.options[i]) === norm(it.answer)) return i;
  return 0;
}
function rFolge() {
  var list = rf.t.folge || [];
  if (rf.i >= list.length) return rDone();
  var it = list[rf.i];
  var h = RCSS + rHdr('Aufgabe ' + (rf.i + 1) + '/' + list.length);
  if (it.type === 'choice') {
    var ai = rAnswerIdx(it);
    h += '<div class="card"><p class="es">' + gapHtml(it.sentence) + '</p></div>' +
      '<div class="row">' + it.options.map(function (o, i) { return '<button data-o="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div>';
    show(h);
    on('[data-o]', 'click', function () {
      var i = +this.getAttribute('data-o');
      rAnswer(it, i === ai, it.options[ai]);
    });
    keys({ '1': function () { var b = $('[data-o="0"]'); if (b) b.click(); }, '2': function () { var b = $('[data-o="1"]'); if (b) b.click(); } });
  } else {
    h += '<div class="card"><p class="es">' + gapHtml(it.sentence) + '</p>' +
      (it.hint ? '<p class="muted">' + esc(it.hint) + '</p>' : '') + '</div>' +
      '<input id="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Lücke füllen …">' +
      accBar() + '<div class="row"><button class="primary" id="go">Prüfen (Enter)</button></div>';
    show(h);
    var inp = $('#ans');
    inp.focus();
    wireAcc(inp);
    var submit = function () {
      var v = inp.value, ans = it.answers || [];
      var ok = ans.some(function (a) { return norm(a) === norm(v); });
      var exact = ans.some(function (a) { return String(a).trim().toLowerCase() === v.trim().toLowerCase(); });
      rAnswer(it, ok, ans[0], ok && !exact);
    };
    on('#go', 'click', submit);
    keys({ 'Enter': submit });
  }
}
function rAnswer(it, ok, correct, accentOnly) {
  if (ok) rf.ok++;
  var list = rf.t.folge || [];
  show(RCSS + rHdr('Aufgabe ' + (rf.i + 1) + '/' + list.length) + '<div class="card">' +
    (ok ? (accentOnly ? '<p class="ok">Richtig – Schreibweise: <b>' + esc(correct) + '</b></p>' : '<p class="ok">Richtig!</p>')
        : '<p class="bad">Falsch. Richtig: <b>' + esc(correct) + '</b></p>') +
    '<p>' + esc(it.expl || '') + '</p></div>' +
    '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>');
  function go() { rf.i++; rFolge(); }
  on('#go', 'click', go);
  keys({ 'Enter': go });
}
function rDone() {
  var st = rState(), t = rf.t, n = (t.folge || []).length;
  st.done[t.id] = 1;
  save();
  lessonMark('read');
  show(RCSS + rHdr('Fertig') + '<h1>' + esc(t.title) + ' ✓</h1>' +
    '<div class="card"><p>Aufgaben richtig: <b>' + rf.ok + '/' + n + '</b><br>' +
    'Tempo (Bestwert): <b>' + (st.wpm[t.id] || 0) + ' WPM</b><br>' +
    'Glossen getippt: <b>' + (st.taps[t.id] || 0) + '</b></p>' +
    '<p class="muted small">Viele Glossen sind kein Fehler – aber ein Hinweis, dass der nächste Text der gleiche Themenbereich sein sollte.</p></div>' +
    '<div class="row"><button class="primary" data-home>Menü (Enter)</button><button id="again">Nochmal lesen</button><button id="list">Zur Textliste</button></div>');
  on('#again', 'click', function () { rReader(t); });
  on('#list', 'click', readHome);
  keys({ 'Enter': home });
}

/* ---------- Eigener Text ---------- */
function rPaste(prev) {
  show(RCSS + rHdr('Eigener Text') + '<h1>Eigener Text</h1>' +
    '<p class="muted">Spanischen Text einfügen – die App zeigt, wie viel davon in ihrem Wortschatz steckt.</p>' +
    '<textarea id="pin" rows="8" placeholder="Text hier einfügen …">' + esc(prev || '') + '</textarea>' +
    '<div class="row"><button class="primary" id="go">Abdeckung prüfen</button></div>' +
    '<p class="muted small">Nichts davon wird gespeichert.</p>');
  var ta = $('#pin');
  ta.focus();
  on('#go', 'click', function () { rPasteResult(ta.value); });
}
function rPasteResult(str) {
  var c = readCoverage(str);
  if (!c.total) return rPaste(str);
  var body = '', i;
  for (i = 0; i < c.parts.length; i++) {
    if (i % 2) {
      var b = bare(c.parts[i]), kn = readLookup(b);
      body += '<span class="w' + (kn ? '' : ' unk') + '" data-g="' + esc(b) + '">' + esc(c.parts[i]) + '</span>';
    } else body += esc(c.parts[i]);
  }
  show(RCSS + rHdr('Eigener Text') + '<h1>' + c.pct + '% der Wörter bekannt</h1>' +
    '<p class="muted">' + c.known + ' von ' + c.total + ' Wörtern · ' + c.unknown.length + ' verschiedene unbekannte Wörter (rot unterstrichen).</p>' +
    (c.pct < 95 ? '<div class="card"><p>Unter 95% Abdeckung wird Lesen anstrengend (Forschung: Hu &amp; Nation 2000).</p>' +
      '<p class="muted small">Abdeckung geschätzt: Grundformen, alle Verbformen der App plus naive Plural-/Endungsregeln. Namen und Zahlen zählen als unbekannt.</p></div>'
      : '<div class="card"><p class="ok">Über 95% – dieser Text ist zum Lesen geeignet.</p></div>') +
    '<div class="card rtext" id="ptext">' + body + '</div>' +
    '<p class="muted small">Wort antippen: bekannte Wörter zeigen die deutsche Bedeutung.</p>' +
    '<div class="row"><button class="primary" id="other">Anderer Text</button><button id="list">Zur Textliste</button></div>' + rPopBox());
  on('#ptext', 'click', function (e) {
    var el = e.target.closest && e.target.closest('.w');
    if (!el) return rHidePop();
    var kn = readLookup(el.getAttribute('data-g'));
    if (!kn) return rPopWord(el, 'nicht im Wortschatz der App', null, 'muted');
    var lem = kn.es && bare(kn.es) !== el.getAttribute('data-g') ? kn.es : null;
    rPopWord(el, kn.de || 'bekannt – keine deutsche Bedeutung in den Daten', lem ? 'Grundform: ' + kn.es : null);
  });
  on('#rpop', 'click', rHidePop);
  on('#other', 'click', function () { rPaste(str); });
  on('#list', 'click', readHome);
}
