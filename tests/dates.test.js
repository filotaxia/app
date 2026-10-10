/* ============================================
   Tests — Dates
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { dateKey, addDays, daysBetween } from "../src/utils/dates.js";

test("dateKey: fecha local como YYYY-MM-DD (sin pasar por UTC)", () => {
  assert.equal(dateKey(new Date(2026, 9, 9, 23, 59)), "2026-10-09");
  assert.equal(dateKey(new Date(2026, 0, 1, 0, 1)), "2026-01-01");
});

test("addDays cruza meses y años", () => {
  assert.equal(addDays("2026-10-09", 3), "2026-10-12");
  assert.equal(addDays("2026-10-30", 3), "2026-11-02");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("daysBetween: días enteros de a hasta b", () => {
  assert.equal(daysBetween("2026-10-09", "2026-10-09"), 0);
  assert.equal(daysBetween("2026-10-02", "2026-10-09"), 7);
  assert.equal(daysBetween("2026-10-09", "2026-10-02"), -7);
  assert.equal(daysBetween("2026-03-28", "2026-04-02"), 5);
});
