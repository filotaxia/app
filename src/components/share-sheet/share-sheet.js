/* ============================================
   Components — Share Sheet
   ============================================ */

// Compartir una pieza, como en Spotify: una hoja (components/sheet) con
//
//   la vista previa   la historia: el fondo elegido y, al centro, la tarjeta
//                     oscura con la foto, el nombre ("TR03"), "Filotaxia" y
//                     el logotipo
//   los fondos        tres círculos para elegirlo: gris, degradado, negro
//   las opciones      Copiar enlace · WhatsApp · Historias · Mensajes · Más
//
// El enlace lleva al reproductor de ese terrario (#/escuchar/03), no al link
// del QR (/t/…): ese conecta el terrario, y compartir no tiene que conectar.
// "Historias" arma la imagen (utils/share-card.js) y abre el menú de
// compartir del teléfono con ella (ahí se elige Instagram); si el navegador
// no puede compartir archivos, la descarga.
//
//   openShareSheet(terrario)

import { codeOf } from "../../content/terrarios.js";
import { openSheet } from "../sheet/sheet.js";
import { terrariumArt } from "../terrarium-art/terrarium-art.js";
import { shareCardImage } from "../../utils/share-card.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

const BACKGROUNDS = [
  ["gris", "Gris"],
  ["degradado", "Degradado"],
  ["negro", "Negro"],
];

export function openShareSheet(terrario) {
  const name = codeOf(terrario);
  const url = `${location.origin}${location.pathname}#/escuchar/${terrario.id}`;
  const text = `Escuchá ${name}, la pieza de un terrario de Filotaxia.`;
  const message = `${text} ${url}`;

  const sheet = openSheet({
    title: "Compartir",
    body: `
      <div class="share">
        <div class="share__story" data-story data-bg="${BACKGROUNDS[0][0]}">
          <div class="share__card" data-card>
            <div class="share__photo" data-photo>${terrariumArt({ photo: terrario.photo })}</div>
            <p class="share__name" data-name>${escapeHTML(name)}</p>
            <p class="share__meta" data-meta>Filotaxia</p>
            <span class="share__logo" aria-hidden="true"></span>
          </div>
        </div>

        <div class="share__backgrounds" role="radiogroup" aria-label="Fondo de la imagen">
          ${BACKGROUNDS.map(([key, label], i) => `
            <button class="share__background share__background--${key}" type="button" role="radio"
              data-background="${key}" aria-checked="${i === 0}" aria-label="${label}"></button>`).join("")}
        </div>

        <ul class="share__apps" role="list">
          ${app("button", `data-copy`, "link", "Copiar enlace")}
          ${app("a", `href="https://wa.me/?text=${encodeURIComponent(message)}" target="_blank" rel="noopener"`, "message-circle", "WhatsApp")}
          ${app("button", `data-story-share`, "instagram", "Historias")}
          ${app("a", `href="sms:?&body=${encodeURIComponent(message)}"`, "message-square", "Mensajes")}
          ${navigator.share ? app("button", `data-more`, "share", "Más") : ""}
        </ul>
      </div>
    `,
  });

  const root = sheet.element;
  const story = root.querySelector("[data-story]");
  const card = { photo: terrario.photo, name, meta: "Filotaxia" };

  // La imagen se arma de antemano (al abrir y al cambiar el fondo): el
  // iPhone solo deja abrir su menú de compartir apenas se toca el botón,
  // sin esperas en el medio. `version`: si se cambia de fondo rápido, solo
  // vale la imagen del último
  let image = null;
  let version = 0;
  const prepare = async () => {
    const mine = ++version;
    image = null;
    const blob = await shareCardImage(story, card);
    if (mine !== version) return;
    image = blob && new File([blob], `filotaxia-${name.toLowerCase()}.png`, { type: "image/png" });
  };
  prepare();

  // Fondo: el círculo elegido cambia la vista previa (y la imagen)
  root.querySelectorAll("[data-background]").forEach((button) => {
    button.addEventListener("click", () => {
      story.dataset.bg = button.dataset.background;
      root.querySelectorAll("[data-background]").forEach((other) => {
        other.setAttribute("aria-checked", String(other === button));
      });
      prepare();
    });
  });

  // Copiar enlace: el aviso va en el mismo botón (los toasts quedan detrás de la hoja)
  root.querySelector("[data-copy]").addEventListener("click", async (event) => {
    const label = event.currentTarget.querySelector("[data-label]");
    flash(label, (await copyText(url)) ? "Copiado" : "No se pudo");
  });

  // Historias: el menú de compartir del teléfono con la imagen; si no se
  // puede compartir un archivo, se descarga
  root.querySelector("[data-story-share]").addEventListener("click", async (event) => {
    const label = event.currentTarget.querySelector("[data-label]");
    if (!image) await prepare();
    if (!image) return flash(label, "No se pudo");
    if (navigator.canShare?.({ files: [image] })) {
      try {
        await navigator.share({ files: [image] });
      } catch {
        // la persona cerró el menú: no pasa nada
      }
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(image);
    link.download = image.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    flash(label, "Descargada");
  });

  // Más: el menú de compartir del teléfono con el enlace
  root.querySelector("[data-more]")?.addEventListener("click", async () => {
    try {
      await navigator.share({ title: name, text, url });
    } catch {
      // la persona cerró el menú
    }
  });
}

// Una opción: el círculo con su ícono y el nombre debajo (botón o link)
function app(tag, attributes, iconName, label) {
  const type = tag === "button" ? ' type="button"' : "";
  return `
    <li>
      <${tag} class="share__app"${type} ${attributes}>
        <span class="share__app-icon">${icon(iconName)}</span>
        <span class="share__app-label" data-label>${label}</span>
      </${tag}>
    </li>
  `;
}

// Copia un texto. Primero con el portapapeles moderno; si el navegador no lo
// deja (los navegadores de adentro de Instagram o WhatsApp, por ejemplo),
// con el método viejo: un campo escondido, seleccionado y "copiar".
// Devuelve si pudo.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.querySelector("dialog[open]")?.append(field) ?? document.body.append(field);
    field.select();
    field.setSelectionRange(0, text.length);   // iPhone
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}

// Cambia el texto de una opción por un momento ("Copiado") y lo devuelve
function flash(label, message) {
  const original = label.dataset.original ?? label.textContent;
  label.dataset.original = original;
  label.textContent = message;
  setTimeout(() => { label.textContent = original; }, 1800);
}
