/**
 * Location Matcher for AccessRoute Journey Routing
 *
 * Resolves user-facing origin and destination query strings or coordinates
 * to graph stop and station nodes.
 */

export class LocationMatcher {
  constructor(transitGraph) {
    this.transitGraph = transitGraph;
  }

  /**
   * Find stop or station matching query.
   * Query can be a stop ID, station ID, station name, or alias.
   */
  resolveLocation(query) {
    if (!query) return null;

    if (typeof query === 'object' && query.lat !== undefined && query.lon !== undefined) {
      return this.resolveByCoordinates(query.lat, query.lon);
    }

    const clean = String(query).trim().toLowerCase();
    if (!clean) return null;

    // 1. Direct Stop ID match
    const directStop = this.transitGraph.getStop(query);
    if (directStop) {
      return {
        type: 'stop',
        id: directStop.id,
        name: directStop.name,
        code: directStop.code,
        stopIds: [directStop.id],
        latitude: directStop.latitude,
        longitude: directStop.longitude,
        parentStation: directStop.parentStation
      };
    }

    // 2. Direct Station ID match
    const directStation = this.transitGraph.getStation(query);
    if (directStation) {
      return {
        type: 'station',
        id: directStation.id,
        name: directStation.name,
        code: directStation.code,
        stopIds: directStation.stopIds.length > 0 ? directStation.stopIds : [directStation.id],
        latitude: directStation.latitude,
        longitude: directStation.longitude
      };
    }

    // 3. Known Aliases and Standard Chennai Hotspot Mappings
    const aliasMap = {
      'location_1': 'STN_CENTRAL',
      'chennai central': 'STN_CENTRAL',
      'station_chennai_central': 'STN_CENTRAL',
      'mgr central': 'STN_CENTRAL',
      'central': 'STN_CENTRAL',
      'smc': 'STN_CENTRAL',
      'mas': 'STN_CENTRAL',

      'location_2': 'STN_GUINDY',
      'guindy': 'STN_GUINDY',
      'guindy metro': 'STN_GUINDY',
      'station_guindy': 'STN_GUINDY',
      'gdy': 'STN_GUINDY',
      'sgd': 'STN_GUINDY',

      'location_3': 'STN_EGMORE',
      'egmore': 'STN_EGMORE',
      'chennai egmore': 'STN_EGMORE',
      'station_egmore': 'STN_EGMORE',
      'ms': 'STN_EGMORE',

      'location_6': 'STN_SAIDAPET',
      'saidapet': 'STN_SAIDAPET',
      'station_saidapet': 'STN_SAIDAPET',
      'saidapet metro': 'STN_SAIDAPET',
      'ssd': 'STN_SAIDAPET',

      'koyambedu': 'STN_KOYAMBEDU',
      'cmbt': 'STN_KOYAMBEDU',
      'skb': 'STN_KOYAMBEDU',

      'airport': 'STN_AIRPORT',
      'chennai airport': 'STN_AIRPORT',
      'meenambakkam': 'STN_AIRPORT'
    };

    if (aliasMap[clean]) {
      const aliasTarget = aliasMap[clean];
      const station = this.transitGraph.getStation(aliasTarget);
      if (station) {
        return {
          type: 'station',
          id: station.id,
          name: station.name,
          code: station.code,
          stopIds: station.stopIds.length > 0 ? station.stopIds : [station.id],
          latitude: station.latitude,
          longitude: station.longitude
        };
      }
      const stop = this.transitGraph.getStop(aliasTarget);
      if (stop) {
        return {
          type: 'stop',
          id: stop.id,
          name: stop.name,
          code: stop.code,
          stopIds: [stop.id],
          latitude: stop.latitude,
          longitude: stop.longitude
        };
      }
    }

    // 4. Fuzzy search across stations
    for (const station of this.transitGraph.stations.values()) {
      const stationName = station.name.toLowerCase();
      const stationCode = (station.code || '').toLowerCase();
      if (stationName === clean || stationCode === clean || stationName.includes(clean) || clean.includes(stationName)) {
        return {
          type: 'station',
          id: station.id,
          name: station.name,
          code: station.code,
          stopIds: station.stopIds.length > 0 ? station.stopIds : [station.id],
          latitude: station.latitude,
          longitude: station.longitude
        };
      }
    }

    // 5. Fuzzy search across stops
    for (const stop of this.transitGraph.stops.values()) {
      const stopName = stop.name.toLowerCase();
      const stopCode = (stop.code || '').toLowerCase();
      if (stopName === clean || stopCode === clean || stopName.includes(clean) || clean.includes(stopName)) {
        return {
          type: 'stop',
          id: stop.id,
          name: stop.name,
          code: stop.code,
          stopIds: [stop.id],
          latitude: stop.latitude,
          longitude: stop.longitude,
          parentStation: stop.parentStation
        };
      }
    }

    return null;
  }

  /**
   * Spatial lookup: Find nearest stop/station within maxDistanceMeters (default 500m)
   */
  resolveByCoordinates(lat, lon, maxDistanceMeters = 500) {
    let nearest = null;
    let minDistance = Infinity;

    for (const stop of this.transitGraph.stops.values()) {
      if (stop.latitude == null || stop.longitude == null) continue;
      const d = haversineDistanceMeters(lat, lon, stop.latitude, stop.longitude);
      if (d < minDistance && d <= maxDistanceMeters) {
        minDistance = d;
        nearest = {
          type: 'stop',
          id: stop.id,
          name: stop.name,
          stopIds: [stop.id],
          latitude: stop.latitude,
          longitude: stop.longitude,
          distanceMeters: Math.round(d)
        };
      }
    }

    return nearest;
  }
}

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
