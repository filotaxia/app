/* ============================================
   Audio — Lanes
   ============================================ */

// Las dos secuencias MIDI de un terrario, una por Biodata:
//
//   plantas   Biodata 02 · las suculentas
//   sustrato  Biodata 01 · sustrato, gravas, piedra pómez y ambient
//
// Si el terrario tiene sus archivos (terrario.midi = { plantas, sustrato },
// .mid en src/assets/midi/), se leen con utils/midi.js. Si no, o si un
// archivo no carga, esa secuencia se simula: las plantas son las notas que
// toca el reproductor (audio/score.js) y el sustrato, buildSubstrate().
//
//   const lanes = await loadLanes(terrario);
//   lanes.plantas  → [{ time, length, midi, velocity }, ...]
//   lanes.sustrato → idem
//   lanes.real     → { plantas: true/false, sustrato: true/false }
//
// toPlayerNotes(lanes.plantas) las pasa al formato del reproductor, para que
// suene lo mismo que se ve cuando el MIDI de las plantas es real.

import { buildScore, buildSubstrate, seedFrom } from "./score.js";
import { parseMidi } from "../utils/midi.js";

export const LANES = [
  { key: "plantas", name: "Plantas", biodata: "Biodata 02", detail: "Suculentas" },
  { key: "sustrato", name: "Sustrato", biodata: "Biodata 01", detail: "Sustrato, gravas, piedra pómez y ambient" },
];

export async function loadLanes(terrario) {
  const seed = seedFrom(terrario.id);
  const { duration } = terrario;
  const lanes = {
    plantas: buildScore({ seed, duration }).notes.map(fromScore),
    sustrato: buildSubstrate({ seed, duration }),
    real: { plantas: false, sustrato: false },
  };

  await Promise.all(LANES.map(async ({ key }) => {
    const url = terrario.midi?.[key];
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const { notes } = parseMidi(await response.arrayBuffer());
      lanes[key] = notes.filter((note) => note.time < duration);
      lanes.real[key] = true;
    } catch (error) {
      console.warn(`No se pudo leer el MIDI de ${key} (${url}): queda simulado.`, error);
    }
  }));

  return lanes;
}

// Nota del reproductor { freq, gain } ↔ nota MIDI { midi, velocity }
function fromScore({ time, length, freq, gain }) {
  return { time, length, midi: Math.round(12 * Math.log2(freq / 440) + 69), velocity: Math.round(Math.min(1, gain / 0.27) * 127) };
}

export function toPlayerNotes(notes) {
  return notes.map(({ time, length, midi, velocity }) => ({
    time,
    length: Math.max(0.3, length),
    freq: 440 * 2 ** ((midi - 69) / 12),
    gain: 0.06 + (velocity / 127) * 0.18,
  }));
}
