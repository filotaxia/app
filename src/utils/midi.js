/* ============================================
   Utils — MIDI
   ============================================ */

// Lee un archivo MIDI (.mid, "Standard MIDI File") y devuelve sus notas en
// segundos. Es lo que graba el Biodata: cada cambio en la señal de la planta
// sale como una nota MIDI. Sin dependencias, para que se entienda entero.
//
//   const { notes, duration } = parseMidi(await (await fetch(url)).arrayBuffer());
//   notes → [{ time, length, midi, velocity, channel }, ...] ordenadas por time
//           (time y length en segundos; midi 60 = C4; velocity 1–127)
//
//   noteName(69) → "A4"
//
// Cómo es un .mid: un encabezado ("MThd": formato, cantidad de pistas y
// cuántos ticks dura una negra) y una o más pistas ("MTrk") con eventos.
// Cada evento empieza con el tiempo desde el anterior, en ticks. Los que
// importan acá: note on / note off (cuándo empieza y termina cada nota) y el
// tempo (cuántos microsegundos dura una negra), para pasar ticks a segundos.

export function parseMidi(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (text(bytes, 0, 4) !== "MThd") throw new Error("Esto no es un archivo MIDI");

  const headerLength = uint32(bytes, 4);
  const trackCount = uint16(bytes, 10);
  const division = uint16(bytes, 12);   // ticks por negra
  if (division & 0x8000) throw new Error("MIDI con tiempo SMPTE: no está soportado");

  const tempos = [];   // [{ tick, perQuarter }] en microsegundos por negra
  const events = [];   // note on / off de todas las pistas
  let pos = 8 + headerLength;

  for (let track = 0; track < trackCount && pos < bytes.length; track++) {
    if (text(bytes, pos, 4) !== "MTrk") throw new Error("Pista MIDI dañada");
    const end = pos + 8 + uint32(bytes, pos + 4);
    let p = pos + 8;
    let tick = 0;
    let status = 0;

    // Número de largo variable: 7 bits por byte, el bit alto dice "sigue"
    const readLength = () => {
      let value = 0;
      let byte;
      do {
        byte = bytes[p++];
        value = (value << 7) | (byte & 0x7f);
      } while (byte & 0x80);
      return value;
    };

    while (p < end) {
      tick += readLength();
      const byte = bytes[p];

      if (byte === 0xff) {
        // Meta evento: tipo, largo y datos. El 0x51 es el tempo (3 bytes).
        const type = bytes[p + 1];
        p += 2;
        const length = readLength();
        if (type === 0x51) tempos.push({ tick, perQuarter: (bytes[p] << 16) | (bytes[p + 1] << 8) | bytes[p + 2] });
        p += length;
      } else if (byte === 0xf0 || byte === 0xf7) {
        // SysEx: se saltea
        p++;
        p += readLength();
      } else {
        // Mensaje de canal. Si el primer byte no es de estado, se repite el
        // anterior ("running status": el Biodata lo usa para ahorrar bytes).
        if (byte & 0x80) {
          status = byte;
          p++;
        }
        const kind = status >> 4;
        const channel = status & 0x0f;
        const data1 = bytes[p];
        const data2 = kind === 0xc || kind === 0xd ? 0 : bytes[p + 1];
        p += kind === 0xc || kind === 0xd ? 1 : 2;

        if (kind === 0x9 && data2 > 0) events.push({ tick, on: true, midi: data1, velocity: data2, channel, track });
        else if (kind === 0x8 || kind === 0x9) events.push({ tick, on: false, midi: data1, channel, track });
      }
    }
    pos = end;
  }

  const seconds = ticksToSeconds(tempos, division);

  // Cada note on se cierra con el próximo note off de la misma nota,
  // en la misma pista y canal. Las que quedan abiertas terminan con el archivo.
  events.sort((a, b) => a.tick - b.tick);
  const open = new Map();
  const notes = [];
  const lastTick = events.length ? events[events.length - 1].tick : 0;

  const close = (start, endTick) => {
    const time = seconds(start.tick);
    notes.push({
      time: round(time),
      length: round(seconds(endTick) - time),
      midi: start.midi,
      velocity: start.velocity,
      channel: start.channel,
    });
  };

  events.forEach((event) => {
    const key = `${event.track}:${event.channel}:${event.midi}`;
    if (event.on) {
      if (!open.has(key)) open.set(key, []);
      open.get(key).push(event);
    } else {
      const start = open.get(key)?.shift();
      if (start) close(start, event.tick);
    }
  });
  open.forEach((starts) => starts.forEach((start) => close(start, lastTick)));

  notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
  const duration = notes.reduce((max, note) => Math.max(max, note.time + note.length), 0);
  return { notes, duration: round(duration) };
}

// Nombre de una nota MIDI: 60 → "C4", 69 → "A4"
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteName(midi) {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

// Ticks → segundos con los cambios de tempo (sin tempo, 120 bpm)
function ticksToSeconds(tempos, division) {
  const changes = [{ tick: 0, perQuarter: 500000 }, ...tempos].sort((a, b) => a.tick - b.tick);
  return (tick) => {
    let total = 0;
    for (let i = 0; i < changes.length; i++) {
      const from = changes[i].tick;
      if (tick <= from && i > 0) break;
      const to = Math.min(tick, changes[i + 1]?.tick ?? Infinity);
      total += ((to - from) * changes[i].perQuarter) / division / 1e6;
    }
    return total;
  };
}

const text = (bytes, start, length) => String.fromCharCode(...bytes.slice(start, start + length));
const uint16 = (bytes, at) => (bytes[at] << 8) | bytes[at + 1];
const uint32 = (bytes, at) => ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
const round = (value) => Math.round(value * 1000) / 1000;
