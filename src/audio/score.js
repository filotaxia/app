/* ============================================
   Audio — Score
   ============================================ */

// La "partitura" de un terrario: qué nota suena en qué segundo.
// Es una función pura y determinista: el mismo terrario (la misma semilla)
// da siempre la misma pieza, así se puede adelantar, volver y escuchar
// de nuevo igual. player.js la toca con Web Audio.
//
// Mientras no haya grabaciones reales, la pieza se genera así:
//   - una nota raíz grave por terrario y una escala pentatónica menor encima
//   - una "señal de la planta": una curva lenta (suma de senos) que sube y baja
//     como las microfluctuaciones eléctricas de una hoja; cuando sube,
//     las notas se acercan y suenan más agudas y fuertes
//
//   const { root, notes } = buildScore({ seed: seedFrom("04"), duration: 222 });
//   notes → [{ time, freq, length, gain }, ...] ordenadas por time

const SCALE = [0, 3, 5, 7, 10];   // pentatónica menor (semitonos)

import { seedFrom, random } from "../utils/random.js";

export { seedFrom };

const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

export function buildScore({ seed, duration }) {
  const rand = random(seed);

  // Raíz entre A1 (33) y E2 (40): el drone grave del terrario
  const rootMidi = 33 + Math.floor(rand() * 8);

  // Fases de la señal de la planta, distintas por terrario
  const phaseA = rand() * Math.PI * 2;
  const phaseB = rand() * Math.PI * 2;
  const signal = (t) =>
    0.5 + 0.32 * Math.sin(t / 23 + phaseA) + 0.18 * Math.sin(t / 7.3 + phaseB); // ~0..1

  const notes = [];
  let time = 1 + rand() * 1.5;

  while (time < duration) {
    const s = Math.min(1, Math.max(0, signal(time)));

    // Más señal → notas más agudas (hasta 3 octavas sobre la raíz)
    const octave = 2 + Math.floor(rand() * (1 + s * 2.2));
    const degree = SCALE[Math.floor(rand() * SCALE.length)];
    const freq = midiToFreq(rootMidi + 12 * octave + degree);

    notes.push({
      time: round(time),
      freq: round(freq),
      length: round(1.6 + rand() * 3.2),
      gain: round(0.08 + s * 0.14 + rand() * 0.05),
    });

    // Más señal → notas más seguidas
    time += 0.35 + (1 - s) * 2.4 * (0.4 + rand());
  }

  return { root: round(midiToFreq(rootMidi)), notes };
}

const round = (value) => Math.round(value * 1000) / 1000;
