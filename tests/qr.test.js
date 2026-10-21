/* ============================================
   Tests — QR
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQrLink, qrLink, qrSvg } from "../src/utils/qr.js";

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
