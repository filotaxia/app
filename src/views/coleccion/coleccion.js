/* ============================================
   Views — Colección
   ============================================ */

// Colección (#/coleccion): todos los terrarios de
// Filotaxia, como la página "Terrarios" de filotaxia.com (TR01 a TR06).
// Solo están habilitados los que se conectaron (escanearon) en este
// teléfono: abren su reproductor y dicen "Conectado". Los demás se ven atenuados, dicen "Sin conectar"
// y no se pueden abrir: para escucharlos hay que escanear su QR.
// El subtítulo cuenta los conectados.

import { TERRARIOS, codeOf } from "../../content/terrarios.js";
import { linkedIds } from "../../store/collection.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { pluralTerrarios } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Colección";
export const subtitle = async () => pluralTerrarios((await linkedIds()).length);
export const header = true;

export async function render(root) {
  const linked = await linkedIds();

  root.innerHTML = `
    <ul class="collection reveal-stagger">
      ${TERRARIOS.map((terrario) => tile(terrario, status(terrario.id, linked))).join("")}
    </ul>
  `;
}

function status(id, linked) {
  return linked.includes(id) ? "Conectado" : "Sin conectar";
}

// Conectado → link a su reproductor. Sin conectar → el mismo contenido en
// un <div> (no se puede tocar ni enfocar), atenuado por CSS.
function tile(terrario, label) {
  const content = `
    ${terrariumArt({ size: "sm", photo: terrario.photo })}
    <span class="collection__meta">
      <span class="collection__status">${label}</span>
      <span class="collection__name">${escapeHTML(codeOf(terrario))}</span>
    </span>
  `;
  const locked = label === "Sin conectar";

  return `
    <li>
      ${locked
        ? `<div class="collection__tile collection__tile--locked">${content}</div>`
        : `<a class="collection__tile" href="#/escuchar/${terrario.id}">${content}</a>`}
    </li>
  `;
}
