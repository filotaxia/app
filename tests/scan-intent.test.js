/* ============================================
   Tests — Scan intent
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { markScanIntent, takeScanIntent } from "../src/utils/scan-intent.js";

test("sin marca, no llegó escaneando", () => {
  assert.equal(takeScanIntent("03"), false);
});

test("la marca vale una sola vez y solo para ese terrario", () => {
  markScanIntent("03");
  assert.equal(takeScanIntent("04"), false);
  assert.equal(takeScanIntent("03"), true);
  assert.equal(takeScanIntent("03"), false);
});
