import { test } from "node:test";
import assert from "node:assert/strict";
import { createReportSchema } from "./report";

const valid = {
  reportType: "structural_damage",
  title: "Pared agrietada en edificio",
  state: "La Guaira",
  locationPrecision: "approximate",
  urgency: "high",
  reportSourceType: "first_hand",
};

test("acepta un reporte válido mínimo", () => {
  assert.equal(createReportSchema.safeParse(valid).success, true);
});

test("rechaza si falta el estado", () => {
  const { state: _state, ...rest } = valid;
  assert.equal(createReportSchema.safeParse(rest).success, false);
});

test("rechaza reportType inválido", () => {
  assert.equal(createReportSchema.safeParse({ ...valid, reportType: "hackeo" }).success, false);
});

test("rechaza campos extra (no se puede forzar verificationStatus)", () => {
  assert.equal(createReportSchema.safeParse({ ...valid, verificationStatus: "verified" }).success, false);
});

test("rechaza evidenceUrl que no es una URL", () => {
  assert.equal(createReportSchema.safeParse({ ...valid, evidenceUrl: "no-es-url" }).success, false);
});

test("recorta espacios del título", () => {
  const r = createReportSchema.safeParse({ ...valid, title: "  Hola mundo  " });
  assert.equal(r.success && r.data.title, "Hola mundo");
});
