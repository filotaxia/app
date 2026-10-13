/* ============================================
   Utils — Theme
   ============================================ */

// Aplica la apariencia elegida en Ajustes (claro por defecto, ver store/defaults.js):
//   "system" → sigue al teléfono (sin data-theme)
//   "light" / "dark" → data-theme en <html>, que fuerza color-scheme
// index.html ya arranca con data-theme="light", así no hay un destello
// oscuro antes de que cargue el JS en un teléfono en modo oscuro.
// Los colores cambian solos: cada alias de semantic-colors.css usa light-dark().
//
// También actualiza el color de la barra del navegador (meta theme-color):
// index.html trae uno por esquema; al forzar un tema, los dos toman ese color.

export const THEMES = ["system", "light", "dark"];

const BAR_COLORS = { light: "#ffffff", dark: "#0a0a0a" };

export function applyTheme(theme = "light") {
  const root = document.documentElement;
  const forced = theme === "light" || theme === "dark";

  if (forced) root.dataset.theme = theme;
  else delete root.dataset.theme;

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content = BAR_COLORS[forced ? theme : meta.dataset.scheme];
  });
}

