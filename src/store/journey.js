/* ============================================
   Store — Journey
   ============================================ */

// El recorrido de la página Filotaxia: qué pasos ya hizo la persona.
//
//   await journey()            → { ubicado, escaneado, escuchado, cuidado, anotado } (true / false)
//   await markStep("cuidado")  → lo anota (una sola vez)
//
// Dos pasos salen de datos que ya existen: "escaneado" (hay terrario propio)
// y "anotado" (su bitácora tiene alguna entrada). Los otros se anotan acá:
//   ubicado     la persona toca "Ya lo ubiqué" en la hoja del paso
//   escuchado   la primera vez que suena una pieza (views/escuchar)
//   cuidado     la primera vez que abre Cuidados (views/cuidados)

import { get, set } from "./store.js";
import { myTerrarioId } from "./my-terrario.js";
import { entries } from "./bitacora.js";

export async function journey() {
  const marks = await get("journey");
  const mine = await myTerrarioId();
  return {
    ubicado: Boolean(marks.ubicado),
    escaneado: Boolean(mine),
    escuchado: Boolean(marks.escuchado),
    cuidado: Boolean(marks.cuidado),
    anotado: Boolean(mine) && (await entries(mine)).length > 0,
  };
}

export async function markStep(key) {
  const marks = await get("journey");
  if (marks[key]) return;
  await set("journey", { ...marks, [key]: true });
}
