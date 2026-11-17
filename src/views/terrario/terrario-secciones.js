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
//   Preguntas frecuentes mismo layout "(PMF)" + frase grande que Cuidados y
//                        Guía (faq-intro, filotaxia.css), pero otras preguntas
//                        (MANIFESTO_FAQ, no CARE_FAQ): Cuidados ya cubre el
//                        cuidado, acá van las del Manifiesto de filotaxia.com
//                        (de qué va el proyecto), así no se repite el mismo
//                        texto en las dos pantallas. El chip de la derecha
//                        lleva el código del terrario en vez de "(Cuidados)"
//
// "Cómo funciona" (tres pasos, la foto cambia con GSAP al tocar uno) se movió
// a Guía, como primera sección (views/filotaxia/filotaxia.js): mismas clases
// .how, terrario.css.

import { FEATURES, MANIFESTO_FAQ } from "../../content/ayuda.js";
import { codeOf } from "../../content/terrarios.js";
import { escapeHTML } from "../../utils/html.js";

// Título de sección, con el mismo tamaño que el título de las pantallas
// (header). Lo usa también "Especificaciones" (terrario.js).
export function heading(id, title) {
  return `<h2 class="terrario__title" id="${id}">${title}</h2>`;
}

export function sections(terrario) {
  return `
    ${features(terrario)}
    ${faq(codeOf(terrario))}
  `;
}

// --- Características: el slider ---
// Si el terrario tiene su propia galería (admin, bloque Archivos), se
// muestran esas fotos en vez de las tres tarjetas genéricas de siempre.

function features(terrario) {
  const cards = terrario.gallery?.length
    ? terrario.gallery.map((image) => ({ image, title: "", text: "", alt: `Foto de ${codeOf(terrario)}` }))
    : FEATURES;
  return `
    <section class="features reveal" aria-labelledby="features-title">
      ${heading("features-title", "Características")}
      <ul class="features__track">
        ${cards.map(({ title, text, image, alt }) => `
          <li class="features__card">
            <img class="features__image" src="${image}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">
            ${title ? `<h3 class="features__title">${escapeHTML(title)}</h3>` : ""}
            ${text ? `<p class="lead">${escapeHTML(text)}</p>` : ""}
          </li>`).join("")}
      </ul>
    </section>
  `;
}

// --- Preguntas frecuentes: la misma intro "(PMF)" + frase grande que
// Cuidados y Guía (faq-intro, filotaxia.css), pero con las del Manifiesto
// (MANIFESTO_FAQ, de qué va el proyecto) en vez de las de cuidado, que ya
// están en Cuidados. El chip de la derecha lleva el código del terrario ---

function faq(code) {
  return `
    <section class="faq reveal" aria-labelledby="faq-title">
      <div class="faq-intro">
        <p class="faq-intro__text" id="faq-title">
          <span class="chip faq-intro__pmf">(PMF)</span>Los terrarios son una conexión entre arte, ciencia y naturaleza: las preguntas más frecuentes sobre el proyecto.
        </p>
        <p class="chip faq-intro__label" aria-hidden="true">(${escapeHTML(code)})</p>
      </div>
      <div>
        ${MANIFESTO_FAQ.map(([question, answer]) => `
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
