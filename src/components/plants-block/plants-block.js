/* ============================================
   Components — Plants block
   ============================================ */

// Plantas del terrario, una por fila: foto, nombre y la forma de su hoja.
// El botón "Ondas" cambia la vista: el título pasa a "Ondas.", el botón a
// "Plantas" (para volver) y, en lugar de la foto y la hoja, cada fila muestra
// el dibujo de la onda con la que suena (según la forma de su hoja,
// content/plantas.js). Las dos versiones ya están en el HTML; el CSS muestra
// una u otra según data-view (ver bindPlants).
//
//   plantsBlock(terrario)   → "" si el terrario no tiene plantas cargadas
//   bindPlants(root)        → conecta el botón (después de insertar el HTML)

import { getPlanta, WAVE_NAMES } from "../../content/plantas.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export function plantsBlock(terrario) {
  if (!terrario.plants?.length) return "";
  const plantas = terrario.plants.map(getPlanta);
  const hasWaves = plantas.some((planta) => planta.wave);
  return `
    <article class="block block--full block--list" data-plants data-view="plantas">
      <h2 class="block__title" data-plants-title>Plantas.</h2>
      ${hasWaves
        ? `<button class="block__badge block__toggle" type="button" aria-label="Ver ondas" data-plants-toggle>Ondas</button>`
        : ""}
      <ol class="block__list">
        ${plantas.map(plantRow).join("")}
      </ol>
    </article>
  `;
}

function plantRow(planta, i) {
  return `
    <li class="plant">
      <span class="block__list-index">${String(i + 1).padStart(2, "0")}/</span>
      ${planta.photo ? `<img class="plant__photo" src="${planta.photo}" alt="" loading="lazy" decoding="async" />` : ""}
      ${planta.wave ? `<span class="plant__photo plant__wave-art" aria-hidden="true">${icon(`wave-${planta.wave}`)}</span>` : ""}
      <span class="plant__text">
        <span class="plant__name">${escapeHTML(planta.name)}</span>
        ${planta.wave
          ? `<span class="plant__detail plant__detail--leaf">Hoja ${planta.leafLabel.toLowerCase()}</span>
             <span class="plant__detail plant__detail--wave">Onda ${WAVE_NAMES[planta.wave].toLowerCase()}</span>`
          : ""}
      </span>
    </li>
  `;
}

// El botón dice a qué vista lleva ("Ondas" o "Plantas")
export function bindPlants(root) {
  const block = root.querySelector("[data-plants]");
  const toggle = root.querySelector("[data-plants-toggle]");
  if (!block || !toggle) return;
  const title = block.querySelector("[data-plants-title]");

  toggle.addEventListener("click", () => {
    const waves = block.dataset.view !== "ondas";
    block.dataset.view = waves ? "ondas" : "plantas";
    title.textContent = waves ? "Ondas." : "Plantas.";
    toggle.textContent = waves ? "Plantas" : "Ondas";
    toggle.setAttribute("aria-label", waves ? "Ver plantas" : "Ver ondas");
  });
}
