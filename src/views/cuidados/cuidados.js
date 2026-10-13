/* ============================================
   Views — Cuidados
   ============================================ */

// Subpágina de Mi terrario (#/mi-terrario/cuidados): las preguntas
// frecuentes de cuidados de filotaxia.com, que se abren de a una.
// Se llega desde la card "Cuidados." de Mi terrario; la flecha vuelve ahí.
// La ruta empieza con "mi-terrario", así la barra sigue marcando esa sección.

import { CARE_FAQ } from "../../content/ayuda.js";
import { getTerrario } from "../../content/terrarios.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Cuidados";
export const subtitle = async () => getTerrario(await myTerrarioId())?.name ?? "";
export const header = true;
export const back = "#/mi-terrario";

export async function render(root) {
  root.innerHTML = `
    <section class="faq reveal" aria-label="Preguntas frecuentes">
      ${CARE_FAQ.map(([question, answer]) => `
        <details class="faq__item">
          <summary class="faq__question">${escapeHTML(question)}</summary>
          <p class="faq__answer lead">${escapeHTML(answer)}</p>
        </details>`).join("")}
    </section>
  `;
}
