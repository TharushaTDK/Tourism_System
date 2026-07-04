// Great-circle distance in km between two lat/lng points, padded by a road-winding
// factor since actual driving routes are never a straight line (stand-in for a
// live routing API).
const ROAD_DISTANCE_FACTOR = 1.3;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimatedRoadKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2) * ROAD_DISTANCE_FACTOR;
}

const isValidLatLng = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// Extracts a lat/lng pair out of a pasted Google Maps URL (or a bare "lat, lng" string),
// so an admin can copy a place from Google Maps and drop the link straight into the form.
export function parseGoogleMapsLink(input: string): { lat: number; lng: number } | null {
  const s = input.trim();
  if (!s) return null;

  // Precise pin coords embedded in "place" links: !3d<lat>!4d<lng>
  let m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  // Map viewport center: .../@<lat>,<lng>,<zoom>z
  if (!m) m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  // Search-style link: ?q=<lat>,<lng>
  if (!m) m = s.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  // Bare "lat, lng" text
  if (!m) m = s.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);

  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return isValidLatLng(lat, lng) ? { lat, lng } : null;
}
