/* ============================================
   Store — Collection
   ============================================ */

// La colección de terrarios de este teléfono.
//
//   await linkedIds()       → ["04", "03", ...] (el último sumado primero)
//   await isLinked("04")
//   await link("04")        → true si se sumó, false si ya estaba

import { get, add } from "./store.js";

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
