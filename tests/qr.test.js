/* ============================================
   Tests — QR
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQrLink } from "../src/utils/qr.js";

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
