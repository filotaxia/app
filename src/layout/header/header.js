/* ============================================
   Layout — Header
   ============================================ */

// Header de las vistas que lo piden (Colección, Cuidados, Ajustes): título
// grande, subtítulo chico y, a la derecha, el punto de Ajustes (como el
// avatar de Pulso; en Ajustes mismo no se muestra).

const titleEl = document.querySelector("[data-header-title]");
const subtitleEl = document.querySelector("[data-header-subtitle]");
const backEl = document.querySelector("[data-header-back]");
const settingsEl = document.querySelector("[data-header-settings]");

// La llama el router en cada cambio de pantalla.
// `back` (opcional) es el hash al que vuelve la flecha.
export function setHeader({ title, subtitle = "", back = "", settings = true }) {
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  subtitleEl.toggleAttribute("hidden", !subtitle);
  backEl.toggleAttribute("hidden", !back);
  if (back) backEl.href = back;
  settingsEl.toggleAttribute("hidden", !settings);
}

export function focusHeaderTitle() {
  titleEl.focus({ preventScroll: true });
}
