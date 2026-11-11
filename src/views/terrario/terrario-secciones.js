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
//   Preguntas frecuentes las de cuidados, con el mismo estilo que Cuidados
//
// "Cómo funciona" (tres pasos, la foto cambia con GSAP al tocar uno) se movió
// a Guía, como primera sección (views/filotaxia/filotaxia.js): mismas clases
// .how, terrario.css.

import { FEATURES, CARE_FAQ } from "../../content/ayuda.js";
import { escapeHTML } from "../../utils/html.js";

// Título de sección, con el mismo tamaño que el título de las pantallas
// (header). Lo usa también "Especificaciones" (terrario.js).
export function heading(id, title) {
  return `<h2 class="terrario__title" id="${id}">${title}</h2>`;
}

export function sections() {
  return `
    ${features()}
    ${faq()}
  `;
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

// --- Preguntas frecuentes: las mismas clases que Cuidados (cuidados.css) ---

function faq() {
  return `
    <section class="faq reveal" aria-labelledby="faq-title">
      ${heading("faq-title", "Preguntas frecuentes")}
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
}
