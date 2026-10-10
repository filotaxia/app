/* ============================================
   Tests — QR
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTerrarioCode } from "../src/utils/qr.js";

const KNOWN = ["01", "02", "03", "04"];

test("acepta el número solo, con o sin cero", () => {
  assert.equal(parseTerrarioCode("04", KNOWN), "04");
  assert.equal(parseTerrarioCode("4", KNOWN), "04");
  assert.equal(parseTerrarioCode("  2 ", KNOWN), "02");
});

test("acepta el esquema filotaxia: y links de la app", () => {
  assert.equal(parseTerrarioCode("filotaxia:03", KNOWN), "03");
  assert.equal(parseTerrarioCode("https://filotaxia.com/t/04", KNOWN), "04");
  assert.equal(parseTerrarioCode("https://filotaxia.com/app/#/terrario/01", KNOWN), "01");
  assert.equal(parseTerrarioCode("https://filotaxia.com/terrario/02?ref=qr", KNOWN), "02");
});

test("devuelve null si no es un terrario conocido", () => {
  assert.equal(parseTerrarioCode("99", KNOWN), null);
  assert.equal(parseTerrarioCode("https://google.com", KNOWN), null);
  assert.equal(parseTerrarioCode("", KNOWN), null);
  assert.equal(parseTerrarioCode(null, KNOWN), null);
});
