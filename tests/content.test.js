/* ============================================
   Tests — Content
   ============================================ */

// Que los catálogos (terrarios — la copia catalogo.json —, plantas, citas y los puntos del terrario del
// Manifiesto) estén completos y coincidan entre sí,
// y que cada foto (y cada video de las capas) que nombran exista.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { TERRARIOS, setCatalog } from "../src/content/terrarios.js";
import { rowToTerrario } from "../src/utils/catalog.js";
import { PLANTAS, LEAVES, WAVE_NAMES, getPlanta } from "../src/content/plantas.js";
import { QUOTES, nextQuoteIndex } from "../src/content/citas.js";
import { INSIDE_TERRARIUM, LAYERS } from "../src/content/ayuda.js";

const root = new URL("../", import.meta.url);
const exists = (path) => existsSync(new URL(path, root));

// El catálogo de terrarios vive en Supabase; acá se prueba la copia del repo
const { rows } = JSON.parse(readFileSync(new URL("catalogo.json", root), "utf8"));
setCatalog(rows.map((row) => rowToTerrario(row, "")));

test("catalogo.json: qr_code con formato válido y sin repetir", () => {
  assert.ok(TERRARIOS.length > 0, "catalogo.json sin terrarios");
  const codes = TERRARIOS.map((terrario) => terrario.qr_code);
  for (const code of codes) assert.match(code, /^[a-hjkmnp-z2-9]{6}$/);
  assert.equal(new Set(codes).size, codes.length, "hay códigos repetidos");
});

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

test("las cuatro capas tienen su video local (MP4 liviano, no un GIF enlazado)", () => {
  assert.equal(LAYERS.length, 4);
  for (const [name, , , video] of LAYERS) {
    assert.match(video, /^src\/assets\/videos\/capas\/.+\.mp4$/, `${name}: ${video}`);
    assert.ok(exists(video), `${name}: falta ${video}`);
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
