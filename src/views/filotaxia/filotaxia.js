/* ============================================
   Views — Guía
   ============================================ */

// Conectar (#/filotaxia, una sección de la barra), de arriba hacia abajo:
//
//   Cómo funciona  el mismo slider "Características" de la ficha (foto +
//                  título + texto, terrario.css), pero con los 3 pasos del
//                  dibujo de abajo (HOW_IT_WORKS, content/ayuda.js): el
//                  título de cada tarjeta es el de su paso en el dibujo
//                  (connect-loop.js, STEPS) para que se lean como el mismo
//                  recorrido, antes de verlo animado.
//   Filotaxia      la animación de los 3 pasos para conectar el terrario
//                  (components/connect-loop: el QR de su base → la cámara →
//                  su pieza), la misma que Mi terrario cuando no hay terrario,
//                  pero al revés del tema (negro en el claro), para que resalte.
//   Preguntas      como el "Section FAQ" de filotaxia.com: "(PMF)" + una
//                  frase grande y, a la derecha, "(Conectar)" (faq-intro, acá
//                  abajo); después, hasta 5 preguntas (de sonido y de
//                  cuidados), que se abren con + (las mismas clases que
//                  Cuidados, cuidados.css).

import { SOUND_FAQ, CARE_FAQ, HOW_IT_WORKS } from "../../content/ayuda.js";
import { connectLoop } from "../../components/connect-loop/connect-loop.js";
import { heading } from "../terrario/terrario-secciones.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Conectar";
export const subtitle = "De la planta a la música";
export const header = true;

// Los mismos 3 títulos que connect-loop.js (STEPS), pareados acá con la
// foto y el texto de HOW_IT_WORKS (mismo orden: ubicar, escanear, escuchar)
const HOW_TITLES = ["El QR de su base", "Conectalo con la cámara", "Escuchá su pieza"];

export function render(root) {
  root.innerHTML = `
    <section class="features reveal" aria-labelledby="how-title">
      ${heading("how-title", "Cómo funciona")}
      <ul class="features__track">
        ${HOW_IT_WORKS.map(({ image, alt, text }, i) => `
          <li class="features__card">
            <img class="features__image" src="${image}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">
            <h3 class="features__title">${escapeHTML(HOW_TITLES[i])}</h3>
            <p class="lead">${escapeHTML(text)}</p>
          </li>`).join("")}
      </ul>
    </section>

    <section class="journey reveal" aria-labelledby="journey-title">
      <h2 class="guide-title" id="journey-title">Filotaxia</h2>
      ${connectLoop({ inverse: true })}
    </section>

    <section class="faq guide-faq reveal" aria-labelledby="faq-title">
      <div class="faq-intro">
        <p class="faq-intro__text" id="faq-title">
          <span class="chip faq-intro__pmf">(PMF)</span>Las preguntas más frecuentes sobre el sonido de tu terrario y cómo cuidarlo.
        </p>
        <p class="chip faq-intro__label" aria-hidden="true">(Conectar)</p>
      </div>
      <div>
        ${[...SOUND_FAQ, ...CARE_FAQ].slice(0, 5).map(([question, answer]) => `
          <details class="faq__item">
            <summary class="faq__question">
              ${escapeHTML(question)}
              <span class="faq__toggle" aria-hidden="true"></span>
            </summary>
            <p class="faq__answer lead">${escapeHTML(answer)}</p>
          </details>`).join("")}
      </div>
    </section>
  `;
}
