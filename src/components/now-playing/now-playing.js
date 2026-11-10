/* ============================================
   Components — Now Playing
   ============================================ */

// El reproductor chico de todo el sitio. Portado a JS plano de un
// componente React ("Sound"). Dos estados:
//
//   cerrado invisible, sin ocupar lugar: no hay nada que tocar acá — lo abre
//           el ícono de play del bottom-nav (layout/player-dock conecta los dos)
//   barra   foto, nombre, ⏮ ▶ ⏭ y la línea de lo escuchado
//
// Cada pantalla elige con cuál arranca (setCollapsible). Tocar la barra (en
// cualquier lado menos los botones) lleva a la Pieza del terrario que suena
// (#/escuchar/:id, el reproductor grande).
//
//   nowPlaying(terrario)                       → el HTML (en pausa)
//   bindNowPlaying(root, { queue, collapsible })
//     → { toggleOpen(), setCollapsible(bool), setQueue(queue), pause(), destroy() }
//
// queue: los terrarios que se pueden pasar, el propio primero. ⏮ / ⏭ pasan al
// anterior / siguiente (con uno solo, vuelven al principio de la pieza).
//
// UN SOLO NÚMERO ES EL ESTADO: `c` va de 0 (cerrado) a 1 (abierto, la
// barra); todo —alto, opacidad, dónde están los botones— se calcula a
// partir de él en paint(). Nada tiene transición propia: así se ve un solo
// objeto que cambia y no varias piezas que se mueven a la vez. El ancho no
// cambia nunca (el de la barra de navegación): crece solo hacia arriba,
// desde cero (cerrado).
//
// El play no se cambia por la pausa: es el mismo dibujo (dos cuadriláteros)
// y lo que se mueve son sus 8 puntos (markPath), con un "estirón" a mitad
// de camino. Con "reducir movimiento" todo cambia sin animación.

import { createPlayer } from "../../audio/player.js";
import { seedFrom } from "../../audio/score.js";
import { loadLanes, toPlayerNotes } from "../../audio/lanes.js";
import { codeOf } from "../../content/terrarios.js";
import { terrariumArt } from "../terrarium-art/terrarium-art.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

// --- Medidas (px) ---
const PAD = 10;
const ART = 40;                    // la foto, cuadrada, sin redondeo
const H = PAD + 68;                 // el alto de la barra (con la línea al pie)
const SIDE = 24;                    // ⏮ y ⏭
const GAP = 5;
const PLAY = 30;
const RAIL_H = 3;
const MS = 380;                     // abrir / cerrar
const MARK_MS = 300;                // play ↔ pausa

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mix = (a, b, t) => a + (b - a) * t;
const quart = (t) => 1 - (1 - t) ** 4;                                       // llega sin pasarse
const swing = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);     // sale y llega suave

// --- El play / la pausa: los mismos dos cuadriláteros (puntos de Lucide) ---
const PAUSE_L = [6, 4, 10, 4, 10, 20, 6, 20];
const PLAY_L = [6.5, 4, 13.25, 8, 13.25, 16, 6.5, 20];
const PAUSE_R = [14, 4, 18, 4, 18, 20, 14, 20];
const PLAY_R = [13.25, 8, 20, 12, 20, 12, 13.25, 16];

function markPath(a, b, t) {
  let d = "";
  for (let i = 0; i < 8; i += 2) {
    d += `${i ? "L" : "M"}${mix(a[i], b[i], t).toFixed(2)} ${mix(a[i + 1], b[i + 1], t).toFixed(2)}`;
  }
  return `${d}Z`;
}

export function nowPlaying(terrario) {
  return `
    <div class="np" data-np>
      <span class="np__art" data-np-art>${terrariumArt({ size: "sm", photo: terrario.photo })}</span>

      <span class="np__say" data-np-say>
        <span class="np__title" data-np-title>${escapeHTML(codeOf(terrario))}</span>
        <span class="np__by">Filotaxia</span>
      </span>

      <span class="np__track" data-np-track>
        <span class="np__rail"><span class="np__run" data-np-run></span></span>
      </span>

      <a class="np__tap" data-np-tap aria-label="Ver la pieza"></a>

      <span class="np__ops" data-np-ops>
        <button class="np__op" type="button" data-np-prev aria-label="Terrario anterior">${icon("skip-back")}</button>
        <button class="np__op np__op--lead" type="button" data-np-play aria-label="Reproducir" aria-pressed="false">
          <svg class="np__mark" data-np-mark viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
            stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">
            <path data-np-mark-l d="${markPath(PAUSE_L, PLAY_L, 1)}" />
            <path data-np-mark-r d="${markPath(PAUSE_R, PLAY_R, 1)}" />
          </svg>
        </button>
        <button class="np__op" type="button" data-np-next aria-label="Terrario siguiente">${icon("skip-forward")}</button>
      </span>
    </div>
  `;
}

