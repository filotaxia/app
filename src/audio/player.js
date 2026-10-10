/* ============================================
   Audio — Player
   ============================================ */

// Toca la partitura de un terrario (score.js) con Web Audio:
// un drone grave constante + notas suaves con un eco largo.
//
//   const player = createPlayer({ seed: seedFrom("04"), duration: 222, waves: ["triangle", "sine"] });
//   (waves: las formas de onda del terrario; las notas las van alternando)
//   player.on("tick", ({ time, duration }) => { ... });   // ~4 veces por segundo
//   player.on("state", ({ playing }) => { ... });
//   player.toggle();  player.skip(15);  player.seek(60);
//   player.destroy();                                       // al salir de la vista
//
// El AudioContext se crea recién en el primer play (los navegadores
// solo dejan sonar audio después de un toque del usuario).
//
// Cómo se mantiene la posición: al dar play se anota "en el segundo X de la
// pieza, el reloj de audio marcaba Y". La posición es X + (reloj ahora − Y).
// Un scheduler mira cada 100 ms qué notas caen en el próximo medio segundo
// y las programa en el reloj de audio, que es preciso.

import { buildScore } from "./score.js";

const LOOKAHEAD = 0.5;        // segundos que se programan por adelantado
const SCHEDULER_MS = 100;
const TICK_MS = 250;

// Volumen de cada forma de onda para que suenen parejas
// (la triangular y la cuadrada tienen más armónicos y se oyen más fuertes)
const WAVE_LEVEL = { sine: 1, triangle: 0.75, square: 0.25, sawtooth: 0.3 };

export function createPlayer({ seed, duration, waves = ["sine"] }) {
  const { root, notes } = buildScore({ seed, duration });
  const listeners = { tick: new Set(), state: new Set(), ended: new Set() };

  let ctx = null;
  let master = null;
  let send = null;            // entrada del eco
  let drone = null;           // { stop() }
  let voices = new Set();     // osciladores de notas ya programadas
  let playing = false;
  let offset = 0;             // segundo de la pieza al dar play / pausa
  let startedAt = 0;          // reloj de audio al dar play
  let nextIndex = 0;          // próxima nota a programar
  let schedulerId = null;
  let tickId = null;

  const emit = (event, data) => listeners[event].forEach((cb) => cb(data));

  function position() {
    if (!playing) return offset;
    return Math.min(duration, offset + (ctx.currentTime - startedAt));
  }

  // --- Grafo de audio: notas → master y → eco → master → parlantes ---
  function setup() {
    // iPhone: por defecto Web Audio se calla con la tecla de silencio.
    // "playback" lo trata como música (como Spotify): suena igual. (Safari 17+)
    if (navigator.audioSession) navigator.audioSession.type = "playback";

    ctx = new AudioContext();

    // Al volver a la app (después de bloquear el celular o cambiar de app),
    // iOS deja el audio "interrumpido": se retoma si estaba sonando
    document.addEventListener("visibilitychange", resumeIfPlaying);

    master = ctx.createGain();
    master.gain.value = 0.9;
    const compressor = ctx.createDynamicsCompressor();
    master.connect(compressor).connect(ctx.destination);

    // Eco: delay con realimentación, filtrado para que se vaya apagando oscuro
    send = ctx.createGain();
    send.gain.value = 0.45;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.42;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1800;
    send.connect(delay);
    delay.connect(tone).connect(feedback).connect(delay);
    tone.connect(master);
  }

  // Drone: raíz + quinta, levemente desafinadas, con un vaivén lento de volumen
  function startDrone() {
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 1.5);
    filter.connect(gain).connect(master);

    const oscillators = [root, root * 1.5, root * 2.003].map((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start();
      return osc;
    });

    // LFO: el drone "respira" cada ~9 segundos
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.11;
    lfoDepth.gain.value = 0.03;
    lfo.connect(lfoDepth).connect(gain.gain);
    lfo.start();

    return {
      stop() {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        [...oscillators, lfo].forEach((osc) => osc.stop(now + 0.45));
      },
    };
  }

  // Una nota: seno + un armónico suave, ataque corto y caída larga
  function playNote(note, when, index) {
    const wave = waves[index % waves.length];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(note.gain, when + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + note.length);
    gain.connect(master);
    gain.connect(send);

    [
      { type: wave, mult: 1, level: WAVE_LEVEL[wave] ?? 1 },
      { type: "triangle", mult: 2, level: 0.12 },
    ].forEach(({ type, mult, level }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = note.freq * mult;
      oscGain.gain.value = level;
      osc.connect(oscGain).connect(gain);
      osc.start(when);
      osc.stop(when + note.length + 0.05);
      voices.add(osc);
      osc.onended = () => voices.delete(osc);
    });
  }

  function schedule() {
    const now = position();
    if (now >= duration) {
      finish();
      return;
    }
    while (nextIndex < notes.length && notes[nextIndex].time < now + LOOKAHEAD) {
      const note = notes[nextIndex];
      if (note.time >= now) playNote(note, ctx.currentTime + (note.time - now), nextIndex);
      nextIndex += 1;
    }
  }

  // Índice de la primera nota que suena en o después de `time`
  function indexAt(time) {
    const index = notes.findIndex((note) => note.time >= time);
    return index === -1 ? notes.length : index;
  }

  function silence() {
    voices.forEach((osc) => {
      try { osc.stop(); } catch { /* ya había parado */ }
    });
    voices.clear();
  }

  function resumeIfPlaying() {
    if (document.visibilityState === "visible" && playing && ctx?.state !== "running") ctx.resume();
  }

  function play() {
    if (playing) return;
    if (!ctx) setup();
    ctx.resume();
    if (offset >= duration) offset = 0;

    playing = true;
    startedAt = ctx.currentTime;
    nextIndex = indexAt(offset);
    drone = startDrone();
    schedule();
    schedulerId = setInterval(schedule, SCHEDULER_MS);
    tickId = setInterval(() => emit("tick", { time: position(), duration }), TICK_MS);
    emit("state", { playing });
  }

  function pause() {
    if (!playing) return;
    offset = position();
    playing = false;
    clearInterval(schedulerId);
    clearInterval(tickId);
    drone?.stop();
    drone = null;
    silence();
    emit("state", { playing });
    emit("tick", { time: offset, duration });
  }

  function finish() {
    pause();
    offset = 0;
    emit("tick", { time: 0, duration });
    emit("ended");
  }

  function seek(time) {
    const target = Math.min(duration, Math.max(0, time));
    if (!playing) {
      offset = target;
      emit("tick", { time: offset, duration });
      return;
    }
    silence();
    offset = target;
    startedAt = ctx.currentTime;
    nextIndex = indexAt(offset);
    emit("tick", { time: offset, duration });
  }

  return {
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    seek,
    skip: (delta) => seek(position() + delta),
    get playing() { return playing; },
    get time() { return position(); },
    duration,
    on(event, callback) {
      listeners[event].add(callback);
      return () => listeners[event].delete(callback);
    },
    destroy() {
      pause();
      document.removeEventListener("visibilitychange", resumeIfPlaying);
      Object.values(listeners).forEach((set) => set.clear());
      ctx?.close();
      ctx = null;
    },
  };
}
