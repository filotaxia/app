/* ============================================
   Views — Escuchar
   ============================================ */

// Reproductor de un terrario, como la pantalla "reproduciendo" de Spotify:
//
//   Arriba de todo   "← Mi terrario" / "← Colección" y el punto de Ajustes
//   Fondo            la foto del terrario a todo el ancho, que se funde con
//                    el fondo de la página; "Cambiar a video" la cambia por el
//                    video del terrario (terrario.video; mientras no haya
//                    videos propios, el GIF de la capa Plantas de filotaxia.com)
//   Abajo            miniatura + nombre + "Filotaxia" (como el artista), barra de progreso y
//                    −15 s · play/pausa · +15 s
//   Al bajar         bloques con todo lo de la pieza (escuchar-bloques.js) y,
//                    pegada arriba, una barra chica con el nombre y play/pausa
//                    para no perder los controles
//   Partitura        las notas MIDI de los dos Biodata (audio/lanes.js); su
//                    botón de ampliar abre la partitura a pantalla completa
//
// Se llega desde Mi terrario (bloque Pieza o "Escuchar"), Colección, la ficha o
// el final del Manifiesto. "← Mi terrario" / "← Colección" vuelve a
// donde se estaba; Ajustes queda arriba a la derecha.
// #/escuchar sin id abre el terrario propio o, si no hay, el primero de la colección.
//
// Teclado: espacio = play/pausa · ← / → = −15 / +15 s (fuera de la barra).

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { LAYERS } from "../../content/ayuda.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { markStep } from "../../store/journey.js";
import { createPlayer } from "../../audio/player.js";
import { seedFrom } from "../../audio/score.js";
import { loadLanes, toPlayerNotes } from "../../audio/lanes.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon, arrow } from "../../utils/icons.js";
import { sections, scoreFull, bindScore } from "./escuchar-bloques.js";
import { bindPlants } from "../../components/plants-block/plants-block.js";

export const title = ({ params }) => {
  const terrario = getTerrario(params.id);
  return terrario ? codeOf(terrario) : "Escuchar";
};

const SKIP = 15;

// Video de fondo mientras no haya videos propios de cada terrario
const FALLBACK_VIDEO = LAYERS[0][3];

export async function render(root, { params, from }) {
  const linked = await linkedIds();

  // Sin id: el propio o el primero de la colección
  if (!params.id) {
    const mine = await myTerrarioId();
    const id = linked.includes(mine) ? mine : linked[0];
    if (id) {
      location.replace(`#/escuchar/${id}`);
      return;
    }
    root.innerHTML = empty();
    return;
  }

  // Se puede escuchar cualquier terrario del catálogo (Terrarios los muestra
  // todos); un código que no existe va a la ficha, que dice "No encontramos…"
  const terrario = getTerrario(params.id);
  if (!terrario) {
    location.replace(`#/terrario/${params.id}`);
    return;
  }

  const back = backTo(from, (await myTerrarioId()) === terrario.id);
  const others = linked.filter((id) => id !== terrario.id).map(getTerrario).filter(Boolean);
  const name = escapeHTML(codeOf(terrario));
  const lanes = await loadLanes(terrario);   // las dos secuencias MIDI (plantas y sustrato)

  root.innerHTML = `
    <section class="screen player" data-mode="audio" data-player>
      <div class="player__backdrop" aria-hidden="true">
        <div class="player__photo">${terrariumArt({ photo: terrario.photo })}</div>
        <div class="player__video" data-video></div>
      </div>

      <div class="player__top">
        <a class="back-link" href="${back.href}">${arrow("left")} ${back.label}</a>
        ${settingsLink()}
      </div>

      <div class="player__body">
        <button class="player__view reveal" type="button" data-view aria-pressed="false">
          <span data-view-icon>${icon("square-play")}</span>
          <span data-view-label>Cambiar a video</span>
        </button>

        <div class="player__track reveal-stagger">
          <div class="player__thumb" data-art>${terrariumArt({ photo: terrario.photo, size: "sm" })}</div>
          <div class="player__info">
            <h1 class="player__name" tabindex="-1">${name}</h1>
            <p class="player__meta">Filotaxia</p>
          </div>
        </div>

        <div class="player__progress reveal">
          <input class="player__range" type="range" min="0" max="${terrario.duration}" step="1" value="0"
            aria-label="Posición" aria-valuetext="0:00 de ${formatTime(terrario.duration)}" data-range />
          <div class="player__times" aria-hidden="true">
            <span data-elapsed>0:00</span>
            <span data-remaining>-${formatTime(terrario.duration)}</span>
          </div>
        </div>

        <div class="player__controls reveal" data-controls>
          <button class="btn btn--icon player__skip" type="button" data-skip="-${SKIP}" aria-label="Retroceder ${SKIP} segundos">
            ${icon("rotate-ccw")}<span aria-hidden="true">${SKIP}</span>
          </button>
          <button class="player__play" type="button" data-toggle aria-label="Reproducir">
            <span data-icon-play>${icon("play")}</span>
            <span data-icon-pause hidden>${icon("pause")}</span>
          </button>
          <button class="btn btn--icon player__skip" type="button" data-skip="${SKIP}" aria-label="Adelantar ${SKIP} segundos">
            ${icon("rotate-cw")}<span aria-hidden="true">${SKIP}</span>
          </button>
        </div>
      </div>
    </section>

    <div class="player__mini" data-mini aria-hidden="true">
      <div class="player__mini-inner">
        <div class="player__mini-text">
          <span class="player__mini-name">${name}</span>
          <span class="player__mini-meta">Filotaxia</span>
        </div>
        <button class="player__mini-play" type="button" data-toggle tabindex="-1" aria-label="Reproducir">
          <span data-icon-play>${icon("play")}</span>
          <span data-icon-pause hidden>${icon("pause")}</span>
        </button>
      </div>
      <span class="player__mini-progress" data-progress-line></span>
    </div>

    <div class="player__sections">
      ${sections({ terrario, lanes, others })}
    </div>

    ${scoreFull(terrario, lanes)}
  `;

  return mountPlayer(root, terrario, lanes);
}

