/* ============================================
   Views — QR
   ============================================ */

// #/t/k7f2q9 — adonde llega el QR impreso en la base de cada terrario.
//
// El QR lleva https://app.filotaxia.com/t/k7f2q9; 404.html lo pasa a
// #/t/k7f2q9 y esta vista busca de qué terrario es ese código
// (store/catalog.js: si no lo conoce, le pregunta de nuevo a Supabase).
// - Si lo encuentra: marca que llegó escaneando (utils/scan-intent.js) y
//   abre su ficha, que lo conecta. replace(): esta pantalla no queda en el
//   historial, así "volver" no reconecta.
// - Si Supabase dice que no existe: "No encontramos este terrario", con salida a Conectar.
// - Si no se pudo preguntar (sin red): "Sin conexión" y "Reintentar". Un QR
//   válido nunca tiene que parecer muerto por falta de internet.
// También llega acá el escáner de la app (views/escanear).

import { findByQr, CatalogOfflineError } from "../../store/catalog.js";
import { markScanIntent } from "../../utils/scan-intent.js";

export const title = "Conectando";
export const nav = false;

export async function render(root, { params }) {
  let terrario;
  try {
    terrario = await findByQr(params.code.toLowerCase());
  } catch (error) {
    if (!(error instanceof CatalogOfflineError)) throw error;
    root.innerHTML = offline();
    // Vuelve a pintar esta misma pantalla, que vuelve a buscar
    root.querySelector("[data-retry]").addEventListener("click", () => {
      window.dispatchEvent(new Event("filotaxia:refresh"));
    });
    return;
  }

  if (terrario) {
    markScanIntent(terrario.id);
    location.replace(`#/terrario/${terrario.id}`);
    return;
  }

  // Mismo estado vacío que la ficha (views/terrario/terrario.css)
  root.innerHTML = `
    <section class="screen terrario terrario--empty">
      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario</p>
        <h1 class="title" tabindex="-1">No encontramos este terrario</h1>
        <p class="lead">Revisá que el QR sea el de la base de un terrario Filotaxia.</p>
      </div>
      <div class="screen__actions">
        <a class="btn btn--primary" href="#/escanear">Conectar</a>
      </div>
    </section>
  `;
}

function offline() {
  return `
    <section class="screen terrario terrario--empty">
      <div class="terrario__info reveal-stagger">
        <p class="eyebrow">Terrario</p>
        <h1 class="title" tabindex="-1">Sin conexión</h1>
        <p class="lead">Para conectar este terrario hace falta internet. Revisá tu conexión y probá de nuevo.</p>
      </div>
      <div class="screen__actions">
        <button class="btn btn--primary" type="button" data-retry>Reintentar</button>
      </div>
    </section>
  `;
}
