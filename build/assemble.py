#!/usr/bin/env python3
"""One-off: assemble data/*.js from workflow-authored JSON + Jehle CSV."""
import csv, glob, json, os, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")

# --- words.js from words_batch_*.json ---
words = []
for f in sorted(glob.glob(os.path.join(ROOT, "build", "words_batch_*.json"))):
    words.extend(json.load(open(f)))
words.sort(key=lambda w: w["r"])
assert len(words) >= 900, f"only {len(words)} words"
assert all(w.get("de") and w.get("ej", {}).get("es") for w in words), "incomplete word entry"
with open(os.path.join(D, "words.js"), "w") as f:
    f.write("const WORDS = " + json.dumps(words, ensure_ascii=False) + ";\n")

# --- grammar.js from grammar_*.json (fixed pedagogical order) ---
order = ["genero", "presente", "serestar", "pasado", "pronombres", "porpara", "preposiciones", "hacks"]
points = []
for pid in order:
    p = json.load(open(os.path.join(ROOT, "build", f"grammar_{pid}.json")))
    for it in p["items"]:
        assert it["type"] in ("mc", "choice", "cloze"), it
        if it["type"] in ("mc", "choice"):
            assert 0 <= it["answer"] < len(it["options"]), it
        else:
            assert it["answers"], it
    points.append(p)
with open(os.path.join(D, "grammar.js"), "w") as f:
    f.write("const GRAMMAR = " + json.dumps(points, ensure_ascii=False) + ";\n")

# --- texts.js from texts_batch_*.json (batch order = topic order, level ascending) ---
texts = []
for f in sorted(glob.glob(os.path.join(ROOT, "build", "texts_batch_*.json"))):
    texts.extend(json.load(open(f)))
assert len(texts) == len({t["id"] for t in texts}), "duplicate text id"
for t in texts:
    assert t.get("title") and t.get("topic") and t.get("text") and t.get("gloss"), t["id"]
    for it in t["folge"]:
        assert it["type"] in ("choice", "cloze"), it
        if it["type"] == "choice":
            assert 0 <= it["answer"] < len(it["options"]), it
        else:
            assert it["answers"], it
with open(os.path.join(D, "texts.js"), "w") as f:
    f.write("const TEXTS = " + json.dumps(texts, ensure_ascii=False) + ";\n")

# --- verbs.js: Jehle CSV filtered to lemma verbs, 3 tenses ---
lemmas = json.load(open(os.path.join(ROOT, "build", "lemmas.json")))
verbset = {w["es"] for w in lemmas if w["pos"] == "verb"}
tmap = {"Presente": "presente", "Pretérito": "preterito", "Imperfecto": "imperfecto"}
verbs = {}
for row in csv.DictReader(open(os.path.join(ROOT, "build", "jehle.csv"))):
    inf, tense = row["infinitive"], row["tense"]
    if inf in verbset and row["mood"] == "Indicativo" and tense in tmap:
        v = verbs.setdefault(inf, {"en": row["infinitive_english"].split(";")[0].strip()})
        v[tmap[tense]] = [row[f"form_{p}"] for p in ("1s", "2s", "3s", "1p", "2p", "3p")]
verbs = {k: v for k, v in verbs.items() if all(t in v for t in tmap.values())}
with open(os.path.join(D, "verbs.js"), "w") as f:
    f.write("const VERBS = " + json.dumps(verbs, ensure_ascii=False) + ";\n")

missing = sorted(verbset - set(verbs))
print(f"words={len(words)} texts={len(texts)} grammar_points={len(points)} items={sum(len(p['items']) for p in points)} verbs={len(verbs)} verbs_missing_in_jehle={len(missing)}: {missing[:15]}")