// La flecha de arriba vuelve a donde estaba la persona (Mi terrario o
// Colección); si llegó de otro lado (la ficha, el Manifiesto), a la sección
// que le corresponde a este terrario.
function backTo(from = "", isMine) {
  if (from.startsWith("mi-terrario")) return { href: "#/mi-terrario", label: "Mi terrario" };
  if (from === "coleccion") return { href: "#/coleccion", label: "Colección" };
  return isMine ? { href: "#/mi-terrario", label: "Mi terrario" } : { href: "#/coleccion", label: "Colección" };
}

function mountPlayer(root, terrario, lanes) {
  const player = createPlayer({
    seed: seedFrom(terrario.id),
    duration: terrario.duration,
    waves: terrario.waves,
    // con el MIDI real de las plantas, suena lo mismo que muestra la partitura
    notes: lanes.real.plantas ? toPlayerNotes(lanes.plantas) : null,
  });
  const range = root.querySelector("[data-range]");
  // Tiempos, play y líneas de progreso: los de la pantalla, la barra chica
  // y la partitura a pantalla completa
  const elapsed = [...root.querySelectorAll("[data-elapsed]")];
  const remaining = [...root.querySelectorAll("[data-remaining]")];
  const toggles = [...root.querySelectorAll("[data-toggle]")];
  const lines = [...root.querySelectorAll("[data-progress-line]")];
  const art = root.querySelector("[data-art] .terrarium-art");
  const paintScore = bindScore(root, lanes);
  let dragging = false;

  function paintTime(time) {
    const { duration } = player;
    const progress = `${(time / duration) * 100}%`;
    range.value = Math.floor(time);
    range.style.setProperty("--progress", progress);
    range.setAttribute("aria-valuetext", `${formatTime(time)} de ${formatTime(duration)}`);
    elapsed.forEach((el) => { el.textContent = formatTime(time); });
    remaining.forEach((el) => { el.textContent = `-${formatTime(duration - Math.floor(time))}`; });
    lines.forEach((line) => line.style.setProperty("--progress", progress));
    paintScore(time);
  }

  player.on("tick", ({ time }) => {
    if (!dragging) paintTime(time);
  });

  player.on("state", ({ playing }) => {
    if (playing) markStep("escuchado");   // paso 03 del recorrido (views/filotaxia)
    toggles.forEach((toggle) => {
      toggle.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
      toggle.querySelector("[data-icon-play]").hidden = playing;
      toggle.querySelector("[data-icon-pause]").hidden = !playing;
    });
    art.toggleAttribute("data-live", playing);
  });

  toggles.forEach((toggle) => toggle.addEventListener("click", () => player.toggle()));

  root.querySelectorAll("[data-skip]").forEach((button) => {
    button.addEventListener("click", () => player.skip(Number(button.dataset.skip)));
  });

  // Barra: mientras se arrastra solo se mueve el número; al soltar, salta
  range.addEventListener("input", () => {
    dragging = true;
    paintTime(Number(range.value));
  });
  range.addEventListener("change", () => {
    dragging = false;
    player.seek(Number(range.value));
  });

  bindView(root, terrario);
  bindScoreFull(root);
  bindPlants(root);   // el botón Ondas / Plantas del bloque de plantas
  const stopMini = bindMini(root);

  function onKey(event) {
    if (event.target.closest("input, textarea, select, dialog")) return;
    if (event.code === "Space" && !event.target.closest("button, a")) {
      event.preventDefault();
      player.toggle();
    } else if (event.key === "ArrowLeft") {
      player.skip(-SKIP);
    } else if (event.key === "ArrowRight") {
      player.skip(SKIP);
    }
  }
  document.addEventListener("keydown", onKey);

  paintTime(0);

  return () => {
    document.removeEventListener("keydown", onKey);
    stopMini();
    player.destroy();
  };
}

