/* ============================================
   Store — Collection
   ============================================ */

// La colección de terrarios de este teléfono.
//
//   await linkedIds()       → ["04", "03", ...] (el último sumado primero)
//   await isLinked("04")
//   await link("04")        → true si se sumó, false si ya estaba
//   await markScanned("04") → guarda que se escaneó ahora (última conexión)
//   await lastScanOn("04")  → "YYYY-MM-DD" de la última vez que se escaneó
//
// `linked_at` es el primer escaneo (de ahí cuentan los cuidados) y no se
// toca nunca; `scanned_at` es el último, y se pisa en cada escaneo.

import { get, set, add } from "./store.js";
import { dateKey, todayKey } from "../utils/dates.js";

export async function linkedIds() {
  const links = await get("links");
  return links
    .sort((a, b) => b.linked_at.localeCompare(a.linked_at))
    .map((row) => row.terrario_id);
}

export async function isLinked(terrarioId) {
  return (await linkedIds()).includes(terrarioId);
}

export async function link(terrarioId) {
  if (await isLinked(terrarioId)) return false;
  await add("links", { terrario_id: terrarioId, linked_at: new Date().toISOString() });
  return true;
}

export async function markScanned(terrarioId) {
  const links = await get("links");
  const row = links.find((link) => link.terrario_id === terrarioId);
  if (!row) return;
  row.scanned_at = new Date().toISOString();
  await set("links", links);
}

// Los terrarios conectados antes de que existiera scanned_at usan el primer escaneo
export async function lastScanOn(terrarioId) {
  const links = await get("links");
  const row = links.find((link) => link.terrario_id === terrarioId);
  if (!row) return todayKey();
  return dateKey(new Date(row.scanned_at ?? row.linked_at));
}
