/* ============================================
   Tests — Content
   ============================================ */

// Que los catálogos (terrarios, plantas, citas y los puntos del terrario del
// Manifiesto) estén completos y coincidan entre sí,
// y que cada foto que nombran exista.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { TERRARIOS } from "../src/content/terrarios.js";
import { PLANTAS, LEAVES, WAVE_NAMES, getPlanta } from "../src/content/plantas.js";
import { QUOTES, nextQuoteIndex } from "../src/content/citas.js";
import { INSIDE_TERRARIUM, LAYERS } from "../src/content/ayuda.js";

const root = new URL("../", import.meta.url);
const exists = (path) => existsSync(new URL(path, root));

test("getPlanta: suma hoja, onda y foto; sin catálogo, solo el nombre", () => {
  assert.deepEqual(getPlanta("haworthia venosa"), {
    name: "Haworthia Venosa",
    leaf: "puntiaguda",
    photo: "src/assets/images/plantas/haworthia-venosa.webp",
    leafLabel: "Puntiaguda",
    wave: "triangle",
  });
  assert.deepEqual(getPlanta("Helecho"), { name: "Helecho" });
});

test("cada planta tiene una hoja conocida y su foto", () => {
  for (const planta of PLANTAS) {
    assert.ok(LEAVES[planta.leaf], `${planta.name}: hoja "${planta.leaf}"`);
    assert.ok(exists(getPlanta(planta.name).photo), `${planta.name}: falta la foto`);
  }
});

test("los terrarios usan plantas del catálogo, ondas con nombre y fotos que existen", () => {
  for (const terrario of TERRARIOS) {
    for (const name of terrario.plants ?? []) {
      assert.ok(getPlanta(name).wave, `${terrario.id}: "${name}" no está en content/plantas.js`);
    }
    for (const wave of terrario.waves ?? []) {
      assert.ok(WAVE_NAMES[wave], `${terrario.id}: onda "${wave}"`);
    }
    if (terrario.photo) assert.ok(exists(terrario.photo), `${terrario.id}: falta ${terrario.photo}`);
  }
});

test("citas: completas, y nextQuoteIndex las recorre sin repetir dos seguidas", () => {
  for (const quote of QUOTES) assert.ok(quote.text && quote.book && quote.author);
  assert.equal(nextQuoteIndex(null), 0);
  assert.equal(nextQuoteIndex(0), 1);
  assert.equal(nextQuoteIndex(QUOTES.length - 1), 0);
});

test("INSIDE_TERRARIUM: la foto existe y cada punto apunta a una capa o planta que existe, dentro de la imagen", () => {
  assert.ok(exists(INSIDE_TERRARIUM.image), INSIDE_TERRARIUM.image);
  INSIDE_TERRARIUM.spots.forEach((spot) => {
    if (spot.kind === "capa") assert.ok(LAYERS[spot.layer], `capa ${spot.layer}`);
    else assert.ok(PLANTAS.some((planta) => planta.name === spot.name), `planta ${spot.name}`);
    assert.ok(spot.x >= 0 && spot.x <= 100 && spot.y >= 0 && spot.y <= 100, "dentro de la imagen");
  });
});
