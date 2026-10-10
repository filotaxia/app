/* ============================================
   Views — Ajustes
   ============================================ */

// Ajustes: una lista de filas:
// Mis terrarios · Apariencia (Auto / Claro / Oscuro, se aplica al instante)
// · Notificaciones (hoja con interruptor) · Ayuda (hoja).

import { get, set } from "../../store/store.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { segmented } from "../../components/segmented/segmented.js";
import { icon } from "../../utils/icons.js";
import { HOW_IT_WORKS, CARE_FAQ } from "../../content/ayuda.js";

const THEME_OPTIONS = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

export const title = "Ajustes";
export const subtitle = "Tu colección vive en este teléfono";
export const header = true;

export async function render(root) {
  const arrow = icon("arrow-right");
  const prefs = await get("prefs");

  root.innerHTML = `
    <nav class="list reveal" aria-label="Ajustes">
      <a class="list-row" href="#/coleccion">Mis terrarios ${arrow}</a>
      <div class="list-row">
        <span aria-hidden="true">Apariencia</span>
        ${segmented({ name: "theme", legend: "Apariencia", value: prefs.theme ?? "system", options: THEME_OPTIONS })}
      </div>
      <button class="list-row" type="button" data-notifications>Notificaciones ${arrow}</button>
      <button class="list-row" type="button" data-help>Ayuda ${arrow}</button>
    </nav>
  `;

  // main.js escucha "prefs" y aplica el tema apenas se guarda
  root.querySelector('[data-segmented="theme"]').addEventListener("change", async (event) => {
    await set("prefs", { ...(await get("prefs")), theme: event.target.value });
  });

  root.querySelector("[data-notifications]").addEventListener("click", openNotifications);
  root.querySelector("[data-help]").addEventListener("click", openHelp);
}

async function openNotifications() {
  const prefs = await get("prefs");
  const sheet = openSheet({
    title: "Notificaciones",
    body: `
      <label class="setting">
        <span class="setting__text">
          <span class="setting__title">Nuevos sonidos</span>
          <span class="lead">Te avisamos cuando uno de tus terrarios tenga una grabación nueva.</span>
        </span>
        <input class="switch" type="checkbox" role="switch" data-switch ${prefs.notifications ? "checked" : ""} />
      </label>
    `,
  });

  sheet.element.querySelector("[data-switch]").addEventListener("change", async (event) => {
    await set("prefs", { ...(await get("prefs")), notifications: event.target.checked });
  });
}

// Ayuda: "¿Cómo funciona?" en tres pasos y las preguntas frecuentes (content/ayuda.js)
function openHelp() {
  openSheet({
    title: "Ayuda",
    body: `
      <section class="help">
        <h3 class="eyebrow">¿Cómo funciona?</h3>
        <ol class="help__steps">
          ${HOW_IT_WORKS.map((step, i) => `
            <li class="help__step">
              <span class="help__index">${String(i + 1).padStart(2, "0")}/</span>
              <p class="lead">${step}</p>
            </li>`).join("")}
        </ol>
      </section>
      <section class="help">
        <h3 class="eyebrow">Preguntas frecuentes</h3>
        <dl class="help__faq">
          ${CARE_FAQ.map(([q, a]) => `<div class="help__item"><dt>${q}</dt><dd class="lead">${a}</dd></div>`).join("")}
        </dl>
      </section>
    `,
  });
}
