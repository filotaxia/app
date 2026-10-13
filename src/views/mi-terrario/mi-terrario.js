/* ============================================
   Views — Mi terrario
   ============================================ */

// El terrario propio y sus cuidados (referencia: pantalla "Status." de una
// app de energía): el nombre del terrario como en la web ("Terrario01.") + "Armonía
// en plantas." en gris, la pieza musical como protagonista (su duración en
// gigante, con chips y "Escuchar") y bloques:
//
//   (foto)         la foto del terrario a todo el ancho; lleva a su ficha
//   Riego. | Luz.
//   Ventilación.   (medidor suave; no aparece en ecosistemas abiertos)
//   Plantas.       (si el terrario las tiene cargadas; el botón "Ondas" muestra sus ondas)
//   Cuidados.      (lleva a la subpágina con las preguntas frecuentes, views/cuidados)
//
// La ventilación se registra acá ("Ventilé hoy"). El riego ya no tiene botón:
// cuenta desde el último registrado en care_log o, si no hay, desde el día
// del escaneo. Las lecturas son simuladas hasta que haya sensores (ver utils/care.js).

import { getTerrario } from "../../content/terrarios.js";
import { CARE_FAQ } from "../../content/ayuda.js";
import { getPlanta, WAVE_NAMES } from "../../content/plantas.js";
import { get, set } from "../../store/store.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId, setMyTerrario, lastCare, logCare, loggedToday } from "../../store/my-terrario.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { themeDot } from "../../components/theme-dot/theme-dot.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { toast } from "../../components/toast/toast.js";
import { nextCare, dueLabel, readings } from "../../utils/care.js";
import { todayKey, daysBetween } from "../../utils/dates.js";
import { formatDate, formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon, arrow } from "../../utils/icons.js";
import { oppositeTheme } from "../../utils/theme.js";

export const title = "Mi terrario";

export async function render(root) {
  const terrario = getTerrario(await myTerrarioId());

  if (!terrario) {
    root.innerHTML = empty();
    bindThemeDot(root);
    return;
  }

  const today = todayKey();
  const { care } = terrario;
  const lastRiego = await lastCare(terrario.id, "riego");
  const lastVent = await lastCare(terrario.id, "ventilacion");
  const riego = nextCare({ last: lastRiego, every: care.riego_days, today });
  // Ecosistema abierto: no se ventila (ventilacion_days es null)
  const vent = care.ventilacion_days ? nextCare({ last: lastVent, every: care.ventilacion_days, today }) : null;
  const reading = readings({ terrario, today, daysSinceRiego: daysBetween(lastRiego, today) });

  root.innerHTML = `
    <section class="screen mine">
      <header class="mine__head reveal">
        <div>
          <h1 class="mine__title" tabindex="-1">Terrario${escapeHTML(terrario.id)}.</h1>
          <p class="mine__status">Armonía en plantas.</p>
        </div>
        ${themeDot()}
      </header>

      ${pieceHero(terrario)}

      <div class="blocks reveal-stagger">
        <a class="block block--full block--photo" href="#/terrario/${terrario.id}" aria-label="Ver la ficha de ${escapeHTML(terrario.name)}">
          ${terrariumArt({ photo: terrario.photo })}
        </a>
        ${block({
          title: "Riego",
          badge: `Cada ${care.riego_days} días`,
          icon: "calendar",
          value: dueLabel(riego.daysLeft),
        })}
        ${block({ title: "Luz", badge: care.light, icon: "sun", value: `${reading.lightHours} h` })}
        ${vent
          ? block({
              title: "Ventilación",
              badge: `Cada ${care.ventilacion_days} días`,
              value: dueLabel(vent.daysLeft),
              meter: { fraction: vent.fraction, tone: "soft" },
              action: careAction("ventilacion", "Ventilé hoy", await loggedToday(terrario.id, "ventilacion")),
              full: true,
            })
          : ""}
        ${plantsBlock(terrario)}
        ${block({
          title: "Cuidados",
          badge: `${CARE_FAQ.length} preguntas`,
          value: "Cómo cuidarlo",
          action: `<span class="block__go">${arrow()}</span>`,
          full: true,
          href: "#/mi-terrario/cuidados",
        })}
      </div>

      <div class="mine__footer">
        <button class="text-link" type="button" data-change>¿No es este? Cambiar terrario</button>
      </div>
    </section>
  `;

  root.querySelectorAll("[data-care]").forEach((button) => {
    button.addEventListener("click", async () => {
      const type = button.dataset.care;
      await logCare(terrario.id, type);
      toast(type === "riego" ? "Riego registrado" : "Ventilación registrada");
      window.dispatchEvent(new Event("filotaxia:refresh"));
    });
  });

  root.querySelector("[data-change]").addEventListener("click", () => openChange(terrario.id));
  bindPlants(root);
  bindThemeDot(root);
}

