/* ============================================
   Views — Cuidados
   ============================================ */

// Cuidados (#/mi-terrario/cuidados): se llega desde la card "Cuidados." de
// Mi terrario; la flecha vuelve ahí. La ruta empieza con "mi-terrario", así
// la barra sigue marcando esa sección.
//
//   Riego.         cuándo toca (cuenta desde el último riego registrado en
//                  care_log o, si no hay, desde el día del escaneo)
//   Guía           riego, luz y sustrato: igual para todos los terrarios, con
//                  el mismo diseño que "Cómo funciona" de la ficha (foto que
//                  cambia al tocar el paso, mismas clases .how, terrario.css)
//   Preguntas      las preguntas frecuentes de cuidados de filotaxia.com, con
//                  la misma intro "(PMF)" + frase grande que Guía (filotaxia.js)
//
// Sin terrario propio todavía, solo se ven la guía y las preguntas.
// (Plantas está en Mi terrario.)

import { CARE_GUIDE, CARE_FAQ } from "../../content/ayuda.js";
import { getTerrario, codeOf } from "../../content/terrarios.js";
import { myTerrarioId, lastCare } from "../../store/my-terrario.js";
import { markStep } from "../../store/journey.js";
import { nextCare, dueLabel } from "../../utils/care.js";
import { todayKey } from "../../utils/dates.js";
import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";

const GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";

export const title = "Cuidados";
export const subtitle = async () => {
  const terrario = getTerrario(await myTerrarioId());
  return terrario ? codeOf(terrario) : "Guía general";
};
export const header = true;
export const back = "#/mi-terrario";

export async function render(root) {
  const terrario = getTerrario(await myTerrarioId());
  markStep("cuidado");   // paso 04 del recorrido (views/filotaxia)

  root.innerHTML = `
    <section class="how reveal" aria-labelledby="guide-title">
      <h2 class="guide-title" id="guide-title">Cuatro fundamentos para cuidar el terrario.</h2>
      <div class="how__images">
        ${CARE_GUIDE.map(({ image, alt }, i) => `
          <img class="how__image${i === 0 ? " is-active" : ""}" src="${image}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">`).join("")}
      </div>
      <ol class="how__list">
        ${CARE_GUIDE.map(({ topic, text }, i) => `
          <li>
            <button class="how__step" type="button" aria-pressed="${i === 0}">
              <span class="how__number">${String(i + 1).padStart(2, "0")}/</span>
              <span class="how__text">(${escapeHTML(topic)}) ${escapeHTML(text)}</span>
              ${arrow()}
            </button>
          </li>`).join("")}
      </ol>
    </section>

    ${terrario ? await riegoBlock(terrario) : ""}

    <section class="faq care-faq reveal" aria-labelledby="faq-title">
      <div class="faq-intro">
        <p class="faq-intro__text" id="faq-title">
          <span class="chip faq-intro__pmf">(PMF)</span>Las preguntas más frecuentes sobre el cuidado de tu terrario.
        </p>
        <p class="chip faq-intro__label" aria-hidden="true">(Cuidados)</p>
      </div>
      <div>
        ${CARE_FAQ.map(([question, answer]) => `
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

  return bindGuide(root.querySelector(".how"));
}

// Igual que "Cómo funciona" (views/terrario/terrario-secciones.js): al tocar
// un paso, la foto de arriba cambia con la misma animación de GSAP (la de
// antes se apaga, la nueva entra bajando apenas). Sin red o con "reducir
// movimiento", cambia sin animación.
function bindGuide(section) {
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
      gsap.killTweensOf(images);
      gsap.to(from, { opacity: 0, duration: 0.4, ease: "power2.inOut" });
      gsap.fromTo(to, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
    });
  });

  return () => gsap?.killTweensOf(images);
}

// Riego del terrario propio: cuándo toca
// Una bolita por día del ciclo (5 por fila): las ya pasadas desde el último
// riego, rellenas; el resto, solo el borde — así se ve de un vistazo qué
// tan cerca está el día ideal de volver a regar (atrasado: quedan todas
// rellenas, dueLabel() lo dice abajo igual, "Hace N días").
async function riegoBlock(terrario) {
  const { care } = terrario;
  const riego = nextCare({ last: await lastCare(terrario.id, "riego"), every: care.riego_days, today: todayKey() });
  const done = Math.min(care.riego_days, Math.max(0, care.riego_days - riego.daysLeft));
  const dots = Array.from({ length: care.riego_days }, (_, i) =>
    `<span class="riego-grid__dot${i < done ? " is-done" : ""}"></span>`
  ).join("");
  return `
    <div class="blocks reveal">
      <article class="block block--full block--riego">
        <h2 class="block__title">Riego.</h2>
        <span class="block__badge">(Cada ${care.riego_days} días)</span>
        <div class="riego-grid" role="img" aria-label="${escapeHTML(dueLabel(riego.daysLeft))} para el próximo riego">${dots}</div>
        <p class="riego-grid__label">${escapeHTML(dueLabel(riego.daysLeft))}</p>
      </article>
    </div>
  `;
}
