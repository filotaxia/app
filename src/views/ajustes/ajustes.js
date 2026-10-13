/* ============================================
   Views — Ajustes
   ============================================ */

// Ajustes: una lista de filas:
// Apariencia (Auto / Claro / Oscuro, se aplica al instante) · Notificaciones
// (hoja con interruptor) · Contacto (hoja). El paso a paso que antes era
// "Ayuda" ahora es la sección Filotaxia de la barra (views/filotaxia).
// Se llega desde el punto de arriba a la derecha (no está en la barra);
// la flecha vuelve a la pantalla de la que se vino.

import { get, set } from "../../store/store.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { segmented } from "../../components/segmented/segmented.js";
import { arrow } from "../../utils/icons.js";
import { CONTACT } from "../../content/ayuda.js";

const THEME_OPTIONS = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

export const title = "Ajustes";
export const subtitle = "Tus terrarios viven en este teléfono";
export const header = true;

// Vuelve a donde estaba la persona (si venía de otra pantalla de la app)
export const back = ({ from }) => (from && from !== "inicio" ? `#/${from}` : "#/mi-terrario");

export async function render(root) {
  const next = arrow();
  const prefs = await get("prefs");

  root.innerHTML = `
    <nav class="list reveal" aria-label="Ajustes">
      <div class="list-row">
        <span aria-hidden="true">Apariencia</span>
        ${segmented({ name: "theme", legend: "Apariencia", value: prefs.theme ?? "light", options: THEME_OPTIONS })}
      </div>
      <button class="list-row" type="button" data-notifications>Notificaciones ${next}</button>
      <button class="list-row" type="button" data-contact>Contacto ${next}</button>
    </nav>
  `;

  // main.js escucha "prefs" y aplica el tema apenas se guarda
  root.querySelector('[data-segmented="theme"]').addEventListener("change", async (event) => {
    await set("prefs", { ...(await get("prefs")), theme: event.target.value });
  });

  root.querySelector("[data-notifications]").addEventListener("click", openNotifications);
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
