/* ============================================
   Views — Admin Form
   ============================================ */

// El formulario de un terrario en el panel: crear uno nuevo o editar uno
// que ya existe. Todos los campos de la tabla `terrarios`, los cuatro
// archivos (foto, video y los dos MIDI de los Biodata), su QR y los botones
// para guardar, publicar o retirar. Nunca borra.
//
//   renderForm(root, { row, rows, onSaved })
//     row      la fila a editar, o null para uno nuevo
//     rows     todas las filas (para sugerir el número y no repetirlo)
//     onSaved  se llama con la fila guardada
//
// Al guardar: primero se revisa todo (y se leen los MIDI, para no subir un
// archivo roto), después se suben los archivos elegidos a Storage (una
// carpeta por terrario) y al final se guarda la fila.

import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";
import { todayKey } from "../../utils/dates.js";
import { formatTime, parseDuration } from "../../utils/format.js";
import { nextTerrarioId, storagePath } from "../../utils/catalog.js";
import { shrinkPhoto } from "../../utils/image.js";
import { parseMidi } from "../../utils/midi.js";
import { PLANTAS, WAVE_NAMES, getPlanta } from "../../content/plantas.js";
import { createTerrario, updateTerrario, uploadFile, publicFileURL } from "../../store/admin.js";
import { qrFor, downloadSvg, downloadPng } from "./admin-qr.js";
import { toast } from "../../components/toast/toast.js";

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
const NEW_CARE = { riego_days: 30, ventilacion_days: null, humidity: [35, 60], temp: [15, 26], light: "Indirecta", light_hours: [5, 8] };

