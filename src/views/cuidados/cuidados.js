/* ============================================
   Views — Cuidados
   ============================================ */

// Cuidados (#/mi-terrario/cuidados): se llega desde la card "Cuidados." de
// Mi terrario; la flecha vuelve ahí. La ruta empieza con "mi-terrario", así
// la barra sigue marcando esa sección.
//
//   Riego.         cuándo toca (cuenta desde el último riego registrado en
//                  care_log o, si no hay, desde el día del escaneo)
//   Guía           riego, luz y sustrato: igual para todos los terrarios
//   Preguntas      las preguntas frecuentes de cuidados de filotaxia.com
//
// Sin terrario propio todavía, solo se ven la guía y las preguntas.
// (Plantas está en Mi terrario.)

import { CARE_GUIDE, CARE_FAQ } from "../../content/ayuda.js";
import { getTerrario, codeOf } from "../../content/terrarios.js";
import { myTerrarioId, lastCare } from "../../store/my-terrario.js";
import { markStep } from "../../store/journey.js";
import { block } from "../../components/block/block.js";
import { nextCare, dueLabel } from "../../utils/care.js";
import { todayKey } from "../../utils/dates.js";
import { escapeHTML } from "../../utils/html.js";

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
    ${terrario ? await riegoBlock(terrario) : ""}

    <section class="guide reveal" aria-labelledby="guide-title">
      <h2 class="eyebrow" id="guide-title">Guía</h2>
      <ol class="guide__list">
        ${CARE_GUIDE.map(([topic, text], i) => `
          <li class="guide__item">
            <span class="guide__index">${String(i + 1).padStart(2, "0")}/</span>
            <div>
              <h3 class="guide__topic">${escapeHTML(topic)}</h3>
              <p class="lead">${escapeHTML(text)}</p>
            </div>
          </li>`).join("")}
      </ol>
    </section>

    <section class="faq reveal" aria-labelledby="faq-title">
      <h2 class="eyebrow" id="faq-title">Preguntas frecuentes</h2>
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

// Riego del terrario propio: cuándo toca
async function riegoBlock(terrario) {
  const { care } = terrario;
  const riego = nextCare({ last: await lastCare(terrario.id, "riego"), every: care.riego_days, today: todayKey() });
  return `
    <div class="blocks reveal">
      ${block({
        title: "Riego",
        badge: `Cada ${care.riego_days} días`,
        icon: "calendar",
        value: dueLabel(riego.daysLeft),
        full: true,
      })}
    </div>
  `;
}
