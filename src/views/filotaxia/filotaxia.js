/* ============================================
   Views — Guía
   ============================================ */

// Guía (#/filotaxia, una sección de la barra), de arriba hacia abajo:
//
//   Proceso        "1 proceso / 3 etapas", como en la página Música de
//                  filotaxia.com: frase grande, slider de fotos con una
//                  línea que se llena y las tres etapas (ver bindSlider
//                  más abajo). Vuelve acá, de primera: antes había pasado
//                  un tiempo en Formas (views/formas-ondas).
//   Filotaxia      la animación de los 3 pasos para conectar el terrario
//                  (components/connect-loop: el QR de su base → la cámara →
//                  su pieza), la misma que Mi terrario cuando no hay terrario,
//                  pero al revés del tema (negro en el claro), para que resalte.
//   Preguntas      como el "Section FAQ" de filotaxia.com: "(PMF)" + una
//                  frase grande y, a la derecha, "(Guía)" (faq-intro, acá
//                  abajo); después, hasta 5 preguntas (de sonido y de
//                  cuidados), que se abren con + (las mismas clases que
//                  Cuidados, cuidados.css).

import { SOUND_FAQ, CARE_FAQ, PROCESS, PROCESS_INTRO, PROCESS_PHOTOS } from "../../content/ayuda.js";
import { connectLoop } from "../../components/connect-loop/connect-loop.js";
import { escapeHTML } from "../../utils/html.js";

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

      <div class="process__stages" data-stages>
        ${PROCESS.map(([name, text], i) => `
          <div class="process__stage${i === 0 ? " is-active" : ""}" data-stage="${i}">
            <h3 class="process__stage-title">Etapa ${i + 1} / ${escapeHTML(name)}</h3>
            <p class="process__stage-text">${escapeHTML(text)}</p>
          </div>`).join("")}
      </div>
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

  bindSlider(root);
}

// El slider del proceso: se desliza con el dedo (scroll nativo) y la línea
// de abajo se llena a medida que avanza: arranca en 18% y llega al 100% al
// final, como en filotaxia.com. La etapa que se lee debajo sigue el mismo
// scroll: se reparten las fotos en PROCESS.length tercios iguales y, al
// cruzar a otro, esa etapa se enciende (fade con CSS, .is-active).
function bindSlider(root) {
  const track = root.querySelector("[data-process-track]");
  const bar = root.querySelector("[data-process-bar]");
  const stages = [...root.querySelectorAll("[data-stage]")];
  let current = 0;
  const paint = () => {
    const max = track.scrollWidth - track.clientWidth;
    const progress = max > 0 ? track.scrollLeft / max : 0;
    bar.style.transform = `scaleX(${0.18 + progress * 0.82})`;
    const index = Math.min(stages.length - 1, Math.floor(progress * stages.length));
    if (index !== current) {
      stages[current].classList.remove("is-active");
      stages[index].classList.add("is-active");
      current = index;
    }
  };
  track.addEventListener("scroll", paint, { passive: true });
  paint();
}
