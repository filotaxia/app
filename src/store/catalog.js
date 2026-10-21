/* ============================================
   Store — Catalog
   ============================================ */

// Trae el catálogo de terrarios de Supabase. Es el ÚNICO archivo de la app
// que habla con Supabase.
//
//   await loadCatalog()        → llena content/terrarios.js (al arrancar, en main.js)
//   await findByQr("k7f2q9")   → el terrario de ese QR, o null si Supabase dice que no existe;
//                                si no se pudo preguntar (sin red), lanza CatalogOfflineError
//
// De dónde sale el catálogo, en orden:
//   1. la copia guardada en el teléfono (clave `catalog` del store): se usa
//      al instante y Supabase se consulta por detrás para actualizarla;
//   2. si no hay copia, Supabase (espera hasta 4 s);
//   3. si Supabase no responde, catalogo.json: la copia que deja en el repo
//      la tarea programada de GitHub (.github/workflows/catalogo.yml).
// Así un QR abre su terrario aunque no haya red o Supabase esté dormido.
//
// La API de Supabase se usa con fetch, sin librería: es un GET con la clave
// pública en el header `apikey`.

import { get, set } from "./store.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase-config.js";
import { rowToTerrario } from "../utils/catalog.js";
import { setCatalog, getTerrarioByQr } from "../content/terrarios.js";

const API = `${SUPABASE_URL}/rest/v1/terrarios?select=*&order=id`;
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/terrarios/`;
const BACKUP = new URL("../../catalogo.json", import.meta.url).href;
const TIMEOUT_MS = 4000;

// Las filas crudas que se están usando ahora
let currentRows = [];

export async function loadCatalog({ fetchImpl = fetch } = {}) {
  const copy = await get("catalog");

  if (copy?.rows?.length) {
    use(copy.rows);
    refreshInBackground(fetchImpl);
    return;
  }

  try {
    await useFresh(await fetchRows(fetchImpl));
  } catch {
    try {
      use(await fetchBackup(fetchImpl));
    } catch {
      use([]);   // sin nada: las vistas muestran "no encontrado"
    }
  }
}

// No se pudo preguntar a Supabase: el QR puede ser válido, falta red
export class CatalogOfflineError extends Error {
  name = "CatalogOfflineError";
}

// Si el código no está en lo que ya hay (un terrario recién publicado),
// se vuelve a preguntar antes de decir que no existe. Solo Supabase puede
// confirmar que no existe: catalogo.json puede estar atrasado un par de días.
export async function findByQr(code, { fetchImpl = fetch } = {}) {
  const known = getTerrarioByQr(code);
  if (known) return known;

  try {
    await useFresh(await fetchRows(fetchImpl));
    return getTerrarioByQr(code);
  } catch {
    try {
      use(merge(currentRows, await fetchBackup(fetchImpl)));
    } catch {
      // sin Supabase ni copia del repo: queda lo que había
    }
    const found = getTerrarioByQr(code);
    if (found) return found;
    throw new CatalogOfflineError("No se pudo consultar el catálogo");
  }
}

async function fetchRows(fetchImpl) {
  const response = await fetchImpl(API, {
    headers: { apikey: SUPABASE_KEY },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Supabase no devolvió una lista");
  return rows;
}

async function fetchBackup(fetchImpl) {
  const response = await fetchImpl(BACKUP);
  if (!response.ok) throw new Error(`catalogo.json respondió ${response.status}`);
  const { rows } = await response.json();
  if (!Array.isArray(rows)) throw new Error("catalogo.json sin filas");
  return rows;
}

function use(rows) {
  currentRows = rows;
  setCatalog(rows.map((row) => rowToTerrario(row, STORAGE_BASE)));
}

// Recién bajado de Supabase: se guarda en el teléfono y se usa
async function useFresh(rows) {
  await set("catalog", { rows, fetched_at: new Date().toISOString() });
  use(rows);
}

// Actualiza la copia sin hacer esperar a nadie; si cambió algo,
// vuelve a pintar la pantalla actual
async function refreshInBackground(fetchImpl) {
  try {
    const rows = await fetchRows(fetchImpl);
    const changed = JSON.stringify(rows) !== JSON.stringify(currentRows);
    await useFresh(rows);
    if (changed) globalThis.dispatchEvent?.(new Event("filotaxia:refresh"));
  } catch {
    // sin red: sigue la copia que había
  }
}

// Suma a lo que hay los terrarios de la copia del repo que falten (por id)
function merge(rows, backupRows) {
  const ids = new Set(rows.map((row) => row.id));
  return [...rows, ...backupRows.filter((row) => !ids.has(row.id))];
}
