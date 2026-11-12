/* ============================================
   App — Main
   ============================================ */

// Punto de entrada de la app. Arranca en este orden:
//   1. apariencia (claro / oscuro / la del teléfono), antes de pintar
//   2. catálogo de terrarios (Supabase, o la copia guardada; ver store/catalog.js)
//   3. el reproductor chico de todo el sitio (layout/player-dock: necesita el
//      catálogo, y escucha al router desde la primera pantalla)
//   4. router (pinta la pantalla del hash actual)
//   5. service worker (app instalable y offline, ver sw.js)
//
// El loader de arranque (index.html, layout/boot/) ya está pintado y
// animándose de entrada (nada de esto lo espera): tapa la pantalla en
// blanco mientras carga el catálogo, que puede pedirle a Supabase. Él
// mismo decide cuándo sacarse (BOOT_MS como mínimo); acá solo se le avisa
// que ya se puede navegar.

import { get, subscribe } from "./store/store.js";
import { applyTheme } from "./utils/theme.js";
import { loadCatalog } from "./store/catalog.js";
import { mountPlayerDock } from "./layout/player-dock/player-dock.js";
import { startRouter } from "./router.js";

applyTheme((await get("prefs")).theme);
subscribe("prefs", (prefs) => applyTheme(prefs.theme));

await loadCatalog();
await mountPlayerDock();
await startRouter(document.querySelector("#view"));

window.dispatchEvent(new Event("filotaxia:ready"));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("[sw]", error));
}
