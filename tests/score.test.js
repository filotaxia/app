/* ============================================
   Tests — Score
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScore, buildSubstrate, seedFrom } from "../src/audio/score.js";

test("seedFrom: mismo texto, misma semilla; distinto texto, distinta", () => {
  assert.equal(seedFrom("04"), seedFrom("04"));
  assert.notEqual(seedFrom("04"), seedFrom("03"));
});

test("buildScore es determinista: el mismo terrario suena siempre igual", () => {
  const a = buildScore({ seed: seedFrom("04"), duration: 222 });
  const b = buildScore({ seed: seedFrom("04"), duration: 222 });
  assert.deepEqual(a, b);
});

test("buildScore: notas ordenadas, dentro de la duración y con valores válidos", () => {
  const { root, notes } = buildScore({ seed: seedFrom("01"), duration: 120 });
  assert.ok(root > 50 && root < 200, `raíz razonable: ${root}`);
  assert.ok(notes.length > 20, "tiene suficientes notas");
  notes.forEach((note, i) => {
    assert.ok(note.time >= 0 && note.time < 120);
    if (i > 0) assert.ok(note.time >= notes[i - 1].time);
    assert.ok(note.freq > root);
    assert.ok(note.length > 0);
    assert.ok(note.gain > 0 && note.gain <= 1);
  });
});

test("buildScore: terrarios distintos suenan distinto", () => {
  const a = buildScore({ seed: seedFrom("01"), duration: 60 });
  const b = buildScore({ seed: seedFrom("02"), duration: 60 });
  assert.notDeepEqual(a.notes, b.notes);
});

test("buildSubstrate: notas graves y largas, ordenadas y dentro de la duración", () => {
  const notes = buildSubstrate({ seed: seedFrom("01"), duration: 120 });
  assert.ok(notes.length >= 5, "tiene notas");
  notes.forEach((note, i) => {
    assert.ok(note.time >= 0 && note.time < 120);
    if (i > 0) assert.ok(note.time >= notes[i - 1].time);
    assert.ok(note.midi >= 24 && note.midi <= 60, `grave: ${note.midi}`);
    assert.ok(note.length >= 3, "larga");
    assert.ok(note.velocity >= 1 && note.velocity <= 127);
  });
  assert.deepEqual(notes, buildSubstrate({ seed: seedFrom("01"), duration: 120 }), "determinista");
});
