/* ============================================
   Components — File Upload
   ============================================ */

// Zona para subir un archivo: clic o arrastrar y soltar. Versión liviana de
// un dropzone (sin vista previa animada ni miniaturas): tarjeta con el
// cuadro de línea punteada adentro, el ícono, el título, la bajada y la
// píldora de "Elegir archivo" con el input nativo. Quien lo usa sigue
// escuchando el "change" del input como con cualquier file input (ver
// fileField() en views/admin/admin-form.js); bindFileDrop() solo suma el
// resaltado al arrastrar encima y, al soltar, carga el archivo en ese
// input y dispara su "change".

import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export function fileDrop({
  name = "", accept, title = "Hacé clic o arrastrá un archivo", description = "",
  browseLabel = "Elegir archivo", multiple = false, inputAttr = "data-file-input",
}) {
  return `
    <div class="file-drop">
      <label class="file-drop__zone">
        <span class="file-drop__icon" aria-hidden="true">${icon("upload")}</span>
        <span class="file-drop__text">
          <span class="file-drop__title">${escapeHTML(title)}</span>
          ${description ? `<span class="file-drop__description">${escapeHTML(description)}</span>` : ""}
        </span>
        <span class="file-drop__browse">${icon("upload")} ${escapeHTML(browseLabel)}</span>
        <input class="visually-hidden" type="file" ${name ? `name="${escapeHTML(name)}"` : ""} accept="${escapeHTML(accept)}"
          ${multiple ? "multiple" : ""} ${inputAttr} />
      </label>
    </div>
  `;
}

export function bindFileDrop(root) {
  root.querySelectorAll(".file-drop").forEach((drop) => {
    const input = drop.querySelector("input[type=file]");
    let depth = 0;
    drop.addEventListener("dragenter", (event) => {
      event.preventDefault();
      depth += 1;
      drop.classList.add("file-drop--active");
    });
    drop.addEventListener("dragleave", (event) => {
      event.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) drop.classList.remove("file-drop--active");
    });
    drop.addEventListener("dragover", (event) => event.preventDefault());
    drop.addEventListener("drop", (event) => {
      event.preventDefault();
      depth = 0;
      drop.classList.remove("file-drop--active");
      if (event.dataTransfer.files.length) {
        input.files = event.dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
}