export function renderForm(root, { row, rows, onSaved }) {
  const isNew = !row;
  const nextId = nextTerrarioId(rows.map((r) => r.id));
  const data = row ?? {
    id: nextId, model: `TR${nextId}`, status: "borrador", recorded: todayKey(), duration: null, story: "",
    specs: null, plants: [], waves: [], care: NEW_CARE,
  };
  const specs = data.specs ?? {};
  const care = { ...NEW_CARE, ...data.care };
  const chosen = {};   // archivos elegidos en este formulario: { photo: File, … }

  root.innerHTML = `
    <a class="back-link" href="#/">${arrow("left")} Terrarios</a>

    <header class="admin-form__head">
      <p class="eyebrow">${isNew ? "Terrario nuevo" : `Nº ${escapeHTML(data.id)} · ${STATUS_LABEL[data.status]}`}</p>
      <h1 class="title" tabindex="-1" data-focus>${escapeHTML(data.model)}</h1>
    </header>

    ${isNew ? "" : `
      <section class="admin-section admin-qr" aria-labelledby="qr-title">
        <h2 class="eyebrow" id="qr-title">QR</h2>
        <div class="admin-qr__body">
          <div class="admin-qr__code" data-qr></div>
          <div class="admin-qr__info">
            <p class="admin-qr__link" data-qr-link></p>
            <p class="lead">El código no cambia nunca. ${data.status === "borrador"
              ? "Mientras sea borrador, el link dice “No encontramos este terrario”: publicalo antes de pegarlo."
              : "Antes de imprimir en el material final, probá uno en papel común."}</p>
            <div class="admin-qr__actions">
              <button class="btn btn--ghost" type="button" data-download="svg">Descargar SVG</button>
              <button class="btn btn--ghost" type="button" data-download="png">Descargar PNG</button>
              <button class="btn btn--ghost" type="button" data-copy>Copiar link</button>
            </div>
          </div>
        </div>
      </section>`}

    <form class="admin-form" novalidate data-form>
      <section class="admin-section">
        <h2 class="eyebrow">Identidad</h2>
        <div class="admin-pair">
          ${field({ label: "Número", name: "id", value: data.id, readonly: !isNew, inputmode: "numeric",
            hint: isNew ? "Va en las rutas de la app. No se puede cambiar después." : "" })}
          ${field({ label: "Código visible", name: "model", value: data.model, hint: isNew ? "Su nombre: “TR07”." : "" })}
        </div>
      </section>

      <section class="admin-section">
        <h2 class="eyebrow">La pieza</h2>
        <div class="admin-pair">
          ${field({ label: "Empezó a sonar", name: "recorded", value: data.recorded ?? "", type: "date" })}
          ${field({ label: "Duración (m:ss)", name: "duration", value: data.duration ? formatTime(data.duration) : "",
            placeholder: "4:11", hint: "Vacía: se toma del MIDI más largo." })}
        </div>
        <div class="field">
          <label class="field__label eyebrow" for="story">Historia</label>
          <textarea class="field__input field__input--area" id="story" name="story" rows="5">${escapeHTML(data.story ?? "")}</textarea>
        </div>
      </section>

      <section class="admin-section">
        <h2 class="eyebrow">Archivos</h2>
        <div class="admin-files">
          ${FILES.map((file) => fileField(file, data[file.key])).join("")}
        </div>
      </section>

      <section class="admin-section">
        <h2 class="eyebrow">Especificaciones</h2>
        ${field({ label: "Ecosistema", name: "ecosistema", value: specs.ecosistema ?? "", placeholder: "Abierto" })}
        ${field({ label: "Recipiente", name: "recipiente", value: specs.recipiente ?? "", placeholder: "Vidrio" })}
        ${field({ label: "Medidas", name: "medidas", value: specs.medidas ?? "", placeholder: "25 × 20 × 17 cm" })}
      </section>

      <fieldset class="admin-section">
        <legend class="eyebrow">Plantas</legend>
        <div class="admin-checks">
          ${PLANTAS.map((planta) => check({ name: "plants", value: planta.name, label: planta.name,
            note: getPlanta(planta.name).leafLabel, checked: data.plants?.includes(planta.name) })).join("")}
        </div>
      </fieldset>

      <fieldset class="admin-section">
        <legend class="eyebrow">Ondas de su pieza</legend>
        <p class="lead">Se marcan solas con las hojas de las plantas; se pueden cambiar.</p>
        <div class="admin-checks admin-checks--row">
          ${Object.entries(WAVE_NAMES).map(([wave, label]) => check({ name: "waves", value: wave, label,
            checked: data.waves?.includes(wave) })).join("")}
        </div>
      </fieldset>

      <section class="admin-section">
        <h2 class="eyebrow">Cuidados</h2>
        <div class="admin-pair">
          ${field({ label: "Regar cada (días)", name: "riego_days", value: care.riego_days, type: "number" })}
          ${field({ label: "Ventilar cada (días)", name: "ventilacion_days", value: care.ventilacion_days ?? "", type: "number",
            hint: "Vacío: ecosistema abierto, no se ventila." })}
        </div>
        ${range({ label: "Humedad ideal (%)", name: "humidity", value: care.humidity })}
        ${range({ label: "Temperatura ideal (°C)", name: "temp", value: care.temp })}
        <div class="admin-pair">
          ${field({ label: "Luz", name: "light", value: care.light, placeholder: "Indirecta" })}
        </div>
        ${range({ label: "Horas de luz", name: "light_hours", value: care.light_hours })}
      </section>

      <div class="admin-form__footer">
        <p class="field__error" role="alert" data-error hidden></p>
        <p class="lead" aria-live="polite" data-progress></p>
        <div class="admin-form__actions">
          <button class="btn btn--primary" type="submit" data-save>${isNew ? "Guardar borrador" : "Guardar"}</button>
          ${statusButton(data.status)}
        </div>
      </div>
    </form>
  `;

  const form = root.querySelector("[data-form]");

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

  // Las ondas se marcan solas con las hojas de las plantas, hasta que se tocan a mano
  let wavesTouched = (data.waves?.length ?? 0) > 0;
  form.querySelectorAll('[name="waves"]').forEach((box) => box.addEventListener("change", () => { wavesTouched = true; }));
  form.querySelectorAll('[name="plants"]').forEach((box) => box.addEventListener("change", () => {
    if (wavesTouched) return;
    const waves = new Set(checked(form, "plants").map((name) => getPlanta(name).wave));
    form.querySelectorAll('[name="waves"]').forEach((wave) => { wave.checked = waves.has(wave.value); });
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

  /* ---------------------------------------- */
  /* Guardar */
  /* ---------------------------------------- */

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save(data.status);
  });

  root.querySelector("[data-status]")?.addEventListener("click", (event) => {
    const status = event.currentTarget.dataset.status;
    const question = status === "retirado"
      ? `¿Retirar ${form.elements.model.value}? Su QR sigue abriendo su ficha y su pieza, pero deja de aparecer en Colección para quien no lo tiene conectado.`
      : `¿Publicar ${form.elements.model.value}? Va a aparecer en la app para todos.`;
    if (confirm(question)) save(status);
  });

  async function save(status) {
    const errorBox = root.querySelector("[data-error]");
    const progress = root.querySelector("[data-progress]");
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
    // Mi terrario simula las lecturas con estos rangos (utils/care.js): no pueden faltar
    for (const [name, label] of [["humidity", "la humedad"], ["temp", "la temperatura"], ["light_hours", "las horas de luz"]]) {
      if (!values.care[name]) return fail(`Completá mínimo y máximo de ${label}.`, form.elements[`${name}_min`]);
    }

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
        progress.textContent = `Subiendo ${file.label.toLowerCase()}…`;
        paths[file.key] = await upload(values.id, file, chosen[file.key]);
      }

      // 3. Guardar la fila
      progress.textContent = "Guardando…";
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
        ...paths,
      };
      const saved = isNew
        ? await createTerrario({ id: values.id, ...fields })
        : await updateTerrario(data.id, fields);

      toast(status !== data.status ? `${saved.model}: ${STATUS_LABEL[status].toLowerCase()}` : `${saved.model} guardado`);
      onSaved(saved);
    } catch (error) {
      progress.textContent = "";
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
  const pair = (name) => {
    const [min, max] = [number(`${name}_min`), number(`${name}_max`)];
    return min === null || max === null ? null : [min, max];
  };
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
      humidity: pair("humidity"),
      temp: pair("temp"),
      light: text("light") || null,
      light_hours: pair("light_hours"),
    },
  };
}

