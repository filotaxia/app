/* ============================================
   Views — Colección
   ============================================ */

// Colección (#/coleccion): todos los terrarios de
// Filotaxia, como la página "Terrarios" de filotaxia.com (los del catálogo de Supabase).
// No son terrarios propios (es una instalación: cualquiera escanea
// cualquiera, en el momento): tocar una tarjeta hace que ese terrario pase a
// ser "Mi terrario" (setMyTerrario, reemplaza al anterior) y abre esa
// pantalla (#/mi-terrario) — lo mismo que hace escanear su QR. Desde ahí, la
// card "Pieza" lleva a escucharlo.
// Un terrario retirado solo aparece si este teléfono ya lo tenía conectado.
//
// El encabezado es propio (header: false): "Colección" y cuántos hay;
// a la derecha, el interruptor galería / lista (dos íconos) y el punto de
// Ajustes. Debajo, la colección: en galería (grilla de fotos) o en lista
// (una fila por terrario, en orden (TR01, TR02…): fecha de grabación, foto,
// nombre, la duración de su pieza y, a la derecha, ›). En las dos vistas
// cada terrario muestra la duración de su pieza; el propio no se marca.
// La vista elegida se guarda en prefs.collection_view.
// El reproductor chico de abajo es de todo el sitio (layout/player-dock):
// acá se muestra abierto como barra; en las demás pantallas, cerrado.

import { TERRARIOS, codeOf } from "../../content/terrarios.js";
import { linkedIds } from "../../store/collection.js";
import { setMyTerrario } from "../../store/my-terrario.js";
import { get, set } from "../../store/store.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export const title = "Colección";

export async function render(root) {
  const linked = await linkedIds();
  let view = (await get("prefs")).collection_view ?? "gallery";

  const visible = TERRARIOS.filter((terrario) => terrario.status !== "retirado" || linked.includes(terrario.id));
  const labelOf = (terrario) => formatTime(terrario.duration);

  root.innerHTML = `
    <header class="collection-head">
      <div>
        <h1 class="collection-head__title" tabindex="-1">Colección</h1>
        <p class="collection-head__subtitle">${visible.length === 1 ? "1 terrario" : `${visible.length} terrarios`}</p>
      </div>
      <div class="collection-head__tools">
        <label class="view-toggle">
          <input type="checkbox" role="switch" data-view-toggle aria-label="Ver en lista" ${view === "list" ? "checked" : ""} />
          <span class="view-toggle__track" aria-hidden="true">
            <span class="view-toggle__thumb"></span>
            ${icon("layout-grid", "view-toggle__icon view-toggle__icon--grid")}
            ${icon("list", "view-toggle__icon view-toggle__icon--list")}
          </span>
        </label>
        ${settingsLink()}
      </div>
    </header>

    <ul data-collection></ul>
  `;

  const list = root.querySelector("[data-collection]");
  const paint = () => {
    list.className = view === "list" ? "collection-list reveal-stagger" : "collection reveal-stagger";
    list.innerHTML = view === "list"
      ? [...visible].sort((a, b) => a.id.localeCompare(b.id)).map((t) => row(t, labelOf(t))).join("")
      : visible.map((t) => tile(t)).join("");
  };
  paint();

  root.querySelector("[data-view-toggle]").addEventListener("change", async (event) => {
    view = event.target.checked ? "list" : "gallery";
    paint();
    await set("prefs", { ...(await get("prefs")), collection_view: view });
  });

  // Tocar una tarjeta: ese terrario pasa a ser "Mi terrario" (delegado en la
  // lista, no en cada tarjeta: paint() la vuelve a armar al cambiar de vista)
  list.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-terrario-id]");
    if (!card) return;
    event.preventDefault();
    await setMyTerrario(card.dataset.terrarioId);
    location.hash = "#/mi-terrario";
  });
}

// Cada tarjeta pasa el terrario a "Mi terrario" y abre esa pantalla (como
// escanear su QR); desde ahí, la card "Pieza" lleva a escucharlo. Solo el
// nombre acá (sin la duración: la lista sí la muestra, ver row())
function tile(terrario) {
  return `
    <li>
      <a class="collection__tile" href="#/mi-terrario" data-terrario-id="${terrario.id}">
        ${terrariumArt({ size: "sm", photo: terrario.photo })}
        <span class="collection__name">${escapeHTML(codeOf(terrario))}</span>
      </a>
    </li>
  `;
}

// Una fila de la lista: la foto, el nombre y la duración; a la derecha, ›
function row(terrario, label) {
  return `
    <li>
      <a class="collection-row" href="#/mi-terrario" data-terrario-id="${terrario.id}">
        <span class="collection-row__thumb">${terrariumArt({ size: "sm", photo: terrario.photo })}</span>
        <span class="collection-row__text">
          <span class="collection-row__name">${escapeHTML(codeOf(terrario))}</span>
          <span class="collection-row__status">${label}</span>
        </span>
        <span class="collection-row__end">${icon("chevron-right")}</span>
      </a>
    </li>
  `;
}
