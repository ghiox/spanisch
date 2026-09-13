'use strict';
/* Hoeren & Aussprache - eigenes Modul, nutzt die Helfer aus app.js
   (show, esc, norm, shuffle, spk, keys, accBar, wireAcc, backBtn, $, on, S, save, ttsVoice).
   Alle Drills sind endlos/Session-Style, kein FSRS, kein Scheduler. */

/* ---------- Zustand ---------- */
function lS() {
  S.listen = S.listen || { tags: { unk: 0, grenze: 0, schnell: 0 }, hist: [], n: 0 };
  if (!S.listen.tags) S.listen.tags = { unk: 0, grenze: 0, schnell: 0 };
  if (!S.listen.hist) S.listen.hist = [];
  if (!(S.settings.ttsRate > 0)) S.settings.ttsRate = 0.9;
  return S.listen;
}
function lRate() { var r = +S.settings.ttsRate; return (r >= 0.5 && r <= 2) ? r : 0.9; }

/* ---------- TTS mit eigenem Tempo ---------- */
function lVoice() { return ttsVoice(); }
function lSpeak(t, rate, voice) {
  if (!t || !window.speechSynthesis) return;
  var u = new SpeechSynthesisUtterance(t);
  u.lang = 'es-ES'; u.rate = rate || lRate();
  var v = voice || lVoice(); if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
/* Forschung: Pausen zwischen Abschnitten helfen mehr als langsameres Sprechen. */
function lChunks(s) {
  var t = String(s || '').replace(/([,;:])/g, '$1|').replace(/\s+(y|pero|porque|que|cuando)\s+/gi, ' |$1 ');
  var res = t.split('|').map(function (x) { return x.trim(); }).filter(Boolean), i;
  if (res.length < 2) {
    var w = t.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    res = [];
    for (i = 0; i < w.length; i += 3) res.push(w.slice(i, i + 3).join(' '));
  }
  return res;
}
function lSeq(list, i) {
  if (!window.speechSynthesis || i >= list.length) return;
  var u = new SpeechSynthesisUtterance(list[i]);
  u.lang = 'es-ES'; u.rate = Math.max(0.6, lRate() - 0.1);
  var v = lVoice(); if (v) u.voice = v;
  u.onend = function () { setTimeout(function () { lSeq(list, i + 1); }, 700); };
  if (i === 0) speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function lSpeakChunks(s) { lSeq(lChunks(s), 0); }

/* ---------- Rahmen ---------- */
function lHdr(right) {
  return '<div class="hdr"><span style="display:flex;gap:6px;flex:0 0 auto">' +
    '<button class="lmenu" style="width:auto;min-height:40px;padding:8px 12px;font-size:14px">&larr; H&ouml;ren</button>' +
    backBtn() + '</span><span class="muted small">' + esc(right) + '</span></div>';
}
function lCnt(st) { return st.ok + '/' + st.n + ' richtig'; }
function lRateRow() {
  return '<label class="bar-row small muted" style="margin:10px 0"><span>Tempo <b id="lrateV">' + lRate().toFixed(1) + 'x</b></span>' +
    '<input id="lrate" type="range" min="0.7" max="1.5" step="0.1" value="' + lRate() +
    '" style="max-width:220px;min-height:0;padding:0;border:0;background:none"></label>';
}
function lShow(html) {
  show(html);
  on('.lmenu', 'click', listenHome);
  on('#lrate', 'input', function () {
    S.settings.ttsRate = +this.value; save();
    var l = $('#lrateV'); if (l) l.textContent = lRate().toFixed(1) + 'x';
  });
}
function lNoData(what) {
  lShow(lHdr('') + '<div class="card"><b>Daten fehlen.</b><p class="muted">' +
    esc(what || 'F&uuml;r diese &Uuml;bung fehlen noch die Daten.') + '</p></div>');
}

/* ---------- Satz-Pool: Beispielsaetze begonnener Woerter ---------- */
function lPool() {
  if (!haveWords()) return [];
  var out = [], i, w;
  for (i = 0; i < WORDS.length; i++) {
    w = WORDS[i];
    if (w.ej && w.ej.es && S.cards['w:' + w.r + ':p']) out.push(w);
  }
  if (out.length < 20) {
    out = [];
    for (i = 0; i < WORDS.length && out.length < 100; i++) if (WORDS[i].ej && WORDS[i].ej.es) out.push(WORDS[i]);
  }
  return out;
}
function lPick(a) { return a[Math.floor(Math.random() * a.length)]; }
function lDe(es) {
  if (!haveWords()) return '';
  var n = norm(es);
  for (var i = 0; i < WORDS.length; i++) if (norm(WORDS[i].es) === n) return WORDS[i].de;
  return '';
}

/* ---------- Wort-Diff (Diktat) ---------- */
function lTok(s) {
  return String(s || '').toLowerCase()
    .replace(/[.,;:!?¡¿"'«»()…—–\-]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
/* listenDiff('mi hermano esta en casa', 'Mi hermana esta en la casa')
   -> words[i].s: 'ok' | 'acc' (nur Akzent falsch) | 'bad' (falsches Wort) | 'miss' (fehlt),
      extra: zu viel getippte Woerter, score: Wortgenauigkeit 0..1, ok: alles richtig. */
function listenDiff(typed, target) {
  var A = lTok(target).split(' ').filter(Boolean);
  var B = lTok(typed).split(' ').filter(Boolean);
  var na = A.map(norm), nb = B.map(norm);
  var n = na.length, m = nb.length, i, j;
  var d = []; for (i = 0; i <= n; i++) { d.push([]); for (j = 0; j <= m; j++) d[i][j] = 0; }
  for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--)
    d[i][j] = (na[i] === nb[j]) ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
  var ops = []; i = 0; j = 0;
  while (i < n && j < m) {
    if (na[i] === nb[j]) { ops.push({ k: 'eq', a: i, b: j }); i++; j++; }
    else if (d[i + 1][j] >= d[i][j + 1]) { ops.push({ k: 'del', a: i }); i++; }
    else { ops.push({ k: 'ins', b: j }); j++; }
  }
  while (i < n) { ops.push({ k: 'del', a: i }); i++; }
  while (j < m) { ops.push({ k: 'ins', b: j }); j++; }

  var words = [], extra = [], k = 0, dels, inss, q;
  while (k < ops.length) {
    if (ops[k].k === 'eq') {
      words.push({ w: A[ops[k].a], typed: B[ops[k].b], s: A[ops[k].a] === B[ops[k].b] ? 'ok' : 'acc' });
      k++; continue;
    }
    dels = []; inss = [];
    while (k < ops.length && ops[k].k !== 'eq') { if (ops[k].k === 'del') dels.push(ops[k].a); else inss.push(ops[k].b); k++; }
    for (q = 0; q < dels.length; q++)
      words.push({ w: A[dels[q]], typed: q < inss.length ? B[inss[q]] : '', s: q < inss.length ? 'bad' : 'miss' });
    for (q = dels.length; q < inss.length; q++) extra.push(B[inss[q]]);
  }
  var good = 0;
  words.forEach(function (x) { if (x.s === 'ok' || x.s === 'acc') good++; });
  var tot = words.length + extra.length;
  return {
    words: words, extra: extra,
    score: tot ? good / tot : 1,
    ok: good === words.length && !extra.length
  };
}
function lDiffHtml(d) {
  var h = d.words.map(function (x) {
    if (x.s === 'ok') return esc(x.w);
    if (x.s === 'acc') return '<span style="background:#ffe680;color:#2a2410;border-radius:4px;padding:0 3px">' + esc(x.w) + '</span>';
    if (x.s === 'miss') return '<span class="bad" style="text-decoration:underline">[' + esc(x.w) + ']</span>';
    return '<span class="bad" style="text-decoration:underline">' + esc(x.w) + '</span>';
  }).join(' ');
  if (d.extra.length) h += '<br><span class="bad small">Zu viel: ' + esc(d.extra.join(' ')) + '</span>';
  return h;
}

/* ---------- 1. DIKTAT ---------- */
function lDiktat(st) {
  lS();
  st = st || { n: 0, ok: 0 }; // Lektion: st.pool, st.max, st.onDone
  var pool = st.pool || lPool();
  if (!pool.length) return lNoData('Die Datei data/words.js wurde noch nicht erzeugt.');
  var w = lPick(pool), target = w.ej.es;
  lShow(lHdr('Diktat &middot; ' + lCnt(st) + (st.max ? ' &middot; Satz ' + (st.n + 1) + '/' + st.max : '')) +
    '<div class="card"><p class="muted small">H&ouml;r zu und schreib den Satz. Der Text bleibt verdeckt.</p>' +
    '<div class="row"><button id="lplay">&#128266; Nochmal</button><button id="lchunk">Langsam in Abschnitten</button></div>' +
    lRateRow() + '</div>' +
    '<input id="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Satz auf Spanisch &hellip;">' +
    accBar() + '<div class="row"><button class="primary" id="go">Pr&uuml;fen (Enter)</button></div>' +
    lRateHint());
  var inp = $('#ans'); inp.focus(); wireAcc(inp);
  on('#lplay', 'click', function () { lSpeak(target); });
  on('#lchunk', 'click', function () { lSpeakChunks(target); });
  lSpeak(target);
  function submit() {
    var d = listenDiff(inp.value, target);
    st.n++; if (d.ok) st.ok++;
    var L = lS();
    L.hist.push({ r: lRate(), s: d.score });
    if (L.hist.length > 60) L.hist = L.hist.slice(-60);
    L.n = (L.n || 0) + 1;
    save();
    lDikFeedback(st, w, d);
  }
  on('#go', 'click', submit);
  keys({ 'Enter': submit });
}
function lDikFeedback(st, w, d) {
  var target = w.ej.es;
  var head = d.ok ? '<p class="ok">Richtig!</p>'
    : (d.score >= 0.999 ? '<p class="ok">Fast richtig &ndash; nur die Akzente.</p>'
      : '<p class="bad">Nicht ganz &ndash; ' + Math.round(d.score * 100) + '% der W&ouml;rter.</p>');
  var tags = d.ok ? '' :
    '<div id="ltags"><p class="muted small">Warum ist es schiefgegangen? (optional, ein Tipp)</p><div class="row">' +
    '<button data-tag="unk">Wort unbekannt</button>' +
    '<button data-tag="grenze">Grenze nicht geh&ouml;rt</button>' +
    '<button data-tag="schnell">Zu schnell</button></div></div>';
  var last = st.max && st.n >= st.max;
  lShow(lHdr('Diktat &middot; ' + lCnt(st) + (st.max ? ' &middot; ' + st.n + '/' + st.max : '')) +
    '<div class="card">' + head +
    '<p class="es">' + lDiffHtml(d) + '</p>' +
    '<p class="muted">' + esc(w.ej.de) + '</p>' +
    '<p class="muted small">Gelb = nur Akzent falsch &middot; Rot = falsch, [in Klammern] = fehlt.</p>' +
    '<div class="row"><button id="lplay">&#128266; Nochmal</button><button id="lchunk">Langsam in Abschnitten</button></div>' +
    lRateRow() + '</div>' + tags +
    '<div class="row"><button class="primary" id="go">' + (last ? 'Fertig' : 'N&auml;chster Satz') + ' (Enter)</button></div>' +
    lRateHint());
  on('#lplay', 'click', function () { lSpeak(target); });
  on('#lchunk', 'click', function () { lSpeakChunks(target); });
  on('[data-tag]', 'click', function () {
    var t = this.getAttribute('data-tag'), L = lS();
    L.tags[t] = (L.tags[t] || 0) + 1; save();
    var box = $('#ltags');
    if (box) box.innerHTML = '<p class="muted small">Notiert: ' + esc(this.textContent) + '</p>';
  });
  var nx = function () { if (last) return st.onDone ? st.onDone() : listenHome(); lDiktat(st); };
  on('#go', 'click', nx);
  keys({ 'Enter': nx });
}
function lRateHint() {
  var L = lS(), h = L.hist.filter(function (x) { return x.r >= 1.0; });
  if (h.length < 10 || lRate() >= 1.3) return '';
  var last = h.slice(-10), s = 0;
  last.forEach(function (x) { s += x.s; });
  return (s / last.length >= 0.8) ? '<p class="ok small">Versuch 1.3x!</p>' : '';
}

/* ---------- 2. MINIMALPAARE ---------- */
/* r vs. rr - alles echte spanische Woerter. */
var LISTEN_RR = [
  ['pero', 'aber', 'perro', 'Hund'],
  ['caro', 'teuer', 'carro', 'Karren, Auto'],
  ['coro', 'Chor', 'corro', 'ich laufe'],
  ['para', 'für', 'parra', 'Weinrebe'],
  ['cero', 'null', 'cerro', 'Hügel'],
  ['moro', 'Maure', 'morro', 'Schnauze'],
  ['foro', 'Forum', 'forro', 'Futter (Kleidung)'],
  ['mira', 'schau!', 'mirra', 'Myrrhe'],
  ['pera', 'Birne', 'perra', 'Hündin'],
  ['coral', 'Koralle', 'corral', 'Viehgehege'],
  ['careta', 'Maske', 'carreta', 'Karren'],
  ['moral', 'Moral', 'morral', 'Rucksack'],
  ['hiero', 'ich verletze', 'hierro', 'Eisen'],
  ['enterar', 'informieren', 'enterrar', 'begraben']
].map(function (x) { return { a: x[0], an: x[1], b: x[2], bn: x[3], kind: 'rr' }; });

/* Betonungspaare zur Laufzeit aus VERBS: gleiche Buchstaben, anderer Akzent. */
function listenStressPairs() {
  if (!haveVerbs()) return [];
  var groups = {}, tenses = ['presente', 'preterito', 'imperfecto'];
  Object.keys(VERBS).forEach(function (inf) {
    var v = VERBS[inf];
    tenses.forEach(function (t) {
      var forms = v[t];
      if (!forms || forms.length !== 6) return;
      forms.forEach(function (f, pi) {
        var k = norm(f), s = String(f).toLowerCase();
        groups[k] = groups[k] || {};
        if (!groups[k][s]) groups[k][s] = { inf: inf, t: t, pi: pi };
      });
    });
  });
  var out = [];
  Object.keys(groups).forEach(function (k) {
    var sp = Object.keys(groups[k]);
    if (sp.length < 2) return;
    var A = sp[0], B = sp[1];
    if (A === B) return;
    out.push({ a: A, an: lFormNote(groups[k][A]), b: B, bn: lFormNote(groups[k][B]), kind: 'stress' });
  });
  return out;
}
function lFormNote(m) {
  var de = lDe(m.inf);
  return m.inf + (de ? ' (' + de + ')' : '') + ' · ' + (TENSES[m.t] || m.t) + ' · ' + PERSONS[m.pi];
}
var lMpCache = null;
function lMpPool() {
  if (!lMpCache) lMpCache = listenStressPairs().concat(LISTEN_RR);
  return lMpCache;
}
function lMinPairs(st) {
  lS();
  st = st || { n: 0, ok: 0 };
  var pool = lMpPool();
  if (!pool.length) return lNoData('Die Datei data/verbs.js wurde noch nicht erzeugt.');
  var p = lPick(pool);
  var which = Math.random() < 0.5 ? 'a' : 'b';
  var target = p[which], note = p[which === 'a' ? 'an' : 'bn'] || lDe(target);
  var rate = 0.85 + Math.random() * 0.3;
  var opts = shuffle([p.a, p.b]);
  lShow(lHdr('Minimalpaare &middot; ' + lCnt(st)) +
    '<div class="card"><p class="muted small">Welches Wort h&ouml;rst du? ' +
    (p.kind === 'stress' ? 'Achte auf die Betonung.' : 'Achte auf r und rr.') + '</p>' +
    '<div class="row"><button id="lplay">&#128266; Nochmal</button></div></div>' +
    '<div class="stack">' + opts.map(function (o, i) {
      return '<button data-o="' + i + '" style="text-align:center"><span class="big">' + esc(o) + '</span></button>';
    }).join('') + '</div>');
  var play = function () { lSpeak(target, rate); };
  on('#lplay', 'click', play);
  play();
  function answer(i) {
    var ok = opts[i] === target;
    st.n++; if (ok) st.ok++;
    lShow(lHdr('Minimalpaare &middot; ' + lCnt(st)) +
      '<div class="card">' + (ok ? '<p class="ok">Richtig!</p>' : '<p class="bad">Falsch &ndash; du hast &bdquo;' + esc(opts[i]) + '&ldquo; gew&auml;hlt.</p>') +
      '<div class="big">' + esc(target) + '</div>' +
      (note ? '<p class="muted">' + esc(note) + '</p>' : '') +
      '<p class="muted small">Gegenst&uuml;ck: ' + esc(opts[0] === target ? opts[1] : opts[0]) + '</p>' +
      '<div class="row"><button id="lplay">&#128266; Nochmal</button>' + spk(target, 'Normal') + '</div></div>' +
      '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>');
    on('#lplay', 'click', play);
    var nx = function () { lMinPairs(st); };
    on('#go', 'click', nx);
    keys({ 'Enter': nx });
  }
  on('[data-o]', 'click', function () { answer(+this.getAttribute('data-o')); });
  keys({ '1': function () { answer(0); }, '2': function () { answer(1); } });
}

/* ---------- 3. SINALEFA ---------- */
var LISTEN_SIN = [
  { p: 'los amigos', a: 2, l: 'lo-sa-mi-gos' },
  { p: 'el hombre', a: 2, l: 'e-lom-bre' },
  { p: 'va a hablar', a: 3, l: 'va-a-blar' },
  { p: 'está aquí', a: 2, l: 'es-ta-quí' },
  { p: 'mi hermana', a: 2, l: 'mier-ma-na' },
  { p: 'te amo', a: 2, l: 'tea-mo' },
  { p: 'para el', a: 2, l: 'pa-rael' },
  { p: 'la casa azul', a: 3, l: 'la-ca-sa-zul' },
  { p: 'es un amigo', a: 3, l: 'e-su-na-mi-go' },
  { p: 'no hay nada', a: 3, l: 'no-ai-na-da' },
  { p: 'mi amigo', a: 2, l: 'mia-mi-go' },
  { p: 'una hora', a: 2, l: 'u-nao-ra' },
  { p: 'el agua', a: 2, l: 'e-la-gua' },
  { p: 'tengo hambre', a: 2, l: 'ten-goam-bre' },
  { p: 'de aquí', a: 2, l: 'dea-quí' },
  { p: 'con el hombre', a: 3, l: 'co-ne-lom-bre' },
  { p: 'lo he hecho', a: 3, l: 'loe-che-cho' }
];
function lSinalefa(st) {
  lS();
  st = st || { n: 0, ok: 0 };
  var it = lPick(LISTEN_SIN), i;
  lShow(lHdr('Wortgrenzen &middot; ' + lCnt(st)) +
    '<div class="card"><p><b>Wie viele W&ouml;rter h&ouml;rst du?</b></p>' +
    '<div class="row"><button id="lplay">&#128266; Nochmal</button></div>' + lRateRow() + '</div>' +
    '<div class="row">' + [1, 2, 3, 4].map(function (n) {
      return '<button data-o="' + n + '"><span class="big">' + n + '</span></button>';
    }).join('') + '</div>');
  var play = function () { lSpeak(it.p); };
  on('#lplay', 'click', play);
  play();
  function answer(n) {
    var ok = n === it.a;
    st.n++; if (ok) st.ok++;
    lShow(lHdr('Wortgrenzen &middot; ' + lCnt(st)) +
      '<div class="card">' + (ok ? '<p class="ok">Richtig!</p>' : '<p class="bad">Es sind ' + it.a + ' W&ouml;rter.</p>') +
      '<div class="big">' + esc(it.p) + '</div>' +
      '<p class="es">gesprochen: ' + esc(it.l) + '</p>' +
      '<p class="muted small">Spanisch bindet den letzten Laut eines Wortes an den ersten des n&auml;chsten &ndash; die Wortgrenze verschwindet im Klang.</p>' +
      '<div class="row"><button id="lplay">&#128266; Nochmal</button></div></div>' +
      '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>');
    on('#lplay', 'click', play);
    var nx = function () { lSinalefa(st); };
    on('#go', 'click', nx);
    keys({ 'Enter': nx });
  }
  on('[data-o]', 'click', function () { answer(+this.getAttribute('data-o')); });
  keys({ '1': function () { answer(1); }, '2': function () { answer(2); }, '3': function () { answer(3); }, '4': function () { answer(4); } });
}

/* ---------- 4. AUSSPRACHE-DECODING ---------- */
var LISTEN_DEC = [
  { w: 'sopa', o: ['ßo-pa (scharfes s)', 'so-pa (summendes s wie in "Rose")'], a: 0, note: 'Spanisches s ist immer stimmlos – nie [z] wie in "Sonne".' },
  { w: 'sol', o: ['ßol', 'sol (summendes s)'], a: 0, note: 'Auch am Wortanfang bleibt s ein scharfes [ß].' },
  { w: 'estar', o: ['es-tar', 'esch-tar'], a: 0, note: 'es + Konsonant bleibt [s]+[t] – kein [scht] wie in "Stein".' },
  { w: 'español', o: ['es-pa-njol', 'esch-pa-njol'], a: 0, note: 'es + p bleibt [s]+[p] – kein [schp] wie in "Spanien".' },
  { w: 'escuela', o: ['es-ku-e-la', 'esch-ku-e-la'], a: 0, note: 'st/sp am Wortanfang nie [scht]/[schp].' },
  { w: 'zapato', o: ['ßa-pa-to', 'tsa-pa-to'], a: 0, note: 'z = [s] (Lateinamerika) bzw. [th] (Spanien) – nie [ts] wie in "Zeit".' },
  { w: 'cinco', o: ['ßin-ko', 'tsin-ko', 'tschin-ko'], a: 0, note: 'ce/ci = [s] bzw. [th] – nie [ts], nie [k].' },
  { w: 'cerveza', o: ['ßer-be-ßa', 'tser-we-tsa'], a: 0, note: 'c vor e und z sind derselbe Laut; v klingt wie [b].' },
  { w: 'gracias', o: ['gra-ßjas', 'gra-tsi-as'], a: 0, note: 'ci = [s]/[th], nie [ts].' },
  { w: 'hola', o: ['o-la', 'ho-la mit gehauchtem h'], a: 0, note: 'h ist im Spanischen immer stumm.' },
  { w: 'hombre', o: ['om-bre', 'hom-bre mit h'], a: 0, note: 'h wird nie gesprochen.' },
  { w: 'ahora', o: ['a-o-ra', 'a-ho-ra mit h'], a: 0, note: 'Auch im Wortinneren bleibt h stumm.' },
  { w: 'vaca', o: ['ba-ka', 'wa-ka'], a: 0, note: 'v spricht sich wie [b] – nie wie deutsches [w].' },
  { w: 'vino', o: ['bi-no', 'wi-no'], a: 0, note: 'b und v klingen im Spanischen gleich.' },
  { w: 'llave', o: ['ja-be', 'l-la-we'], a: 0, note: 'll = [j] wie in "ja" (yeismo); dazu v = [b].' },
  { w: 'calle', o: ['ka-je', 'kal-le'], a: 0, note: 'll ist ein Laut [j] – kein doppeltes l.' },
  { w: 'año', o: ['an-jo', 'a-no'], a: 0, note: 'ñ = [nj] wie in "Kognak" – klar anders als n.' },
  { w: 'jamón', o: ['cha-mon', 'dscha-mon', 'ja-mon'], a: 0, note: 'j = Rachenlaut [ch] wie in "Bach".' },
  { w: 'jugar', o: ['chu-gar', 'dschu-gar'], a: 0, note: 'j ist immer [ch], nie [dsch].' },
  { w: 'queso', o: ['ke-so', 'kwe-so'], a: 0, note: 'qu = [k]; das u ist stumm.' },
  { w: 'quién', o: ['kjen', 'kwi-en'], a: 0, note: 'qu vor e/i = [k], nie [kw].' },
  { w: 'guitarra', o: ['gi-ta-rra', 'gwi-ta-rra'], a: 0, note: 'gue/gui = [ge]/[gi]; das u ist stumm.' },
  { w: 'guerra', o: ['ge-rra', 'gwe-rra'], a: 0, note: 'gue = [ge] mit hartem g.' },
  { w: 'gente', o: ['chen-te', 'gen-te mit hartem g'], a: 0, note: 'ge/gi = [che]/[chi], genau wie j.' },
  { w: 'gigante', o: ['chi-gan-te', 'gi-gan-te'], a: 0, note: 'g vor e/i = [ch]; vor a/o/u bleibt es hartes [g].' }
];
function lDecode(st) {
  lS();
  st = st || { n: 0, ok: 0 };
  var it = lPick(LISTEN_DEC), correct = it.o[it.a], opts = shuffle(it.o.slice());
  lShow(lHdr('Schrift &rarr; Laut &middot; ' + lCnt(st)) +
    '<div class="card"><p class="muted small">Wie klingt das? (erst raten, dann h&ouml;ren)</p>' +
    '<div class="big">' + esc(it.w) + '</div></div>' +
    '<div class="stack">' + opts.map(function (o, i) {
      return '<button data-o="' + i + '">' + esc(o) + '</button>';
    }).join('') + '</div>');
  function answer(i) {
    if (!opts[i]) return;
    var ok = opts[i] === correct;
    st.n++; if (ok) st.ok++;
    lShow(lHdr('Schrift &rarr; Laut &middot; ' + lCnt(st)) +
      '<div class="card">' + (ok ? '<p class="ok">Richtig!</p>' : '<p class="bad">Falsch &ndash; richtig ist:</p>') +
      '<div class="big">' + esc(it.w) + '</div>' +
      '<p class="es">' + esc(correct) + '</p>' +
      '<p class="muted">' + esc(it.note) + '</p>' +
      '<div class="row"><button id="lplay">&#128266; Nochmal h&ouml;ren</button></div></div>' +
      '<div class="row"><button class="primary" id="go">Weiter (Enter)</button></div>');
    var play = function () { lSpeak(it.w); };
    on('#lplay', 'click', play);
    play();
    var nx = function () { lDecode(st); };
    on('#go', 'click', nx);
    keys({ 'Enter': nx });
  }
  on('[data-o]', 'click', function () { answer(+this.getAttribute('data-o')); });
  keys({ '1': function () { answer(0); }, '2': function () { answer(1); }, '3': function () { answer(2); } });
}

/* ---------- 5. SHADOWING ---------- */
var lRecUrl = null, lMR = null;
function lCanRec() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}
var LSHADOW_RATES = [0.8, 0.9, 1.0];
function lShadow(st) {
  lS();
  st = st || { n: 0, step: 0, w: null }; // Lektion: st.pool, st.max, st.onDone
  if (!st.w) {
    var pool = st.pool || lPool();
    if (!pool.length) return lNoData('Die Datei data/words.js wurde noch nicht erzeugt.');
    st.w = lPick(pool); st.step = 0;
  }
  var w = st.w, target = w.ej.es, rate = LSHADOW_RATES[st.step] || 1.0, hidden = st.step >= 2;
  var last = st.max && st.n + 1 >= st.max;
  var nextLabel = st.step === 0 ? 'Nochmal (0.9)' : (st.step === 1 ? 'Nochmal (1.0, Text versteckt)' : (last ? 'Fertig' : 'N&auml;chster Satz'));
  var rec = '';
  if (lCanRec()) {
    rec = '<div class="row"><button id="lrec">' + (lMR ? '&#9632; Aufnahme stoppen' : '&#127908; Mich aufnehmen') + '</button>' +
      (lRecUrl ? '<button id="lplaymodel">Modell anh&ouml;ren</button><button id="lplayrec">Meine Aufnahme</button>' : '') + '</div>' +
      '<p class="muted small" id="lrecmsg"></p>';
  }
  lShow(lHdr('Shadowing &middot; ' + st.n + (st.max ? '/' + st.max : '') + ' S&auml;tze') +
    '<div class="card"><p class="muted small">Sprich gleichzeitig mit &ndash; Tempo ' + rate.toFixed(1) + 'x' +
    (hidden ? ' &middot; ohne Text' : '') + '</p>' +
    (hidden ? '<div class="big muted">&middot; &middot; &middot;</div>' : '<p class="es">' + esc(target) + '</p>') +
    '<p class="muted">' + esc(w.ej.de) + '</p>' +
    '<div class="row"><button id="lplay">&#128266; Nochmal (' + rate.toFixed(1) + 'x)</button>' +
    '<button id="lchunk">Langsam in Abschnitten</button></div>' + rec + '</div>' +
    '<div class="row"><button class="primary" id="go">' + nextLabel + ' (Enter)</button></div>' +
    '<p class="muted small">Shadowing trainiert Sprechfluss und Prosodie &ndash; mitsprechen, nicht nachsprechen.</p>');
  var play = function () { lSpeak(target, rate); };
  on('#lplay', 'click', play);
  on('#lchunk', 'click', function () { lSpeakChunks(target); });
  on('#lplaymodel', 'click', play);
  on('#lplayrec', 'click', function () { if (lRecUrl) new Audio(lRecUrl).play(); });
  on('#lrec', 'click', function () { lRecToggle(function () { lShadow(st); }); });
  play();
  var nx = function () {
    if (st.step >= 2) {
      st.n++; st.w = null; st.step = 0;
      if (st.max && st.n >= st.max) return st.onDone ? st.onDone() : listenHome();
    } else st.step++;
    lShadow(st);
  };
  on('#go', 'click', nx);
  keys({ 'Enter': nx });
}
/* nur die letzte Aufnahme, im Speicher, keine Persistenz. */
function lRecToggle(done) {
  if (lMR) { try { lMR.stop(); } catch (e) {} return; }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    var chunks = [], mr = new MediaRecorder(stream);
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () {
      stream.getTracks().forEach(function (t) { t.stop(); });
      if (lRecUrl) URL.revokeObjectURL(lRecUrl);
      lRecUrl = chunks.length ? URL.createObjectURL(new Blob(chunks)) : null;
      lMR = null; done();
    };
    lMR = mr; mr.start(); done();
  })['catch'](function () {
    lMR = null;
    var m = $('#lrecmsg');
    if (m) m.textContent = 'Kein Mikrofon-Zugriff (bei file:// oft blockiert).';
  });
}

/* ---------- MENÜ ---------- */
function listenHome() {
  var L = lS();
  var drills = [
    ['dik', 'Diktat', 'Satz h&ouml;ren, tippen &ndash; Wort f&uuml;r Wort korrigiert.'],
    ['mp', 'Minimalpaare', 'Zwei &auml;hnliche W&ouml;rter: welches war es? (Betonung, r/rr)'],
    ['sin', 'Wortgrenzen', 'Wie viele W&ouml;rter? Spanisch bindet sie zusammen.'],
    ['dec', 'Schrift &rarr; Laut', 'Deutsche Lesefallen: s, z, h, v, ll, j, qu, gue.'],
    ['sha', 'Shadowing', 'Mitsprechen von langsam bis normal &ndash; Fluss und Rhythmus.']
  ];
  var tags = L.tags.unk + L.tags.grenze + L.tags.schnell;
  var h = lHdr('H&ouml;ren &amp; Aussprache') +
    '<h1>H&ouml;ren &amp; Aussprache</h1>' +
    '<p class="muted">F&uuml;nf endlose Drills. Alles per Sprachausgabe &ndash; kein Download.</p>' +
    '<div class="stack">' + drills.map(function (d) {
      return '<button data-d="' + d[0] + '"><b>' + d[1] + '</b><br><span class="small muted">' + d[2] + '</span></button>';
    }).join('') + '</div>' +
    '<div class="card">' + lRateRow() +
    '<div class="row">' + spk('Hola, ¿qué tal? Hoy hace buen tiempo.', 'Stimme testen') + '</div>' +
    '<p class="muted small">Diktate insgesamt: ' + (L.n || 0) + '</p>' +
    (tags ? '<p class="muted small">Deine Stolpersteine: Wort unbekannt ' + L.tags.unk +
      ' &middot; Grenze nicht geh&ouml;rt ' + L.tags.grenze + ' &middot; zu schnell ' + L.tags.schnell + '</p>' : '') +
    lRateHint() + '</div>';
  lShow(h);
  var go = { dik: lDiktat, mp: lMinPairs, sin: lSinalefa, dec: lDecode, sha: lShadow };
  on('[data-d]', 'click', function () { go[this.getAttribute('data-d')](); });
  keys({
    '1': function () { lDiktat(); }, '2': function () { lMinPairs(); }, '3': function () { lSinalefa(); },
    '4': function () { lDecode(); }, '5': function () { lShadow(); }
  });
}
