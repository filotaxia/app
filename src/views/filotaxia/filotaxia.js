/* ============================================
   Views — Guía
   ============================================ */

// Guía (#/filotaxia, una sección de la barra), de arriba hacia abajo:
//
//   Cómo funciona  tres pasos 01/ 02/ 03/; al tocar uno, la foto de arriba
//                  cambia con una animación de GSAP (la misma de la ficha,
//                  de donde se movió: mismas clases .how, terrario.css). GSAP
//                  se baja del CDN solo al entrar acá; si no llega (sin red) o
//                  el teléfono pide menos movimiento, la foto cambia sin animación.
//   Filotaxia      la animación de los 3 pasos para conectar el terrario
//                  (components/connect-loop: el QR de su base → la cámara →
//                  su pieza), la misma que Mi terrario cuando no hay terrario,
//                  pero al revés del tema (negro en el claro), para que resalte.
//   Proceso        "1 proceso / 3 etapas", como en la página Música de
//                  filotaxia.com: frase grande, slider de fotos con una
//                  línea que se llena y las tres etapas (ver bindSlider
//                  más abajo).
//   Preguntas      como el "Section FAQ" de filotaxia.com: "(PMF)" + una
//                  frase grande y, a la derecha, "(Guía)" (faq-intro, acá
//                  abajo); después, hasta 5 preguntas (de sonido y de
//                  cuidados), que se abren con + (las mismas clases que
//                  Cuidados, cuidados.css).

import { SOUND_FAQ, CARE_FAQ, HOW_IT_WORKS, PROCESS, PROCESS_INTRO, PROCESS_PHOTOS } from "../../content/ayuda.js";
import { connectLoop } from "../../components/connect-loop/connect-loop.js";
import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";

const GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";

export const title = "Guía";
export const subtitle = "De la planta a la música";
export const header = true;

export function render(root) {
  root.innerHTML = `
    <section class="how reveal" aria-labelledby="how-title">
      <h2 class="terrario__title" id="how-title">Cómo funciona</h2>
      <div class="how__images">
        ${HOW_IT_WORKS.map(({ image, alt }, i) => `
          <img class="how__image${i === 0 ? " is-active" : ""}" src="${image}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">`).join("")}
      </div>
      <ol class="how__list">
        ${HOW_IT_WORKS.map(({ text }, i) => `
          <li>
            <button class="how__step" type="button" aria-pressed="${i === 0}">
              <span class="how__number">${String(i + 1).padStart(2, "0")}/</span>
              <span class="how__text">${escapeHTML(text)}</span>
              ${arrow()}
            </button>
          </li>`).join("")}
      </ol>
    </section>

    <section class="journey reveal" aria-labelledby="journey-title">
      <h2 class="guide-title" id="journey-title">Filotaxia</h2>
      ${connectLoop({ inverse: true })}
    </section>

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
  return bindHowItWorks(root.querySelector(".how"));
}

// --- Cómo funciona: la foto cambia al tocar un paso (de la ficha) ---
function bindHowItWorks(section) {
  const images = [...section.querySelectorAll(".how__image")];
  const steps = [...section.querySelectorAll(".how__step")];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active = 0;
  let gsap = null;

  if (!calm) {
    import(GSAP_URL)
      .then((module) => { gsap = module.gsap; })
      .catch(() => {});   // sin red: cambia sin animación
  }

  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      if (index === active) return;
      const from = images[active];
      const to = images[index];
      steps[active].setAttribute("aria-pressed", "false");
      step.setAttribute("aria-pressed", "true");
      active = index;

      from.classList.remove("is-active");
      to.classList.add("is-active");

      if (!gsap) return;
      // La de antes se apaga; la nueva aparece bajando 24px, encima
      gsap.killTweensOf(images);
      gsap.to(from, { opacity: 0, duration: 0.4, ease: "power2.inOut" });
      gsap.fromTo(to, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
    });
  });

  return () => gsap?.killTweensOf(images);
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
