/* ============================================
   Views — Terrarios
   ============================================ */

// Terrarios (la ruta sigue siendo #/coleccion): todos los terrarios de
// Filotaxia, como la página "Terrarios" de filotaxia.com (TR01 a TR06).
// Cada uno abre su reproductor; el propio dice "Tuyo" y los que ya se
// escanearon en este teléfono, "Escaneado". El subtítulo cuenta los escaneados.

import { TERRARIOS, codeOf } from "../../content/terrarios.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { pluralTerrarios } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Terrarios";
export const subtitle = async () => pluralTerrarios((await linkedIds()).length);
export const header = true;

export async function render(root) {
  const mine = await myTerrarioId();
  const linked = await linkedIds();

  root.innerHTML = `
    <ul class="collection reveal-stagger">
      ${TERRARIOS.map((terrario) => tile(terrario, status(terrario.id, mine, linked))).join("")}
    </ul>
  `;
}

function status(id, mine, linked) {
  if (id === mine) return "Tuyo";
  return linked.includes(id) ? "Escaneado" : "";
}

function tile(terrario, label) {
  return `
    <li>
      <a class="collection__tile" href="#/escuchar/${terrario.id}">
        ${terrariumArt({ size: "sm", photo: terrario.photo })}
        <span class="collection__meta">
          <span class="collection__number">${escapeHTML(codeOf(terrario))}${label ? ` · ${label}` : ""}</span>
          <span class="collection__name">${escapeHTML(terrario.name)}</span>
        </span>
      </a>
    </li>
  `;
}
