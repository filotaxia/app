/* ============================================
   Views — Guía
   ============================================ */

// Guía (#/filotaxia, una sección de la barra), de arriba hacia abajo:
//
//   Proceso        "1 proceso / 3 etapas", como en la página Música de
//                  filotaxia.com: la frase grande, un slider de fotos que se
//                  desliza con el dedo (debajo, una línea fina que se llena a
//                  medida que avanza, como en la web) y las tres etapas
//                  ("Etapa 1 / Selección y armado del terrario" y su texto).
//                  Textos y fotos: PROCESS_INTRO / PROCESS_PHOTOS / PROCESS.
//   Filotaxia      la animación de los 3 pasos para conectar el terrario
//                  (components/connect-loop: el QR de su base → la cámara →
//                  su pieza), la misma que Mi terrario cuando no hay terrario,
//                  pero al revés del tema (negro en el claro), para que resalte.
//   Preguntas      las de sonido y las de cuidados, que se abren con + (las
//                  mismas clases que Cuidados, cuidados.css), y el Manifiesto.

import { PROCESS, PROCESS_INTRO, PROCESS_PHOTOS, SOUND_FAQ, CARE_FAQ } from "../../content/ayuda.js";
import { connectLoop } from "../../components/connect-loop/connect-loop.js";
import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";

export const title = "Guía";
export const subtitle = "De la planta a la música";
export const header = true;

export function render(root) {
  root.innerHTML = `
    <section class="process reveal" aria-labelledby="process-title">
      <h2 class="process__label" id="process-title">1 proceso / ${PROCESS.length} etapas</h2>
      <p class="process__intro">${escapeHTML(PROCESS_INTRO)}</p>

      <div class="process__slider">
        <ul class="process__track" data-process-track>
          ${PROCESS_PHOTOS.map(({ image, alt }) => `
            <li class="process__slide">
              <img class="process__photo" src="${image}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">
            </li>`).join("")}
        </ul>
        <div class="process__progress" aria-hidden="true"><span class="process__bar" data-process-bar></span></div>
      </div>

      <ol class="process__stages">
        ${PROCESS.map(([name, text], i) => `
          <li class="process__stage">
            <h3 class="process__stage-title">Etapa ${i + 1} / ${escapeHTML(name)}</h3>
            <p class="process__stage-text">${escapeHTML(text)}</p>
          </li>`).join("")}
      </ol>
    </section>

    <section class="journey reveal" aria-labelledby="journey-title">
      <h2 class="guide-title" id="journey-title">Filotaxia</h2>
      ${connectLoop({ inverse: true })}
    </section>

    <section class="faq guide-faq reveal" aria-labelledby="faq-title">
      <h2 class="guide-title" id="faq-title">Preguntas frecuentes</h2>
      <div>
        ${[...SOUND_FAQ, ...CARE_FAQ].map(([question, answer]) => `
          <details class="faq__item">
            <summary class="faq__question">${escapeHTML(question)}</summary>
            <p class="faq__answer lead">${escapeHTML(answer)}</p>
          </details>`).join("")}
      </div>
      <a class="text-link guide-faq__more" href="#/manifiesto">Ver el Manifiesto ${arrow()}</a>
    </section>
  `;

  bindSlider(root);
}

// El slider del proceso: se desliza con el dedo (scroll nativo) y la línea
// de abajo se llena a medida que avanza: arranca en 18% y llega al 100% al
// final, como en filotaxia.com
function bindSlider(root) {
  const track = root.querySelector("[data-process-track]");
  const bar = root.querySelector("[data-process-bar]");
  const paint = () => {
    const max = track.scrollWidth - track.clientWidth;
    const progress = max > 0 ? track.scrollLeft / max : 0;
    bar.style.transform = `scaleX(${0.18 + progress * 0.82})`;
  };
  track.addEventListener("scroll", paint, { passive: true });
  paint();
}
