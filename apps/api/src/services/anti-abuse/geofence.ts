/**
 * Geofence Venezuela.
 *
 * Two-tier check:
 *  1) Fast bounding box (cheap, used for first rejection).
 *  2) Polygon check using ray casting (precise, only when bbox passes).
 *
 * Bounding box for Venezuela (incl. continental + insular):
 *   lat:  0.6  ..  12.3
 *   lon: -73.4 .. -59.8
 *
 * The simplified polygon below is sufficient for emergency-report
 * filtering (we accept some slack on borders); replace with FUNVISIS
 * official polygon if/when available.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export const VENEZUELA_BBOX = {
  minLat: 0.6,
  maxLat: 12.3,
  minLng: -73.4,
  maxLng: -59.8,
};

export function isInVenezuelaBbox(point: LatLng): boolean {
  return (
    point.lat >= VENEZUELA_BBOX.minLat &&
    point.lat <= VENEZUELA_BBOX.maxLat &&
    point.lng >= VENEZUELA_BBOX.minLng &&
    point.lng <= VENEZUELA_BBOX.maxLng
  );
}

/**
 * Simplified VE polygon (~30 vertices). Conservative — slightly wider
 * than the real border so we don't reject legitimate reports near it.
 * Format: [lng, lat] pairs (GeoJSON convention).
 */
const VENEZUELA_POLYGON: ReadonlyArray<readonly [number, number]> = [
  [-71.8, 11.6], [-69.5, 11.9], [-68.0, 11.5], [-65.6, 10.7],
  [-63.0, 10.7], [-61.8, 10.7], [-60.6, 10.0], [-60.0, 9.0],
  [-60.2, 8.0], [-60.5, 7.5], [-60.0, 6.5], [-61.4, 5.9],
  [-61.0, 4.5], [-60.0, 3.0], [-62.5, 1.3], [-65.0, 1.0],
  [-67.0, 1.5], [-67.5, 2.2], [-67.9, 4.0], [-67.4, 6.0],
  [-69.4, 6.1], [-71.0, 7.0], [-72.0, 8.0], [-72.5, 9.0],
  [-72.8, 10.5], [-71.8, 11.6],
];

/**
 * Ray casting point-in-polygon. Standard algorithm.
 */
export function isInVenezuelaPolygon(point: LatLng): boolean {
  const { lat, lng } = point;
  let inside = false;
  for (
    let i = 0, j = VENEZUELA_POLYGON.length - 1;
    i < VENEZUELA_POLYGON.length;
    j = i++
  ) {
    const [xi, yi] = VENEZUELA_POLYGON[i]!;
    const [xj, yj] = VENEZUELA_POLYGON[j]!;
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export type GeofenceVerdict =
  | { allowed: true }
  | { allowed: false; reason: "outside_bbox" | "outside_polygon" };

export function geofenceVenezuela(point: LatLng): GeofenceVerdict {
  if (!isInVenezuelaBbox(point)) {
    return { allowed: false, reason: "outside_bbox" };
  }
  if (!isInVenezuelaPolygon(point)) {
    return { allowed: false, reason: "outside_polygon" };
  }
  return { allowed: true };
}

/**
 * Fuzz coordinates server-side before persisting.
 * Default: round to ~200m precision (3 decimal places in degrees ~ 111m,
 * we go to 3 dp which is ~111m and then add small randomized offset
 * within the cell to break exact deduplication of fuzzing).
 *
 * NOTE: never store the original precise coordinate. The fuzzed value
 * is what goes into the DB.
 */
export function fuzzLocation(point: LatLng, precisionMeters = 200): LatLng {
  // 1 degree latitude ≈ 111_000 m
  // 1 degree longitude ≈ 111_000 * cos(lat) m
  const latM = precisionMeters / 111_000;
  const lngM = precisionMeters / (111_000 * Math.cos((point.lat * Math.PI) / 180));

  // Snap to cell of size (latM, lngM), then jitter within cell.
  const latCell = Math.round(point.lat / latM) * latM;
  const lngCell = Math.round(point.lng / lngM) * lngM;
  const latJitter = (Math.random() - 0.5) * latM;
  const lngJitter = (Math.random() - 0.5) * lngM;

  return {
    lat: Number((latCell + latJitter).toFixed(6)),
    lng: Number((lngCell + lngJitter).toFixed(6)),
  };
}
