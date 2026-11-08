/* ============================================
   Tests — Format
   ============================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTime, formatDate, monthDay, parseDuration } from "../src/utils/format.js";

test("formatTime: segundos a m:ss", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(9), "0:09");
  assert.equal(formatTime(222), "3:42");
  assert.equal(formatTime(222.9), "3:42");
  assert.equal(formatTime(-4), "0:00");
  assert.equal(formatTime(NaN), "0:00");
});

test("formatDate: YYYY-MM-DD a DD/MM/YYYY sin pasar por UTC", () => {
  assert.equal(formatDate("2026-10-09"), "09/10/2026");
  assert.equal(formatDate("2026-01-01"), "01/01/2026");
});

test("monthDay: el mes corto en castellano y el día, sin pasar por UTC", () => {
  assert.deepEqual(monthDay("2026-06-14"), { month: "Jun", day: "14" });
  assert.deepEqual(monthDay("2026-01-01"), { month: "Ene", day: "01" });
  assert.deepEqual(monthDay("2026-12-31"), { month: "Dic", day: "31" });
});

test("parseDuration lee m:ss (o solo segundos) y devuelve segundos", () => {
  assert.equal(parseDuration("4:11"), 251);
  assert.equal(parseDuration(" 0:59 "), 59);
  assert.equal(parseDuration("251"), 251);
  assert.equal(parseDuration(""), null);
  assert.equal(parseDuration("4:75"), null);
  assert.equal(parseDuration("cuatro"), null);
  assert.equal(parseDuration(formatTime(222)), 222);
});
