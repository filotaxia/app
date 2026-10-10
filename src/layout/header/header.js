/* ============================================
   Layout — Header
   ============================================ */

// Header de las vistas que lo piden (Colección, Ajustes): título grande
// y subtítulo chico.

const titleEl = document.querySelector("[data-header-title]");
const subtitleEl = document.querySelector("[data-header-subtitle]");
const backEl = document.querySelector("[data-header-back]");

// La llama el router en cada cambio de pantalla.
// `back` (opcional) es el hash al que vuelve la flecha.
export function setHeader({ title, subtitle = "", back = "" }) {
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  subtitleEl.toggleAttribute("hidden", !subtitle);
  backEl.toggleAttribute("hidden", !back);
  if (back) backEl.href = back;
}

export function focusHeaderTitle() {
  titleEl.focus({ preventScroll: true });
}
