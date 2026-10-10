/* ============================================
   Tests — Care
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { nextCare, dueLabel, readings, careStatus } from "../src/utils/care.js";

const CARE = { riego_days: 7, ventilacion_days: 3, humidity: [70, 90], temp: [18, 24], light: "Indirecta" };
const TERRARIO = { id: "04", care: CARE };

test("nextCare: días que faltan y cuánto queda (1 = recién hecho)", () => {
  assert.deepEqual(nextCare({ last: "2026-10-09", every: 7, today: "2026-10-09" }), { daysLeft: 7, fraction: 1 });
  assert.deepEqual(nextCare({ last: "2026-10-05", every: 7, today: "2026-10-09" }), { daysLeft: 3, fraction: 3 / 7 });
  assert.deepEqual(nextCare({ last: "2026-10-02", every: 7, today: "2026-10-09" }), { daysLeft: 0, fraction: 0 });
  assert.deepEqual(nextCare({ last: "2026-09-30", every: 7, today: "2026-10-09" }), { daysLeft: -2, fraction: 0 });
});

test("dueLabel", () => {
  assert.equal(dueLabel(5), "En 5 días");
  assert.equal(dueLabel(1), "Mañana");
  assert.equal(dueLabel(0), "Hoy");
  assert.equal(dueLabel(-1), "Hace 1 día");
  assert.equal(dueLabel(-3), "Hace 3 días");
});

test("readings: deterministas por terrario y día", () => {
  const a = readings({ terrario: TERRARIO, today: "2026-10-09", daysSinceRiego: 2 });
  const b = readings({ terrario: TERRARIO, today: "2026-10-09", daysSinceRiego: 2 });
  assert.deepEqual(a, b);
  assert.ok(Number.isInteger(a.humidity) && a.humidity >= 0 && a.humidity <= 100);
  assert.ok(Number.isInteger(a.yesterdayHumidity));
  assert.ok(a.temp >= 10 && a.temp <= 35);
  assert.ok(a.lightHours >= 1 && a.lightHours <= 12);
});

test("readings: recién regado está en rango; muy pasado de riego, por debajo", () => {
  const fresh = readings({ terrario: TERRARIO, today: "2026-10-09", daysSinceRiego: 0 });
  const dry = readings({ terrario: TERRARIO, today: "2026-10-09", daysSinceRiego: 12 });
  assert.ok(fresh.humidity >= 70 && fresh.humidity <= 90, `fresh ${fresh.humidity}`);
  assert.ok(dry.humidity < 70, `dry ${dry.humidity}`);
});

test("careStatus: lo más urgente primero", () => {
  const ok = { humidity: 80, temp: 21 };
  const base = { care: CARE, riegoLeft: 4, ventilacionLeft: 2 };
  assert.equal(careStatus({ ...base, reading: ok }), "Todo en equilibrio.");
  assert.equal(careStatus({ ...base, riegoLeft: -1, reading: { humidity: 60, temp: 21 } }), "Necesita riego.");
  assert.equal(careStatus({ ...base, riegoLeft: 0, reading: ok }), "Hoy toca regar.");
  assert.equal(careStatus({ ...base, reading: { humidity: 65, temp: 21 } }), "Le falta humedad.");
  assert.equal(careStatus({ ...base, reading: { humidity: 95, temp: 21 } }), "Demasiada humedad. Ventilalo.");
  assert.equal(careStatus({ ...base, reading: { humidity: 80, temp: 27 } }), "Está fuera de su temperatura.");
  assert.equal(careStatus({ ...base, ventilacionLeft: 0, reading: ok }), "Hoy toca ventilar.");
});

test("careStatus: ecosistema abierto (sin ventilación)", () => {
  const open = { ...CARE, ventilacion_days: null };
  const ok = { humidity: 80, temp: 21 };
  assert.equal(careStatus({ care: open, riegoLeft: 4, ventilacionLeft: null, reading: ok }), "Todo en equilibrio.");
  assert.equal(
    careStatus({ care: open, riegoLeft: 4, ventilacionLeft: null, reading: { humidity: 95, temp: 21 } }),
    "Demasiada humedad. Esperá para regar.",
  );
});
