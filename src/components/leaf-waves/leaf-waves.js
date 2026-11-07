/* ============================================
   Components — Leaf Waves
   ============================================ */

// Grilla 2×2 "forma de hoja → onda": Puntiaguda · Redondeada · Dentada · Recta,
// cada una con el ícono de su oscilador (los de filotaxia.com) y el nombre de la onda.
//
//   leafWaves()                           → las cuatro iguales, con la onda
//   leafWaves({ flip: true })             → tarjetas de dos caras (Manifiesto): primero
//                                           la hoja ("hoja / Puntiaguda") y, al girar,
//                                           su onda en negro ("onda / Triangular").
//                                           Los dos puntos para elegir la vista (hojas ·
//                                           ondas) van aparte: leafWaveDots() — en el
//                                           Manifiesto se ponen entre las flechas de
//                                           abajo, no accá arriba. Conectarlos con
//                                           bindLeafWaves(root) después de insertar los dos HTML.
//   leafWaves({ active: ["puntiaguda"] }) → esas en negro sólido, el resto atenuado
//                                           (para la ficha de un terrario)
//
// Los textos van como en filotaxia.com/musica: una etiqueta chica en
// minúscula ("hoja", "onda") y debajo el nombre.

import { LEAVES, WAVE_NAMES } from "../../content/plantas.js";

const LEAF_DIR = "src/assets/images/hojas/";

export function leafWaves({ active = [], flip = false } = {}) {
  const classes = ["leaf-waves", active.length && "leaf-waves--highlight"];
  const grid = `
    <ul class="${classes.filter(Boolean).join(" ")}">
      ${Object.entries(LEAVES)
        .map(([key, leaf], i) => (flip ? flipCard(key, leaf, i) : card(key, leaf, active.includes(key))))
        .join("")}
    </ul>
  `;
  if (!flip) return grid;

  // data-face dice qué cara se ve: "hoja" (al principio) u "onda"
  return `
    <div class="leaf-waves-flip" data-leaf-waves data-face="hoja">
      ${grid}
    </div>
  `;
}

// Los dos puntos que eligen la vista (hojas · ondas) de leafWaves({ flip: true }).
// Van aparte porque en el Manifiesto no quedan sobre la tarjeta: se ponen en
// el medio de las flechas de abajo (manifiesto__nav).
export function leafWaveDots() {
  return `
    <div class="leaf-waves__dots" role="group" aria-label="Vista">
      <button class="leaf-waves__dot" type="button" data-face-to="hoja" aria-pressed="true" aria-label="Ver las hojas"></button>
      <button class="leaf-waves__dot" type="button" data-face-to="onda" aria-pressed="false" aria-label="Ver las ondas"></button>
    </div>
  `;
}

// Conecta los dos puntos (estén donde estén dentro de `root`) con la tarjeta.
// Devuelve:
//   play(ms)  después de ms (3 s por defecto) pasa solo de las hojas a sus
//             ondas, una vez; no hace nada si la persona ya tocó un punto
//   stop()    cancela el cambio pendiente (al salir de la pantalla)
export function bindLeafWaves(root) {
  const box = root.querySelector("[data-leaf-waves]");
  const dots = [...root.querySelectorAll("[data-face-to]")];
  if (!box || !dots.length) return { play() {}, stop() {} };
  let touched = false;
  let timer = 0;

  function show(face) {
    box.dataset.face = face;
    dots.forEach((dot) => dot.setAttribute("aria-pressed", String(dot.dataset.faceTo === face)));
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", (event) => {
      event.stopPropagation();
      touched = true;
      clearTimeout(timer);
      show(dot.dataset.faceTo);
    });
  });

  return {
    play(ms = 3000) {
      if (touched || timer) return;
      timer = setTimeout(() => !touched && show("onda"), ms);
    },
    stop() {
      clearTimeout(timer);
    },
  };
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

// Tarjeta que gira: al frente la hoja (tarjeta clara), al dorso su onda (en
// negro). Las dos caras son visuales; el lector de pantalla lee el texto
// escondido, que dice las dos cosas ("Hoja puntiaguda: onda triangular").
function flipCard(key, leaf, i) {
  return `
    <li class="leaf-wave leaf-wave--flip" style="--i: ${i}">
      <span class="visually-hidden">Hoja ${leaf.label.toLowerCase()}: onda ${WAVE_NAMES[leaf.wave].toLowerCase()}</span>
      <div class="leaf-wave__inner" aria-hidden="true">
        <div class="leaf-wave__face">
          ${face({
            caption: "hoja",
            name: leaf.label,
            art: `<img class="leaf-wave__photo" src="${LEAF_DIR}${key}.webp" alt="" decoding="async" />`,
          })}
        </div>
        <div class="leaf-wave__face leaf-wave__face--onda leaf-wave__face--back">
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
