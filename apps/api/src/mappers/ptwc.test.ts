import { test } from "node:test";
import assert from "node:assert/strict";
import { mapPtwcEntry, type PtwcEntry } from "./ptwc";

// Fixtures con la forma real de tsunami.gov (summary xhtml con "Category:").
const warning: PtwcEntry = {
  id: "urn:uuid:abc-warning",
  title: "near the coast of Venezuela",
  updated: "2026-06-24T22:47:24Z",
  lat: 10.5,
  long: -66.1,
  summary:
    '<div><strong>Category:</strong> Warning<br/><strong>Bulletin Issue Time: </strong> 2026.06.24 22:47:24 UTC <br/><strong>Affected Region: </strong>Coast of Venezuela<br/><b>Note: stay away</b></div>',
};

const cancellation: PtwcEntry = {
  id: "urn:uuid:def-cancel",
  title: "near the coast of Venezuela",
  updated: "2026-06-24T23:30:00Z",
  summary: '<div><strong>Category:</strong> Cancellation<br/><strong>Affected Region: </strong>Coast of Venezuela</div>',
};

test("mapea un Warning correctamente", () => {
  const r = mapPtwcEntry(warning, "NOAA_PTWC");
  assert.equal(r.status, "warning");
  assert.equal(r.provider, "NOAA_PTWC");
  assert.equal(r.headline, "near the coast of Venezuela");
  assert.equal(r.externalId, "urn:uuid:abc-warning");
  assert.match(r.affectedAreaText ?? "", /Coast of Venezuela/);
  assert.equal(r.effectiveAt?.toISOString(), "2026-06-24T22:47:24.000Z");
});

test("Cancellation -> canceled (no se trata como warning)", () => {
  const r = mapPtwcEntry(cancellation, "NOAA_PTWC");
  assert.equal(r.status, "canceled");
  assert.notEqual(r.status, "warning");
});

test("summary sin Category -> unknown; id ausente -> id derivado estable", () => {
  const r = mapPtwcEntry({ title: "X", updated: "2026-06-24T00:00:00Z", summary: "sin categoria" }, "NOAA_PTWC");
  assert.equal(r.status, "unknown");
  assert.equal(r.externalId, "NOAA_PTWC:X:2026-06-24T00:00:00Z");
});
