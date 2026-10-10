/* ============================================
   Utils — Dates
   ============================================ */

// Fechas como texto "YYYY-MM-DD" en la hora LOCAL del teléfono.
// Nunca toISOString(): pasa a UTC y en Argentina, después de las 21 h,
// daría el día siguiente.

const pad = (n) => String(n).padStart(2, "0");

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayKey = () => dateKey(new Date());

// "YYYY-MM-DD" → Date a las 12 del mediodía (así los cambios de horario no corren el día)
function toDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(key, days) {
  const date = toDate(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

// Días enteros desde a hasta b (negativo si b es antes)
export function daysBetween(a, b) {
  return Math.round((toDate(b) - toDate(a)) / 86_400_000);
}
