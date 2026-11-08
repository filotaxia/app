/* ============================================
   Views — Guía
   ============================================ */

// Guía (#/filotaxia, una sección de la barra), de arriba hacia abajo:
//
//   Filotaxia      la animación de los 3 pasos para conectar el terrario
//                  (components/connect-loop: el QR de su base → la cámara →
//                  su pieza), la misma que Mi terrario cuando no hay terrario,
//                  pero al revés del tema (negro en el claro), para que resalte.
//   Preguntas      como el "Section FAQ" de filotaxia.com: "(PMF)" + una
//                  frase grande y, a la derecha, "(Guía)" (faq-intro, acá
//                  abajo); después, hasta 5 preguntas (de sonido y de
//                  cuidados), que se abren con + (las mismas clases que
//                  Cuidados, cuidados.css).
//
// El proceso ("1 proceso / 3 etapas") se mudó a la página Filotaxia
// (views/formas-ondas), como su primera sección.

import { SOUND_FAQ, CARE_FAQ } from "../../content/ayuda.js";
import { connectLoop } from "../../components/connect-loop/connect-loop.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Guía";
export const subtitle = "De la planta a la música";
export const header = true;

export function render(root) {
  root.innerHTML = `
    <section class="journey reveal" aria-labelledby="journey-title">
      <h2 class="guide-title" id="journey-title">Filotaxia</h2>
      ${connectLoop({ inverse: true })}
    </section>

    <section class="faq guide-faq reveal" aria-labelledby="faq-title">
      <div class="faq-intro">
        <p class="faq-intro__text" id="faq-title">
          <span class="chip faq-intro__pmf">(PMF)</span>Las preguntas más frecuentes sobre el sonido de tu terrario y cómo cuidarlo.
        </p>
        <p class="chip faq-intro__label" aria-hidden="true">(Guía)</p>
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
