/* ============================================
   Views — Colección
   ============================================ */

// Colección (#/coleccion): todos los terrarios de
// Filotaxia, como la página "Terrarios" de filotaxia.com (los del catálogo de Supabase).
// Cualquiera puede escuchar cualquiera: todos abren su reproductor. Escanear
// solo conecta el que tenés enfrente (el primero pasa a ser "Mi terrario").
// Un terrario retirado solo aparece si este teléfono ya lo tenía conectado.
//
// El encabezado es propio (header: false): "Colección" y cuántos hay;
// a la derecha, el interruptor galería / lista (dos íconos) y el punto de
// Ajustes. Debajo, la colección: en galería (grilla de fotos) o en lista
// (una fila por terrario, la más nueva arriba: fecha de grabación, foto,
// nombre, la duración de su pieza y, a la derecha, ›). En las dos vistas
// cada terrario muestra la duración de su pieza; el propio no se marca.
// La vista elegida se guarda en prefs.collection_view.
// El reproductor chico de abajo es de todo el sitio (layout/player-dock):
// acá se muestra abierto como barra; en las demás pantallas, cerrado.

import { TERRARIOS, codeOf } from "../../content/terrarios.js";
import { linkedIds } from "../../store/collection.js";
import { get, set } from "../../store/store.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { formatTime, monthDay } from "../../utils/format.js";
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
      ? [...visible].sort((a, b) => b.recorded.localeCompare(a.recorded)).map((t) => row(t, labelOf(t))).join("")
      : visible.map((t) => tile(t, labelOf(t))).join("");
  };
  paint();

  root.querySelector("[data-view-toggle]").addEventListener("change", async (event) => {
    view = event.target.checked ? "list" : "gallery";
    paint();
    await set("prefs", { ...(await get("prefs")), collection_view: view });
  });
}

// Cada tarjeta lleva a su reproductor
function tile(terrario, label) {
  return `
    <li>
      <a class="collection__tile" href="#/escuchar/${terrario.id}">
        ${terrariumArt({ size: "sm", photo: terrario.photo })}
        <span class="collection__meta">
          <span class="collection__status">${label}</span>
          <span class="collection__name">${escapeHTML(codeOf(terrario))}</span>
        </span>
      </a>
    </li>
  `;
}

// Una fila de la lista: la fecha en que empezó a sonar, la foto, el nombre
// y la duración; a la derecha, ›
function row(terrario, label) {
  const { month, day } = monthDay(terrario.recorded);
  return `
    <li>
      <a class="collection-row" href="#/escuchar/${terrario.id}">
        <span class="collection-row__date">
          <span class="collection-row__month">${month}</span>
          <span class="collection-row__day">${day}</span>
        </span>
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
