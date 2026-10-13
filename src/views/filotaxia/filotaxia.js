/* ============================================
   Views — Guía
   ============================================ */

// Guía (#/filotaxia, una sección de la barra): la experiencia paso a
// paso (referencia: una lista de tareas del día).
//
//   Tu recorrido   card con el porcentaje hecho, "3/5 completados" y un punto
//                  por paso, que se llenan de izquierda a derecha (3 hechos = 3 negros)
//   Los pasos      una fila por paso (content/ayuda.js → STEPS): chips
//                  ("✓ Hecho", "Paso 01"), título, una línea de texto y, a la
//                  derecha, un círculo "Ver" que abre la hoja del paso: su video
//                  tutorial, el texto completo y el botón para hacerlo.
//                  Hecho = círculo claro con ✓ (se puede volver a ver).
//
// Qué pasos están hechos lo sabe store/journey.js. Debajo, "Para saber más":
// de la planta a la música, las cuatro capas, las preguntas frecuentes y el
// Manifiesto (lo que antes era la hoja "Ayuda" de Ajustes).

import { STEPS, PROCESS, LAYERS, SOUND_FAQ, CARE_FAQ } from "../../content/ayuda.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { journey, markStep } from "../../store/journey.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { toast } from "../../components/toast/toast.js";
import { escapeHTML } from "../../utils/html.js";
import { icon, arrow } from "../../utils/icons.js";

export const title = "Guía";
export const subtitle = "La experiencia, paso a paso";
export const header = true;

// "01/", "02/"… como en filotaxia.com
const index = (i) => `<span class="help__index">${String(i + 1).padStart(2, "0")}/</span>`;
const pad = (i) => String(i + 1).padStart(2, "0");

export async function render(root) {
  const mine = await myTerrarioId();
  const done = await journey();
  const count = STEPS.filter((step) => done[step.key]).length;
  const percent = Math.round((count / STEPS.length) * 100);

  root.innerHTML = `
    <section class="journey reveal" aria-label="Tu recorrido">
      <p class="journey__label">Tu recorrido<br />en Filotaxia</p>
      <p class="journey__count">${count}/${STEPS.length} completados</p>
      <p class="journey__percent" aria-hidden="true">${percent}%</p>
      <ol class="journey__dots" aria-hidden="true">
        ${STEPS.map((_, i) => `<li class="journey__dot${i < count ? " is-done" : ""}"></li>`).join("")}
      </ol>
    </section>

    <ol class="steps reveal-stagger" aria-label="Paso a paso">
      ${STEPS.map((step, i) => stepRow(step, i, done[step.key])).join("")}
    </ol>

    <h2 class="help__heading reveal">Para saber más</h2>

    <section class="help reveal" aria-labelledby="help-process">
      <h3 class="eyebrow" id="help-process">De la planta a la música</h3>
      <ol class="help__steps">
        ${PROCESS.map(([name, text], i) => `
          <li class="help__step">
            ${index(i)}
            <div class="help__item">
              <h4 class="help__step-title">${name}</h4>
              <p class="lead">${text}</p>
            </div>
          </li>`).join("")}
      </ol>
    </section>

    <section class="help reveal" aria-labelledby="help-layers">
      <h3 class="eyebrow" id="help-layers">Las cuatro capas</h3>
      <dl class="help__faq">
        ${LAYERS.map(([name, material, text]) => `
          <div class="help__item">
            <dt>${name} <span class="help__material">${material}</span></dt>
            <dd class="lead">${text}</dd>
          </div>`).join("")}
      </dl>
    </section>

    <section class="help reveal" aria-labelledby="help-faq">
      <h3 class="eyebrow" id="help-faq">Preguntas frecuentes</h3>
      <dl class="help__faq">
        ${[...SOUND_FAQ, ...CARE_FAQ].map(([question, answer]) => `
          <div class="help__item">
            <dt>${question}</dt>
            <dd class="lead">${answer}</dd>
          </div>`).join("")}
      </dl>
      <a class="text-link help__more" href="#/manifiesto">Ver el Manifiesto ${arrow()}</a>
    </section>
  `;

  root.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => openStep(Number(button.dataset.step), mine, done));
  });
}

// Una fila: chips, título, una línea y el círculo "Ver" (o ✓ si ya está hecho)
function stepRow(step, i, isDone) {
  return `
    <li class="step${isDone ? " is-done" : ""}">
      <div class="step__body">
        <div class="step__chips">
          ${isDone ? `<span class="step__chip step__chip--done">${icon("check")} Hecho</span>` : ""}
          <span class="step__chip">Paso ${pad(i)}</span>
        </div>
        <h2 class="step__title">${escapeHTML(step.title)}</h2>
        <p class="step__short">${escapeHTML(step.short)}</p>
      </div>
      <button class="step__see" type="button" data-step="${i}" aria-label="Ver el paso ${pad(i)}: ${escapeHTML(step.title)}">
        ${isDone ? icon("check") : "Ver"}
      </button>
    </li>
  `;
}

// Lo que se hace en cada paso: [texto del botón, link] (sin terrario propio,
// los últimos llevan a donde se puede empezar)
function stepAction(key, mine) {
  switch (key) {
    case "escaneado": return ["Conectar mi terrario", "#/escanear"];
    case "escuchado": return mine ? ["Escuchar mi terrario", `#/escuchar/${mine}`] : ["Elegir un terrario", "#/coleccion"];
    case "cuidado": return ["Ver sus cuidados", "#/mi-terrario/cuidados"];
    case "anotado": return mine ? ["Abrir la bitácora", `#/bitacora/${mine}`] : ["Conectar mi terrario", "#/escanear"];
    default: return null;   // "ubicado": no hay pantalla, lo marca la persona
  }
}

// Hoja del paso: el video tutorial (o "Video en preparación"), el texto
// completo y el botón para hacerlo. El paso 01 no tiene pantalla: su botón
// lo marca como hecho.
function openStep(i, mine, done) {
  const step = STEPS[i];
  const action = stepAction(step.key, mine);
  const sheet = openSheet({
    title: `${pad(i)}/ ${step.title}`,
    body: `
      <div class="step-sheet">
        ${step.video
          ? `<video class="step-sheet__video" src="${step.video}" controls playsinline preload="metadata"></video>`
          : `<div class="step-sheet__video step-sheet__video--soon">
               ${icon("play")}
               <span>Video en preparación</span>
             </div>`}
        <p class="lead">${escapeHTML(step.text)}</p>
        ${action
          ? `<a class="btn btn--primary btn--block" href="${action[1]}" data-go>${action[0]}</a>`
          : done[step.key]
            ? `<p class="step-sheet__done">${icon("check")} Ya está hecho</p>`
            : `<button class="btn btn--primary btn--block" type="button" data-mark>Ya lo ubiqué</button>`}
      </div>
    `,
  });

  // Ir a otra pantalla: primero se cierra la hoja
  sheet.element.querySelector("[data-go]")?.addEventListener("click", () => sheet.close());

  sheet.element.querySelector("[data-mark]")?.addEventListener("click", async () => {
    await markStep(step.key);
    sheet.close();
    toast("Paso hecho");
    window.dispatchEvent(new Event("filotaxia:refresh"));
  });
}
