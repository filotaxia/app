/* ============================================
   Utils — QR
   ============================================ */

// Lee lo que trae el QR pegado en la base de cada terrario y devuelve
// el id del terrario ("04"), o null si no es uno conocido.
//
// Formatos aceptados (el QR impreso puede ser cualquiera de estos):
//   "04" · "4" · "filotaxia:04"
//   "https://filotaxia.com/t/04" · ".../terrario/04" · ".../#/terrario/04"

const PATTERNS = [
  /^(\d{1,3})$/,                       // el número solo
  /^filotaxia:(\d{1,3})$/i,            // esquema propio
  /\/(?:t|terrario)\/(\d{1,3})(?:\b|$)/i, // link a la ficha
];

export function parseTerrarioCode(raw, knownIds) {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const id = match[1].padStart(2, "0");
    return knownIds.includes(id) ? id : null;
  }
  return null;
}
