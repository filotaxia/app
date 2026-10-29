/* ============================================
   Views — Admin QR
   ============================================ */

// El QR de cada terrario en el panel: verlo, descargarlo y armar la hoja
// para imprimir varios.
//
//   await qrFor(terrario)     → { link, svg } (el SVG, listo para meter en el HTML)
//   downloadSvg(terrario)     → baja "TR07-qr.svg" (vectorial, para imprenta)
//   downloadPng(terrario)     → baja "TR07-qr.png" (1200px, para compartir o maquetar)
//
// El QR lleva siempre https://app.filotaxia.com/t/<qr_code> (utils/qr.js).
// Corrección de errores H: se sigue leyendo con ~30% dañado (raspones,
// tierra, una gota). En el centro, chico, el isotipo de Filotaxia (el hueco
// y su tamaño: logoLayout en utils/qr.js). qrcode-generator (MIT) se carga
// del CDN la primera vez.

import { qrLink, qrSvg, logoLayout, clearHole } from "../../utils/qr.js";
import { codeOf } from "../../content/terrarios.js";

const LIBRARY = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm";
const LOGO_URL = new URL("../../assets/images/marca/isotipo.png", import.meta.url).href;
const MARGIN = 4;          // módulos de borde blanco (lo que piden los lectores)
const PNG_SIZE = 1200;     // px de lado del PNG

let qrcode = null;
let mark = null;           // el isotipo cargado (una sola vez para todos los QRs)

// Los módulos del QR: grilla de true (negro) / false (blanco)
async function modulesFor(link) {
  qrcode ??= (await import(LIBRARY)).default;
  const qr = qrcode(0, "H");   // 0 = tamaño automático
  qr.addData(link);
  qr.make();
  const count = qr.getModuleCount();
  return Array.from({ length: count }, (_, row) => Array.from({ length: count }, (_, col) => qr.isDark(row, col)));
}

// El isotipo como data URL (así el SVG descargado lo lleva adentro y no
// depende de la app) y como imagen (para dibujarlo en el PNG)
function loadMark() {
  mark ??= (async () => {
    const blob = await (await fetch(LOGO_URL)).blob();
    const href = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const image = new Image();
    image.src = href;
    await image.decode();
    return { href, image, aspect: image.naturalWidth / image.naturalHeight };
  })();
  return mark;
}

// Módulos con el hueco del centro ya en blanco + dónde va el logo
async function partsFor(terrario) {
  const link = qrLink(terrario.qr_code);
  const [modules, { href, image, aspect }] = await Promise.all([modulesFor(link), loadMark()]);
  const { hole, logo } = logoLayout(modules.length, aspect);
  return { link, modules: clearHole(modules, hole), logo: { ...logo, href }, image };
}

export async function qrFor(terrario) {
  const { link, modules, logo } = await partsFor(terrario);
  return { link, svg: qrSvg(modules, { margin: MARGIN, logo }) };
}

export async function downloadSvg(terrario) {
  const { svg } = await qrFor(terrario);
  save(new Blob([svg], { type: "image/svg+xml" }), `${codeOf(terrario)}-qr.svg`);
}

export async function downloadPng(terrario) {
  const { modules, logo, image } = await partsFor(terrario);
  const cells = modules.length + MARGIN * 2;
  const cell = Math.floor(PNG_SIZE / cells);   // px enteros por módulo: bordes nítidos
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = cell * cells;

  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";   // blanco y negro fijos: es lo que se imprime
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";
  modules.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) context.fillRect((x + MARGIN) * cell, (y + MARGIN) * cell, cell, cell);
  }));
  context.drawImage(image, (logo.x + MARGIN) * cell, (logo.y + MARGIN) * cell, logo.width * cell, logo.height * cell);

  canvas.toBlob((blob) => save(blob, `${codeOf(terrario)}-qr.png`), "image/png");
}

// Baja un archivo con un link temporal
function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
