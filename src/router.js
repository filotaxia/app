/* ============================================
   App — Router
   ============================================ */

// Router por hash. Las rutas de la app:
//   #/inicio                 splash
//   #/mi-terrario            el terrario propio y sus cuidados
//   #/mi-terrario/cuidados   riego, ventilación, plantas y la guía general
//   #/escanear               escaneo del QR (desde el bloque Pieza)
//   #/t/k7f2q9               adonde llega el QR impreso (/t/k7f2q9, vía 404.html):
//                            busca el terrario de ese código y abre su ficha conectándolo
//   #/terrario/04            ficha de un terrario (solo conecta si se llega escaneando)
//   #/escuchar/04            reproductor (#/escuchar solo → el terrario propio)
//   #/bitacora/04            bitácora de un terrario
//   #/coleccion              mi colección
//   #/ajustes                ajustes (desde el punto de arriba a la derecha)
//   #/filotaxia              la experiencia paso a paso (antes, la hoja Ayuda de Ajustes)
//   #/manifiesto/04          introducción, una sola vez tras el primer escaneo
//   #/manifiesto             la misma, desde la barra (termina en Mi terrario)
//
// La barra de abajo: Mi terrario · Colección · Conectar · Manifiesto · Guía.
//
// No hay cuentas: la colección vive en el teléfono.
//
// Cada vista exporta:
//   title               texto o función (ctx) => texto (pestaña y header)
//   subtitle            opcional, igual que title (debajo del título del header)
//   header              true → se muestra el header grande (título + subtítulo)
//   nav                 false → sin barra (el splash); o función (ctx) => boolean
//                       (el Manifiesto la esconde solo en el primer escaneo)
//   back                opcional: hash de la flecha de volver del header
//                       (texto o función (ctx) => texto)
//   render(root, ctx)   pinta la vista; puede devolver una función de limpieza
//
// ctx = { params: { id }, from: "coleccion" }   (from: la ruta de la que se viene)
//
// Para volver a pintar la vista actual desde cualquier lado:
//   window.dispatchEvent(new Event("filotaxia:refresh"))

import * as inicio from "./views/inicio/inicio.js";
import * as miTerrario from "./views/mi-terrario/mi-terrario.js";
import * as escanear from "./views/escanear/escanear.js";
import * as terrario from "./views/terrario/terrario.js";
import * as qr from "./views/qr/qr.js";
import * as coleccion from "./views/coleccion/coleccion.js";
import * as escuchar from "./views/escuchar/escuchar.js";
import * as bitacora from "./views/bitacora/bitacora.js";
import * as ajustes from "./views/ajustes/ajustes.js";
import * as cuidados from "./views/cuidados/cuidados.js";
import * as filotaxia from "./views/filotaxia/filotaxia.js";
import * as manifiesto from "./views/manifiesto/manifiesto.js";
import { setHeader, focusHeaderTitle } from "./layout/header/header.js";

// ":id" es un parámetro; "?" lo hace opcional
const ROUTES = [
  ["inicio", inicio],
  ["mi-terrario", miTerrario],
  ["mi-terrario/cuidados", cuidados],
  ["escanear", escanear],
  ["t/:code", qr],
  ["terrario/:id", terrario],
  ["escuchar/:id?", escuchar],
  ["bitacora/:id", bitacora],
  ["coleccion", coleccion],
  ["ajustes", ajustes],
  ["filotaxia", filotaxia],
  ["manifiesto/:id?", manifiesto],
];
const DEFAULT_ROUTE = "inicio";

const shell = document.querySelector("[data-app-shell]");
const headerEl = document.querySelector("[data-header]");
const navEl = document.querySelector("[data-nav]");

let outlet = null;
let cleanupView = null;
let navigationId = 0;   // para descartar renders viejos si se navega muy rápido
let isFirstRender = true;
let currentRoute = "";  // la ruta de la pantalla actual
let previousRoute = ""; // y la de la anterior (ctx.from)

export function startRouter(container) {
  outlet = container;
  window.addEventListener("hashchange", () => render({ moveFocus: true }));
  window.addEventListener("filotaxia:refresh", () => render({ moveFocus: false, refresh: true }));
  render({ moveFocus: false });
}

// "#/terrario/04" → "terrario/04"
function currentPath() {
  return location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
}

// Busca la ruta que corresponde al path y saca sus parámetros
function match(path) {
  const parts = path.split("/");
  for (const [pattern, view] of ROUTES) {
    const segments = pattern.split("/");
    const required = segments.filter((segment) => !segment.endsWith("?")).length;
    if (parts.length < required || parts.length > segments.length) continue;

    const params = {};
    const ok = segments.every((segment, i) => {
      if (segment.startsWith(":")) {
        if (parts[i] !== undefined) params[segment.slice(1).replace("?", "")] = decodeURIComponent(parts[i]);
        return true;
      }
      return segment === parts[i];
    });
    if (ok) return { view, params, section: segments[0] };
  }
  return null;
}

async function render({ moveFocus, refresh = false }) {
  const path = currentPath();
  const found = match(path);

  // Hash vacío o desconocido → inicio. replace() no deja la ruta inválida
  // en el historial; el cambio de hash vuelve a disparar render().
  if (!found) {
    location.replace(`#/${DEFAULT_ROUTE}`);
    return;
  }

  const { view, params, section } = found;
  const id = ++navigationId;
  // Al volver a pintar la misma pantalla (filotaxia:refresh), from no cambia
  if (!refresh) previousRoute = currentRoute;
  currentRoute = path;
  const ctx = { params, from: previousRoute };

  // 1. Limpiar la vista anterior
  cleanupView?.();
  cleanupView = null;

  // 2. Marco: header y barra según la vista (antes de pintar, así la
  //    vista ya mide bien su alto disponible)
  const showNav = typeof view.nav === "function" ? view.nav(ctx) : view.nav !== false;
  shell.toggleAttribute("data-nav", showNav);
  navEl.toggleAttribute("hidden", !showNav);
  headerEl.toggleAttribute("hidden", !view.header);

  // 3. Renderizar la nueva en un contenedor propio
  const viewRoot = document.createElement("div");
  viewRoot.className = "view container";
  const cleanup = await view.render(viewRoot, ctx);

  // Si mientras esperábamos se navegó a otra pantalla, este render ya no sirve
  if (id !== navigationId) {
    if (typeof cleanup === "function") cleanup();
    return;
  }

  outlet.replaceChildren(viewRoot);
  cleanupView = typeof cleanup === "function" ? cleanup : null;

  // 4. Actualizar el resto de la app
  const title = await resolve(view.title, ctx);
  document.title = title === "Filotaxia" ? "Filotaxia" : `${title} · Filotaxia`;
  if (view.header) {
    setHeader({
      title,
      subtitle: await resolve(view.subtitle, ctx),
      back: await resolve(view.back, ctx),
      settings: section !== "ajustes",
    });
  }
  markActive(section);

  if (moveFocus && !isFirstRender) {
    window.scrollTo(0, 0);
    // El foco va al título: el lector de pantalla anuncia en qué pantalla estás
    if (view.header) focusHeaderTitle();
    else viewRoot.querySelector("h1, h2")?.focus({ preventScroll: true });
  }
  isFirstRender = false;
}

// title / subtitle pueden ser texto o una función (async) que recibe el ctx
async function resolve(value, ctx) {
  return typeof value === "function" ? value(ctx) : value ?? "";
}

// Marca con aria-current los links a la sección actual
// (los de la barra y el de Ajustes del header)
function markActive(section) {
  document.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.route === section) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