// El punto de arriba a la derecha: pasa al tema contrario y lo guarda en
// prefs (main.js lo aplica; Ajustes → Apariencia queda en Claro u Oscuro).
function bindThemeDot(root) {
  root.querySelector("[data-theme-dot]").addEventListener("click", async () => {
    const prefs = await get("prefs");
    await set("prefs", { ...prefs, theme: oppositeTheme(prefs.theme) });
  });
}

// El protagonista: la pieza musical del terrario, su duración en gigante.
// Debajo, un chip con la fecha en que se grabó y "Escuchar".
function pieceHero(terrario) {
  return `
    <div class="mine__hero reveal">
      <p class="mine__big" aria-hidden="true">${formatTime(terrario.duration)}</p>
      <p class="visually-hidden">Tu pieza dura ${formatTime(terrario.duration)}.</p>
    </div>

    <div class="mine__pieza reveal">
      <ul class="mine__chips" aria-label="Tu pieza">
        <li class="chip">Grabado ${formatDate(terrario.recorded)}</li>
      </ul>
      <a class="block__action" href="#/escuchar/${terrario.id}">${icon("play")} Escuchar</a>
    </div>
  `;
}

// Un bloque de dato: título con punto arriba a la izquierda, etiqueta arriba
// a la derecha, ícono (opcional) y valor grande abajo. Con `meter`, el fondo
// se llena de izquierda a derecha (como la batería de la referencia).
function block({ title, badge, icon: iconName, value, meter, action = "", full = false, href = "" }) {
  const tag = href ? "a" : "article";
  const classes = ["block", full && "block--full", meter && `block--${meter.tone}`].filter(Boolean).join(" ");
  const style = meter ? ` style="--fill: ${Math.round(meter.fraction * 100)}%"` : "";
  return `
    <${tag} class="${classes}"${style}${href ? ` href="${href}"` : ""}>
      ${meter ? `<span class="block__fill" aria-hidden="true"></span>` : ""}
      <h2 class="block__title">${title}.</h2>
      <span class="block__badge">${escapeHTML(badge)}</span>
      ${iconName ? `<span class="block__icon">${icon(iconName)}</span>` : ""}
      <p class="block__value${value.length > 9 ? " block__value--long" : ""}">${digits(value)}.</p>
      ${action}
    </${tag}>
  `;
}

// Aprieta el espacio entre cifras ("27" de "27 días") más que entre letras.
// El tracking va en todas las cifras menos la última: así lo que sigue
// ("días", "°") queda a la distancia de siempre.
// El texto se escapa en partes, para no partir un "&#39;" al buscar cifras.
function digits(text) {
  return String(text)
    .split(/(\d+)/)
    .map((part, i) => {
      if (i % 2 === 0) return escapeHTML(part);
      if (part.length === 1) return part;
      return `<span class="block__digits">${part.slice(0, -1)}</span>${part.slice(-1)}`;
    })
    .join("");
}

// Plantas del terrario, una por fila: foto, nombre y la forma de su hoja.
// El botón "Ondas" cambia la vista: el título pasa a "Ondas.", el botón a
// "Plantas" (para volver) y, en lugar
// de la foto y la hoja, cada fila muestra el dibujo de la onda con la que
// suena (según la forma de su hoja, content/plantas.js). Las dos versiones ya
// están en el HTML; el CSS muestra una u otra según data-view (ver bindPlants).
function plantsBlock(terrario) {
  if (!terrario.plants?.length) return "";
  const plantas = terrario.plants.map(getPlanta);
  const hasWaves = plantas.some((planta) => planta.wave);
  return `
    <article class="block block--full block--list" data-plants data-view="plantas">
      <h2 class="block__title" data-plants-title>Plantas.</h2>
      ${hasWaves
        ? `<button class="block__badge block__toggle" type="button" aria-label="Ver ondas" data-plants-toggle>Ondas</button>`
        : ""}
      <ol class="block__list">
        ${plantas.map(plantRow).join("")}
      </ol>
    </article>
  `;
}

