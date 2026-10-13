/* ============================================
   Views — Bitácora
   ============================================ */

// La bitácora de un terrario (#/bitacora/04): notas con fecha y una foto
// opcional, la más nueva arriba. Cada terrario tiene la suya.
// Se llega desde el bloque "Bitácora." de Mi terrario o desde la ficha
// ("Ver su bitácora"); la flecha del header vuelve a donde se estaba.
//
// Las notas se guardan en el store y las fotos en IndexedDB (store/bitacora.js).

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { isLinked } from "../../store/collection.js";
import { entries, addEntry, removeEntry, photoURL } from "../../store/bitacora.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { toast } from "../../components/toast/toast.js";
import { formatDate } from "../../utils/format.js";
import { todayKey } from "../../utils/dates.js";
import { shrinkPhoto } from "../../utils/image.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export const title = "Bitácora";
export const subtitle = ({ params }) => {
  const terrario = getTerrario(params.id);
  return terrario ? codeOf(terrario) : "";
};
export const header = true;
export const back = ({ from }) => (from && from !== "inicio" ? `#/${from}` : "#/mi-terrario");

export async function render(root, { params }) {
  const terrario = getTerrario(params.id);

  // Un terrario que no está en la colección se ve primero en su ficha
  if (!terrario || !(await isLinked(terrario.id))) {
    location.replace(`#/terrario/${params.id}`);
    return;
  }

  root.innerHTML = `<div class="bitacora reveal" data-bitacora></div>`;
  return mountBitacora(root.querySelector("[data-bitacora]"), terrario);
}

// Pinta la lista de entradas y conecta "Nueva entrada" y "Borrar".
// Al guardar o borrar se vuelve a pintar la lista.
async function mountBitacora(container, terrario) {
  let urls = [];   // las fotos se muestran con URLs temporales: se liberan al salir

  function releasePhotos() {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls = [];
  }

  async function paint() {
    const list = await entries(terrario.id);
    releasePhotos();

    container.innerHTML = `
      <button class="btn btn--primary btn--block" type="button" data-new>${icon("plus")} Nueva entrada</button>
      ${list.length
        ? `<ol class="bitacora__list">${list.map(entry).join("")}</ol>`
        : `<p class="bitacora__empty lead">Todavía no hay entradas. Anotá cómo va tu terrario: un brote nuevo, el último riego, cómo sonaba hoy. Podés sumar una foto.</p>`}
    `;

    container.querySelector("[data-new]").addEventListener("click", () => openNewEntry(terrario, paint));

    container.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!confirm("¿Borrar esta entrada?")) return;
        await removeEntry(list.find((row) => row.id === button.dataset.delete));
        toast("Entrada borrada");
        paint();
      });
    });

    // Las fotos vienen de IndexedDB: se cargan después de pintar
    for (const img of container.querySelectorAll("[data-photo]")) {
      const url = await photoURL(img.dataset.photo);
      if (!url) {
        img.remove();
        continue;
      }
      urls.push(url);
      img.src = url;
    }
  }

  await paint();
  return releasePhotos;
}

function entry(row) {
  return `
    <li class="entry">
      <div class="entry__head">
        <time class="eyebrow" datetime="${row.date}">${formatDate(row.date)}</time>
        <button class="entry__delete" type="button" data-delete="${row.id}" aria-label="Borrar la entrada del ${formatDate(row.date)}">Borrar</button>
      </div>
      ${row.note ? `<p class="entry__note">${escapeHTML(row.note)}</p>` : ""}
      ${row.photo_id ? `<img class="entry__photo" data-photo="${row.photo_id}" alt="Foto del terrario, ${formatDate(row.date)}" />` : ""}
    </li>
  `;
}

// Hoja "Nueva entrada": la fecha es la de hoy (automática), la nota es
// obligatoria y la foto opcional (se achica antes de guardarla).
function openNewEntry(terrario, onSaved) {
  let photo = null;
  let preview = "";

  const sheet = openSheet({
    title: "Nueva entrada",
    body: `
      <form class="entry-form" data-form novalidate>
        <p class="eyebrow">Hoy · ${formatDate(todayKey())}</p>
        <label class="field">
          <span class="visually-hidden">Nota</span>
          <textarea class="field__input entry-form__note" name="note" rows="4"
            placeholder="Un brote nuevo, el riego de hoy, cómo suena…" aria-describedby="entry-error" data-note></textarea>
        </label>
        <p class="field__error" id="entry-error" data-error hidden>Escribí una nota para guardar la entrada.</p>

        <img class="entry-form__preview" alt="La foto elegida" data-preview hidden />
        <div class="entry-form__photo">
          <label class="btn btn--ghost btn--block">
            ${icon("image-plus")} <span data-photo-label>Sumar una foto</span>
            <input class="visually-hidden" type="file" accept="image/*" data-file />
          </label>
          <button class="text-link" type="button" data-remove-photo hidden>Quitar la foto</button>
        </div>

        <button class="btn btn--primary btn--block" type="submit" data-save>Guardar</button>
      </form>
    `,
    onClose: () => preview && URL.revokeObjectURL(preview),
  });

  const form = sheet.element.querySelector("[data-form]");
  const note = form.querySelector("[data-note]");
  const error = form.querySelector("[data-error]");
  const file = form.querySelector("[data-file]");
  const img = form.querySelector("[data-preview]");
  const label = form.querySelector("[data-photo-label]");
  const removePhoto = form.querySelector("[data-remove-photo]");
  const save = form.querySelector("[data-save]");

  function showPhoto(blob) {
    if (preview) URL.revokeObjectURL(preview);
    photo = blob;
    preview = blob ? URL.createObjectURL(blob) : "";
    img.src = preview;
    img.hidden = !blob;
    removePhoto.hidden = !blob;
    label.textContent = blob ? "Cambiar la foto" : "Sumar una foto";
  }

  file.addEventListener("change", async () => {
    const [chosen] = file.files;
    file.value = "";
    if (!chosen) return;
    try {
      showPhoto(await shrinkPhoto(chosen));
    } catch {
      toast("No pudimos abrir esa foto");
    }
  });

  removePhoto.addEventListener("click", () => showPhoto(null));

  note.addEventListener("input", () => {
    error.hidden = true;
    note.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = note.value.trim();
    if (!text) {
      error.hidden = false;
      note.setAttribute("aria-invalid", "true");
      note.focus();
      return;
    }
    save.disabled = true;
    try {
      await addEntry(terrario.id, { note: text, photo });
      sheet.close();
      toast("Entrada guardada");
      onSaved();
    } catch {
      save.disabled = false;
      toast("No se pudo guardar. Probá de nuevo");
    }
  });
}
