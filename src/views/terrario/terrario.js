/* ============================================
   Views — Terrario
   ============================================ */

// Ficha del terrario: ilustración, número, nombre e historia.
// Se llega escaneando su QR (desde la app o con la cámara del teléfono),
// así que abrirla ya suma el terrario a la colección: no hace falta cuenta.
// El primero que se escanea pasa a ser "Mi terrario" (se cambia desde ahí).
// Si el terrario trae ficha técnica (modelo, ecosistema, plantas…), se lista
// debajo de la historia, como en filotaxia.com.
// El primer escaneo de todos pasa antes por el Manifiesto (views/manifiesto),
// que termina en el reproductor de este terrario.

import { getTerrario } from "../../content/terrarios.js";
import { link } from "../../store/collection.js";
import { claimIfFirst, myTerrarioId } from "../../store/my-terrario.js";
import { get } from "../../store/store.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { toast } from "../../components/toast/toast.js";
import { formatDate } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";

export const title = ({ params }) => getTerrario(params.id)?.name ?? "Terrario";

export async function render(root, { params }) {
  const terrario = getTerrario(params.id);

  if (!terrario) {
    root.innerHTML = notFound();
    return;
  }

  const isNew = await link(terrario.id);
  const claimed = await claimIfFirst(terrario.id);
  const isMine = (await myTerrarioId()) === terrario.id;

  // Primer escaneo: la introducción a la biosonificación, antes de escuchar
  if (isNew && !(await get("manifiesto_seen"))) {
    location.replace(`#/manifiesto/${terrario.id}`);
    return;
  }

  root.innerHTML = `
    <article class="screen terrario">
      <div class="terrario__art reveal">${terrariumArt({ photo: terrario.photo })}</div>

      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario Nº ${escapeHTML(terrario.id)}</p>
        <h1 class="title" tabindex="-1">${escapeHTML(terrario.name)}</h1>
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
          : `<a class="text-link" href="#/coleccion">Ir a mi colección</a>`}
      </div>
    </article>
  `;

  if (claimed) toast(`${terrario.name} es tu terrario`);
  else if (isNew) toast(`${terrario.name} se sumó a tu colección`);
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

function notFound() {
  return `
    <section class="screen terrario terrario--empty">
      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario</p>
        <h1 class="title" tabindex="-1">No encontramos este terrario</h1>
        <p class="lead">El código no corresponde a ningún terrario de Filotaxia. Probá escanearlo de nuevo.</p>
      </div>
      <div class="screen__actions">
        <a class="btn btn--primary" href="#/escanear">Volver a escanear</a>
      </div>
    </section>
  `;
}
