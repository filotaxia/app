/* ============================================
   Views — Colección
   ============================================ */

// Mi Colección: grilla de todos los terrarios que se fueron escaneando
// (el último primero). Cada uno abre el reproductor; el propio dice "Tuyo".

import { getTerrario } from "../../content/terrarios.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { pluralTerrarios } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export const title = "Mi Colección";
export const subtitle = async () => pluralTerrarios((await linkedIds()).length);
export const header = true;

export async function render(root) {
  const terrarios = (await linkedIds()).map(getTerrario).filter(Boolean);

  if (!terrarios.length) {
    root.innerHTML = `
      <section class="collection-empty reveal">
        <div class="collection-empty__art">${terrariumArt({ size: "sm" })}</div>
        <p class="lead">Escaneá el QR que está en la base de tu terrario para sumarlo y escuchar su sonido.</p>
        <a class="btn btn--primary" href="#/escanear">${icon("scan-line")} Escanear QR</a>
      </section>
    `;
    return;
  }

  const mine = await myTerrarioId();
  root.innerHTML = `
    <ul class="collection reveal-stagger">
      ${terrarios.map((terrario) => tile(terrario, terrario.id === mine)).join("")}
    </ul>
  `;
}

function tile(terrario, isMine) {
  return `
    <li>
      <a class="collection__tile" href="#/escuchar/${terrario.id}">
        ${terrariumArt({ size: "sm", photo: terrario.photo })}
        <span class="collection__meta">
          <span class="collection__number">Nº ${escapeHTML(terrario.id)}${isMine ? " · Tuyo" : ""}</span>
          <span class="collection__name">${escapeHTML(terrario.name)}</span>
        </span>
      </a>
    </li>
  `;
}
