/* ============================================
   Tests — MIDI
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMidi, noteName } from "../src/utils/midi.js";

// Arma un archivo .mid chico a mano: encabezado + pistas (cada pista, bytes de eventos)
function midiFile({ format = 0, division = 480, tracks }) {
  const bytes = [
    ...ascii("MThd"), 0, 0, 0, 6,
    0, format, 0, tracks.length, division >> 8, division & 0xff,
  ];
  tracks.forEach((events) => {
    const body = [...events, 0x00, 0xff, 0x2f, 0x00];   // fin de pista
    const n = body.length;
    bytes.push(...ascii("MTrk"), (n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff, ...body);
  });
  return new Uint8Array(bytes);
}

const ascii = (text) => [...text].map((c) => c.charCodeAt(0));
const TEMPO_120 = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20];   // 500000 µs por negra

test("parseMidi: una nota de una negra a 120 bpm dura medio segundo", () => {
  const file = midiFile({
    tracks: [[...TEMPO_120, 0x00, 0x90, 60, 100, 0x83, 0x60, 0x80, 60, 0]],   // 0x83 0x60 = 480 ticks
  });
  const { notes, duration } = parseMidi(file);
  assert.deepEqual(notes, [{ time: 0, length: 0.5, midi: 60, velocity: 100, channel: 0 }]);
  assert.equal(duration, 0.5);
});

test("parseMidi: running status y note on con velocidad 0 como note off", () => {
  const file = midiFile({
    tracks: [[
      ...TEMPO_120,
      0x00, 0x90, 60, 90,        // C4 on
      0x00, 64, 80,              // E4 on (running status)
      0x83, 0x60, 60, 0,         // C4 off a los 480 ticks (on con velocidad 0)
      0x83, 0x60, 64, 0,         // E4 off a los 960
    ]],
  });
  const { notes } = parseMidi(file);
  assert.equal(notes.length, 2);
  assert.deepEqual(notes.map((n) => [n.midi, n.time, n.length]), [[60, 0, 0.5], [64, 0, 1]]);
});

test("parseMidi: formato 1, el tempo de la primera pista vale para las demás", () => {
  const file = midiFile({
    format: 1,
    tracks: [
      [0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40],   // 1000000 µs por negra (60 bpm)
      [0x83, 0x60, 0x91, 48, 70, 0x83, 0x60, 0x81, 48, 0],
    ],
  });
  const { notes } = parseMidi(file);
  assert.deepEqual(notes, [{ time: 1, length: 1, midi: 48, velocity: 70, channel: 1 }]);
});

test("parseMidi: un archivo que no es MIDI tira un error claro", () => {
  assert.throws(() => parseMidi(new Uint8Array([1, 2, 3, 4])), /no es un archivo MIDI/);
});

test("noteName: número MIDI → nombre con octava", () => {
  assert.equal(noteName(69), "A4");
  assert.equal(noteName(60), "C4");
  assert.equal(noteName(61), "C#4");
  assert.equal(noteName(21), "A0");
});