export function bindNowPlaying(root, { queue: firstQueue, collapsible = true }) {
  const box = root.querySelector("[data-np]");
  const $ = (name) => box.querySelector(`[data-np-${name}]`);
  const el = {
    art: $("art"), say: $("say"), title: $("title"), track: $("track"), run: $("run"),
    tap: $("tap"), ops: $("ops"), prev: $("prev"), play: $("play"), next: $("next"),
    mark: $("mark"), markL: $("mark-l"), markR: $("mark-r"),
  };
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let queue = firstQueue;
  let index = 0;
  let player = null;
  let offs = [];          // para dejar de escuchar al reproductor anterior
  let token = 0;          // descarta un reproductor que terminó de armarse tarde
  let wantPlay = false;   // tocaron play antes de que estuviera listo

  // --- El audio: un reproductor por terrario; sus notas MIDI se bajan una vez ---
  const lanes = new Map();
  const lanesFor = (terrario) => {
    if (!lanes.has(terrario.id)) lanes.set(terrario.id, loadLanes(terrario));
    return lanes.get(terrario.id);
  };
  // Se piden todas de entrada: al pasar de terrario ya están, y el play
  // sale dentro del mismo toque (si no, el iPhone no deja sonar)
  queue.forEach(lanesFor);

  async function load(i, autoplay) {
    const mine = ++token;
    offs.forEach((off) => off());
    offs = [];
    player?.destroy();
    player = null;
    setPlaying(false);
    index = (i + queue.length) % queue.length;
    const terrario = queue[index];
    el.title.textContent = codeOf(terrario);
    el.art.innerHTML = terrariumArt({ size: "sm", photo: terrario.photo });
    el.tap.href = `#/escuchar/${terrario.id}`;
    el.run.style.width = "0%";

    const notes = await lanesFor(terrario);
    if (mine !== token) return;
    player = createPlayer({
      seed: seedFrom(terrario.id),
      duration: terrario.duration,
      waves: terrario.waves,
      notes: notes.real.plantas ? toPlayerNotes(notes.plantas) : null,
    });
    offs = [
      player.on("tick", ({ time, duration }) => { el.run.style.width = `${(time / duration) * 100}%`; }),
      player.on("state", ({ playing }) => setPlaying(playing)),
    ];
    if (autoplay || wantPlay) player.play();
    wantPlay = false;
  }

  // --- Estado: "closed" o "bar" ---
  let state = collapsible ? "closed" : "bar";
  let c = state === "closed" ? 0 : 1;
  let raf = 0;

  function go(next) {
    state = next;
    const open = state === "bar";
    [el.tap, el.prev, el.play, el.next].forEach((node) => { node.tabIndex = open ? 0 : -1; });
    cancelAnimationFrame(raf);
    const cTo = open ? 1 : 0;
    if (still) {
      c = cTo;
      paint();
      return;
    }
    const cFrom = c;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / MS);
      c = mix(cFrom, cTo, quart(k));
      paint();
      raf = k < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  }

  const place = (node, { left, top, width, height }) => {
    if (left != null) node.style.left = `${left}px`;
    if (top != null) node.style.top = `${top}px`;
    if (width != null) node.style.width = `${width}px`;
    if (height != null) node.style.height = `${height}px`;
  };

  function paint() {
    const W = box.parentElement.clientWidth;
    if (!W) return;   // escondido (en el reproductor grande, por ejemplo)
    const h = H * c;   // cerrado: alto 0, invisible; crece hacia arriba desde cero

    place(box, { width: W, height: h });
    box.style.opacity = c;   // a h:0 el borde igual se ve (1px): se apaga del todo con esto
    place(el.art, { left: PAD, top: PAD, width: ART, height: ART });

    // ⏮ ▶ ⏭ a la derecha, centrados con la foto. Se ubican por su centro
    const row = SIDE * 2 + PLAY + GAP * 2;
    place(el.ops, { left: W - PAD - row / 2, top: PAD + ART / 2 });
    el.ops.style.gap = `${GAP}px`;
    el.ops.style.opacity = c;
    el.ops.style.pointerEvents = c > 0.9 ? "auto" : "none";
    [el.prev, el.next].forEach((button) => { place(button, { width: SIDE, height: SIDE }); });

    // el nombre, al lado de la foto y centrado con ella
    const sayLeft = PAD + ART + 10;
    place(el.say, { left: sayLeft, top: PAD, height: ART, width: Math.max(0, W - sayLeft - row - PAD - 8) });
    el.say.style.opacity = c;

    // la línea, al pie de la barra
    place(el.track, { left: PAD, top: h - PAD - RAIL_H, width: Math.max(0, W - PAD * 2) });
    el.track.style.opacity = c;

    // lo que se toca para ir a la Pieza: toda la caja (los botones, encima)
    place(el.tap, { left: 0, top: 0, width: W, height: h });
    el.tap.style.pointerEvents = c > 0.9 ? "auto" : "none";
  }

  // --- Play ↔ pausa: t va de 0 (pausa) a 1 (play) ---
  let playing = false;
  let markT = 1;
  let markRaf = 0;

  function setPlaying(value) {
    if (value === playing) return;
    playing = value;
    el.play.setAttribute("aria-pressed", String(playing));
    el.play.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    cancelAnimationFrame(markRaf);
    const target = playing ? 0 : 1;
    if (still) {
      markT = target;
      paintMark();
      return;
    }
    const from = markT;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / MARK_MS);
      markT = mix(from, target, swing(k));
      paintMark();
      markRaf = k < 1 ? requestAnimationFrame(step) : 0;
    };
    markRaf = requestAnimationFrame(step);
  }

  // A mitad de camino se aplasta, las mitades se juntan y se inclina un poco:
  // cambia de forma sin cambiar de volumen, por eso se ve blando
  function paintMark() {
    const goo = Math.sin(clamp(markT, 0, 1) * Math.PI);
    const pull = 1.6 * goo;
    const tip = (playing ? -9 : 9) * goo;
    el.markL.setAttribute("d", markPath(PAUSE_L, PLAY_L, markT));
    el.markR.setAttribute("d", markPath(PAUSE_R, PLAY_R, markT));
    el.markL.setAttribute("transform", `translate(${pull} 0)`);
    el.markR.setAttribute("transform", `translate(${-pull} 0)`);
    el.mark.style.transform = `rotate(${tip}deg) scale(${1 - 0.13 * goo}, ${1 + 0.11 * goo})`;
  }

  // --- Controles (el.tap es un link: lo abre el navegador solo) ---
  el.play.addEventListener("click", () => {
    if (player) player.toggle();
    else wantPlay = true;
  });

  // ⏮: si ya pasaron unos segundos, vuelve al principio; si no, al anterior
  el.prev.addEventListener("click", () => {
    if (queue.length === 1 || (player && player.time > 3)) player?.seek(0);
    else load(index - 1, playing);
  });

  el.next.addEventListener("click", () => {
    if (queue.length === 1) player?.seek(0);
    else load(index + 1, playing);
  });

  // Se pinta cuando la caja ya tiene dónde medirse, y de nuevo si cambia el
  // ancho disponible (girar el teléfono, volver a mostrarla)
  let width = 0;
  const resize = new ResizeObserver(() => {
    const now = box.parentElement.clientWidth;
    if (now === width) return;
    width = now;
    paint();
  });
  resize.observe(box.parentElement);
  go(state);
  load(0, false);

  return {
    // El ícono del bottom-nav: cerrado → abre (sin reproducir solo); abierto
    // → cierra (sigue sonando si estaba sonando, solo se esconde)
    toggleOpen() {
      go(state === "closed" ? "bar" : "closed");
    },
    // La pantalla elige con qué estado arranca: true = cerrado (casi todas), false = barra (Colección)
    setCollapsible(value) {
      go(value ? "closed" : "bar");
    },
    // La cola cambió (por ejemplo, el primer escaneo eligió "Mi terrario").
    // Si está sonando algo, sigue; si no, pasa al primero de la nueva
    setQueue(next) {
      const current = queue[index];
      queue = next;
      queue.forEach(lanesFor);
      const i = queue.findIndex((terrario) => terrario.id === current?.id);
      if (playing || i === 0) index = Math.max(0, i);
      else load(0, false);
    },
    pause() {
      player?.pause();
    },
    destroy() {
      token += 1;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(markRaf);
      resize.disconnect();
      offs.forEach((off) => off());
      player?.destroy();
    },
  };
}
