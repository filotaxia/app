/* ============================================
   Views — Mi terrario
   ============================================ */

// El terrario propio y sus cuidados (referencia: pantalla "Status." de una
// app de energía): nombre con punto + frase de estado en gris, la humedad
// del aire en gigante con su tendencia, chips de contexto y bloques:
//
//   Riego.         (bloque de acento: se vacía a medida que se acerca el riego)
//   Luz. | Temperatura.
//   Ventilación.   (medidor suave; no aparece en ecosistemas abiertos)
//   Plantas.       (si el terrario las tiene cargadas)
//   Sonido. | Con vos.
//   Cuidados.      (preguntas frecuentes, de filotaxia.com)
//
// Riego y ventilación se registran acá ("Regué hoy"); las lecturas son
// simuladas hasta que haya sensores (ver utils/care.js).

import { getTerrario } from "../../content/terrarios.js";
import { CARE_FAQ } from "../../content/ayuda.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId, setMyTerrario, lastCare, logCare, loggedToday, linkedOn } from "../../store/my-terrario.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { toast } from "../../components/toast/toast.js";
import { nextCare, dueLabel, readings, careStatus } from "../../utils/care.js";
import { todayKey, daysBetween } from "../../utils/dates.js";
import { formatDate, formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export const title = "Mi terrario";

export async function render(root) {
  const terrario = getTerrario(await myTerrarioId());

  if (!terrario) {
    root.innerHTML = empty();
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
  const status = careStatus({ care, reading, riegoLeft: riego.daysLeft, ventilacionLeft: vent?.daysLeft ?? null });
  const sinceDate = await linkedOn(terrario.id);
  const sinceDays = daysBetween(sinceDate, today) + 1;   // el día que se escaneó cuenta como el primero
  const trend = Math.sign(reading.humidity - reading.yesterdayHumidity);
  const trendWord = trend > 0 ? "subió" : trend < 0 ? "bajó" : "igual que";

  root.innerHTML = `
    <section class="screen mine">
      <header class="mine__head reveal">
        <div>
          <h1 class="mine__title" tabindex="-1">${escapeHTML(terrario.name)}.</h1>
          <p class="mine__status">${status}</p>
        </div>
        <a class="mine__thumb" href="#/terrario/${terrario.id}" aria-label="Ver la ficha de ${escapeHTML(terrario.name)}">
          ${terrariumArt({ size: "sm", photo: terrario.photo })}
        </a>
      </header>

      <div class="mine__hero reveal">
        <p class="mine__big ${reading.humidity >= 100 ? "mine__big--long" : ""}" aria-hidden="true">${reading.humidity}%</p>
        ${trend ? `<span class="mine__trend mine__trend--${trend > 0 ? "up" : "down"}" aria-hidden="true"></span>` : ""}
        <p class="visually-hidden">Humedad del aire: ${reading.humidity}%, ${trendWord} ayer (${reading.yesterdayHumidity}%).</p>
      </div>

      <ul class="mine__chips reveal" aria-label="Humedad">
        <li class="chip">Humedad del aire</li>
        <li class="chip">Ideal ${care.humidity[0]}–${care.humidity[1]}%</li>
        <li class="chip">Ayer ${reading.yesterdayHumidity}%</li>
      </ul>

      <div class="blocks reveal-stagger">
        ${block({
          title: "Riego",
          badge: `Cada ${care.riego_days} días`,
          value: dueLabel(riego.daysLeft),
          meter: { fraction: riego.fraction, tone: "accent" },
          action: careAction("riego", "Regué hoy", await loggedToday(terrario.id, "riego")),
          full: true,
        })}
        ${block({ title: "Luz", badge: care.light, icon: "sun", value: `${reading.lightHours} h` })}
        ${block({ title: "Temperatura", badge: `Ideal ${care.temp[0]}–${care.temp[1]}°`, icon: "thermometer", value: `${reading.temp}°` })}
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
        ${block({ title: "Sonido", badge: "Escuchar", icon: "audio-lines", value: formatTime(terrario.duration), href: `#/escuchar/${terrario.id}` })}
        ${block({ title: "Con vos", badge: `Desde ${formatDate(sinceDate)}`, icon: "sprout", value: sinceDays === 1 ? "1 día" : `${sinceDays} días` })}
      </div>

      <section class="faq reveal" aria-labelledby="faq-title">
        <h2 class="faq__title" id="faq-title">Cuidados.</h2>
        ${CARE_FAQ.map(([question, answer]) => `
          <details class="faq__item">
            <summary class="faq__question">${question}</summary>
            <p class="faq__answer lead">${answer}</p>
          </details>`).join("")}
      </section>

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
      <p class="block__value${value.length > 9 ? " block__value--long" : ""}">${escapeHTML(value)}.</p>
      ${action}
    </${tag}>
  `;
}

// Plantas del terrario, una por fila, con el tipo de ecosistema como etiqueta
function plantsBlock(terrario) {
  if (!terrario.plants?.length) return "";
  const ecosistema = terrario.specs?.ecosistema;
  return `
    <article class="block block--full block--list">
      <h2 class="block__title">Plantas.</h2>
      ${ecosistema ? `<span class="block__badge">Ecosistema ${escapeHTML(ecosistema.toLowerCase())}</span>` : ""}
      <ol class="block__list">
        ${terrario.plants
          .map((plant, i) => `
          <li><span class="block__list-index">${String(i + 1).padStart(2, "0")}</span>${escapeHTML(plant)}</li>`)
          .join("")}
      </ol>
    </article>
  `;
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
      </div>
      <div class="screen__actions">
        <p class="lead">Escaneá el QR que está en la base de tu terrario para ver sus cuidados.</p>
        <a class="btn btn--primary" href="#/escanear">${icon("scan-line")} Escanear QR</a>
      </div>
    </section>
  `;
}
