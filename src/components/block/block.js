/* ============================================
   Components — Block
   ============================================ */

// Un bloque de dato: título con punto arriba a la izquierda, etiqueta arriba
// a la derecha, ícono (opcional) y valor grande abajo (los números van sin
// punto final: "27 días", "4:11"). Con `meter`, el fondo se llena de
// izquierda a derecha (como la batería de la referencia). Con `href`, el
// bloque entero es un link. Van dentro de un <div class="blocks">.
//
//   block({ title: "Riego", badge: "Cada 30 días", icon: "calendar", value: "27 días" })
//   block({ ..., full: true, action: "<button…>", meter: { fraction: 0.4, tone: "soft" } })

import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export function block({ title, badge, icon: iconName, value, meter, action = "", full = false, href = "" }) {
  const tag = href ? "a" : "article";
  const classes = ["block", full && "block--full", meter && `block--${meter.tone}`].filter(Boolean).join(" ");
  const style = meter ? ` style="--fill: ${Math.round(meter.fraction * 100)}%"` : "";
  return `
    <${tag} class="${classes}"${style}${href ? ` href="${href}"` : ""}>
      ${meter ? `<span class="block__fill" aria-hidden="true"></span>` : ""}
      <h2 class="block__title">${title}.</h2>
      <span class="block__badge">${escapeHTML(badge)}</span>
      ${iconName ? `<span class="block__icon">${icon(iconName)}</span>` : ""}
      <p class="block__value${value.length > 9 ? " block__value--long" : ""}">${digits(value)}</p>
      ${action}
    </${tag}>
  `;
}

// Aprieta el espacio entre cifras ("27" de "27 días") más que entre letras.
// El tracking va en todas las cifras menos la última: así lo que sigue
// ("días", "°") queda a la distancia de siempre.
// El texto se escapa en partes, para no partir un "&#39;" al buscar cifras.
export function digits(text) {
  return String(text)
    .split(/(\d+)/)
    .map((part, i) => {
      if (i % 2 === 0) return escapeHTML(part);
      if (part.length === 1) return part;
      return `<span class="block__digits">${part.slice(0, -1)}</span>${part.slice(-1)}`;
    })
    .join("");
}
