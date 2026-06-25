import { test } from "node:test";
import assert from "node:assert/strict";
import { translatePlace } from "./place";

test("traduce dirección y 'of' al español", () => {
  assert.equal(translatePlace("5 km NE of Guatire, Venezuela"), "5 km al NE de Guatire, Venezuela");
  assert.equal(translatePlace("23 km SW of Morón, Venezuela"), "23 km al SO de Morón, Venezuela");
  assert.equal(translatePlace("10 km W of Coro"), "10 km al O de Coro");
});

test("traduce frases costeras", () => {
  assert.equal(translatePlace("near the coast of Venezuela"), "cerca de la costa de Venezuela");
});

test("conserva null y nombres sin patrón conocido", () => {
  assert.equal(translatePlace(null), null);
  assert.equal(translatePlace("Venezuela"), "Venezuela");
});
