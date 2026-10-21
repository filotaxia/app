/* ============================================
   Tests — Catalog store
   ============================================ */

// Cómo se carga el catálogo: Supabase → copia del teléfono → catalogo.json.
// fetch es falso (no sale a la red). En Node no hay localStorage, así que
// el store guarda en memoria: los tests de este archivo comparten esa
// memoria y corren en orden.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalog, findByQr } from "../src/store/catalog.js";
import { getTerrario } from "../src/content/terrarios.js";

const ROW_01 = { id: "01", model: "TR01", qr_code: "97vqye", status: "publicado", care: {} };
const ROW_07 = { id: "07", model: "TR07", qr_code: "k7f2q9", status: "publicado", care: {} };

const json = (data) => ({ ok: true, status: 200, json: async () => data });

// supabase: filas que devuelve la API (null = sin red) · backup: filas de catalogo.json (null = no está)
function fakeFetch({ supabase = null, backup = null }) {
  return async (url) => {
    const path = String(url);
    if (path.includes("/rest/v1/terrarios")) {
      if (!supabase) throw new TypeError("Failed to fetch");
      return json(supabase);
    }
    if (path.endsWith("catalogo.json")) {
      if (!backup) return { ok: false, status: 404, json: async () => ({}) };
      return json({ checked_on: "2026-10", rows: backup });
    }
    throw new Error(`url inesperada: ${path}`);
  };
}

test("sin copia y Supabase caído, usa catalogo.json", async () => {
  await loadCatalog({ fetchImpl: fakeFetch({ backup: [ROW_01] }) });
  assert.equal(getTerrario("01")?.model, "TR01");
});

test("findByQr pide de nuevo si el código no está en la copia", async () => {
  await loadCatalog({ fetchImpl: fakeFetch({ supabase: [ROW_01] }) });
  assert.equal(getTerrario("07"), null);
  const found = await findByQr("k7f2q9", { fetchImpl: fakeFetch({ supabase: [ROW_01, ROW_07] }) });
  assert.equal(found?.id, "07");
});

test("findByQr con Supabase caído busca en catalogo.json", async () => {
  const ROW_08 = { ...ROW_07, id: "08", model: "TR08", qr_code: "m8n3p4" };
  const found = await findByQr("m8n3p4", { fetchImpl: fakeFetch({ backup: [ROW_01, ROW_08] }) });
  assert.equal(found?.id, "08");
  assert.equal(getTerrario("07")?.model, "TR07", "no pierde lo que ya tenía");
});

test("findByQr devuelve null si nadie lo conoce", async () => {
  const found = await findByQr("zzzzzz", { fetchImpl: fakeFetch({ supabase: [ROW_01], backup: [ROW_01] }) });
  assert.equal(found, null);
});

// Solo Supabase puede confirmar que un código no existe: catalogo.json puede
// estar atrasado. Si no se pudo preguntar, findByQr avisa (no dice "no existe").
test("findByQr sin Supabase avisa que no pudo buscar, aunque haya catalogo.json", async () => {
  await assert.rejects(
    findByQr("q2w3e4", { fetchImpl: fakeFetch({ backup: [ROW_01] }) }),
    { name: "CatalogOfflineError" },
  );
});

test("findByQr sin Supabase ni catalogo.json avisa que no pudo buscar", async () => {
  await assert.rejects(findByQr("q2w3e4", { fetchImpl: fakeFetch({}) }), { name: "CatalogOfflineError" });
});
