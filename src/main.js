/* ============================================
   App — Main
   ============================================ */

// Punto de entrada de la app. Arranca en este orden:
//   1. apariencia (claro / oscuro / la del teléfono), antes de pintar
//   2. router (pinta la pantalla del hash actual)
//   3. service worker (app instalable y offline, ver sw.js)

import { get, subscribe } from "./store/store.js";
import { applyTheme } from "./utils/theme.js";
import { startRouter } from "./router.js";

applyTheme((await get("prefs")).theme);
subscribe("prefs", (prefs) => applyTheme(prefs.theme));

startRouter(document.querySelector("#view"));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("[sw]", error));
}
