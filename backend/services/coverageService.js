import fs from 'fs';
import path from 'path';

/**
 * AccessRoute Centralized Coverage Service
 * Enforces Chennai-only geographic boundary and connected multi-county transit network
 * (Chennai, Chengalpattu, Kanchipuram, Tiruvallur).
 */

export const CHENNAI_BOUNDS = {
  minLatitude: 12.50,
  maxLatitude: 13.50,
  minLongitude: 79.50,
  maxLongitude: 80.40,
  defaultCenter: [80.2707, 13.0827], // [lon, lat] Chennai Central
  defaultZoom: 12.5
};

export const CHENNAI_COVERAGE_MESSAGE =
  'AccessRoute currently supports Chennai and its connected transit network.';

// Blacklist of explicit out-of-scope metropolitan cities
export const UNSUPPORTED_CITIES_REGEX =
  /\b(bengaluru|bangalore|mumbai|bombay|delhi|new delhi|hyderabad|secunderabad|kolkata|calcutta|pune|ahmedabad|jaipur|surat|lucknow|chandigarh|kochi|cochin|trivandrum|thiruvananthapuram|coimbatore|madurai|trichy|tiruchirappalli|salem|tirunelveli|mysore|mysuru|london|singapore|new york)\b/i;

// Cache loaded stations
let cachedLocations = null;

