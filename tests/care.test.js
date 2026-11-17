/* ============================================
   Tests — Care
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { nextCare, dueLabel, careStatus } from "../src/utils/care.js";

const CARE = { riego_days: 7, ventilacion_days: 3, light: "Indirecta" };

test("nextCare: días que faltan y cuánto queda (1 = recién hecho)", () => {
  assert.deepEqual(nextCare({ last: "2026-10-09", every: 7, today: "2026-10-09" }), { daysLeft: 7, fraction: 1 });
  assert.deepEqual(nextCare({ last: "2026-10-05", every: 7, today: "2026-10-09" }), { daysLeft: 3, fraction: 3 / 7 });
  assert.deepEqual(nextCare({ last: "2026-10-02", every: 7, today: "2026-10-09" }), { daysLeft: 0, fraction: 0 });
  assert.deepEqual(nextCare({ last: "2026-09-30", every: 7, today: "2026-10-09" }), { daysLeft: -2, fraction: 0 });
});

test("dueLabel", () => {
  assert.equal(dueLabel(5), "5 días");
  assert.equal(dueLabel(1), "Mañana");
  assert.equal(dueLabel(0), "Hoy");
  assert.equal(dueLabel(-1), "Hace 1 día");
  assert.equal(dueLabel(-3), "Hace 3 días");
});

test("careStatus: lo más urgente primero", () => {
  const base = { care: CARE, riegoLeft: 4, ventilacionLeft: 2 };
  assert.equal(careStatus(base), "Todo en equilibrio.");
  assert.equal(careStatus({ ...base, riegoLeft: -1 }), "Necesita riego.");
  assert.equal(careStatus({ ...base, riegoLeft: 0 }), "Hoy toca regar.");
  assert.equal(careStatus({ ...base, ventilacionLeft: 0 }), "Hoy toca ventilar.");
});

test("careStatus: ecosistema abierto (sin ventilación)", () => {
  const open = { ...CARE, ventilacion_days: null };
  assert.equal(careStatus({ care: open, riegoLeft: 4, ventilacionLeft: null }), "Todo en equilibrio.");
});
