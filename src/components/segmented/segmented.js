/* ============================================
   Components — Segmented
   ============================================ */

// Control segmentado: una pill con opciones, la elegida en negro.
// Son radios nativos (teclado y lectores de pantalla andan solos).
//
//   segmented({
//     name: "theme",
//     legend: "Apariencia",            // para lectores de pantalla
//     value: "system",
//     options: [{ value: "system", label: "Auto" }, ...],
//   })
//   → escuchar "change" en el fieldset: event.target.value

import { escapeHTML } from "../../utils/html.js";

export function segmented({ name, legend, value, options }) {
  return `
    <fieldset class="segmented" data-segmented="${name}">
      <legend class="visually-hidden">${escapeHTML(legend)}</legend>
      ${options
        .map(
          (option) => `
        <label class="segmented__option">
          <input class="segmented__input" type="radio" name="${name}" value="${escapeHTML(option.value)}"
            ${option.value === value ? "checked" : ""} />
          <span>${escapeHTML(option.label)}</span>
        </label>`,
        )
        .join("")}
    </fieldset>
  `;
}
