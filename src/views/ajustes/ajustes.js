/* ============================================
   Views — Ajustes
   ============================================ */

// Ajustes: una lista de filas:
// Mis terrarios · Apariencia (Auto / Claro / Oscuro, se aplica al instante)
// · Notificaciones (hoja con interruptor) · Ayuda (hoja) · Ver el Manifiesto
// (la introducción del primer escaneo, otra vez) · Contacto (hoja).

import { get, set } from "../../store/store.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { segmented } from "../../components/segmented/segmented.js";
import { arrow } from "../../utils/icons.js";
import { HOW_IT_WORKS, CARE_FAQ, PROCESS, LAYERS, SOUND_FAQ, CONTACT } from "../../content/ayuda.js";

const THEME_OPTIONS = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

export const title = "Ajustes";
export const subtitle = "Tu colección vive en este teléfono";
export const header = true;

export async function render(root) {
  const next = arrow();
  const prefs = await get("prefs");

  root.innerHTML = `
    <nav class="list reveal" aria-label="Ajustes">
      <a class="list-row" href="#/coleccion">Mis terrarios ${next}</a>
      <div class="list-row">
        <span aria-hidden="true">Apariencia</span>
        ${segmented({ name: "theme", legend: "Apariencia", value: prefs.theme ?? "light", options: THEME_OPTIONS })}
      </div>
      <button class="list-row" type="button" data-notifications>Notificaciones ${next}</button>
      <button class="list-row" type="button" data-help>Ayuda ${next}</button>
      <a class="list-row" href="#/manifiesto">Ver el Manifiesto ${next}</a>
      <button class="list-row" type="button" data-contact>Contacto ${next}</button>
    </nav>
  `;

  // main.js escucha "prefs" y aplica el tema apenas se guarda
  root.querySelector('[data-segmented="theme"]').addEventListener("change", async (event) => {
    await set("prefs", { ...(await get("prefs")), theme: event.target.value });
  });

  root.querySelector("[data-notifications]").addEventListener("click", openNotifications);
  root.querySelector("[data-help]").addEventListener("click", openHelp);
  root.querySelector("[data-contact]").addEventListener("click", openContact);
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

// Ayuda (textos de filotaxia.com, content/ayuda.js): "¿Cómo funciona?" en
// tres pasos, de la planta a la música, las cuatro capas y las preguntas
function openHelp() {
  const index = (i) => `<span class="help__index">${String(i + 1).padStart(2, "0")}/</span>`;
  const faq = (list) => list.map(([q, a]) => `<div class="help__item"><dt>${q}</dt><dd class="lead">${a}</dd></div>`).join("");

  openSheet({
    title: "Ayuda",
    body: `
      <section class="help">
        <h3 class="eyebrow">¿Cómo funciona?</h3>
        <ol class="help__steps">
          ${HOW_IT_WORKS.map((step, i) => `
            <li class="help__step">
              ${index(i)}
              <p class="lead">${step}</p>
            </li>`).join("")}
        </ol>
      </section>
      <section class="help">
        <h3 class="eyebrow">De la planta a la música</h3>
        <ol class="help__steps">
          ${PROCESS.map(([name, text], i) => `
            <li class="help__step">
              ${index(i)}
              <div class="help__item">
                <p class="help__step-title">${name}</p>
                <p class="lead">${text}</p>
              </div>
            </li>`).join("")}
        </ol>
      </section>
      <section class="help">
        <h3 class="eyebrow">Las cuatro capas</h3>
        <dl class="help__faq">
          ${LAYERS.map(([name, material, text]) => `
            <div class="help__item">
              <dt>${name} <span class="help__meta">${material}</span></dt>
              <dd class="lead">${text}</dd>
            </div>`).join("")}
        </dl>
      </section>
      <section class="help">
        <h3 class="eyebrow">Preguntas frecuentes</h3>
        <dl class="help__faq">${faq(SOUND_FAQ)}${faq(CARE_FAQ)}</dl>
      </section>
    `,
  });
}

// Contacto: mail e Instagram de Filotaxia
function openContact() {
  const next = arrow();
  openSheet({
    title: "Contacto",
    body: `
      <p class="lead">¿Una duda sobre tu terrario? Escribinos.</p>
      <nav class="list contact" aria-label="Contacto">
        <a class="list-row" href="mailto:${CONTACT.email}">
          <span class="contact__text">Mail <span class="help__meta">${CONTACT.email}</span></span> ${next}
        </a>
        <a class="list-row" href="https://instagram.com/${CONTACT.instagram}" target="_blank" rel="noopener">
          <span class="contact__text">Instagram <span class="help__meta">@${CONTACT.instagram}</span></span> ${next}
        </a>
      </nav>
    `,
  });
}
