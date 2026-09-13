// node test_fsrs.js  -> prints PASS or throws
var assert = require('assert');
var f = require('./fsrs.js');
var DAY = 86400000;
var t0 = Date.UTC(2025, 0, 1);

// 1) new card, Good
var c = f.fsrsInit(3, t0);
assert.ok(Math.abs(c.S - 3.7145) < 1e-9, 'S after new Good');
assert.strictEqual(Math.round((c.due - t0) / DAY), 4, 'due ~ +4 days');
assert.ok(c.D >= 1 && c.D <= 10, 'D in range');
assert.strictEqual(c.reps, 1);

// 2) repeated Good at due date -> monotonically growing intervals
var iv = [], st = c;
for (var i = 0; i < 6; i++) {
  var ivDays = Math.round((st.due - st.last) / DAY);
  iv.push(ivDays);
  st = f.fsrsReview(st, 3, st.due);
}
for (var j = 1; j < iv.length; j++) {
  assert.ok(iv[j] > iv[j - 1], 'interval must grow: ' + iv.join(','));
}

// 3) Again after successes shrinks stability
var before = st.S;
var after = f.fsrsReview(st, 1, st.due);
assert.ok(after.S < before, 'Again must reduce S');
assert.strictEqual(after.lapses, st.lapses + 1, 'lapse counted');
assert.ok(Math.round((after.due - after.last) / DAY) >= 1, 'due at least 1 day out');

// 4) Hard < Good < Easy stability, D stays clamped
var g2 = f.fsrsReview(c, 2, c.due).S, g3 = f.fsrsReview(c, 3, c.due).S, g4 = f.fsrsReview(c, 4, c.due).S;
assert.ok(g2 < g3 && g3 < g4, 'Hard<Good<Easy: ' + [g2, g3, g4].join(','));
var hard = c; for (var k = 0; k < 20; k++) hard = f.fsrsReview(hard, 1, hard.due);
assert.ok(hard.D >= 1 && hard.D <= 10, 'D clamped');

console.log('intervals:', iv.join(', '));
console.log('PASS');
