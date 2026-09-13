#!/usr/bin/env node
/* Rendert jeden gesprochenen Text der App als MP3: audio/n2f/<audioKey>.mp3 (Google Cloud TTS).
   Schluessel: ~/.config/spanish/google-tts.key oder $GOOGLE_TTS_KEY - nie im Repo.
   Nur fehlende Clips werden erzeugt, beliebig oft aufrufbar. Neue Stimme = VOICE + AUDIO_DIR
   (audio.js) aendern, dann rendert alles neu in einen neuen Ordner.
     node build/tts.js            rendern
     node build/tts.js --dry      nur zaehlen
     node build/tts.js --limit 20 nur die ersten 20 (Pipeline testen) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), os = require('os');
const ROOT = path.dirname(__dirname);
const VOICE = 'es-ES-Neural2-F', RATE = 1.0, PARALLEL = 3;
const args = process.argv.slice(2), dry = args.includes('--dry');
const limit = args.includes('--limit') ? +args[args.indexOf('--limit') + 1] : Infinity;

// App-Dateien im Sandkasten laden: Daten, audioKey(), lChunks() und die festen Hoer-Listen.
const ctx = vm.createContext({});
for (const f of ['data/words.js', 'data/grammar.js', 'data/verbs.js', 'data/house.js', 'data/texts.js', 'audio.js', 'listen.js', 'read.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^const /m, 'var '), ctx, { filename: f });
const OUT = path.join(ROOT, ctx.AUDIO_DIR);

const texts = new Map(); // key -> text
const add = s => { s = String(s == null ? '' : s).trim().replace(/\s+/g, ' '); if (s) texts.set(ctx.audioKey(s), s); };
const chunks = s => ctx.lChunks(s).forEach(add);
ctx.WORDS.forEach(w => { add(w.es); if (w.ej && w.ej.es) { add(w.ej.es); chunks(w.ej.es); } });
ctx.TEXTS.forEach(t => { String(t.text).split(/\n+/).forEach(add); ctx.textSentences(t.text).forEach(x => { add(x); chunks(x); }); });
ctx.GRAMMAR.forEach(p => { (p.rule.examples || []).forEach(e => add(e.es)); p.items.forEach(it => { if (it.type === 'mc') add(it.sentence); }); });
Object.values(ctx.VERBS).forEach(v => ['presente', 'preterito', 'imperfecto'].forEach(t => (v[t] || []).forEach(f => { add(f); add(String(f).toLowerCase()); })));
ctx.HOUSE.forEach(r => { add(r.es); (r.items || []).forEach(it => add(it.es)); });
ctx.LISTEN_RR.forEach(p => { add(p.a); add(p.b); });
ctx.LISTEN_SIN.forEach(x => { add(x.p); chunks(x.p); });
ctx.LISTEN_DEC.forEach(x => add(x.w));
add('Hola, ¿qué tal? Hoy hace buen tiempo.');

fs.mkdirSync(OUT, { recursive: true });
const missing = [...texts].filter(([k]) => !fs.existsSync(path.join(OUT, k + '.mp3'))), todo = missing.slice(0, limit);
const chars = [...texts.values()].reduce((n, t) => n + t.length, 0);
console.log(`Texte: ${texts.size} (${chars} Zeichen) · vorhanden: ${texts.size - missing.length} · zu rendern: ${todo.length}`);
fs.writeFileSync(path.join(__dirname, 'tts_manifest.json'), JSON.stringify(Object.fromEntries([...texts].sort()), null, 0) + '\n');
if (dry || !todo.length) process.exit(0);

let KEY = process.env.GOOGLE_TTS_KEY || '';
try { KEY = KEY || fs.readFileSync(path.join(os.homedir(), '.config/spanish/google-tts.key'), 'utf8').trim(); } catch (e) {}
if (!KEY) { console.error('Kein Schluessel: ~/.config/spanish/google-tts.key oder $GOOGLE_TTS_KEY'); process.exit(1); }

async function synth(text, tries) {
  const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
    body: JSON.stringify({ input: { text }, voice: { languageCode: 'es-ES', name: VOICE }, audioConfig: { audioEncoding: 'MP3', speakingRate: RATE } })
  });
  if (r.ok) return Buffer.from((await r.json()).audioContent, 'base64');
  const msg = `${r.status} ${(await r.text()).slice(0, 160)}`;
  if ((r.status === 429 || r.status >= 500) && tries < 6) { await new Promise(res => setTimeout(res, 4000 * (tries + 1))); return synth(text, tries + 1); }
  throw new Error(msg);
}
let i = 0, fail = 0, done = 0;
async function worker() {
  while (i < todo.length) {
    const [k, t] = todo[i++];
    try {
      const buf = await synth(t, 0), f = path.join(OUT, k + '.mp3');
      fs.writeFileSync(f + '.part', buf); fs.renameSync(f + '.part', f); done++;
    } catch (e) { fail++; console.error(`FEHLER ${k} "${t.slice(0, 40)}": ${e.message}`); if (fail > 20) process.exit(2); }
    if ((done + fail) % 100 === 0) console.log(`${done + fail}/${todo.length}`);
  }
}
Promise.all(Array.from({ length: PARALLEL }, worker)).then(() => { console.log(`fertig: ${done} neu, ${fail} Fehler`); process.exit(fail ? 1 : 0); });
