import { test } from "node:test";
import assert from "node:assert/strict";
import { mapUsgsFeature, type UsgsFeature } from "./usgs";

// Fixture con la forma real del FDSN event API de USGS.
const base: UsgsFeature = {
  id: "us7000abcd",
  properties: {
    mag: 5.2,
    place: "10 km al N de Carúpano, Venezuela",
    time: Date.UTC(2026, 5, 25, 22, 5, 0),
    updated: Date.UTC(2026, 5, 25, 22, 10, 0),
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
    felt: 3,
    cdi: 4.1,
    mmi: 5.5,
    alert: "green",
    status: "reviewed",
    tsunami: 0,
    sig: 300,
    magType: "mww",
    type: "earthquake",
  },
  geometry: { coordinates: [-66.1, 10.5, 12.3] },
};

test("mapea campos básicos y hora local VET (UTC-4)", () => {
  const r = mapUsgsFeature(base);
  assert.equal(r.externalId, "us7000abcd");
  assert.equal(r.magnitude, 5.2);
  assert.equal(r.latitude, 10.5);
  assert.equal(r.longitude, -66.1);
  assert.equal(r.depthKm, 12.3);
  assert.equal(r.status, "reviewed");
  assert.equal(r.eventType, "earthquake");
  assert.equal(r.alertLevel, "green");
  assert.equal(r.tsunamiFlag, false);
  assert.equal(r.eventTimeUtc.getUTCHours(), 22);
  assert.equal(r.eventTimeLocal.getUTCHours(), 18); // 22:05 UTC -> 18:05 VET
});

test("tsunami=1 marca solo el flag y NO genera estado de alerta de tsunami", () => {
  const r = mapUsgsFeature({ ...base, id: "us2", properties: { ...base.properties, tsunami: 1, alert: null } });
  assert.equal(r.tsunamiFlag, true);
  assert.equal(r.alertLevel, "unknown"); // alert nulo -> unknown
  // El mapper no produce ningún campo de alerta/estado de tsunami.
  assert.equal("tsunamiStatus" in r, false);
  assert.equal("alert" in r, false);
});

test("tipos de evento se normalizan", () => {
  assert.equal(mapUsgsFeature({ ...base, properties: { ...base.properties, type: "explosion" } }).eventType, "other");
  assert.equal(mapUsgsFeature({ ...base, properties: { ...base.properties, type: "quarry blast" } }).eventType, "quarry_blast");
  assert.equal(mapUsgsFeature({ ...base, properties: { ...base.properties, status: null } }).status, "automatic");
});

test("lanza si faltan coordenadas", () => {
  assert.throws(() => mapUsgsFeature({ ...base, geometry: null }), /sin coordenadas/);
});
