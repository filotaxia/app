/* ============================================
   Utils — Care
   ============================================ */

// Cuidados del terrario: cuándo toca regar y ventilar, y la frase de estado.
// Todo puro y testeado.
//
// `care` de cada terrario (content/terrarios.js):
//   { riego_days, ventilacion_days, light: "Indirecta" }
// ventilacion_days es null en los ecosistemas abiertos (no se ventilan).

import { daysBetween } from "./dates.js";

// last: último día que se hizo · every: cada cuántos días · today: hoy
// → daysLeft (negativo = atrasado) y fraction (1 = recién hecho, 0 = toca)
export function nextCare({ last, every, today }) {
  const daysLeft = every - daysBetween(last, today);
  return { daysLeft, fraction: Math.min(1, Math.max(0, daysLeft / every)) };
}

export function dueLabel(daysLeft) {
  if (daysLeft > 1) return `${daysLeft} días`;
  if (daysLeft === 1) return "Mañana";
  if (daysLeft === 0) return "Hoy";
  return daysLeft === -1 ? "Hace 1 día" : `Hace ${-daysLeft} días`;
}

// La frase de estado debajo del nombre: lo más urgente primero
export function careStatus({ care, riegoLeft, ventilacionLeft }) {
  if (riegoLeft < 0) return "Necesita riego.";
  if (riegoLeft === 0) return "Hoy toca regar.";
  if (care.ventilacion_days && ventilacionLeft <= 0) return "Hoy toca ventilar.";
  return "Todo en equilibrio.";
}
