// FSRS-4.5 scheduler, pure functions. Works as browser global and as node module.
// Grades: 1=Again, 2=Hard, 3=Good, 4=Easy. Desired retention 0.9 => interval == stability.
var FSRS_W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031,
              1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
var FSRS_F = 19 / 81;
var DAY_MS = 86400000;

function fsrsClamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

function fsrsDue(now, S) { return now + Math.max(1, Math.round(S)) * DAY_MS; }

// Retrievability after t days with stability S.
function fsrsR(S, t) { return Math.pow(1 + FSRS_F * t / S, -0.5); }

function fsrsInit(G, now) {
  var w = FSRS_W;
  now = now || Date.now();
  var S = w[G - 1];
  var D = fsrsClamp(w[4] - (G - 3) * w[5], 1, 10);
  return { S: S, D: D, due: fsrsDue(now, S), last: now, reps: 1, lapses: G === 1 ? 1 : 0 };
}

function fsrsReview(st, G, now) {
  var w = FSRS_W;
  now = now || Date.now();
  var t = Math.max(0, (now - st.last) / DAY_MS);
  var S = st.S, D = st.D, R = fsrsR(S, t), nS;
  if (G >= 2) {
    nS = S * (Math.exp(w[8]) * (11 - D) * Math.pow(S, -w[9]) *
              (Math.exp(w[10] * (1 - R)) - 1) *
              (G === 2 ? w[15] : 1) * (G === 4 ? w[16] : 1) + 1);
  } else {
    nS = Math.min(S, w[11] * Math.pow(D, -w[12]) * (Math.pow(S + 1, w[13]) - 1) *
                     Math.exp(w[14] * (1 - R)));
  }
  nS = fsrsClamp(nS, 0.1, 36500);
  var nD = fsrsClamp(w[7] * w[4] + (1 - w[7]) * (D - w[6] * (G - 3)), 1, 10);
  return {
    S: nS, D: nD, due: fsrsDue(now, nS), last: now,
    reps: (st.reps || 0) + 1, lapses: (st.lapses || 0) + (G === 1 ? 1 : 0)
  };
}

// Days until due (for display).
function fsrsIntervalDays(st) { return Math.max(1, Math.round(st.S)); }

if (typeof module !== 'undefined') {
  module.exports = { FSRS_W: FSRS_W, fsrsInit: fsrsInit, fsrsReview: fsrsReview, fsrsR: fsrsR, fsrsIntervalDays: fsrsIntervalDays };
}
