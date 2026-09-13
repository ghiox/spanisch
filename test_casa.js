/* Selbsttest fuer den Casa-Modus - wird von test_casa.sh in eine Kopie von
   index.html injiziert und headless geladen. Ergebnis steht im <title>. */
setTimeout(function () {
  var out = [], ok = true;
  function t(c, m) { if (!c) { ok = false; out.push('FAIL ' + m); } }
  t(HOUSE.length === 5, '5 Zimmer');
  HOUSE.forEach(function (r) {
    t(r.items.length >= 10, r.id + ' >=10 Objekte');
    r.items.forEach(function (i) {
      t(/^(el|la|los|las) /.test(i.es), r.id + '/' + i.id + ' ohne Artikel');
      t(r.svg.indexOf('data-item="' + i.id + '"') > 0, r.id + '/' + i.id + ' fehlt im SVG');
    });
  });
  HOUSE.forEach(function (r) {
    casaRoom(r);
    var first = r.items[0], pins = document.getElementById('pins');
    document.querySelector('#scene [data-item="' + first.id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    t(pins.querySelectorAll('.postit').length === 1, r.id + ': ein Post-it nach Klick');
    t(pins.textContent.indexOf(first.es) === 0, r.id + ': Post-it zeigt ' + first.es);
    t(pins.textContent.indexOf(first.de) > 0, r.id + ': Post-it zeigt ' + first.de);
    document.getElementById('all').click();
    var m = [].slice.call(pins.querySelectorAll('.postit.mini'));
    t(m.length === r.items.length, r.id + ': alle ' + r.items.length + ' Mini-Post-its');
    var sc = document.querySelector('.scene').getBoundingClientRect(), bad = 0, esc = 0;
    m.forEach(function (a, i) {
      var A = a.getBoundingClientRect();
      if (A.left < sc.left || A.right > sc.right || A.top < sc.top || A.bottom > sc.bottom) esc++;
      m.slice(i + 1).forEach(function (b) {
        var B = b.getBoundingClientRect();
        if (A.left < B.right && A.right > B.left && A.top < B.bottom && A.bottom > B.top) bad++;
      });
    });
    t(bad === 0, r.id + ': ' + bad + ' ueberlappende Labels');
    t(esc === 0, r.id + ': ' + esc + ' Labels ausserhalb der Szene');
  });
  document.title = (ok ? 'PASS' : 'FAIL') + ' ' + out.join('; ');
}, 900);
