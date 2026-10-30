/* ============================================
   Views — Terrario
   ============================================ */

// Ficha del terrario: ilustración, número, nombre e historia.
// Se llega escaneando su QR (con la cámara del teléfono o desde Conectar):
// el link /t/<código> (views/qr) marca que llegó escaneando y abre la ficha,
// que entonces suma el terrario a la colección (no hace falta cuenta) y sigue
// directo a su pieza, el reproductor (views/escuchar).
// El primero que se escanea pasa a ser "Mi terrario".
// Sin escanear (por ejemplo, escribiendo #/terrario/03), un terrario que este
// teléfono no tiene conectado muestra "Sin conectar" y no se suma.
// Debajo de la historia, "Especificaciones", como en filotaxia.com: la ficha
// técnica (modelo, ecosistema, plantas…) y, en la misma lista, tres filas
// que son links, con una flecha: el próximo riego → Cuidados (o, si no es el
// propio, cuántos terrarios hay → Colección), sus notas → Bitácora
// (views/bitacora) y la duración de la pieza → el reproductor (views/escuchar).
// Arriba, "← Mi terrario" o "← Colección" a la izquierda (como en Escuchar)
// y Ajustes a la derecha.
// Más abajo, como en la página del terrario en filotaxia.com
// (terrario-secciones.js): Características (slider), Cómo funciona (la foto
// cambia al tocar cada paso, con GSAP) y Preguntas frecuentes al final.

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { isLinked, link, markScanned, linkedIds } from "../../store/collection.js";
import { takeScanIntent } from "../../utils/scan-intent.js";
import { claimIfFirst, myTerrarioId, lastCare } from "../../store/my-terrario.js";
import { entries } from "../../store/bitacora.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { toast } from "../../components/toast/toast.js";
import { formatDate, formatTime } from "../../utils/format.js";
import { nextCare, dueLabel } from "../../utils/care.js";
import { todayKey } from "../../utils/dates.js";
import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";
import { sections, bindSections, heading } from "./terrario-secciones.js";

export const title = ({ params }) => {
  const terrario = getTerrario(params.id);
  return terrario ? codeOf(terrario) : "Terrario";
};

