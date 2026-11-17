/* ============================================
   Views — Admin Form
   ============================================ */

// El formulario de un terrario en el panel: crear uno nuevo o editar uno
// que ya existe. Todos los campos de la tabla `terrarios`, los cuatro
// archivos (foto, video y los dos MIDI de los Biodata), su QR y los botones
// para guardar, publicar, retirar o eliminar (esta última, de verdad: ver
// deleteTerrario más abajo).
//
//   renderForm(root, { row, rows, onSaved, onDeleted })
//     row       la fila a editar, o null para uno nuevo
//     rows      todas las filas (para sugerir el número y no repetirlo)
//     onSaved   se llama con la fila guardada
//     onDeleted se llama (sin argumentos) después de eliminar
//
// Al guardar: primero se revisa todo (y se leen los MIDI, para no subir un
// archivo roto), después se suben los archivos elegidos a Storage (una
// carpeta por terrario) y al final se guarda la fila.

import { escapeHTML } from "../../utils/html.js";
import { arrow, icon } from "../../utils/icons.js";
import { todayKey } from "../../utils/dates.js";
import { formatTime, parseDuration } from "../../utils/format.js";
import { nextTerrarioId, storagePath } from "../../utils/catalog.js";
import { shrinkPhoto } from "../../utils/image.js";
import { parseMidi } from "../../utils/midi.js";
import { PLANTAS, WAVE_NAMES, getPlanta } from "../../content/plantas.js";
import { createTerrario, updateTerrario, deleteTerrario, uploadFile, publicFileURL } from "../../store/admin.js";
import { qrFor, downloadSvg, downloadPng } from "./admin-qr.js";
import { toast } from "../../components/toast/toast.js";
import { loader, bindLoader } from "../../components/loader/loader.js";
import { openSheet } from "../../components/sheet/sheet.js";

const STATUS_LABEL = { borrador: "Borrador", publicado: "Publicado", retirado: "Retirado" };

// Los cuatro archivos de un terrario: columna de la tabla, nombre en Storage y qué acepta
const FILES = [
  { key: "photo", kind: "foto", label: "Foto", accept: "image/*", pick: "Elegir foto",
    hint: "Se achica a 1200px antes de subir. Cuadrada se ve mejor." },
  { key: "video", kind: "video", label: "Video", accept: "video/mp4,video/webm", pick: "Elegir video",
    hint: "MP4 (o WebM), hasta 50 MB. Es el fondo de “Cambiar a video”." },
  { key: "midi_plantas", kind: "midi-plantas", label: "MIDI Plantas", accept: ".mid,.midi,audio/midi", pick: "Elegir .mid",
    hint: "Biodata 02: las suculentas." },
  { key: "midi_sustrato", kind: "midi-sustrato", label: "MIDI Sustrato", accept: ".mid,.midi,audio/midi", pick: "Elegir .mid",
    hint: "Biodata 01: sustrato, gravas, piedra pómez y ambient." },
];

// Cuidados de un terrario nuevo (los del TR01, para no arrancar de cero)
const NEW_CARE = { riego_days: 30, ventilacion_days: null, light: "Indirecta" };

