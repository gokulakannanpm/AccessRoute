/**
 * AccessRoute Frontend Coverage & Boundary Utility
 * Centralized configuration enforcing Chennai and its connected transit network.
 */

export const CHENNAI_BOUNDS = {
  minLatitude: 12.50,
  maxLatitude: 13.50,
  minLongitude: 79.50,
  maxLongitude: 80.40,
  defaultCenter: [80.2707, 13.0827], // [lon, lat] Chennai Central
  defaultZoom: 12.5,
  maxBounds: [
    [79.30, 12.30], // Southwest bounds (buffer)
    [80.60, 13.70]  // Northeast bounds (buffer)
  ]
};

export const CHENNAI_COVERAGE_MESSAGE =
  'AccessRoute currently supports Chennai and its connected transit network.';

export const UNSUPPORTED_CITIES_REGEX =
  /\b(bengaluru|bangalore|mumbai|bombay|delhi|new delhi|hyderabad|secunderabad|kolkata|calcutta|pune|ahmedabad|jaipur|surat|lucknow|chandigarh|kochi|coimbatore|madurai|trichy|mysore|london|new york)\b/i;

/**
 * Check if coordinates are within the Chennai network scope
 */
export function isWithinChennaiBounds(lon, lat) {
  if (typeof lon !== 'number' || typeof lat !== 'number') return false;
  return (
    lat >= CHENNAI_BOUNDS.minLatitude &&
    lat <= CHENNAI_BOUNDS.maxLatitude &&
    lon >= CHENNAI_BOUNDS.minLongitude &&
    lon <= CHENNAI_BOUNDS.maxLongitude
  );
}

/**
 * Check if a search query is asking for an unsupported city
 */
export function isUnsupportedLocation(query) {
  if (!query || typeof query !== 'string') return false;
  return UNSUPPORTED_CITIES_REGEX.test(query.trim());
}

