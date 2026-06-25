import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePtwcFeed } from "./fetch-ptwc";
import { mapPtwcEntry } from "../mappers/ptwc";

// XML con la forma real de tsunami.gov: el <summary> es xhtml anidado.
// Regresión: sin stopNodes el parser convierte summary en objeto y se pierde
// el "Category:", devolviendo status "unknown" por error.
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
  <title>Tsunami Information Statement</title>
  <entry>
    <id>urn:uuid:test-1</id>
    <title>near the coast of Venezuela</title>
    <updated>2026-06-24T22:47:24Z</updated>
    <geo:lat>10.5</geo:lat>
    <geo:long>-66.1</geo:long>
    <summary type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml">
      <strong>Category:</strong> Information<br/><strong>Affected Region: </strong>Coast of Venezuela<br/></div></summary>
  </entry>
</feed>`;

test("parsePtwcFeed extrae el summary xhtml y el mapper lee Category", () => {
  const entries = parsePtwcFeed(FEED);
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.id, "urn:uuid:test-1");
  assert.match(e.summary ?? "", /Category:/);

  const norm = mapPtwcEntry(e, "NOAA_PTWC");
  assert.equal(norm.status, "information");
  assert.match(norm.affectedAreaText ?? "", /Coast of Venezuela/);
});

test("feed sin entradas -> array vacío (estado honesto: sin alerta)", () => {
  const empty = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>x</title></feed>`;
  assert.deepEqual(parsePtwcFeed(empty), []);
});