export function loadAllSupportedLocations() {
  if (cachedLocations) return cachedLocations;

  const baseDir = path.resolve(process.cwd(), 'data');
  const list = [];
  const aliasMap = new Map();

  try {
    const cmrl = JSON.parse(fs.readFileSync(path.join(baseDir, 'chennai_metro', 'verified_stations.json'), 'utf8'));
    for (const st of cmrl.stations) {
      const loc = {
        id: st.id || `cmrl_${st.code.toLowerCase()}`,
        code: st.code,
        name: st.name,
        tamilName: st.tamilName || '',
        category: 'metro_station',
        mode: 'chennai_metro',
        modeLabel: 'Chennai Metro',
        latitude: st.latitude,
        longitude: st.longitude,
        coordinates: [st.longitude, st.latitude],
        district: st.latitude > 13.1 ? 'Tiruvallur' : 'Chennai',
        stepFreeAccess: Boolean(st.stepFreeAccess)
      };
      list.push(loc);
      aliasMap.set(st.name.toLowerCase(), loc);
      aliasMap.set(st.code.toLowerCase(), loc);
    }
  } catch (err) {
    console.warn('[coverageService] Could not read cmrl data:', err.message);
  }

  try {
    const srr = JSON.parse(fs.readFileSync(path.join(baseDir, 'suburban_rail', 'verified_stations.json'), 'utf8'));
    for (const st of srr.stations) {
      const loc = {
        id: st.id || `srr_${st.code.toLowerCase()}`,
        code: st.code,
        name: st.name,
        tamilName: st.tamilName || '',
        category: 'suburban_station',
        mode: 'suburban_rail',
        modeLabel: 'Suburban Rail',
        latitude: st.latitude,
        longitude: st.longitude,
        coordinates: [st.longitude, st.latitude],
        district: st.district || 'Chennai',
        stepFreeAccess: Boolean(st.stepFreeAccess)
      };
      list.push(loc);
      aliasMap.set(st.name.toLowerCase(), loc);
      aliasMap.set(st.code.toLowerCase(), loc);
    }
  } catch (err) {
    console.warn('[coverageService] Could not read srr data:', err.message);
  }

  try {
    const mtc = JSON.parse(fs.readFileSync(path.join(baseDir, 'mtc_bus', 'verified_hubs.json'), 'utf8'));
    for (const hub of mtc.interchangeHubs) {
      const loc = {
        id: hub.id || `mtc_${hub.code.toLowerCase()}`,
        code: hub.code,
        name: hub.name,
        tamilName: hub.tamilName || '',
        category: 'bus_hub',
        mode: 'mtc_bus',
        modeLabel: 'MTC Bus Hub',
        latitude: hub.latitude,
        longitude: hub.longitude,
        coordinates: [hub.longitude, hub.latitude],
        district: hub.district || 'Chennai',
        stepFreeAccess: false
      };
      list.push(loc);
      aliasMap.set(hub.name.toLowerCase(), loc);
      aliasMap.set(hub.code.toLowerCase(), loc);
    }
  } catch (err) {
    console.warn('[coverageService] Could not read mtc data:', err.message);
  }

  try {
    const exp = JSON.parse(fs.readFileSync(path.join(baseDir, 'express_rail', 'verified_express_stops.json'), 'utf8'));
    for (const st of exp.chennaiBeltStations) {
      const loc = {
        id: `exp_${st.code.toLowerCase()}`,
        code: st.code,
        name: st.name,
        tamilName: st.tamilName || '',
        category: 'express_terminal',
        mode: 'express_rail',
        modeLabel: 'Express Rail',
        latitude: st.latitude,
        longitude: st.longitude,
        coordinates: [st.longitude, st.latitude],
        district: st.district || 'Chennai',
        stepFreeAccess: true
      };
      list.push(loc);
      aliasMap.set(st.name.toLowerCase(), loc);
      aliasMap.set(st.code.toLowerCase(), loc);
    }
  } catch (err) {
    console.warn('[coverageService] Could not read exp data:', err.message);
  }

  // Key Chennai localities & landmarks connected within bounds
  const additionalLocalities = [
    { name: 'T. Nagar', code: 'TNAGAR', latitude: 13.0418, longitude: 80.2341, district: 'Chennai' },
    { name: 'Mylapore', code: 'MYL', latitude: 13.0368, longitude: 80.2676, district: 'Chennai' },
    { name: 'Adyar', code: 'ADY', latitude: 13.0012, longitude: 80.2565, district: 'Chennai' },
    { name: 'Anna Nagar', code: 'ANAGAR', latitude: 13.0850, longitude: 80.2100, district: 'Chennai' },
    { name: 'Besant Nagar', code: 'BNAGAR', latitude: 13.0001, longitude: 80.2667, district: 'Chennai' },
    { name: 'Porur', code: 'PORUR', latitude: 13.0382, longitude: 80.1565, district: 'Chennai / Tiruvallur' },
    { name: 'Poonamallee', code: 'PNML', latitude: 13.0494, longitude: 80.1114, district: 'Tiruvallur' },
    { name: 'Velachery', code: 'VLCY_LOC', latitude: 12.9815, longitude: 80.2180, district: 'Chennai' },
    { name: 'Sholinganallur', code: 'SHOL', latitude: 12.9010, longitude: 80.2279, district: 'Chengalpattu' },
    { name: 'Siruseri', code: 'SIPCOT', latitude: 12.8270, longitude: 80.2185, district: 'Chengalpattu' },
    { name: 'Sriperumbudur', code: 'SRIPER', latitude: 12.9699, longitude: 79.9406, district: 'Kanchipuram' }
  ];

  for (const loc of additionalLocalities) {
    const entry = {
      id: `loc_${loc.code.toLowerCase()}`,
      code: loc.code,
      name: loc.name,
      tamilName: '',
      category: 'locality',
      mode: 'road_hub',
      modeLabel: 'Locality',
      latitude: loc.latitude,
      longitude: loc.longitude,
      coordinates: [loc.longitude, loc.latitude],
      district: loc.district,
      stepFreeAccess: true
    };
    list.push(entry);
    aliasMap.set(loc.name.toLowerCase(), entry);
    aliasMap.set(loc.code.toLowerCase(), entry);
  }

  // Common aliases
  aliasMap.set('chennai central', aliasMap.get('mgr central') || list.find(l => l.name.includes('Central')));
  aliasMap.set('central', aliasMap.get('chennai central'));
  aliasMap.set('central railway station', aliasMap.get('chennai central'));
  aliasMap.set('egmore', list.find(l => l.name.toLowerCase().includes('egmore')));
  aliasMap.set('airport', list.find(l => l.name.toLowerCase().includes('airport')));
  aliasMap.set('chennai airport', list.find(l => l.name.toLowerCase().includes('airport')));
  aliasMap.set('tambaram', list.find(l => l.name.toLowerCase().includes('tambaram')));
  aliasMap.set('guindy', list.find(l => l.name.toLowerCase().includes('guindy')));
  aliasMap.set('cmbt', list.find(l => l.name.toLowerCase().includes('koyambedu') || l.name.toLowerCase().includes('cmbt')));
  aliasMap.set('koyambedu', aliasMap.get('cmbt'));
  aliasMap.set('location_1', aliasMap.get('chennai central'));
  aliasMap.set('location_2', aliasMap.get('guindy'));

  cachedLocations = { list, aliasMap };
  return cachedLocations;
}

