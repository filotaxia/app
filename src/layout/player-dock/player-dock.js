/* ============================================
   Layout — Player dock
   ============================================ */

// El reproductor chico de todo el sitio (components/now-playing). Vive fuera
// de las pantallas, así la pieza sigue sonando mientras se navega. Lo más
// importante es que se pueda escuchar. El ícono del bottom-nav (index.html,
// data-nav-player) lo muestra u oculta — no es un link, no navega.
//
//   await mountPlayerDock()   (main.js, después del catálogo y antes del router)
//
// Igual en todas las pantallas (Colección incluida): el ícono abre y cierra
// la píldora del propio bottom-nav (index.html, data-nav-pill): el nav se
// estira a la derecha y aparece la foto del terrario que suena con el
// play/pause encima, como un ícono más (sin ⏮ ⏭ ni la línea: para eso está
// el reproductor grande, #/escuchar). Tocar la foto (afuera del play) lleva ahí.
//
// En cada cambio de pantalla el router avisa con el evento "filotaxia:chrome"
// ({ nav, section }) y el dock decide: si la barra de navegación no está (el
// reproductor grande, el splash, el Manifiesto del primer escaneo) se
// esconde todo y se pausa (el reproductor grande tiene su propio audio).
//
// La cola: todos los terrarios (cualquiera se puede escuchar), el propio primero.

import { TERRARIOS } from "../../content/terrarios.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { linkedIds } from "../../store/collection.js";
import { subscribe } from "../../store/store.js";
import { nowPlaying, bindNowPlaying } from "../../components/now-playing/now-playing.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { icon } from "../../utils/icons.js";

async function buildQueue() {
  const mine = await myTerrarioId();
  const linked = await linkedIds();
  const visible = TERRARIOS.filter((terrario) => terrario.status !== "retirado" || linked.includes(terrario.id));
  const own = visible.find((terrario) => terrario.id === mine);
  return own ? [own, ...visible.filter((terrario) => terrario !== own)] : visible;
}

export async function mountPlayerDock() {
  const queue = await buildQueue();
  if (!queue.length) return;

  const shell = document.querySelector("[data-app-shell]");
  const dock = document.createElement("div");
  dock.className = "player-dock";
  dock.hidden = true;
  dock.innerHTML = nowPlaying(queue[0]);
  shell.append(dock);

  const navPlayer = document.querySelector("[data-nav-player]");
  const pill = document.querySelector("[data-nav-pill]");
  const pillTap = pill.querySelector("[data-pill-tap]");
  const pillArt = pill.querySelector("[data-pill-art]");
  const pillPlay = pill.querySelector("[data-pill-play]");

  function paintPill(terrario) {
    pillTap.href = `#/escuchar/${terrario.id}`;
    pillArt.innerHTML = terrariumArt({ size: "sm", photo: terrario.photo });
  }

  function paintPillPlay(playing) {
    pillPlay.innerHTML = icon(playing ? "pause" : "play");
    pillPlay.setAttribute("aria-pressed", String(playing));
    pillPlay.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
  }

  paintPill(queue[0]);
  paintPillPlay(false);

  const player = bindNowPlaying(dock, {
    queue,
    collapsible: true,
    // Mientras suena, el ícono del nav (el ecualizador) se anima solo (bottom-nav.css)
    onPlaying: (playing) => {
      navPlayer.classList.toggle("is-playing", playing);
      paintPillPlay(playing);
    },
    onTrack: paintPill,
  });

  const setPillOpen = (open) => pill.classList.toggle("is-open", open);

  navPlayer.addEventListener("click", () => setPillOpen(!pill.classList.contains("is-open")));

  pillPlay.addEventListener("click", () => player.togglePlay());

  // El primer escaneo elige "Mi terrario": pasa a ser el primero de la cola
  subscribe("my_terrario", async () => player.setQueue(await buildQueue()));

  window.addEventListener("filotaxia:chrome", ({ detail }) => {
    dock.hidden = !detail.nav;
    if (!detail.nav) player.pause();
  });
}
