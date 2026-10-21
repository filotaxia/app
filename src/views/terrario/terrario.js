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
// Si el terrario trae ficha técnica (modelo, ecosistema, plantas…), se lista
// debajo de la historia, como en filotaxia.com.
// Al pie: "Escuchar" (el reproductor), sus cuidados o la colección, y su
// Bitácora (views/bitacora). Ajustes queda arriba a la derecha.

import { getTerrario, codeOf } from "../../content/terrarios.js";
import { isLinked, link, markScanned } from "../../store/collection.js";
import { takeScanIntent } from "../../utils/scan-intent.js";
import { claimIfFirst, myTerrarioId } from "../../store/my-terrario.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { toast } from "../../components/toast/toast.js";
import { formatDate } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";

export const title = ({ params }) => {
  const terrario = getTerrario(params.id);
  return terrario ? codeOf(terrario) : "Terrario";
};

export async function render(root, { params }) {
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

  root.innerHTML = `
    <article class="screen terrario">
      <div class="terrario__top">${settingsLink()}</div>
      <div class="terrario__art reveal">${terrariumArt({ photo: terrario.photo })}</div>

      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario</p>
        <h1 class="title" tabindex="-1">${escapeHTML(codeOf(terrario))}</h1>
        <p class="terrario__story lead">
          Un ecosistema vivo que empezó a sonar el ${formatDate(terrario.recorded)}.
          ${escapeHTML(terrario.story)}
        </p>
      </div>

      ${specs(terrario)}

      <div class="screen__actions">
        <a class="btn btn--primary" href="#/escuchar/${terrario.id}">Escuchar</a>
        ${isMine
          ? `<a class="text-link" href="#/mi-terrario">Ver sus cuidados</a>`
          : `<a class="text-link" href="#/coleccion">Ir a mis terrarios</a>`}
        <a class="text-link" href="#/bitacora/${terrario.id}">Ver su bitácora</a>
      </div>
    </article>
  `;

}

// "Especificaciones": filas con la etiqueta chica a la izquierda y el dato a la derecha
function specs(terrario) {
  const rows = [
    ["Modelo", terrario.model],
    ["Ecosistema", terrario.specs?.ecosistema],
    ["Recipiente", terrario.specs?.recipiente],
    ["Medidas", terrario.specs?.medidas],
    ...(terrario.plants ?? []).map((plant, i) => [`Planta ${String(i + 1).padStart(2, "0")}`, plant]),
  ].filter(([, value]) => value);

  if (!rows.length) return "";

  return `
    <section class="specs reveal" aria-labelledby="specs-title">
      <h2 class="eyebrow" id="specs-title">Especificaciones</h2>
      <dl class="specs__list">
        ${rows
          .map(([label, value]) => `
          <div class="specs__row">
            <dt class="specs__label">${escapeHTML(label)}</dt>
            <dd class="specs__value">${escapeHTML(value)}</dd>
          </div>`)
          .join("")}
      </dl>
    </section>
  `;
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
