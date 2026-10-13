/* ============================================
   Utils — Format
   ============================================ */

// Textos que se arman a partir de datos: tiempos del reproductor,
// fechas de grabación y el subtítulo de la colección.

// 222 → "3:42"
export function formatTime(seconds) {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

// "2026-10-09" → "09/10/2026"
// Se corta el texto en vez de usar new Date(): "2026-10-09" se lee como UTC
// y en Argentina daría el día anterior.
export function formatDate(key) {
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

export function pluralTerrarios(count) {
  if (count === 0) return "Todavía no conectaste terrarios";
  if (count === 1) return "1 terrario conectado";
  return `${count} terrarios conectados`;
}