/**
 * Check if a coordinate [latitude, longitude] or {lat, lon} falls inside the Chennai network boundary
 */
export function isCoordinateWithinChennai(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  return (
    lat >= CHENNAI_BOUNDS.minLatitude &&
    lat <= CHENNAI_BOUNDS.maxLatitude &&
    lon >= CHENNAI_BOUNDS.minLongitude &&
    lon <= CHENNAI_BOUNDS.maxLongitude
  );
}

/**
 * Validate a location query string or coordinate object.
 * Returns { valid: true, location, coordinates } or { valid: false, reason, outOfScope: true }
 */
export function validateAndResolveLocation(queryOrPoint) {
  if (!queryOrPoint) {
    return { valid: false, reason: 'Location is required', outOfScope: false };
  }

  // If passed as coordinate array [lon, lat]
  if (Array.isArray(queryOrPoint) && queryOrPoint.length >= 2) {
    const lon = Number(queryOrPoint[0]);
    const lat = Number(queryOrPoint[1]);
    if (isCoordinateWithinChennai(lat, lon)) {
      return {
        valid: true,
        coordinates: [lon, lat],
        location: { name: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`, latitude: lat, longitude: lon }
      };
    }
    return {
      valid: false,
      reason: CHENNAI_COVERAGE_MESSAGE,
      outOfScope: true
    };
  }

  // If passed as object { lat, lon } or { latitude, longitude }
  if (typeof queryOrPoint === 'object' && queryOrPoint !== null) {
    const lat = Number(queryOrPoint.lat ?? queryOrPoint.latitude);
    const lon = Number(queryOrPoint.lon ?? queryOrPoint.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      if (isCoordinateWithinChennai(lat, lon)) {
        return {
          valid: true,
          coordinates: [lon, lat],
          location: queryOrPoint
        };
      }
      return {
        valid: false,
        reason: CHENNAI_COVERAGE_MESSAGE,
        outOfScope: true
      };
    }
  }

  const queryStr = String(queryOrPoint).trim();

  // Explicit check against non-Chennai cities (e.g. Bengaluru, Mumbai, Delhi, Hyderabad)
  if (UNSUPPORTED_CITIES_REGEX.test(queryStr)) {
    return {
      valid: false,
      reason: CHENNAI_COVERAGE_MESSAGE,
      outOfScope: true,
      query: queryStr
    };
  }

  const { list, aliasMap } = loadAllSupportedLocations();
  const lower = queryStr.toLowerCase();

  // 1. Direct alias match
  if (aliasMap.has(lower)) {
    const match = aliasMap.get(lower);
    return {
      valid: true,
      location: match,
      coordinates: [match.longitude, match.latitude]
    };
  }

  // 2. Exact name / code match
  const exact = list.find(
    (l) => l.name.toLowerCase() === lower || l.code.toLowerCase() === lower
  );
  if (exact) {
    return {
      valid: true,
      location: exact,
      coordinates: [exact.longitude, exact.latitude]
    };
  }

  // 3. Substring match
  const partial = list.find((l) => {
    const nameLow = l.name.toLowerCase();
    return nameLow.includes(lower) || (lower.length >= 4 && lower.includes(nameLow));
  });
  if (partial) {
    return {
      valid: true,
      location: partial,
      coordinates: [partial.longitude, partial.latitude]
    };
  }

  // If query is an unknown location name that wasn't found in Chennai network
  return {
    valid: false,
    reason: `${CHENNAI_COVERAGE_MESSAGE} Destination "${queryStr}" was not found in supported stations or corridors.`,
    outOfScope: true,
    query: queryStr
  };
}
