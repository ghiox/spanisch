/* Offline-Cache fuer die Home-Bildschirm-App (iOS/Android).
   Install: alles vorladen. Danach Netz zuerst, Cache als Fallback - kein Versions-Bump
   noetig, wer online ist bekommt immer den aktuellen Stand, offline laeuft der letzte. */
var CACHE = 'esapp-shell';
var FILES = ['./', 'index.html', 'app.js', 'fsrs.js', 'listen.js', 'read.js',
  'data/words.js', 'data/grammar.js', 'data/verbs.js', 'data/house.js', 'data/texts.js',
  'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
