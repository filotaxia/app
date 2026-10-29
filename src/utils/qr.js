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

// El logo del centro (el isotipo). El QR va con corrección de errores H: se
// sigue leyendo aunque falte ~30%. El logo tapa una parte de ese margen y el
// resto queda para la tierra y los raspones de la base del terrario, así que
// va chico: el hueco ocupa ~27% del ancho y ~6% de los módulos (como en un
// QR de 33×33, el del link de 32 letras, donde el centro no tiene ninguna
// de las marcas que el lector usa para ubicarse). Probado con lectores y
// manchas simuladas: un hueco más grande (11×7, 11×9) ya se lee peor con
// suciedad; para que el logo se vea más, mejor imprimir el QR más grande.
const LOGO_SHARE = 0.27;
const LOGO_PAD = 0.3;   // filo blanco entre el logo y los módulos (en módulos)

// Dónde va el logo, en módulos: `hole` es el rectángulo que queda en blanco
// (módulos enteros, centrado) y `logo` la caja del dibujo, que llena el hueco
// dejando LOGO_PAD de blanco alrededor. `aspect` = ancho / alto del logo.
export function logoLayout(count, aspect) {
  let width = Math.round(count * LOGO_SHARE);
  if ((count - width) % 2) width += 1;   // mismo borde a los dos lados
  const logoWidth = width - LOGO_PAD * 2;
  const logoHeight = logoWidth / aspect;
  let height = Math.ceil(logoHeight + LOGO_PAD * 2);
  if ((count - height) % 2) height += 1;
  return {
    hole: { x: (count - width) / 2, y: (count - height) / 2, width, height },
    logo: { x: (count - logoWidth) / 2, y: (count - logoHeight) / 2, width: logoWidth, height: logoHeight },
  };
}

// Los mismos módulos con el hueco en blanco (el logo no se pone encima de
// los cuadraditos: se los saca, así el lector no ve manchas a medias)
export function clearHole(modules, { x, y, width, height }) {
  return modules.map((row, r) => row.map((dark, c) =>
    dark && !(r >= y && r < y + height && c >= x && c < x + width)));
}

// Dibuja un QR como SVG a partir de sus módulos (los cuadraditos):
// `modules` es una grilla de true (negro) / false (blanco), fila por fila.
// Un solo <path> con un cuadrado de 1×1 por módulo negro, sobre un fondo
// blanco con `margin` módulos de borde (los lectores de QR piden 4).
// Negro sobre blanco fijos, sin tema: es lo que se imprime.
// `logo` (opcional): { href, x, y, width, height } en módulos, sin contar el margen.
export function qrSvg(modules, { margin = 4, logo = null } = {}) {
  const size = modules.length + margin * 2;
  const squares = [];
  modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) squares.push(`M${x + margin} ${y + margin}h1v1h-1z`);
    });
  });
  // xlink:href y no href: lo entienden también los programas de imprenta viejos
  const image = logo
    ? `<image xlink:href="${logo.href}" x="${logo.x + margin}" y="${logo.y + margin}" width="${logo.width}" height="${logo.height}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<path fill="#000" d="${squares.join(" ")}"/>${image}</svg>`;
}