export async function render(root, { params, from }) {
  const terrario = getTerrario(params.id);

  if (!terrario) {
    root.innerHTML = notFound();
    return;
  }

  // ¿Llegó escaneando su QR? Solo así se conecta y cuenta como
  // "Última conexión". Abrirla desde otra pantalla no cuenta.
  const scanned = takeScanIntent(terrario.id);

  if (!scanned && !(await isLinked(terrario.id))) {
    root.innerHTML = notConnected(terrario);
    return;
  }

  // Escaneo: se conecta y el QR lleva directo a la pieza (el reproductor).
  // replace(): la ficha no queda en el historial antes del reproductor.
  if (scanned) {
    const isNew = await link(terrario.id);
    await markScanned(terrario.id);
    const claimed = await claimIfFirst(terrario.id);
    if (claimed) toast(`${codeOf(terrario)} es tu terrario`);
    else if (isNew) toast(`${codeOf(terrario)} se sumó a tus terrarios`);
    location.replace(`#/escuchar/${terrario.id}`);
    return;
  }

  const isMine = (await myTerrarioId()) === terrario.id;
  const back = backTo(from, isMine);
  const today = todayKey();
  const notes = await entries(terrario.id);

  root.innerHTML = `
    <article class="screen terrario">
      <div class="terrario__top">
        <a class="back-link" href="${back.href}">${arrow("left")} ${back.label}</a>
        ${settingsLink()}
      </div>
      <div class="terrario__art reveal">${terrariumArt({ photo: terrario.photo })}</div>

      <div class="terrario__info reveal-stagger">
        <h1 class="title terrario__code" tabindex="-1">${escapeHTML(codeOf(terrario))}</h1>
        <p class="terrario__story lead">
          Un ecosistema vivo que empezó a sonar el ${formatDate(terrario.recorded)}.
          ${escapeHTML(terrario.story)}
        </p>
      </div>

      ${specs(terrario, [
        isMine ? await careRow(terrario, today) : await collectionRow(),
        ["Bitácora", notes.length === 1 ? "1 nota" : `${notes.length} notas`, `#/bitacora/${terrario.id}`],
        ["Pieza", formatTime(terrario.duration), `#/escuchar/${terrario.id}`, `Escuchar la pieza (${formatTime(terrario.duration)})`],
      ])}

      ${sections()}
    </article>
  `;

  return bindSections(root);
}

// "Especificaciones": filas con la etiqueta chica a la izquierda y el dato a
// la derecha. Al final, `links` ([etiqueta, dato, href, texto para lectores de
// pantalla opcional]): filas iguales, pero toda la fila es un link (el <a> del
// dato se estira con ::after en CSS).
function specs(terrario, links) {
  const rows = [
    ["Modelo", terrario.model],
    ["Ecosistema", terrario.specs?.ecosistema],
    ["Recipiente", terrario.specs?.recipiente],
    ["Medidas", terrario.specs?.medidas],
    ...(terrario.plants ?? []).map((plant, i) => [`Planta ${String(i + 1).padStart(2, "0")}`, plant]),
  ].filter(([, value]) => value);

  return `
    <section class="specs reveal" aria-labelledby="specs-title">
      ${heading("specs-title", "Especificaciones")}
      <dl class="specs__list">
        ${rows
          .map(([label, value]) => `
          <div class="specs__row">
            <dt class="specs__label">${escapeHTML(label)}</dt>
            <dd class="specs__value">${escapeHTML(value)}</dd>
          </div>`)
          .join("")}
        ${links
          .map(([label, value, href, ariaLabel = `${label}: ${value}`]) => `
          <div class="specs__row specs__row--link">
            <dt class="specs__label">${label}</dt>
            <dd class="specs__value">
              <a class="specs__link" href="${href}" aria-label="${escapeHTML(ariaLabel)}">${escapeHTML(value)} ${arrow()}</a>
            </dd>
          </div>`)
          .join("")}
      </dl>
    </section>
  `;
}

// "←" vuelve a donde estaba la persona (Mi terrario o Colección); si llegó
// de otro lado (el reproductor, Ajustes), a la sección de este terrario.
// La misma regla que el reproductor (views/escuchar).
function backTo(from = "", isMine) {
  if (from.startsWith("mi-terrario")) return { href: "#/mi-terrario", label: "Mi terrario" };
  if (from === "coleccion") return { href: "#/coleccion", label: "Colección" };
  return isMine ? { href: "#/mi-terrario", label: "Mi terrario" } : { href: "#/coleccion", label: "Colección" };
}

// El terrario propio: cuándo toca el próximo riego → la subpágina de cuidados
async function careRow(terrario, today) {
  const riego = nextCare({ last: await lastCare(terrario.id, "riego"), every: terrario.care.riego_days, today });
  return ["Próximo riego", dueLabel(riego.daysLeft), "#/mi-terrario/cuidados"];
}

// Uno que no es el propio: cuántos terrarios hay conectados → la colección
async function collectionRow() {
  const count = (await linkedIds()).length;
  return ["Mis terrarios", count === 1 ? "1 terrario" : `${count} terrarios`, "#/coleccion"];
}

// Un terrario que existe pero este teléfono no escaneó
function notConnected(terrario) {
  return `
    <section class="screen terrario terrario--empty">
      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario</p>
        <h1 class="title" tabindex="-1">${escapeHTML(codeOf(terrario))}</h1>
        <p class="lead">Escaneá el QR de su base para conectarlo y escuchar su pieza.</p>
      </div>
      <div class="screen__actions">
        <a class="btn btn--primary" href="#/escanear">Conectar</a>
      </div>
    </section>
  `;
}

function notFound() {
  return `
    <section class="screen terrario terrario--empty">
      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario</p>
        <h1 class="title" tabindex="-1">No encontramos este terrario</h1>
        <p class="lead">El código no corresponde a ningún terrario de Filotaxia. Probá escanearlo de nuevo.</p>
      </div>
      <div class="screen__actions">
        <a class="btn btn--primary" href="#/escanear">Volver a intentar</a>
      </div>
    </section>
  `;
}
