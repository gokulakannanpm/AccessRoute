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

/**
 * Search routes from origin to destination considering preferences
 */
export async function searchRoutes(origin = 'Chennai Central', destination = 'Guindy', preferences = {}) {
  try {
    const res = await fetch('/api/routes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, preferences })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[API Client] searchRoutes fetch failed, using fallback:', err.message);
  }
  return DEMO_ROUTES;
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
