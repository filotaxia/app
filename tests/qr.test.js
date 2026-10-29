/* ============================================
   Tests — QR
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQrLink, qrLink, qrSvg, logoLayout, clearHole } from "../src/utils/qr.js";

test("lee el link impreso y el de la app", () => {
  assert.equal(parseQrLink("https://app.filotaxia.com/t/k7f2q9"), "k7f2q9");
  assert.equal(parseQrLink("http://localhost:4180/#/t/k7f2q9"), "k7f2q9");
  assert.equal(parseQrLink("  https://app.filotaxia.com/t/K7F2Q9/  "), "k7f2q9");
  assert.equal(parseQrLink("https://app.filotaxia.com/t/k7f2q9?ref=qr"), "k7f2q9");
});

test("no acepta los formatos viejos ni códigos mal formados", () => {
  const rejected = [
    "04",
    "filotaxia:04",
    "https://app.filotaxia.com/#/terrario/04",
    "https://app.filotaxia.com/t/04",
    "https://app.filotaxia.com/t/k7f2q",     // corto
    "https://app.filotaxia.com/t/k0f2q9",    // con 0
    "https://app.filotaxia.com/t/k7f2q9xx",  // largo
    "https://google.com",
    "",
    null,
  ];
  for (const raw of rejected) assert.equal(parseQrLink(raw), null, String(raw));
});

test("qrLink arma el link impreso, siempre con el dominio propio", () => {
  assert.equal(qrLink("k7f2q9"), "https://app.filotaxia.com/t/k7f2q9");
  assert.equal(parseQrLink(qrLink("k7f2q9")), "k7f2q9");
});

test("qrSvg dibuja un cuadrado por módulo oscuro, con margen blanco", () => {
  const svg = qrSvg([
    [true, false],
    [false, true],
  ], { margin: 1 });
  assert.match(svg, /viewBox="0 0 4 4"/);
  assert.match(svg, /<rect width="4" height="4" fill="#fff"\/>/);
  assert.match(svg, /d="M1 1h1v1h-1z M2 2h1v1h-1z"/);
});

test("logoLayout: el hueco del logo es chico y queda centrado en módulos enteros", () => {
  // El QR del link impreso es de 33×33; el isotipo mide 512×324
  const { hole, logo } = logoLayout(33, 512 / 324);
  assert.deepEqual(hole, { x: 12, y: 13, width: 9, height: 7 });
  assert.ok(hole.width * hole.height / (33 * 33) < 0.07, "tapa menos del 7% de los módulos");
  // el dibujo llena el hueco a lo ancho (8,4 de 9 módulos), centrado, sin pisar módulos
  assert.ok(Math.abs(logo.width - 8.4) < 1e-9);
  assert.ok(Math.abs(logo.x + logo.width / 2 - 33 / 2) < 1e-9);
  assert.ok(Math.abs(logo.y + logo.height / 2 - 33 / 2) < 1e-9);
  assert.ok(logo.x > hole.x && logo.x + logo.width < hole.x + hole.width);
  assert.ok(logo.y > hole.y && logo.y + logo.height < hole.y + hole.height);
});

test("clearHole deja en blanco solo los módulos del hueco", () => {
  const all = Array.from({ length: 5 }, () => Array(5).fill(true));
  const cleared = clearHole(all, { x: 1, y: 2, width: 3, height: 1 });
  assert.deepEqual(cleared[2], [true, false, false, false, true]);
  assert.equal(cleared.flat().filter((dark) => !dark).length, 3);
});

test("qrSvg con logo suma la imagen corrida por el margen", () => {
  const svg = qrSvg([[true]], { margin: 4, logo: { href: "data:x", x: 0, y: 0.5, width: 1, height: 0.25 } });
  assert.match(svg, /<image xlink:href="data:x" x="4" y="4.5" width="1" height="0.25"\/>/);
  assert.match(svg, /xmlns:xlink=/);
});
