/* ============================================
   Utils — QR
   ============================================ */

// Lee lo que trae el QR pegado en la base de cada terrario y devuelve su
// código ("k7f2q9"), o null si no es un QR de Filotaxia.
//
// El QR impreso es siempre el link https://app.filotaxia.com/t/<código>
// (también vale el de la app: …/#/t/<código>). El código son 6 caracteres
// sin los que se confunden (sin 0 o 1 l i); lo genera Supabase y no cambia
// nunca. Los formatos viejos por número ("04", "filotaxia:04",
// …/#/terrario/04) ya no conectan: un terrario se conecta solo escaneándolo.

const CODE = /^[a-hjkmnp-z2-9]{6}$/;

// El dominio que queda impreso. Nunca la dirección del hosting (*.github.io)
// ni localhost: el QR tiene que durar para siempre.
export const QR_BASE = "https://app.filotaxia.com/";

// "k7f2q9" → "https://app.filotaxia.com/t/k7f2q9" (lo que lleva el QR)
export function qrLink(code) {
  return `${QR_BASE}t/${code}`;
}

export function parseQrLink(raw) {
  const match = String(raw ?? "").match(/\/t\/([a-z0-9]+)/i);
  if (!match) return null;
  const code = match[1].toLowerCase();
  return CODE.test(code) ? code : null;
}

// Dibuja un QR como SVG a partir de sus módulos (los cuadraditos):
// `modules` es una grilla de true (negro) / false (blanco), fila por fila.
// Un solo <path> con un cuadrado de 1×1 por módulo negro, sobre un fondo
// blanco con `margin` módulos de borde (los lectores de QR piden 4).
// Negro sobre blanco fijos, sin tema: es lo que se imprime.
export function qrSvg(modules, { margin = 4 } = {}) {
  const size = modules.length + margin * 2;
  const squares = [];
  modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) squares.push(`M${x + margin} ${y + margin}h1v1h-1z`);
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<path fill="#000" d="${squares.join(" ")}"/></svg>`;
}
