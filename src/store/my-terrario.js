/* ============================================
   Store — My Terrario
   ============================================ */

// El terrario que se ve en Mi terrario, y sus cuidados. No son terrarios
// propios (es una instalación: cualquiera escanea cualquiera): "Mi terrario"
// es el último escaneado o tocado desde la Colección, no el primero para
// siempre — setMyTerrario reemplaza al anterior cada vez.
//
//   await myTerrarioId()               → "04" o null
//   await setMyTerrario("04")
//   await lastCare("04", "riego")      → "YYYY-MM-DD" del último riego (o del día
//                                        en que se escaneó, si nunca se registró)
//   await logCare("04", "riego")       → registra el cuidado hoy
//   await loggedToday("04", "riego")   → true si hoy se registró (no cuenta el día del escaneo)
//   await linkedOn("04")               → "YYYY-MM-DD" del día en que se escaneó

import { get, set, add } from "./store.js";
import { dateKey, todayKey } from "../utils/dates.js";

export async function myTerrarioId() {
  return get("my_terrario");
}

export async function setMyTerrario(id) {
  await set("my_terrario", id);
}

export async function lastCare(terrarioId, type) {
  const log = await get("care_log");
  const dates = log
    .filter((row) => row.terrario_id === terrarioId && row.type === type)
    .map((row) => row.date)
    .sort();
  // Nunca registrado: se cuenta desde el día en que se escaneó
  return dates.length ? dates.at(-1) : linkedOn(terrarioId);
}

export async function loggedToday(terrarioId, type) {
  const today = todayKey();
  const log = await get("care_log");
  return log.some((row) => row.terrario_id === terrarioId && row.type === type && row.date === today);
}

export async function linkedOn(terrarioId) {
  const links = await get("links");
  const linked = links.find((row) => row.terrario_id === terrarioId);
  return linked ? dateKey(new Date(linked.linked_at)) : todayKey();
}

export async function logCare(terrarioId, type) {
  await add("care_log", { terrario_id: terrarioId, type, date: todayKey() });
}
