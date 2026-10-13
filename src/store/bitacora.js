/* ============================================
   Store — Bitácora
   ============================================ */

// La bitácora de cada terrario: notas con fecha y una foto opcional.
// Cada terrario tiene la suya (no se comparten).
//
//   await entries("04")                      → [{ id, terrario_id, date, created_at, note, photo_id }]
//                                              (la más nueva primero)
//   await addEntry("04", { note, photo })    → photo: un Blob ya achicado (utils/image.js) o null
//   await removeEntry(entry)                 → borra la entrada y su foto
//   await photoURL(entry.photo_id)           → para mostrar la foto (ver store/photos.js)
//
// El texto va en el store de siempre (clave "bitacora"); las fotos, en
// IndexedDB (store/photos.js), porque en localStorage no entran.

import { get, add, remove } from "./store.js";
import { savePhoto, deletePhoto, photoURL } from "./photos.js";
import { todayKey } from "../utils/dates.js";

export { photoURL };

export async function entries(terrarioId) {
  const rows = await get("bitacora");
  return rows
    .filter((row) => row.terrario_id === terrarioId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addEntry(terrarioId, { note, photo }) {
  const photo_id = photo ? await savePhoto(photo) : null;
  return add("bitacora", {
    terrario_id: terrarioId,
    date: todayKey(),
    created_at: new Date().toISOString(),
    note,
    photo_id,
  });
}

export async function removeEntry(entry) {
  if (entry.photo_id) await deletePhoto(entry.photo_id);
  await remove("bitacora", entry.id);
}
