// apps/api/src/lib/geo.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundToGrid } from "./geo";

test("redondea a rejilla de 0.01° (~1 km)", () => {
  assert.equal(roundToGrid(10.512345), 10.51);
  assert.equal(roundToGrid(-66.918765), -66.92);
});

test("es determinista: misma entrada, misma salida", () => {
  assert.equal(roundToGrid(10.512345), roundToGrid(10.512345));
});

test("nunca conserva más de 2 decimales (no expone la coordenada exacta)", () => {
  const r = roundToGrid(10.512999);
  assert.equal(Math.round(r * 100) / 100, r);
});