function plantRow(planta, i) {
  return `
    <li class="plant">
      <span class="block__list-index">${String(i + 1).padStart(2, "0")}/</span>
      ${planta.photo ? `<img class="plant__photo" src="${planta.photo}" alt="" loading="lazy" decoding="async" />` : ""}
      ${planta.wave ? `<span class="plant__photo plant__wave-art" aria-hidden="true">${icon(`wave-${planta.wave}`)}</span>` : ""}
      <span class="plant__text">
        <span class="plant__name">${escapeHTML(planta.name)}</span>
        ${planta.wave
          ? `<span class="plant__detail plant__detail--leaf">Hoja ${planta.leafLabel.toLowerCase()}</span>
             <span class="plant__detail plant__detail--wave">Onda ${WAVE_NAMES[planta.wave].toLowerCase()}</span>`
          : ""}
      </span>
    </li>
  `;
}

// Botón del bloque de plantas: alterna entre ver las hojas y las ondas.
// El botón dice a qué vista lleva ("Ondas" o "Plantas").
function bindPlants(root) {
  const block = root.querySelector("[data-plants]");
  const toggle = root.querySelector("[data-plants-toggle]");
  if (!block || !toggle) return;
  const title = block.querySelector("[data-plants-title]");

  toggle.addEventListener("click", () => {
    const waves = block.dataset.view !== "ondas";
    block.dataset.view = waves ? "ondas" : "plantas";
    title.textContent = waves ? "Ondas." : "Plantas.";
    toggle.textContent = waves ? "Plantas" : "Ondas";
    toggle.setAttribute("aria-label", waves ? "Ver plantas" : "Ver ondas");
  });
}

function careAction(type, label, doneToday) {
  if (doneToday) {
    return `<span class="block__action block__action--done">${icon("check")} Hecho hoy</span>`;
  }
  return `<button class="block__action" type="button" data-care="${type}">${label}</button>`;
}

// Hoja para elegir cuál de los terrarios escaneados es el propio
async function openChange(currentId) {
  const terrarios = (await linkedIds()).map(getTerrario).filter(Boolean);
  const sheet = openSheet({
    title: "¿Cuál es tu terrario?",
    body: `
      <ul class="pick">
        ${terrarios
          .map(
            (terrario) => `
          <li>
            <button class="pick__row" type="button" data-pick="${terrario.id}" ${terrario.id === currentId ? 'aria-current="true"' : ""}>
              <span class="pick__art">${terrariumArt({ size: "sm", photo: terrario.photo })}</span>
              <span class="pick__text">
                <span class="eyebrow">Nº ${escapeHTML(terrario.id)}</span>
                <span class="pick__name">${escapeHTML(terrario.name)}</span>
              </span>
              ${terrario.id === currentId ? icon("check") : ""}
            </button>
          </li>`,
          )
          .join("")}
      </ul>
    `,
  });

  sheet.element.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", async () => {
      await setMyTerrario(button.dataset.pick);
      sheet.close();
      window.dispatchEvent(new Event("filotaxia:refresh"));
    });
  });
}

function empty() {
  return `
    <section class="screen mine mine--empty">
      <div class="mine__head reveal">
        <div>
          <h1 class="mine__title" tabindex="-1">Mi terrario.</h1>
          <p class="mine__status">Todavía no lo escaneaste.</p>
        </div>
        ${themeDot()}
      </div>
      <div class="screen__actions">
        <p class="lead">Escaneá el QR que está en la base de tu terrario para ver sus cuidados.</p>
        <a class="btn btn--primary" href="#/escanear">${icon("scan-line")} Escanear QR</a>
      </div>
    </section>
  `;
}
