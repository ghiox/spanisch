/* Offline-Cache fuer die Home-Bildschirm-App (iOS/Android).
   Install: alles vorladen. Danach Netz zuerst, Cache als Fallback - kein Versions-Bump
   noetig, wer online ist bekommt immer den aktuellen Stand, offline laeuft der letzte.
   cache:'no-cache' / 'reload': GitHub Pages setzt max-age=600, sonst antwortet der
   HTTP-Cache des Browsers 10 Minuten lang mit der alten Datei. */
var CACHE = 'esapp-shell';
var AUDIO_CACHE = 'esapp-audio';
var FILES = ['./', 'index.html', 'app.js', 'fsrs.js', 'audio.js', 'listen.js', 'read.js',
  'data/words.js', 'data/grammar.js', 'data/verbs.js', 'data/house.js', 'data/texts.js',
  'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('/audio/') !== -1) return e.respondWith(audioResponse(e.request));
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});

/* Sprachclips sind unveraenderlich -> Cache zuerst, sonst laden und behalten (offline nach dem
   ersten Hoeren). iOS fragt Audio per Range-Header ab; die Cache-API kann keine 206-Antworten
   speichern, also immer komplett laden/speichern und die Range hier selbst ausschneiden. */
function audioResponse(req) {
  return caches.open(AUDIO_CACHE).then(function (c) {
    return c.match(req.url).then(function (hit) {
      if (hit) return ranged(hit, req);
      return fetch(req.url).then(function (res) {
        if (!res.ok) return res;
        return c.put(req.url, res.clone()).then(function () { return ranged(res, req); });
      });
    });
  });
}
function ranged(res, req) {
  var m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (!m) return res;
  return res.arrayBuffer().then(function (buf) {
    var total = buf.byteLength;
    var start = m[1] ? +m[1] : Math.max(0, total - +m[2]);
    var end = (m[1] && m[2]) ? Math.min(+m[2], total - 1) : total - 1;
    var h = new Headers(res.headers);
    h.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
    h.set('Content-Length', String(end - start + 1));
    h.set('Accept-Ranges', 'bytes');
    return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: h });
  });
}