// "Cambiar a video" / "Cambiar a audio": cambia el fondo entre la foto y el
// video (data-mode en la pantalla; el CSS hace el fundido). El video recién
// se carga la primera vez que se pide, así no se baja si nadie lo mira.
function bindView(root, terrario) {
  const screen = root.querySelector("[data-player]");
  const button = root.querySelector("[data-view]");
  const box = root.querySelector("[data-video]");

  button.addEventListener("click", () => {
    const toVideo = screen.dataset.mode === "audio";
    if (toVideo && !box.firstChild) {
      box.innerHTML = terrario.video
        ? `<video src="${terrario.video}" muted loop playsinline autoplay></video>`
        : `<img src="${FALLBACK_VIDEO}" alt="" decoding="async" />`;
    }
    box.querySelector("video")?.[toVideo ? "play" : "pause"]();
    screen.dataset.mode = toVideo ? "video" : "audio";
    button.setAttribute("aria-pressed", String(toVideo));
    button.querySelector("[data-view-icon]").innerHTML = icon(toVideo ? "audio-lines" : "square-play");
    button.querySelector("[data-view-label]").textContent = toVideo ? "Cambiar a audio" : "Cambiar a video";
  });
}

// El botón de ampliar abre la partitura a pantalla completa (un <dialog>:
// se cierra con la X o con Escape)
function bindScoreFull(root) {
  const dialog = root.querySelector("[data-score-full]");
  root.querySelector("[data-score-open]").addEventListener("click", () => dialog.showModal());
  dialog.querySelector("[data-score-close]").addEventListener("click", () => dialog.close());
}

// La barra chica de arriba: aparece cuando los controles grandes salen de
// la pantalla por arriba (al bajar a los bloques) y se va al volver.
// Devuelve la función que la apaga al salir de la pantalla.
function bindMini(root) {
  const mini = root.querySelector("[data-mini]");
  const controls = root.querySelector("[data-controls]");
  const miniPlay = mini.querySelector("[data-toggle]");

  const observer = new IntersectionObserver(([entry]) => {
    const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    mini.classList.toggle("is-visible", show);
    mini.setAttribute("aria-hidden", String(!show));
    miniPlay.tabIndex = show ? 0 : -1;
  });
  observer.observe(controls);
  return () => observer.disconnect();
}

function empty() {
  return `
    <section class="screen player player--empty">
      <div class="player__info reveal-stagger">
        <p class="eyebrow">Escuchar</p>
        <h1 class="title" tabindex="-1">Todavía no hay nada para escuchar</h1>
        <p class="lead">Conectá tu terrario con el QR de su base para sumarlo a tus terrarios.</p>
      </div>
      <div class="screen__actions">
        <a class="btn btn--primary" href="#/escanear">${icon("scan-line")} Conectar mi terrario</a>
      </div>
    </section>
  `;
}
