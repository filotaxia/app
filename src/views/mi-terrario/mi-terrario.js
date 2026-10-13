/* ============================================
   Views — Mi terrario
   ============================================ */

// Mi terrario (#/mi-terrario; la primera de la barra): el terrario propio
// (referencia: pantalla "Status." de una app de energía):
// "Filotaxia." + "Armonía en plantas." en gris, Ajustes arriba a la derecha,
// el nombre del terrario en gigante ("TR01", con un chip y "Escuchar") y bloques:
//
//   (foto)              la foto del terrario a todo el ancho; lleva a su ficha
//   Bitácora. | Pieza.  la bitácora lleva a su pantalla (views/bitacora); Pieza
//                       (la duración) lleva al reproductor y tiene el QR chico
//                       arriba a la derecha, que abre el escaneo
//   Ventilación.        (medidor suave; no aparece en ecosistemas abiertos)
//   Plantas.            (si el terrario las tiene cargadas; el botón "Ondas" muestra sus ondas)
//   Cuidados.           (lleva a la subpágina: riego, guía y preguntas frecuentes)
//
// La ventilación se registra acá ("Ventilé hoy"). Las lecturas son simuladas
// hasta que haya sensores (ver utils/care.js).

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { CARE_FAQ } from "../../content/ayuda.js";
import { myTerrarioId, lastCare, logCare, loggedToday } from "../../store/my-terrario.js";
import { entries } from "../../store/bitacora.js";
import { lastScanOn } from "../../store/collection.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { block, digits } from "../../components/block/block.js";
import { plantsBlock, bindPlants } from "../../components/plants-block/plants-block.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { toast } from "../../components/toast/toast.js";
import { nextCare, dueLabel } from "../../utils/care.js";
import { todayKey, daysBetween } from "../../utils/dates.js";
import { formatDate, formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon, arrow } from "../../utils/icons.js";

export const title = "Mi terrario";

export async function render(root) {
  const terrario = getTerrario(await myTerrarioId());

  if (!terrario) {
    root.innerHTML = empty();
    return;
  }

  const today = todayKey();
  const { care } = terrario;
  // Ecosistema abierto: no se ventila (ventilacion_days es null)
  const vent = care.ventilacion_days
    ? nextCare({ last: await lastCare(terrario.id, "ventilacion"), every: care.ventilacion_days, today })
    : null;
  const notes = await entries(terrario.id);
  const lastScan = await lastScanOn(terrario.id);

  root.innerHTML = `
    <section class="screen mine">
      ${head("Filotaxia.", "Armonía en plantas.")}

      ${pieceHero(terrario, lastScan)}

      <div class="blocks reveal-stagger">
        <a class="block block--full block--photo" href="#/terrario/${terrario.id}" aria-label="Ver la ficha de ${escapeHTML(codeOf(terrario))}">
          ${terrariumArt({ photo: terrario.photo })}
        </a>
        ${block({
          title: "Bitácora",
          badge: notes.length ? `Última: ${dueLabel(-daysBetween(notes[0].date, today)).toLowerCase()}` : "Notas y fotos",
          value: notes.length === 1 ? "1 nota" : `${notes.length} notas`,
          href: `#/bitacora/${terrario.id}`,
        })}
        ${pieceBlock(terrario)}
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
          value: "Cómo cuidarlo.",
          action: `<span class="block__go">${arrow()}</span>`,
          full: true,
          href: "#/mi-terrario/cuidados",
        })}
      </div>
    </section>
  `;

  root.querySelectorAll("[data-care]").forEach((button) => {
    button.addEventListener("click", async () => {
      await logCare(terrario.id, button.dataset.care);
      toast("Ventilación registrada");
      window.dispatchEvent(new Event("filotaxia:refresh"));
    });
  });

  bindPlants(root);
}

// Encabezado de dos líneas (la segunda en gris) y Ajustes a la derecha
function head(title, status) {
  return `
    <header class="mine__head reveal">
      <div>
        <h1 class="mine__title" tabindex="-1">${title}</h1>
        <p class="mine__status">${status}</p>
      </div>
      ${settingsLink()}
    </header>
  `;
}

// El protagonista: el nombre del terrario en gigante ("TR01").
// Debajo, un chip con la última conexión (la última vez que se escaneó
// su QR) y "Escuchar".
function pieceHero(terrario, lastScan) {
  return `
    <div class="mine__hero reveal">
      <p class="mine__big" aria-hidden="true">${escapeHTML(codeOf(terrario))}</p>
      <p class="visually-hidden">Tu terrario es el ${escapeHTML(codeOf(terrario))}.</p>
    </div>

    <div class="mine__pieza reveal">
      <ul class="mine__chips" aria-label="Tu terrario">
        <li class="chip">Última conexión ${formatDate(lastScan)}</li>
      </ul>
      <a class="block__action" href="#/escuchar/${terrario.id}">${icon("play")} Escuchar</a>
    </div>
  `;
}

// El bloque Pieza (la duración): todo el bloque lleva al reproductor (el
// link del título, estirado con ::after en CSS) y el QR de
// la esquina, que queda por encima, abre el escaneo para sumar otro terrario.
function pieceBlock(terrario) {
  const duration = formatTime(terrario.duration);
  return `
    <article class="block block--pieza">
      <h2 class="block__title pieza__title">
        <a class="pieza__link" href="#/escuchar/${terrario.id}" aria-label="Pieza: ${duration}. Escuchar">Pieza.</a>
      </h2>
      <a class="pieza__scan" href="#/escanear" aria-label="Conectar otro terrario">${icon("qr-code")}</a>
      <span class="block__badge">Duración</span>
      <p class="block__value">${digits(duration)}</p>
    </article>
  `;
}

function careAction(type, label, doneToday) {
  if (doneToday) {
    return `<span class="block__action block__action--done">${icon("check")} Hecho hoy</span>`;
  }
  return `<button class="block__action" type="button" data-care="${type}">${label}</button>`;
}

function empty() {
  return `
    <section class="screen mine mine--empty">
      ${head("Filotaxia.", "Conectá tu terrario.")}
      <div class="screen__actions">
        <p class="lead">Conectalo con el QR de su base para ver sus cuidados.</p>
        <a class="btn btn--primary" href="#/escanear">${icon("scan-line")} Conectar mi terrario</a>
      </div>
    </section>
  `;
}
