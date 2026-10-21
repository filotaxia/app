/* ============================================
   Tests — Catalog
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { rowToTerrario, nextTerrarioId, storagePath } from "../src/utils/catalog.js";

const STORAGE = "https://x.supabase.co/storage/v1/object/public/terrarios/";

test("rowToTerrario arma midi y saca los null", () => {
  const terrario = rowToTerrario({
    id: "07", model: "TR07", qr_code: "k7f2q9", status: "publicado",
    story: null, photo: "07/foto.jpg", midi_plantas: "07/p.mid", midi_sustrato: null, care: { riego_days: 30 },
  }, STORAGE);
  assert.equal(terrario.story, undefined);
  assert.equal(terrario.qr_code, "k7f2q9");
  assert.equal(terrario.photo, `${STORAGE}07/foto.jpg`);
  assert.deepEqual(terrario.midi, { plantas: `${STORAGE}07/p.mid`, sustrato: undefined });
});

test("rowToTerrario deja igual las rutas locales y los links", () => {
  const local = rowToTerrario({ id: "01", model: "TR01", photo: "src/assets/images/terrarios/tr01.jpg", care: {} }, "B/");
  assert.equal(local.photo, "src/assets/images/terrarios/tr01.jpg");
  const link = rowToTerrario({ id: "01", model: "TR01", photo: "https://a.b/c.jpg", care: {} }, "B/");
  assert.equal(link.photo, "https://a.b/c.jpg");
});

test("rowToTerrario sin MIDI no tiene midi", () => {
  assert.equal(rowToTerrario({ id: "01", model: "TR01", care: {} }, "B/").midi, undefined);
});

test("nextTerrarioId sugiere el número que sigue, con dos cifras", () => {
  assert.equal(nextTerrarioId(["01", "02", "05"]), "06");
  assert.equal(nextTerrarioId(["09"]), "10");
  assert.equal(nextTerrarioId(["99"]), "100");
  assert.equal(nextTerrarioId([]), "01");
});

test("storagePath arma la ruta del archivo en su carpeta, con la hora en el nombre", () => {
  const date = new Date("2026-10-21T20:15:07Z");
  assert.equal(storagePath("07", "foto", "jpg", date), "07/foto-20261021201507.jpg");
  assert.equal(storagePath("07", "midi-plantas", "MID", date), "07/midi-plantas-20261021201507.mid");
});