function checked(form, name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked`)].map((box) => box.value);
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

function field({ label, name, value, type = "text", hint = "", placeholder = "", readonly = false, inputmode = "" }) {
  const hintId = hint ? `${name}-hint` : "";
  return `
    <div class="field">
      <label class="field__label eyebrow" for="${name}">${escapeHTML(label)}</label>
      <input class="field__input" id="${name}" name="${name}" type="${type}" value="${escapeHTML(value ?? "")}"
        ${placeholder ? `placeholder="${escapeHTML(placeholder)}"` : ""} ${readonly ? "readonly" : ""}
        ${inputmode ? `inputmode="${inputmode}"` : ""} ${hintId ? `aria-describedby="${hintId}"` : ""} />
      ${hint ? `<p class="admin-hint" id="${hintId}">${escapeHTML(hint)}</p>` : ""}
    </div>
  `;
}

// Un rango "mín – máx" ([35, 60])
function range({ label, name, value }) {
  const [min, max] = value ?? [];
  return `
    <fieldset class="admin-range">
      <legend class="eyebrow">${escapeHTML(label)}</legend>
      <div class="admin-pair">
        ${field({ label: "Mínimo", name: `${name}_min`, value: min, type: "number" })}
        ${field({ label: "Máximo", name: `${name}_max`, value: max, type: "number" })}
      </div>
    </fieldset>
  `;
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
