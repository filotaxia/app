/* ============================================
   Views — Escuchar
   ============================================ */

// Reproductor de un terrario: ilustración (el brote "respira" mientras suena),
// número, nombre, fecha de grabación y duración, las ondas con las que suena,
// barra de progreso y controles: −15 s · play/pausa · +15 s.
//
// Se llega desde Mi terrario (bloque Pieza o "Escuchar"), Colección, la ficha o
// el final del Manifiesto. "← Mi terrario" / "← Colección" vuelve a
// donde se estaba; Ajustes queda arriba a la derecha.
// #/escuchar sin id abre el terrario propio o, si no hay, el primero de la colección.
//
// Teclado: espacio = play/pausa · ← / → = −15 / +15 s (fuera de la barra).

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { WAVE_NAMES } from "../../content/plantas.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { markStep } from "../../store/journey.js";
import { createPlayer } from "../../audio/player.js";
import { seedFrom } from "../../audio/score.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { formatDate, formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon, arrow } from "../../utils/icons.js";

export const title = ({ params }) => {
  const terrario = getTerrario(params.id);
  return terrario ? codeOf(terrario) : "Escuchar";
};

const SKIP = 15;

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

  root.innerHTML = `
    <section class="screen player">
      <div class="player__top">
        <a class="back-link" href="${back.href}">${arrow("left")} ${back.label}</a>
        ${settingsLink()}
      </div>

      <div class="player__body">
        <div class="player__art reveal" data-art>${terrariumArt({ photo: terrario.photo })}</div>

        <div class="player__info reveal-stagger">
          <p class="eyebrow">Terrario</p>
          <h1 class="player__name" tabindex="-1">${escapeHTML(codeOf(terrario))}</h1>
          <p class="lead">Grabado el ${formatDate(terrario.recorded)} · ${formatTime(terrario.duration)}</p>
          ${waves(terrario.waves ?? ["sine"])}
        </div>

        <div class="player__progress reveal">
          <input class="player__range" type="range" min="0" max="${terrario.duration}" step="1" value="0"
            aria-label="Posición" aria-valuetext="0:00 de ${formatTime(terrario.duration)}" data-range />
          <div class="player__times" aria-hidden="true">
            <span data-elapsed>0:00</span>
            <span data-remaining>-${formatTime(terrario.duration)}</span>
          </div>
        </div>

        <div class="player__controls reveal">
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
  `;

  return mountPlayer(root, terrario);
}

// La flecha de arriba vuelve a donde estaba la persona (Mi terrario o
// Colección); si llegó de otro lado (la ficha, el Manifiesto), a la sección
// que le corresponde a este terrario.
function backTo(from = "", isMine) {
  if (from.startsWith("mi-terrario")) return { href: "#/mi-terrario", label: "Mi terrario" };
  if (from === "coleccion") return { href: "#/coleccion", label: "Colección" };
  return isMine ? { href: "#/mi-terrario", label: "Mi terrario" } : { href: "#/coleccion", label: "Colección" };
}

// Las ondas de la pieza (la forma de las hojas de sus plantas): ícono + nombre
function waves(list) {
  return `
    <ul class="player__waves" aria-label="Ondas">
      ${list.map((wave) => `<li class="chip">${icon(`wave-${wave}`)} ${WAVE_NAMES[wave] ?? wave}</li>`).join("")}
    </ul>
  `;
}

function mountPlayer(root, terrario) {
  const player = createPlayer({ seed: seedFrom(terrario.id), duration: terrario.duration, waves: terrario.waves });
  const range = root.querySelector("[data-range]");
  const elapsed = root.querySelector("[data-elapsed]");
  const remaining = root.querySelector("[data-remaining]");
  const toggle = root.querySelector("[data-toggle]");
  const art = root.querySelector("[data-art] .terrarium-art");
  let dragging = false;

  function paintTime(time) {
    const { duration } = player;
    range.value = Math.floor(time);
    range.style.setProperty("--progress", `${(time / duration) * 100}%`);
    range.setAttribute("aria-valuetext", `${formatTime(time)} de ${formatTime(duration)}`);
    elapsed.textContent = formatTime(time);
    remaining.textContent = `-${formatTime(duration - Math.floor(time))}`;
  }

  player.on("tick", ({ time }) => {
    if (!dragging) paintTime(time);
  });

  player.on("state", ({ playing }) => {
    if (playing) markStep("escuchado");   // paso 03 del recorrido (views/filotaxia)
    toggle.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    root.querySelector("[data-icon-play]").hidden = playing;
    root.querySelector("[data-icon-pause]").hidden = !playing;
    art.toggleAttribute("data-live", playing);
  });

  toggle.addEventListener("click", () => player.toggle());

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
    player.destroy();
  };
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