export function renderForm(root, { row, rows, onSaved, onDeleted }) {
  const isNew = !row;
  const nextId = nextTerrarioId(rows.map((r) => r.id));
  const data = row ?? {
    id: nextId, model: `TR${nextId}`, status: "borrador", recorded: todayKey(), duration: null, story: "",
    specs: null, plants: [], waves: [], gallery: [], care: NEW_CARE,
  };
  const specs = data.specs ?? {};
  const care = { ...NEW_CARE, ...data.care };
  const chosen = {};   // archivos elegidos en este formulario: { photo: File, … }
  const galleryKeep = [...(data.gallery ?? [])];   // rutas de la galería que se mantienen
  const galleryNew = [];                           // fotos nuevas de la galería, para subir al guardar

  root.innerHTML = `
    <div class="admin-form__top">
      <a class="back-link" href="#/">${arrow("left")} Terrarios</a>
      <button class="back-link" type="button" data-toggle-all>Desplegar todo</button>
    </div>

    <h1 class="visually-hidden" tabindex="-1" data-focus>${escapeHTML(data.model)}</h1>

    <form class="admin-form" novalidate data-form>
      <div class="admin-blocks">
        <details class="admin-block" open>
          <summary class="admin-block__title">Identidad.${toggle()}</summary>
          <div class="admin-pair">
            ${field({ label: "Número", name: "id", value: data.id, readonly: !isNew, inputmode: "numeric",
              hint: isNew ? "Va en las rutas de la app. No se puede cambiar después." : "" })}
            ${field({ label: "Código visible", name: "model", value: data.model, hint: isNew ? "Su nombre: “TR07”." : "" })}
          </div>
        </details>

        <details class="admin-block admin-block--full" open>
          <summary class="admin-block__title">Archivos.${toggle()}</summary>
          <div class="admin-files">
            ${FILES.map((file) => fileField(file, data[file.key])).join("")}
          </div>
          <div class="admin-gallery">
            <p class="eyebrow">Galería (Características)</p>
            <p class="admin-hint">Fotos propias de este terrario; si hay alguna, reemplazan a las tres tarjetas genéricas en “Características” de su ficha.</p>
            <ul class="admin-gallery__grid" data-gallery-list></ul>
            <label class="btn btn--ghost admin-file__pick">
              Agregar fotos
              <input class="visually-hidden" type="file" accept="image/*" multiple data-gallery-input />
            </label>
          </div>
        </details>

        ${isNew ? "" : `
        <details class="admin-block admin-block--full admin-qr" aria-labelledby="qr-title" open>
          <summary class="admin-block__title" id="qr-title">QR.${toggle()}</summary>
          <div class="admin-qr__body">
            <div class="admin-qr__code" data-qr></div>
            <div class="admin-qr__info">
              <p class="admin-qr__link" data-qr-link></p>
              <p class="lead">El código no cambia nunca. ${data.status === "borrador"
                ? "Mientras sea borrador, el link dice “No encontramos este terrario”: publicalo antes de pegarlo."
                : "Antes de imprimir en el material final, probá uno en papel común."}</p>
              <p class="eyebrow">Descargar</p>
              <div class="admin-qr__actions">
                <button class="btn btn--ghost" type="button" data-download="svg">Descargar SVG</button>
                <button class="btn btn--ghost" type="button" data-download="png">Descargar PNG</button>
                <button class="btn btn--ghost" type="button" data-copy>Copiar link</button>
              </div>
            </div>
          </div>
        </details>`}

        <details class="admin-block" open>
          <summary class="admin-block__title">La pieza.${toggle()}</summary>
          <div class="admin-pair admin-pair--stack">
            ${field({ label: "Grabación", name: "recorded", value: data.recorded ?? "", type: "date" })}
            ${field({ label: "Duración (m:ss)", name: "duration", value: data.duration ? formatTime(data.duration) : "",
              placeholder: "4:11", hint: "Vacía: se toma del MIDI más largo." })}
          </div>
          <div class="admin-box">
            <label class="admin-box__label eyebrow" for="story">Historia</label>
            <textarea class="admin-box__input admin-box__input--area" id="story" name="story" rows="5">${escapeHTML(data.story ?? "")}</textarea>
          </div>
        </details>

        <details class="admin-block admin-block--full" open>
          <summary class="admin-block__title">Especificaciones.${toggle()}</summary>
          ${field({ label: "Ecosistema", name: "ecosistema", value: specs.ecosistema ?? "", placeholder: "Abierto" })}
          ${field({ label: "Recipiente", name: "recipiente", value: specs.recipiente ?? "", placeholder: "Vidrio" })}
          ${field({ label: "Medidas", name: "medidas", value: specs.medidas ?? "", placeholder: "25 × 20 × 17 cm" })}
        </details>

        <details class="admin-block admin-block--full" open>
          <summary class="admin-block__title">Plantas.${toggle()}</summary>
          <div class="admin-checks">
            ${PLANTAS.map((planta) => check({ name: "plants", value: planta.name, label: planta.name,
              note: getPlanta(planta.name).leafLabel, checked: data.plants?.includes(planta.name) })).join("")}
          </div>
        </details>

        <details class="admin-block admin-block--full" open>
          <summary class="admin-block__title">Ondas de su pieza.${toggle()}</summary>
          <p class="lead">Una por capa: la pone la hoja de cada planta elegida arriba.</p>
          <ul class="admin-checks" data-waves-list>
            ${wavesRows(data.plants)}
          </ul>
          <div class="visually-hidden" data-waves-inputs>
            ${Object.keys(WAVE_NAMES).map((wave) =>
              `<input type="checkbox" name="waves" value="${wave}" ${wavesFromPlants(data.plants).has(wave) ? "checked" : ""}>`).join("")}
          </div>
        </details>

        <details class="admin-block admin-block--full" open>
          <summary class="admin-block__title">Cuidados.${toggle()}</summary>
          <div class="admin-pair admin-pair--stack">
            ${field({ label: "Regar cada (días)", name: "riego_days", value: care.riego_days, type: "number" })}
            ${field({ label: "Ventilar cada (días)", name: "ventilacion_days", value: care.ventilacion_days ?? "", type: "number",
              hint: "Vacío: ecosistema abierto, no se ventila." })}
          </div>
          ${field({ label: "Luz", name: "light", value: care.light, placeholder: "Indirecta" })}
        </details>
      </div>

      <div class="admin-form__footer">
        <p class="field__error" role="alert" data-error hidden></p>
        <p class="admin-form__progress lead" aria-live="polite" data-progress hidden>
          ${loader({ size: 18, label: null })}
          <span data-progress-text></span>
        </p>
        <div class="admin-form__actions">
          <button class="btn btn--primary" type="submit" data-save>${isNew ? "Guardar borrador" : "Guardar"}</button>
          ${statusButton(data.status)}
        </div>
        ${isNew ? "" : `<button class="btn btn--ghost btn--block" type="button" data-delete>Eliminar</button>`}
      </div>
    </form>
  `;

  const form = root.querySelector("[data-form]");

  /* ---------------------------------------- */
  /* Desplegar / plegar todos los bloques */
  /* ---------------------------------------- */

  const blocks = root.querySelectorAll("details.admin-block");
  const toggleAllBtn = root.querySelector("[data-toggle-all]");
  const syncToggleAllLabel = () => {
    const allOpen = [...blocks].every((block) => block.open);
    toggleAllBtn.textContent = allOpen ? "Plegar todo" : "Desplegar todo";
  };
  toggleAllBtn.addEventListener("click", () => {
    const allOpen = [...blocks].every((block) => block.open);
    blocks.forEach((block) => { block.open = !allOpen; });
    syncToggleAllLabel();
  });
  blocks.forEach((block) => block.addEventListener("toggle", syncToggleAllLabel));
  syncToggleAllLabel();

  /* ---------------------------------------- */
  /* QR */
  /* ---------------------------------------- */

  if (!isNew) {
    qrFor(data).then(({ link, svg }) => {
      root.querySelector("[data-qr]").innerHTML = svg;
      root.querySelector("[data-qr-link]").innerHTML =
        `<a href="${escapeHTML(link)}" target="_blank" rel="noopener">${escapeHTML(link)}</a>`;
    }).catch(() => {
      root.querySelector("[data-qr]").textContent = "No se pudo dibujar el QR (¿sin conexión?).";
    });
    root.querySelector('[data-download="svg"]').addEventListener("click", () => downloadSvg(data));
    root.querySelector('[data-download="png"]').addEventListener("click", () => downloadPng(data));
    root.querySelector("[data-copy]").addEventListener("click", async () => {
      const { link } = await qrFor(data);
      await navigator.clipboard.writeText(link);
      toast("Link copiado");
    });
  }

  /* ---------------------------------------- */
  /* Ayudas mientras se completa */
  /* ---------------------------------------- */

  // Terrario nuevo: el código visible sigue al número mientras no se toque a mano
  if (isNew) {
    let lastId = data.id;
    form.elements.id.addEventListener("input", () => {
      if (form.elements.model.value === `TR${lastId}`) form.elements.model.value = `TR${form.elements.id.value}`;
      lastId = form.elements.id.value;
    });
  }

  // Las ondas las marca la hoja de cada planta elegida: una fila por capa (ver wavesFromPlants)
  form.querySelectorAll('[name="plants"]').forEach((box) => box.addEventListener("change", () => {
    const plants = checked(form, "plants");
    const waves = wavesFromPlants(plants);
    form.querySelectorAll('[name="waves"]').forEach((wave) => { wave.checked = waves.has(wave.value); });
    root.querySelector("[data-waves-list]").innerHTML = wavesRows(plants);
  }));

  // Archivo elegido: se muestra su nombre (y la foto) hasta guardar
  form.querySelectorAll("[data-file-input]").forEach((input) => input.addEventListener("change", () => {
    const file = input.files[0];
    const key = input.name;
    chosen[key] = file ?? undefined;
    const label = root.querySelector(`[data-chosen="${key}"]`);
    label.textContent = file ? `Nuevo: ${file.name} · se sube al guardar` : "";
    if (key === "photo" && file) {
      const current = root.querySelector('[data-current="photo"]');
      current.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="" />`;
    }
  }));

  // Galería de Características: fotos ya subidas (galleryKeep) + nuevas elegidas acá (galleryNew)
  const renderGallery = () => {
    const items = [
      ...galleryKeep.map((path, i) => ({ src: publicFileURL(path), remove: () => galleryKeep.splice(i, 1) })),
      ...galleryNew.map((file, i) => ({ src: URL.createObjectURL(file), remove: () => galleryNew.splice(i, 1) })),
    ];
    const list = root.querySelector("[data-gallery-list]");
    list.innerHTML = items.length
      ? items.map((item, i) => `
          <li class="admin-gallery__item">
            <img src="${escapeHTML(item.src)}" alt="" />
            <button class="btn btn--icon admin-gallery__remove" type="button" data-gallery-remove="${i}" aria-label="Quitar">${icon("x")}</button>
          </li>`).join("")
      : `<li class="admin-hint">Sin fotos propias todavía: se muestran las tres tarjetas genéricas.</li>`;
    list.querySelectorAll("[data-gallery-remove]").forEach((button) => button.addEventListener("click", () => {
      items[Number(button.dataset.galleryRemove)].remove();
      renderGallery();
    }));
  };
  root.querySelector("[data-gallery-input]").addEventListener("change", (event) => {
    galleryNew.push(...event.target.files);
    event.target.value = "";
    renderGallery();
  });
  renderGallery();

  /* ---------------------------------------- */
  /* Guardar */
  /* ---------------------------------------- */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = isNew
      ? `¿Guardar ${form.elements.model.value} como borrador?`
      : `¿Guardar los cambios de ${form.elements.model.value}?`;
    if (await confirmSheet(question, "Guardar")) save(data.status);
  });

  root.querySelector("[data-status]")?.addEventListener("click", async (event) => {
    const status = event.currentTarget.dataset.status;
    const question = status === "retirado"
      ? `¿Retirar ${form.elements.model.value}? Su QR sigue abriendo su ficha y su pieza, pero deja de aparecer en Colección para quien no lo tiene conectado.`
      : `¿Publicar ${form.elements.model.value}? Va a aparecer en la app para todos.`;
    const label = status === "retirado" ? "Retirar" : "Publicar";
    if (await confirmSheet(question, label)) save(status);
  });

  root.querySelector("[data-delete]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;   // después de un await, event.currentTarget ya es null
    if (!(await confirmDeleteSheet(data.model))) return;
    const errorBox = root.querySelector("[data-error]");
    errorBox.hidden = true;
    button.disabled = true;
    try {
      await deleteTerrario(data.id);
      toast(`${data.model} eliminado`);
      onDeleted();
    } catch (error) {
      button.disabled = false;
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    }
  });

  async function save(status) {
    const errorBox = root.querySelector("[data-error]");
    const progress = root.querySelector("[data-progress]");
    const progressText = root.querySelector("[data-progress-text]");
    let progressLoader = null;
    const setProgress = (text) => {
      progress.hidden = !text;
      progressText.textContent = text;
      if (text && !progressLoader) progressLoader = bindLoader(progress);
      if (!text && progressLoader) {
        progressLoader.stop();
        progressLoader = null;
      }
    };
    const buttons = form.querySelectorAll("button");
    const fail = (message, input) => {
      errorBox.textContent = message;
      errorBox.hidden = false;
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
    };

    errorBox.hidden = true;
    form.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));

    // 1. Revisar
    const values = readValues(form);
    if (!/^\d{2,3}$/.test(values.id)) return fail("El número tiene que tener 2 o 3 cifras: “07”.", form.elements.id);
    if (isNew && rows.some((r) => r.id === values.id)) return fail(`Ya hay un terrario con el número ${values.id}.`, form.elements.id);
    if (!values.model) return fail("Falta el código visible: “TR07”.", form.elements.model);
    if (values.duration === undefined) return fail("La duración se escribe así: 4:11.", form.elements.duration);
    if (!values.care.riego_days) return fail("Falta cada cuántos días se riega.", form.elements.riego_days);

    // Los MIDI se leen antes de subir nada: si uno está roto, no se sube ninguno
    const midiLengths = [];
    for (const file of FILES.filter((f) => f.key.startsWith("midi_") && chosen[f.key])) {
      try {
        midiLengths.push(parseMidi(await chosen[file.key].arrayBuffer()).duration);
      } catch (error) {
        return fail(`El ${file.label} no se pudo leer: ${error.message}.`);
      }
    }
    if (values.duration === null && midiLengths.length) values.duration = Math.round(Math.max(...midiLengths));

    buttons.forEach((button) => { button.disabled = true; });

    try {
      // 2. Subir los archivos elegidos
      const paths = {};
      for (const file of FILES.filter((f) => chosen[f.key])) {
        setProgress(`Subiendo ${file.label.toLowerCase()}…`);
        paths[file.key] = await upload(values.id, file, chosen[file.key]);
      }

      // Fotos nuevas de la galería (Características); las que ya estaban
      // se mantienen salvo que se hayan quitado (galleryKeep)
      const newGalleryPaths = [];
      for (let i = 0; i < galleryNew.length; i++) {
        setProgress(`Subiendo foto ${i + 1} de la galería…`);
        let blob;
        try {
          blob = await shrinkPhoto(galleryNew[i]);
        } catch {
          throw new Error("No se pudo leer una de las fotos de la galería. Probá con un JPG o un PNG.");
        }
        newGalleryPaths.push(await uploadFile(storagePath(values.id, `galeria-${i}`, "jpg"), blob, "image/jpeg"));
      }

      // 3. Guardar la fila
      setProgress("Guardando…");
      const fields = {
        model: values.model,
        recorded: values.recorded,
        duration: values.duration,
        story: values.story,
        specs: values.specs,
        plants: values.plants,
        waves: values.waves,
        care: values.care,
        status,
        gallery: [...galleryKeep, ...newGalleryPaths],
        ...paths,
      };
      const saved = isNew
        ? await createTerrario({ id: values.id, ...fields })
        : await updateTerrario(data.id, fields);

      setProgress("");
      toast(status !== data.status ? `${saved.model}: ${STATUS_LABEL[status].toLowerCase()}` : `${saved.model} guardado`);
      onSaved(saved);
    } catch (error) {
      setProgress("");
      buttons.forEach((button) => { button.disabled = false; });
      fail(error.message);
    }
  }
}

/* ---------------------------------------- */
/* Leer el formulario */
/* ---------------------------------------- */

function readValues(form) {
  const text = (name) => form.elements[name].value.trim();
  const number = (name) => (text(name) === "" ? null : Number(text(name)));
  const duration = text("duration");
  const specs = { ecosistema: text("ecosistema"), recipiente: text("recipiente"), medidas: text("medidas") };

  return {
    id: text("id"),
    model: text("model"),
    recorded: text("recorded") || null,
    // null = vacía · undefined = mal escrita
    duration: duration === "" ? null : parseDuration(duration) ?? undefined,
    story: text("story") || null,
    specs: Object.values(specs).some(Boolean) ? specs : null,
    plants: checked(form, "plants"),
    waves: checked(form, "waves"),
    care: {
      riego_days: number("riego_days"),
      ventilacion_days: number("ventilacion_days"),
      light: text("light") || null,
    },
  };
}

function checked(form, name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked`)].map((box) => box.value);
}

// La onda de cada planta elegida viene fija de su hoja (ver content/plantas.js)
function wavesFromPlants(plantNames) {
  return new Set((plantNames ?? []).map((name) => getPlanta(name).wave));
}

// Una fila por capa (planta elegida) con su onda; nada elegido, un aviso
function wavesRows(plantNames) {
  if (!plantNames?.length) return `<li class="admin-hint">Elegí plantas arriba para ver sus ondas.</li>`;
  return plantNames.map((name) => {
    const wave = getPlanta(name).wave;
    return `
      <li class="admin-check admin-check--static">
        <span class="admin-check__icon" aria-hidden="true">${icon(`wave-${wave}`)}</span>
        <span>${escapeHTML(name)}</span>
        <span class="admin-check__note">${WAVE_NAMES[wave]}</span>
      </li>`;
  }).join("");
}

// Sube un archivo a la carpeta de su terrario y devuelve su ruta en Storage
async function upload(id, file, chosenFile) {
  if (file.key === "photo") {
    let blob;
    try {
      blob = await shrinkPhoto(chosenFile);
    } catch {
      throw new Error("No se pudo leer la foto. Probá con un JPG o un PNG.");
    }
    return uploadFile(storagePath(id, file.kind, "jpg"), blob, "image/jpeg");
  }
  if (file.key === "video") {
    const extension = chosenFile.name.split(".").pop().toLowerCase() === "webm" ? "webm" : "mp4";
    return uploadFile(storagePath(id, file.kind, extension), chosenFile, `video/${extension}`);
  }
  return uploadFile(storagePath(id, file.kind, "mid"), chosenFile, "audio/midi");
}

/* ---------------------------------------- */
/* Piezas del formulario */
/* ---------------------------------------- */

// Label arriba (eyebrow, como siempre) + caja con borde entero (antes solo
// línea abajo); el placeholder queda adentro de la caja, sin animación
function field({ label, name, value, type = "text", hint = "", placeholder = "", readonly = false, inputmode = "" }) {
  const hintId = hint ? `${name}-hint` : "";
  return `
    <div class="admin-box">
      <label class="admin-box__label eyebrow" for="${name}">${escapeHTML(label)}</label>
      <input class="admin-box__input" id="${name}" name="${name}" type="${type}" value="${escapeHTML(value ?? "")}"
        ${placeholder ? `placeholder="${escapeHTML(placeholder)}"` : ""} ${readonly ? "readonly" : ""}
        ${inputmode ? `inputmode="${inputmode}"` : ""} ${hintId ? `aria-describedby="${hintId}"` : ""} />
      ${hint ? `<p class="admin-hint" id="${hintId}">${escapeHTML(hint)}</p>` : ""}
    </div>
  `;
}

// El +/− de cada bloque plegable (admin-block es <details>; ver admin.css)
function toggle() {
  return `<span class="admin-block__toggle" aria-hidden="true"></span>`;
}

// Modal de confirmar/cancelar antes de guardar, publicar o retirar
function confirmSheet(message, confirmLabel) {
  return new Promise((resolve) => {
    let decided = false;
    const sheet = openSheet({
      title: "¿Estás seguro?",
      body: `
        <p class="lead">${escapeHTML(message)}</p>
        <div class="admin-form__actions">
          <button class="btn btn--primary" type="button" data-confirm>${escapeHTML(confirmLabel)}</button>
          <button class="btn btn--ghost" type="button" data-cancel>Cancelar</button>
        </div>
      `,
      onClose: () => { if (!decided) resolve(false); },
    });
    sheet.element.querySelector("[data-confirm]").addEventListener("click", () => {
      decided = true;
      sheet.close();
      resolve(true);
    });
    sheet.element.querySelector("[data-cancel]").addEventListener("click", () => {
      decided = true;
      sheet.close();
      resolve(false);
    });
  });
}

// Eliminar de verdad (no "retirar"): irreversible, y su QR impreso deja de
// abrir nada para siempre. El paso de seguridad es escribir el código del
// terrario tal cual se ve (p. ej. "TR07"); "Eliminar" queda desactivado
// hasta que coincide.
function confirmDeleteSheet(model) {
  return new Promise((resolve) => {
    let decided = false;
    const sheet = openSheet({
      title: "Eliminar para siempre",
      body: `
        <p class="lead">Esta acción no se puede deshacer: ${escapeHTML(model)} desaparece de la base y su QR impreso deja de abrir nada. Escribí <strong>${escapeHTML(model)}</strong> para confirmar.</p>
        <div class="admin-box">
          <input class="admin-box__input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-delete-word />
        </div>
        <div class="admin-form__actions">
          <button class="btn btn--primary" type="button" data-confirm disabled>Eliminar</button>
          <button class="btn btn--ghost" type="button" data-cancel>Cancelar</button>
        </div>
      `,
      onClose: () => { if (!decided) resolve(false); },
    });
    const word = sheet.element.querySelector("[data-delete-word]");
    const confirmButton = sheet.element.querySelector("[data-confirm]");
    word.addEventListener("input", () => { confirmButton.disabled = word.value.trim() !== model; });
    confirmButton.addEventListener("click", () => {
      decided = true;
      sheet.close();
      resolve(true);
    });
    sheet.element.querySelector("[data-cancel]").addEventListener("click", () => {
      decided = true;
      sheet.close();
      resolve(false);
    });
  });
}

function check({ name, value, label, note = "", checked: isChecked }) {
  return `
    <label class="admin-check">
      <input type="checkbox" name="${name}" value="${escapeHTML(value)}" ${isChecked ? "checked" : ""} />
      <span>${escapeHTML(label)}</span>
      ${note ? `<span class="admin-check__note">${escapeHTML(note)}</span>` : ""}
    </label>
  `;
}

// Un archivo: lo que hay hoy (la foto, o el nombre del archivo) y el botón para elegir otro
function fileField(file, path) {
  const url = publicFileURL(path);
  const name = path ? path.split("/").pop() : "";
  const current = !path
    ? `<span class="admin-hint">Sin archivo</span>`
    : file.key === "photo"
      ? `<img src="${escapeHTML(url)}" alt="" />`
      : `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(name)}</a>`;
  return `
    <div class="admin-file">
      <p class="eyebrow">${escapeHTML(file.label)}</p>
      <div class="admin-file__current ${file.key === "photo" ? "admin-file__current--photo" : ""}" data-current="${file.key}">${current}</div>
      <label class="btn btn--ghost admin-file__pick">
        ${escapeHTML(path ? "Cambiar" : file.pick)}
        <input class="visually-hidden" type="file" name="${file.key}" accept="${file.accept}" data-file-input />
      </label>
      <p class="admin-file__chosen" data-chosen="${file.key}"></p>
      <p class="admin-hint">${escapeHTML(file.hint)}</p>
    </div>
  `;
}

// El segundo botón: lo que se puede hacer con su estado (nunca borrar ni volver a borrador)
function statusButton(status) {
  const next = { borrador: ["publicado", "Guardar y publicar"], publicado: ["retirado", "Retirar"], retirado: ["publicado", "Volver a publicar"] };
  const [to, label] = next[status];
  return `<button class="btn btn--ghost" type="button" data-status="${to}">${label}</button>`;
}
