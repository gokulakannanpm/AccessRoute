/**
 * AccessRoute API Utilities
 * Mock implementation ready for Backend Engineer integration.
 */

// Demo route data matching Stitch design specs
export const DEMO_ROUTES = {
  recommended: {
    id: 'rec-1',
    type: 'recommended',
    label: 'RECOMMENDED FOR YOU',
    fare: 25,
    fareText: '₹25',
    cabSavingsText: '₹140 cheaper than estimated cab',
    durationMinutes: 38,
    durationText: '38 min',
    arrivalTime: '10:23 AM',
    accessibilityLevel: 'Highly Accessible',
    accessibilityBadgeColor: 'teal',
    isStepFree: true,
    elevatorsCount: 2,
    stairsCount: 0,
    hasRamp: true,
    hasLowFloorBus: true,
    walkingDistanceMeters: 180,
    walkingText: '180m walking distance',
    color: '#1A5C8D',
    coordinates: [
      [80.2707, 13.0827],
      [80.2715, 13.0818],
      [80.2725, 13.0750],
      [80.2670, 13.0650],
      [80.2570, 13.0550],
      [80.2480, 13.0420],
      [80.2390, 13.0320],
      [80.2285, 13.0235],
      [80.2281, 13.0232],
      [80.2320, 13.0150],
      [80.2370, 13.0070],
      [80.2408, 13.0001]
    ],
    segments: [
      { id: 1, type: 'walk', mode: 'Walk', distance: '120m', duration: '2 min', description: 'Step-free path', icon: 'walk' },
      { id: 2, type: 'bus', mode: 'MTC Bus', badge: 'MTC Bus 21', routeName: 'Bus 21', duration: '18 min', description: 'Low-floor, Ramp', icon: 'bus' },
      { id: 3, type: 'transfer', mode: 'Walk', distance: '80m', duration: '2 min', description: 'Smooth transition', icon: 'walk' },
      { id: 4, type: 'elevator', mode: 'Elevator', elevatorName: 'Elevator B', duration: '1 min', description: 'Step-free to platform', icon: 'elevator' },
      { id: 5, type: 'metro', mode: 'Chennai Metro', routeName: 'Blue Line', duration: '14 min', description: 'Board train', icon: 'metro' },
    ],
    destinationDetails: {
      name: 'Guindy',
      status: 'Verified/Accessible',
      elevators: 2,
      rampAvailable: true,
      stairsPresent: true,
      gate2StepFree: true
    }
  },
  fastest: {
    id: 'fast-1',
    type: 'fastest',
    label: 'FASTEST',
    fare: 35,
    fareText: '₹35',
    durationMinutes: 31,
    durationText: '31 min',
    arrivalTime: '10:16 AM',
    accessibilityLevel: 'Limited Accessibility',
    accessibilityBadgeColor: 'warning',
    warningText: '2 flights of stairs, 620m walking',
    isStepFree: false,
    elevatorsCount: 0,
    stairsCount: 2,
    hasRamp: false,
    walkingDistanceMeters: 620,
    walkingText: '620m walking distance',
    color: '#5A9FD4',
    coordinates: [
      [80.2707, 13.0827],
      [80.2720, 13.0805],
      [80.2660, 13.0680],
      [80.2550, 13.0560],
      [80.2440, 13.0420],
      [80.2340, 13.0280],
      [80.2281, 13.0232],
      [80.2360, 13.0090],
      [80.2408, 13.0001],
      [80.2415, 12.9985]
    ],
    segments: [
      { id: 1, type: 'walk', mode: 'Walk', distance: '300m', duration: '5 min', description: 'Stairs required', icon: 'walk' },
      { id: 2, type: 'metro', mode: 'Chennai Metro', routeName: 'Blue Line', duration: '20 min', description: 'Direct train', icon: 'metro' },
      { id: 3, type: 'walk', mode: 'Walk', distance: '320m', duration: '6 min', description: 'Overpass stairs', icon: 'walk' }
    ]
  },
  lowestCost: {
    id: 'cost-1',
    type: 'lowest_cost',
    label: 'LOWEST COST',
    fare: 15,
    fareText: '₹15',
    durationMinutes: 44,
    durationText: '44 min',
    arrivalTime: '10:29 AM',
    accessibilityLevel: 'Good Accessibility',
    accessibilityBadgeColor: 'navy',
    isStepFree: true,
    elevatorsCount: 0,
    stairsCount: 0,
    hasRamp: true,
    walkingDistanceMeters: 300,
    walkingText: '300m walking distance',
    color: '#64748B',
    coordinates: [
      [80.2707, 13.0827],
      [80.2718, 13.0815],
      [80.2690, 13.0720],
      [80.2600, 13.0590],
      [80.2480, 13.0450],
      [80.2360, 13.0300],
      [80.2310, 13.0180],
      [80.2395, 13.0030],
      [80.2408, 13.0001]
    ],
    segments: [
      { id: 1, type: 'walk', mode: 'Walk', distance: '150m', duration: '3 min', description: 'Ramp entrance', icon: 'walk' },
      { id: 2, type: 'bus', mode: 'MTC Bus', badge: 'MTC Bus 18G', routeName: 'Bus 18G', duration: '38 min', description: 'Standard bus, Low step', icon: 'bus' },
      { id: 3, type: 'walk', mode: 'Walk', distance: '150m', duration: '3 min', description: 'Paved sidewalk', icon: 'walk' }
    ]
  }
};

