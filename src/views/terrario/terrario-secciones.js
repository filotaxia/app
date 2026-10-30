/* ============================================
   Views — Terrario (secciones)
   ============================================ */

// Las secciones de abajo de la ficha, de la página de cada terrario en
// filotaxia.com (content/ayuda.js):
//
//   Características      slider de tres tarjetas (foto, título y texto):
//                        Recipiente resistente · QR integrado · Composición
//                        única. Se desliza con el dedo (scroll-snap); la
//                        siguiente tarjeta asoma a la derecha
//   Cómo funciona        tres pasos 01/ 02/ 03/; al tocar uno, la foto de
//                        arriba cambia con una animación de GSAP (la misma
//                        de la web: la de antes se apaga, la nueva entra
//                        bajando apenas)
//   Preguntas frecuentes las de cuidados, con el mismo estilo que Cuidados
//
// GSAP se baja del CDN solo al entrar a la ficha. Si no llega (sin red) o el
// teléfono pide menos movimiento, la foto cambia sin animación.

import { FEATURES, HOW_IT_WORKS, CARE_FAQ } from "../../content/ayuda.js";
import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";

const GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";

// Título de sección, con el mismo tamaño que el título de las pantallas
// (header). Lo usa también "Especificaciones" (terrario.js).
export function heading(id, title) {
  return `<h2 class="terrario__title" id="${id}">${title}</h2>`;
}

export function sections() {
  return `
    ${features()}
    ${howItWorks()}
    ${faq()}
  `;
}

// Engancha "Cómo funciona". Devuelve la limpieza (al salir).
export function bindSections(root) {
  return bindHowItWorks(root.querySelector(".how"));
}

// --- Características: el slider ---

function features() {
  return `
    <section class="features reveal" aria-labelledby="features-title">
      ${heading("features-title", "Características")}
      <ul class="features__track">
        ${FEATURES.map(({ title, text, image, alt }) => `
          <li class="features__card">
            <img class="features__image" src="${image}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">
            <h3 class="features__title">${escapeHTML(title)}</h3>
            <p class="lead">${escapeHTML(text)}</p>
          </li>`).join("")}
      </ul>
    </section>
  `;
}

// --- Cómo funciona: la foto cambia al tocar un paso ---

function howItWorks() {
  return `
    <section class="how reveal" aria-labelledby="how-title">
      ${heading("how-title", "Cómo funciona")}
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
  `;
}

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

// --- Preguntas frecuentes: las mismas clases que Cuidados (cuidados.css) ---

function faq() {
  return `
    <section class="faq reveal" aria-labelledby="faq-title">
      ${heading("faq-title", "Preguntas frecuentes")}
      <div>
        ${CARE_FAQ.map(([question, answer]) => `
          <details class="faq__item">
            <summary class="faq__question">${escapeHTML(question)}</summary>
            <p class="faq__answer lead">${escapeHTML(answer)}</p>
          </details>`).join("")}
      </div>
    </section>
  `;
}
