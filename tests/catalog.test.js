/* ============================================
   Tests — Catalog
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { rowToTerrario } from "../src/utils/catalog.js";

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
