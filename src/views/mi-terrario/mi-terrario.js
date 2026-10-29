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
//   Plantas.            (si el terrario las tiene cargadas; el botón "Ondas" muestra sus ondas)
//   Cuidados.           (lleva a la subpágina: riego, guía y preguntas frecuentes)

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { CARE_FAQ } from "../../content/ayuda.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { entries } from "../../store/bitacora.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { block, digits } from "../../components/block/block.js";
import { plantsBlock, bindPlants } from "../../components/plants-block/plants-block.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { connectLoop } from "../../components/connect-loop/connect-loop.js";
import { dueLabel } from "../../utils/care.js";
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
  const notes = await entries(terrario.id);

  root.innerHTML = `
    <section class="screen mine">
      ${head("Filotaxia.", "Armonía en plantas.")}

      ${pieceHero(terrario)}

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
// Debajo, un chip con el día en que se creó (`recorded`: el día que empezó
// a sonar, el mismo que el panel llama "Empezó a sonar") y "Escuchar".
function pieceHero(terrario) {
  return `
    <div class="mine__hero reveal">
      <p class="mine__big" aria-hidden="true">${escapeHTML(codeOf(terrario))}</p>
      <p class="visually-hidden">Tu terrario es el ${escapeHTML(codeOf(terrario))}.</p>
    </div>

    <div class="mine__pieza reveal">
      <ul class="mine__chips" aria-label="Tu terrario">
        ${terrario.recorded ? `<li class="chip">Creado ${formatDate(terrario.recorded)}</li>` : ""}
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

function empty() {
  return `
    <section class="screen mine mine--empty">
      ${head("Filotaxia.", "Conectá tu terrario.")}
      <div class="mine__connect reveal">${connectLoop()}</div>
      <div class="screen__actions">
        <p class="lead">Conectalo con el QR de su base para ver sus cuidados.</p>
        <a class="btn btn--primary" href="#/escanear">${icon("scan-line")} Conectar mi terrario</a>
      </div>
    </section>
  `;
}
