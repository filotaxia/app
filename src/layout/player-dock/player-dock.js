/* ============================================
   Layout — Player dock
   ============================================ */

// El reproductor chico de todo el sitio (components/now-playing), fijo sobre
// la barra de navegación. Vive fuera de las pantallas, así la pieza sigue
// sonando mientras se navega. Lo más importante es que se pueda escuchar.
//
//   await mountPlayerDock()   (main.js, después del catálogo y antes del router)
//
// En cada cambio de pantalla el router avisa con el evento "filotaxia:chrome"
// ({ nav, section }) y el dock decide:
//   - si la barra de navegación no está (el reproductor grande, el splash,
//     el Manifiesto del primer escaneo): se esconde y se pausa (el
//     reproductor grande tiene su propio audio)
//   - en Colección: arranca como barra
//   - en las demás: cerrado (la "mini", una franja fina a todo el ancho:
//     foto chica, nombre y play); tocándolo pasa a barra, y de nuevo a mini
//
// La cola: todos los terrarios (cualquiera se puede escuchar), el propio primero.

import { TERRARIOS } from "../../content/terrarios.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { linkedIds } from "../../store/collection.js";
import { subscribe } from "../../store/store.js";
import { nowPlaying, bindNowPlaying } from "../../components/now-playing/now-playing.js";

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

  const player = bindNowPlaying(dock, { queue, collapsible: true });

  // El primer escaneo elige "Mi terrario": pasa a ser el primero de la cola
  subscribe("my_terrario", async () => player.setQueue(await buildQueue()));

  window.addEventListener("filotaxia:chrome", ({ detail }) => {
    dock.hidden = !detail.nav;
    shell.toggleAttribute("data-dock", detail.nav);
    if (!detail.nav) player.pause();
    player.setCollapsible(detail.section !== "coleccion");
  });
}
