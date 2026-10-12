/* ============================================
   Components — Leaf Waves
   ============================================ */

// Grilla 2×2 "forma de hoja → onda": Puntiaguda · Redondeada · Dentada · Recta,
// cada una con el ícono de su oscilador (los de filotaxia.com) y el nombre de la onda.
//
//   leafWaves()                           → las cuatro iguales, con la onda
//   leafWaves({ flip: true })             → tarjetas de dos caras que giran solas
//                                           (Manifiesto): al frente la hoja
//                                           ("hoja / Puntiaguda") y al dorso,
//                                           en negro, su onda ("onda / Triangular")
//   leafWaves({ active: ["puntiaguda"] }) → esas en negro sólido, el resto atenuado
//                                           (para la ficha de un terrario)
//
// Los textos van como en filotaxia.com/musica: una etiqueta chica en
// minúscula ("hoja", "onda") y debajo el nombre.

import { LEAVES, WAVE_NAMES } from "../../content/plantas.js";

const LEAF_DIR = "src/assets/images/hojas/";

export function leafWaves({ active = [], flip = false } = {}) {
  const classes = ["leaf-waves", active.length && "leaf-waves--highlight"];

  return `
    <ul class="${classes.filter(Boolean).join(" ")}">
      ${Object.entries(LEAVES)
        .map(([key, leaf], i) => (flip ? flipCard(key, leaf, i) : card(key, leaf, active.includes(key))))
        .join("")}
    </ul>
  `;
}

// Tarjeta simple: nombre de la hoja, su onda y el ícono
function card(key, leaf, isActive) {
  return `
    <li class="leaf-wave${isActive ? " is-active" : ""}">
      ${face({ caption: "hoja", name: leaf.label, art: waveIcon(leaf.wave) })}
      <span class="visually-hidden">: onda ${WAVE_NAMES[leaf.wave].toLowerCase()}</span>
      ${isActive ? `<span class="visually-hidden">(la de este terrario)</span>` : ""}
    </li>
  `;
}

// Tarjeta que gira: frente con la hoja, dorso con su onda. El lector de
// pantalla lee el frente, con la onda dicha en texto (el dorso es visual).
function flipCard(key, leaf, i) {
  return `
    <li class="leaf-wave leaf-wave--flip" style="--i: ${i}">
      <div class="leaf-wave__inner">
        <div class="leaf-wave__face">
          ${face({
            caption: "hoja",
            name: leaf.label,
            art: `<img class="leaf-wave__photo" src="${LEAF_DIR}${key}.webp" alt="" decoding="async" />`,
          })}
          <span class="visually-hidden">: onda ${WAVE_NAMES[leaf.wave].toLowerCase()}</span>
        </div>
        <div class="leaf-wave__face leaf-wave__face--back" aria-hidden="true">
          ${face({ caption: "onda", name: WAVE_NAMES[leaf.wave], art: waveIcon(leaf.wave) })}
        </div>
      </div>
    </li>
  `;
}

// Contenido de una cara: etiqueta chica y nombre arriba a la izquierda,
// dibujo centrado
function face({ caption, name, art }) {
  return `
    <span class="leaf-wave__label">
      <span class="leaf-wave__caption">${caption}</span>
      <span class="leaf-wave__name">${name}</span>
    </span>
    <span class="leaf-wave__art" aria-hidden="true">${art}</span>
  `;
}

function waveIcon(wave) {
  return `<span class="leaf-wave__icon leaf-wave__icon--${wave}"></span>`;
}