export const USER_IMPACT_STATS = {
  user: {
    name: 'Chennai Commuter',
    subtitle: 'My Impact',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop'
  },
  stats: {
    publicTransportJourneys: 14,
    estimatedSavings: 1240, // ₹
    co2AvoidedKg: 18.4, // kg
    accessibleJourneys: 9,
    issuesReported: 3
  }
};

import { fetchDynamicRouteData } from './routing';

/**
 * Fetch timetable routing engine status and feed eligibility audit
 */
export async function fetchTimetableStatus() {
  try {
    const res = await fetch('/api/routes/timetable/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API Client] fetchTimetableStatus failed:', err.message);
  }
  return {
    service: 'AccessRoute Timetable Routing Engine',
    productionRoutingReady: false,
    eligibleFeedsCount: 0,
    notice: 'Production timetable routing is strictly disabled: unverified feeds in verification quarantine.'
  };
}

/**
 * Query the timetable routing engine for real schedule-based journeys.
 * Returns { success: true, data } on success, or { success: false, status, code, error, details } on failure.
 * Never silently falls back to illustrative routes.
 */
export async function searchTimetableRoutes({
  origin = 'Chennai Central',
  destination = 'Guindy',
  departureTime = '08:30:00',
  preferences = {},
  transportModes = {},
  useSyntheticFixtures = false
}) {
  try {
    const res = await fetch('/api/routes/timetable-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        departureTime,
        preferences: {
          ...preferences,
          transportModes
        },
        useSyntheticFixtures
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return {
        success: true,
        data
      };
    }

    return {
      success: false,
      status: res.status,
      code: data.code || 'ROUTING_ERROR',
      error: data.error || 'Failed to calculate timetable route',
      details: data.details || {}
    };
  } catch (err) {
    return {
      success: false,
      status: 503,
      code: 'NETWORK_ERROR',
      error: `Network error reaching routing engine: ${err.message}`,
      details: {}
    };
  }
}

/**
 * Search routes from origin to destination considering preferences.
 * By default returns illustrative preview; if routingMode === 'timetable', queries timetable engine.
 */
export async function searchRoutes(origin = 'Chennai Central', destination = 'Guindy', preferences = {}, routingMode = 'illustrative') {
  try {
    const res = await fetch('/api/routes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, preferences, routingMode })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.recommended || data.fastest)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[API Client] searchRoutes fetch failed, using dynamic route builder:', err.message);
  }

  // Generate real road-snapped polylines via OSRM + MTC bus numbers and stage fares
  return await fetchDynamicRouteData(origin, destination);
}

/**
 * Get station accessibility details
 */
export async function getStationDetails(stationId = 'station_guindy') {
  try {
    const res = await fetch(`/api/stations/${stationId}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[API Client] getStationDetails fetch failed, using fallback:', err.message);
  }
  return {
    stationId,
    name: 'Guindy Station',
    verified: true,
    elevators: 2,
    ramp: 'Available',
    stairs: 'Present',
    gate2: 'Step-free'
  };
}

/**
 * Report an infrastructure issue
 */
export async function reportIssue(issueData) {
  try {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[API Client] reportIssue fetch failed, using fallback:', err.message);
  }
  console.log('[AccessRoute API] Issue reported fallback:', issueData);
  return {
    success: true,
    issueId: 'ISSUE-' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch searchable locations
 */
export async function fetchLocations() {
  try {
    const res = await fetch('/api/locations');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API Client] fetchLocations failed:', err.message);
  }
  return [];
}

/**
 * Fetch user impact and profile statistics
 */
export async function fetchUserProfile() {
  try {
    const res = await fetch('/api/profile');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API Client] fetchUserProfile failed:', err.message);
  }
  return USER_IMPACT_STATS;
}

/**
 * Calculate geographical road or pedestrian route via /api/geo/route
 */
export async function calculateGeoRoute({ origin, destination, profile = 'walking', preferences = {} }) {
  try {
    const res = await fetch('/api/geo/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, profile, preferences })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, status: res.status, code: data.code, error: data.error, details: data.details };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, status: 500, code: 'NETWORK_ERROR', error: err.message };
  }
}

/**
 * Geocode query via /api/geo/geocode
 */
export async function geocodeLocation(query) {
  try {
    const res = await fetch(`/api/geo/geocode?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, status: res.status, error: data.error, code: data.code };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Autocomplete place query via /api/geo/autocomplete
 */
export async function searchAutocomplete(query) {
  try {
    const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(query || '')}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return { outOfScope: false, results: [] };
  }
}

/**
 * Fetch pedestrian infrastructure features via /api/geo/pedestrian
 */
export async function fetchPedestrianFeatures(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.stepFreeOnly) params.set('stepFreeOnly', 'true');
    if (filters.avoidStairs) params.set('avoidStairs', 'true');
    const res = await fetch(`/api/geo/pedestrian?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.features || [];
    }
  } catch (err) {
    console.warn('[API Client] fetchPedestrianFeatures failed:', err.message);
  }
  return [];
}

