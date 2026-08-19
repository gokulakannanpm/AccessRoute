/**
 * AccessRoute Accessibility Routing Engine
 * Chennai Public Transit Route Calculation and Accessibility Scoring
 */

// Geographic Coordinates for Chennai Public Transit Network
export const CHENNAI_COORDINATES = {
  chennaiCentral: [80.2707, 13.0827],
  egmore: [80.2610, 13.0792],
  thousandLights: [80.2520, 13.0604],
  tNagar: [80.2341, 13.0418],
  saidapet: [80.2281, 13.0232],
  guindy: [80.2408, 13.0001],
  alandur: [80.2014, 13.0039],
  airport: [80.1636, 12.9815]
};

// Chennai Metro Network Polylines for Background Transit Map Layer
export const CHENNAI_METRO_LINES = {
  blueLine: {
    id: 'metro-blue-line',
    name: 'Chennai Metro Blue Line',
    color: '#0284C7',
    coordinates: [
      [80.2707, 13.0827], // Chennai Central
      [80.2680, 13.0720], // Government Estate
      [80.2600, 13.0610], // LIC
      [80.2520, 13.0500], // Thousand Lights
      [80.2440, 13.0410], // AG-DMS
      [80.2400, 13.0310], // Teynampet
      [80.2340, 13.0270], // Nandanam
      [80.2281, 13.0232], // Saidapet
      [80.2350, 13.0110], // Little Mount
      [80.2408, 13.0001], // Guindy
      [80.2014, 13.0039], // Alandur
      [80.1820, 12.9920], // Meenambakkam
      [80.1636, 12.9815]  // Chennai Airport
    ]
  },
  greenLine: {
    id: 'metro-green-line',
    name: 'Chennai Metro Green Line',
    color: '#10B981',
    coordinates: [
      [80.2707, 13.0827], // Chennai Central
      [80.2610, 13.0792], // Egmore
      [80.2480, 13.0780], // Nehru Park
      [80.2340, 13.0760], // Kilpauk
      [80.2210, 13.0740], // Shenoy Nagar
      [80.2080, 13.0720], // Anna Nagar East
      [80.1940, 13.0700], // Thirumangalam
      [80.1930, 13.0600], // Koyambedu
      [80.2100, 13.0500], // CMBT
      [80.2120, 13.0300], // Ashok Nagar
      [80.2050, 13.0150], // Ekkattuthangal
      [80.2014, 13.0039], // Alandur
      [80.1980, 12.9950]  // St. Thomas Mount
    ]
  }
};

// Accessibility Features and Barriers in Chennai
export const CHENNAI_ACCESSIBILITY_FEATURES = [
  // Elevators (Green)
  {
    id: 'elev-central-1',
    type: 'elevator',
    name: 'Elevator A & B',
    station: 'Chennai Central',
    status: 'Operational',
    details: 'Step-free subway access to metro concourse and platform level',
    coordinates: [80.2709, 13.0829],
    icon: 'elevator',
    color: '#10B981'
  },
  {
    id: 'elev-egmore-1',
    type: 'elevator',
    name: 'Elevator 1',
    station: 'Egmore Station',
    status: 'Operational',
    details: 'Platform 1 & Main Concourse step-free transfer',
    coordinates: [80.2612, 13.0794],
    icon: 'elevator',
    color: '#10B981'
  },
  {
    id: 'elev-saidapet-1',
    type: 'elevator',
    name: 'Elevator B',
    station: 'Saidapet Metro',
    status: 'Operational',
    details: 'Step-free street to concourse and train platform',
    coordinates: [80.2283, 13.0234],
    icon: 'elevator',
    color: '#10B981'
  },
  {
    id: 'elev-guindy-1',
    type: 'elevator',
    name: 'Elevator B & C',
    station: 'Guindy Metro',
    status: 'Operational',
    details: 'Gate B & Gate C fully operational hydraulic lifts',
    coordinates: [80.2410, 13.0004],
    icon: 'elevator',
    color: '#10B981'
  },

  // Ramps (Green)
  {
    id: 'ramp-central-1',
    type: 'ramp',
    name: 'Gate 1 Concourse Ramp',
    station: 'Chennai Central',
    status: 'Available',
    details: 'Tactile guided 1:12 slope ramp with dual handrails',
    coordinates: [80.2702, 13.0823],
    icon: 'ramp',
    color: '#10B981'
  },
  {
    id: 'ramp-saidapet-1',
    type: 'ramp',
    name: 'South Entry Ramp',
    station: 'Saidapet Metro',
    status: 'Available',
    details: 'Direct street-level ramp into fare gate lobby',
    coordinates: [80.2277, 13.0228],
    icon: 'ramp',
    color: '#10B981'
  },
  {
    id: 'ramp-guindy-1',
    type: 'ramp',
    name: 'Guindy Main Entrance Ramp',
    station: 'Guindy Metro',
    status: 'Available',
    details: 'Wide anti-slip ramp leading to ticketing counters',
    coordinates: [80.2404, 12.9998],
    icon: 'ramp',
    color: '#10B981'
  },

  // Accessible Step-Free Entrances (Teal/Green Wheelchair)
  {
    id: 'entrance-central-1',
    type: 'entrance',
    name: 'Gate 1 Step-Free Entry',
    station: 'Chennai Central',
    status: 'Step-Free',
    details: 'Automatic wide sliding doors with level boarding',
    coordinates: [80.2705, 13.0825],
    icon: 'wheelchair',
    color: '#1AC8A0'
  },
  {
    id: 'entrance-guindy-1',
    type: 'entrance',
    name: 'Gate 2 Step-Free Entry',
    station: 'Guindy Metro',
    status: 'Step-Free',
    details: 'Wide wheelchair fare gates & audio beacons',
    coordinates: [80.2408, 13.0001],
    icon: 'wheelchair',
    color: '#1AC8A0'
  },

  // Stairs / Physical Barriers (Gray / Warning)
  {
    id: 'stairs-central-subway',
    type: 'stairs',
    name: 'North Subway Stairs',
    station: 'Chennai Central',
    status: 'Warning',
    details: '28 steep steps without ramp (Elevator bypass available at Gate 1)',
    coordinates: [80.2718, 13.0838],
    icon: 'stairs',
    color: '#EF4444'
  },
  {
    id: 'stairs-guindy-overpass',
    type: 'stairs',
    name: 'Road Overpass Stairs',
    station: 'Guindy Transit Hub',
    status: 'Warning',
    details: '2 flights of stairs (42 steps total) on pedestrian footbridge',
    coordinates: [80.2416, 12.9992],
    icon: 'stairs',
    color: '#EF4444'
  }
];

// Seeded candidate routes with precise Chennai Transit Geometries
export const CHENNAI_CANDIDATE_ROUTES = {
  recommended: {
    id: 'route_1',
    type: 'recommended',
    label: 'RECOMMENDED FOR YOU',
    badge: '⭐ RECOMMENDED FOR YOU',
    duration: 38,
    durationMinutes: 38,
    durationText: '38 min',
    arrivalTime: '10:23 AM',
    fare: 25,
    fareText: '₹25',
    estimatedCabFare: 165,
    estimatedSavings: 140,
    cabSavingsText: '₹140 cheaper than estimated cab',
    accessibilityLevel: 'Highly Accessible',
    accessibilityBadgeColor: 'teal',
    isStepFree: true,
    elevatorsCount: 2,
    stairsCount: 0,
    hasRamp: true,
    hasLowFloorBus: true,
    walkingDistanceMeters: 180,
    walkingDistance: 180,
    walkingText: '180m walking distance',
    color: '#1A5C8D',
    accessibility: {
      level: 'highly_accessible',
      elevators: 2,
      stairs: 0,
      ramps: 1,
      lowFloorBus: true,
      details: '2 elevators, 0 stairs, ramp available, low-floor bus'
    },
    // Detailed GeoJSON Polyline tracing Chennai Central -> Mount Rd -> Saidapet -> Guindy
    coordinates: [
      [80.2707, 13.0827], // Chennai Central Origin
      [80.2715, 13.0818], // MTC Bus Bay
      [80.2725, 13.0750], // Anna Salai / Mount Rd Start
      [80.2670, 13.0650], // LIC
      [80.2570, 13.0550], // Thousand Lights
      [80.2480, 13.0420], // Anna Flyover / Gemini
      [80.2390, 13.0320], // Teynampet
      [80.2285, 13.0235], // Saidapet Bus Stop
      [80.2281, 13.0232], // Saidapet Metro Elevator B Transfer
      [80.2320, 13.0150], // Blue Line Track
      [80.2370, 13.0070], // Blue Line Track approaching Guindy
      [80.2408, 13.0001]  // Guindy Metro Destination
    ],
    segments: [
      {
        id: 1,
        type: 'walk',
        mode: 'Walk',
        distance: '120m',
        distanceMeters: 120,
        duration: '2 min',
        description: 'Step-free path',
        accessibility: 'step-free',
        icon: 'walk',
        coordinates: [
          [80.2707, 13.0827],
          [80.2715, 13.0818]
        ]
      },
      {
        id: 2,
        type: 'bus',
        mode: 'MTC Bus',
        line: 'MTC Bus 21',
        badge: 'MTC Bus 21',
        routeName: 'Bus 21',
        duration: '18 min',
        description: 'Low-floor, Ramp',
        accessibility: 'low-floor, ramp',
        icon: 'bus',
        coordinates: [
          [80.2715, 13.0818],
          [80.2725, 13.0750],
          [80.2670, 13.0650],
          [80.2570, 13.0550],
          [80.2480, 13.0420],
          [80.2390, 13.0320],
          [80.2285, 13.0235]
        ]
      },
      {
        id: 3,
        type: 'walk',
        mode: 'Walk',
        distance: '80m',
        distanceMeters: 80,
        duration: '2 min',
        description: 'Smooth transition',
        accessibility: 'smooth',
        icon: 'walk',
        coordinates: [
          [80.2285, 13.0235],
          [80.2281, 13.0232]
        ]
      },
      {
        id: 4,
        type: 'elevator',
        mode: 'Elevator',
        elevatorName: 'Elevator B',
        location: 'Saidapet Metro Elevator B',
        duration: '1 min',
        description: 'Step-free to platform',
        accessibility: 'step-free to platform',
        icon: 'elevator',
        coordinates: [
          [80.2281, 13.0232]
        ]
      },
      {
        id: 5,
        type: 'metro',
        mode: 'Chennai Metro',
        line: 'Chennai Metro Line 2',
        routeName: 'Blue Line',
        duration: '14 min',
        description: 'Board train',
        accessibility: 'step-free platform',
        icon: 'metro',
        coordinates: [
          [80.2281, 13.0232],
          [80.2320, 13.0150],
          [80.2370, 13.0070],
          [80.2408, 13.0001]
        ]
      }
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
    id: 'route_2',
    type: 'fastest',
    label: 'FASTEST',
    badge: '⚡ FASTEST',
    duration: 31,
    durationMinutes: 31,
    durationText: '31 min',
    arrivalTime: '10:16 AM',
    fare: 35,
    fareText: '₹35',
    estimatedCabFare: 165,
    estimatedSavings: 130,
    accessibilityLevel: 'Limited Accessibility',
    accessibilityBadgeColor: 'warning',
    warningText: '2 flights of stairs, 620m walking',
    isStepFree: false,
    elevatorsCount: 0,
    stairsCount: 2,
    hasRamp: false,
    hasLowFloorBus: false,
    walkingDistanceMeters: 620,
    walkingDistance: 620,
    walkingText: '620m walking distance',
    color: '#5A9FD4',
    accessibility: {
      level: 'limited',
      elevators: 0,
      stairs: 2,
      ramps: 0,
      lowFloorBus: false,
      details: '2 flights of stairs, 620m walking'
    },
    coordinates: [
      [80.2707, 13.0827], // Chennai Central
      [80.2720, 13.0805], // Subway Stairs Entry
      [80.2660, 13.0680], // Blue Line Underground
      [80.2550, 13.0560], // Thousand Lights
      [80.2440, 13.0420], // AG-DMS
      [80.2340, 13.0280], // Nandanam
      [80.2281, 13.0232], // Saidapet
      [80.2360, 13.0090], // Little Mount
      [80.2408, 13.0001], // Guindy Metro
      [80.2415, 12.9985]  // Footbridge Stairs Exit
    ],
    segments: [
      {
        id: 1,
        type: 'walk',
        mode: 'Walk',
        distance: '300m',
        distanceMeters: 300,
        duration: '5 min',
        description: 'Stairs required',
        accessibility: 'stairs-only',
        icon: 'walk',
        coordinates: [
          [80.2707, 13.0827],
          [80.2720, 13.0805]
        ]
      },
      {
        id: 2,
        type: 'metro',
        mode: 'Chennai Metro',
        line: 'Chennai Metro Line 2',
        routeName: 'Blue Line',
        duration: '20 min',
        description: 'Direct train',
        accessibility: 'step-free platform',
        icon: 'metro',
        coordinates: [
          [80.2720, 13.0805],
          [80.2660, 13.0680],
          [80.2550, 13.0560],
          [80.2440, 13.0420],
          [80.2340, 13.0280],
          [80.2281, 13.0232],
          [80.2360, 13.0090],
          [80.2408, 13.0001]
        ]
      },
      {
        id: 3,
        type: 'walk',
        mode: 'Walk',
        distance: '320m',
        distanceMeters: 320,
        duration: '6 min',
        description: 'Overpass stairs',
        accessibility: 'overpass stairs',
        icon: 'walk',
        coordinates: [
          [80.2408, 13.0001],
          [80.2415, 12.9985]
        ]
      }
    ]
  },

  lowestCost: {
    id: 'route_3',
    type: 'lowest_cost',
    label: 'LOWEST COST',
    badge: '💰 LOWEST COST',
    duration: 44,
    durationMinutes: 44,
    durationText: '44 min',
    arrivalTime: '10:29 AM',
    fare: 15,
    fareText: '₹15',
    estimatedCabFare: 165,
    estimatedSavings: 150,
    accessibilityLevel: 'Good Accessibility',
    accessibilityBadgeColor: 'navy',
    isStepFree: true,
    elevatorsCount: 1,
    stairsCount: 0,
    hasRamp: true,
    hasLowFloorBus: false,
    walkingDistanceMeters: 300,
    walkingDistance: 300,
    walkingText: '300m walking distance',
    color: '#64748B',
    accessibility: {
      level: 'good',
      elevators: 1,
      stairs: 0,
      ramps: 1,
      lowFloorBus: false,
      details: 'Ramp available'
    },
    coordinates: [
      [80.2707, 13.0827], // Chennai Central
      [80.2718, 13.0815], // Bus Bay Ramp
      [80.2690, 13.0720], // Wall Tax / Chintadripet
      [80.2600, 13.0590], // Royapettah High Rd
      [80.2480, 13.0450], // Eldams Rd
      [80.2360, 13.0300], // Anna Salai South
      [80.2310, 13.0180], // Maraimalai Adigal Bridge
      [80.2395, 13.0030], // Guindy Industrial Estate Stop
      [80.2408, 13.0001]  // Guindy Metro
    ],
    segments: [
      {
        id: 1,
        type: 'walk',
        mode: 'Walk',
        distance: '150m',
        distanceMeters: 150,
        duration: '3 min',
        description: 'Ramp entrance',
        accessibility: 'ramp entrance',
        icon: 'walk',
        coordinates: [
          [80.2707, 13.0827],
          [80.2718, 13.0815]
        ]
      },
      {
        id: 2,
        type: 'bus',
        mode: 'MTC Bus',
        line: 'MTC Bus 18G',
        badge: 'MTC Bus 18G',
        routeName: 'Bus 18G',
        duration: '38 min',
        description: 'Standard bus, Low step',
        accessibility: 'standard bus, low step',
        icon: 'bus',
        coordinates: [
          [80.2718, 13.0815],
          [80.2690, 13.0720],
          [80.2600, 13.0590],
          [80.2480, 13.0450],
          [80.2360, 13.0300],
          [80.2310, 13.0180],
          [80.2395, 13.0030]
        ]
      },
      {
        id: 3,
        type: 'walk',
        mode: 'Walk',
        distance: '150m',
        distanceMeters: 150,
        duration: '3 min',
        description: 'Paved sidewalk',
        accessibility: 'paved sidewalk',
        icon: 'walk',
        coordinates: [
          [80.2395, 13.0030],
          [80.2408, 13.0001]
        ]
      }
    ]
  }
};

/**
 * Calculate Accessibility Score
 * score = (elevators * 10) - (stairs * 15) + (ramps * 5) - (walking_distance / 20)
 * Higher score = more accessible
 */
export function calculateAccessibilityScore({
  elevatorsCount = 0,
  stairsCount = 0,
  hasRamp = false,
  rampsCount = null,
  walkingDistanceMeters = 0
}) {
  const ramps = rampsCount !== null ? rampsCount : (hasRamp ? 1 : 0);
  const score = (elevatorsCount * 10) - (stairsCount * 15) + (ramps * 5) - (walkingDistanceMeters / 20);
  return Math.round(score * 10) / 10;
}

/**
 * Filter and Rank Routes based on user accessibility preferences
 * @param {Object} candidateRoutes - Map of routes { recommended, fastest, lowestCost }
 * @param {Object} preferences - User preferences { wheelchair, avoidStairs, minimizeWalking, voiceGuidance }
 * @returns {Object} { recommended, fastest, lowestCost }
 */
export function rankRoutes(candidateRoutes = CHENNAI_CANDIDATE_ROUTES, preferences = {}) {
  const {
    wheelchair = false,
    avoidStairs = false,
    minimizeWalking = false,
    voiceGuidance = false
  } = preferences;

  // Clone candidate routes
  const routesList = Object.values(candidateRoutes).map(route => {
    const r = JSON.parse(JSON.stringify(route));
    r.accessibilityScore = calculateAccessibilityScore({
      elevatorsCount: r.elevatorsCount || 0,
      stairsCount: r.stairsCount || 0,
      hasRamp: Boolean(r.hasRamp),
      walkingDistanceMeters: r.walkingDistanceMeters || r.walkingDistance || 0
    });
    return r;
  });

  // Apply constraints
  const validForAccessibility = routesList.filter(route => {
    if (avoidStairs && route.stairsCount > 0) {
      return false;
    }
    if (wheelchair && (!route.isStepFree || route.stairsCount > 0)) {
      return false;
    }
    if (minimizeWalking && (route.walkingDistanceMeters || route.walkingDistance || 0) > 400) {
      return false;
    }
    return true;
  });

  // Sort candidate pools
  const sortedByAccessibility = [...(validForAccessibility.length > 0 ? validForAccessibility : routesList)]
    .sort((a, b) => b.accessibilityScore - a.accessibilityScore);

  const sortedByDuration = [...routesList]
    .sort((a, b) => a.durationMinutes - b.durationMinutes);

  const sortedByFare = [...(validForAccessibility.length > 0 ? validForAccessibility : routesList)]
    .sort((a, b) => a.fare - b.fare);

  const recommended = sortedByAccessibility[0] || candidateRoutes.recommended;
  const fastest = sortedByDuration[0] || candidateRoutes.fastest;
  const lowestCost = sortedByFare[0] || candidateRoutes.lowestCost;

  if (voiceGuidance) {
    recommended.voiceGuidanceEnabled = true;
  }

  return {
    recommended,
    fastest,
    lowestCost
  };
}

/**
 * Find station accessibility details for map markers and popups
 */
export function getStationAccessibilityData(stationNameOrId) {
  if (!stationNameOrId) return null;
  const clean = String(stationNameOrId).toLowerCase().trim();

  if (clean.includes('guindy') || clean === 'location_2') {
    return {
      id: 'station_guindy',
      name: 'Guindy Metro',
      type: 'Metro & Bus Interchange',
      coordinates: CHENNAI_COORDINATES.guindy,
      verified: true,
      verificationDate: '2024-08-15',
      elevators: 2,
      elevatorStatus: 'Operational (Gate B & Gate C)',
      ramps: true,
      rampDetails: 'Main Concourse & Bus bay ramp',
      stairs: 2,
      stairsDetails: 'Present with bypass elevators',
      stepFreeEntrance: 'Gate 2 (Step-free)',
      accessibleToilets: true,
      transitModes: ['Chennai Metro Blue Line', 'MTC Buses', 'Southern Railway Suburban'],
      knownIssues: [
        {
          id: 'issue_101',
          type: 'elevator_maintenance',
          details: 'Gate B elevator scheduled maintenance every Monday 2AM-4AM',
          status: 'notice'
        }
      ]
    };
  }

  if (clean.includes('central') || clean === 'location_1') {
    return {
      id: 'station_chennai_central',
      name: 'Chennai Central',
      type: 'Major Rail & Metro Terminal (MGR Central)',
      coordinates: CHENNAI_COORDINATES.chennaiCentral,
      verified: true,
      verificationDate: '2024-08-10',
      elevators: 4,
      elevatorStatus: 'Operational (Subway & Wall Tax Rd)',
      ramps: true,
      rampDetails: 'Tactile guided ramp at Main Concourse Gate 1',
      stairs: 6,
      stairsDetails: 'Bypass elevators available to all platforms',
      stepFreeEntrance: 'Gate 1 (Automatic doors)',
      accessibleToilets: true,
      transitModes: ['Chennai Metro Blue & Green Lines', 'MTC Bus Terminus', 'National Rail'],
      knownIssues: []
    };
  }

  if (clean.includes('egmore') || clean === 'location_3') {
    return {
      id: 'station_egmore',
      name: 'Egmore Station',
      type: 'Rail & Metro Station',
      coordinates: CHENNAI_COORDINATES.egmore,
      verified: true,
      verificationDate: '2024-08-01',
      elevators: 2,
      elevatorStatus: 'Operational at Platform 1',
      ramps: true,
      rampDetails: 'Ramp entrance from main porch',
      stairs: 4,
      stairsDetails: 'Equipped with dual-height handrails',
      stepFreeEntrance: 'Main Gate (Luggage Concourse)',
      accessibleToilets: true,
      transitModes: ['Chennai Metro Green Line', 'MTC Buses', 'Southern Railway'],
      knownIssues: []
    };
  }

  if (clean.includes('saidapet') || clean === 'location_6') {
    return {
      id: 'station_saidapet',
      name: 'Saidapet Metro',
      type: 'Metro Station (Blue Line)',
      coordinates: CHENNAI_COORDINATES.saidapet,
      verified: true,
      verificationDate: '2024-08-12',
      elevators: 2,
      elevatorStatus: 'Elevator B Operational',
      ramps: true,
      rampDetails: 'Step-free South entrance',
      stairs: 2,
      stairsDetails: 'Direct stairs with elevator alternative',
      stepFreeEntrance: 'South Gate (Step-free)',
      accessibleToilets: true,
      transitModes: ['Chennai Metro Blue Line', 'MTC Saidapet Corridor'],
      knownIssues: []
    };
  }

  return {
    id: `station_${clean.replace(/\s+/g, '_')}`,
    name: stationNameOrId,
    type: 'Transit Station',
    coordinates: CHENNAI_COORDINATES.chennaiCentral,
    verified: true,
    elevators: 1,
    ramps: true,
    stairs: 1,
    stepFreeEntrance: 'Main Entrance',
    accessibleToilets: true,
    transitModes: ['Chennai Transit'],
    knownIssues: []
  };
}

// Bus numbers sourced from public MTC route data as of 2026-08-19, not a live feed
// Fares based on official MTC distance-based stage fare table (illustrative, not live pricing)
export const MTC_BUS_ROUTES_AND_FARES = {
  'Chennai Central-Guindy': { busNumber: '18A', fareRecommended: 25, fareFastest: 35, fareLowest: 15 },
  'Guindy-Chennai Central': { busNumber: '18A', fareRecommended: 25, fareFastest: 35, fareLowest: 15 },

  'Chennai Central-Egmore': { busNumber: '17D', fareRecommended: 15, fareFastest: 25, fareLowest: 10 },
  'Egmore-Chennai Central': { busNumber: '17D', fareRecommended: 15, fareFastest: 25, fareLowest: 10 },

  'Chennai Central-T. Nagar': { busNumber: '27C', fareRecommended: 20, fareFastest: 30, fareLowest: 12 },
  'T. Nagar-Chennai Central': { busNumber: '27C', fareRecommended: 20, fareFastest: 30, fareLowest: 12 },

  'Chennai Central-Koyambedu': { busNumber: '15B', fareRecommended: 22, fareFastest: 35, fareLowest: 15 },
  'Koyambedu-Chennai Central': { busNumber: '15B', fareRecommended: 22, fareFastest: 35, fareLowest: 15 },

  'Chennai Central-Tambaram': { busNumber: '18A', fareRecommended: 32, fareFastest: 45, fareLowest: 22 },
  'Tambaram-Chennai Central': { busNumber: '18A', fareRecommended: 32, fareFastest: 45, fareLowest: 22 },

  'Egmore-Koyambedu': { busNumber: '27B', fareRecommended: 20, fareFastest: 30, fareLowest: 12 },
  'Koyambedu-Egmore': { busNumber: '27B', fareRecommended: 20, fareFastest: 30, fareLowest: 12 },

  'Egmore-Guindy': { busNumber: '15A', fareRecommended: 22, fareFastest: 35, fareLowest: 15 },
  'Guindy-Egmore': { busNumber: '15A', fareRecommended: 22, fareFastest: 35, fareLowest: 15 },

  'Egmore-T. Nagar': { busNumber: '47', fareRecommended: 15, fareFastest: 25, fareLowest: 10 },
  'T. Nagar-Egmore': { busNumber: '47', fareRecommended: 15, fareFastest: 25, fareLowest: 10 },

  'Egmore-Tambaram': { busNumber: 'E18', fareRecommended: 30, fareFastest: 45, fareLowest: 20 },
  'Tambaram-Egmore': { busNumber: 'E18', fareRecommended: 30, fareFastest: 45, fareLowest: 20 },

  'Koyambedu-Tambaram': { busNumber: '70K', fareRecommended: 28, fareFastest: 40, fareLowest: 18 },
  'Tambaram-Koyambedu': { busNumber: '70K', fareRecommended: 28, fareFastest: 40, fareLowest: 18 },

  'Koyambedu-Guindy': { busNumber: '70K', fareRecommended: 20, fareFastest: 30, fareLowest: 14 },
  'Guindy-Koyambedu': { busNumber: '70K', fareRecommended: 20, fareFastest: 30, fareLowest: 14 },

  'Koyambedu-T. Nagar': { busNumber: '29C', fareRecommended: 18, fareFastest: 28, fareLowest: 12 },
  'T. Nagar-Koyambedu': { busNumber: '29C', fareRecommended: 18, fareFastest: 28, fareLowest: 12 },

  'T. Nagar-Guindy': { busNumber: '47', fareRecommended: 15, fareFastest: 25, fareLowest: 10 },
  'Guindy-T. Nagar': { busNumber: '47', fareRecommended: 15, fareFastest: 25, fareLowest: 10 },

  'T. Nagar-Tambaram': { busNumber: '52', fareRecommended: 25, fareFastest: 35, fareLowest: 16 },
  'Tambaram-T. Nagar': { busNumber: '52', fareRecommended: 25, fareFastest: 35, fareLowest: 16 },

  'Guindy-Tambaram': { busNumber: '70C', fareRecommended: 20, fareFastest: 30, fareLowest: 12 },
  'Tambaram-Guindy': { busNumber: '70C', fareRecommended: 20, fareFastest: 30, fareLowest: 12 }
};

// Cache for fetched OSRM road geometry
const OSRM_CACHE = new Map();

/**
 * Fetch road-following polyline from public OSRM API for road/bus/walk segments
 */
export async function getOSRMRoutePath(startCoords, endCoords) {
  if (!startCoords || !endCoords) return [];
  const cacheKey = `${startCoords[0].toFixed(4)},${startCoords[1].toFixed(4)};${endCoords[0].toFixed(4)},${endCoords[1].toFixed(4)}`;

  if (OSRM_CACHE.has(cacheKey)) {
    return OSRM_CACHE.get(cacheKey);
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
        const coords = data.routes[0].geometry.coordinates;
        if (Array.isArray(coords) && coords.length > 0) {
          OSRM_CACHE.set(cacheKey, coords);
          return coords;
        }
      }
    }
  } catch (err) {
    console.warn('[OSRM API] Failed to fetch road geometry, falling back to 2-point line:', err.message);
  }

  const fallback = [startCoords, endCoords];
  OSRM_CACHE.set(cacheKey, fallback);
  return fallback;
}

/**
 * Extract track geometry from Chennai Metro Blue/Green Line track data
 */
export function getMetroTrackSegment(startCoords, endCoords, lineName = 'Green Line') {
  const line = lineName.toLowerCase().includes('blue')
    ? CHENNAI_METRO_LINES.blueLine.coordinates
    : CHENNAI_METRO_LINES.greenLine.coordinates;

  const findClosestIndex = (pt) => {
    let minDist = Infinity;
    let closestIdx = 0;
    line.forEach((linePt, idx) => {
      const dist = Math.hypot(linePt[0] - pt[0], linePt[1] - pt[1]);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  const startIdx = findClosestIndex(startCoords);
  const endIdx = findClosestIndex(endCoords);

  if (startIdx <= endIdx) {
    return line.slice(startIdx, endIdx + 1);
  } else {
    return line.slice(endIdx, startIdx + 1).reverse();
  }
}

// Reference table of estimated per-pair route durations and fares (placeholder estimate, not live MTC/Metro data)
// Values are symmetric in both directions (A -> B and B -> A produce identical values).
export const HUB_PAIR_ROUTE_METRICS = {
  'Chennai Central-Egmore': { distKm: 2, recMin: 12, recFare: 10, fastMin: 9, fastFare: 15, lowMin: 16, lowFare: 8 },
  'Egmore-Chennai Central': { distKm: 2, recMin: 12, recFare: 10, fastMin: 9, fastFare: 15, lowMin: 16, lowFare: 8 },

  'Chennai Central-T. Nagar': { distKm: 7, recMin: 27, recFare: 20, fastMin: 22, fastFare: 25, lowMin: 32, lowFare: 12 },
  'T. Nagar-Chennai Central': { distKm: 7, recMin: 27, recFare: 20, fastMin: 22, fastFare: 25, lowMin: 32, lowFare: 12 },

  'Chennai Central-Koyambedu': { distKm: 11, recMin: 38, recFare: 25, fastMin: 30, fastFare: 30, lowMin: 46, lowFare: 15 },
  'Koyambedu-Chennai Central': { distKm: 11, recMin: 38, recFare: 25, fastMin: 30, fastFare: 30, lowMin: 46, lowFare: 15 },

  'Chennai Central-Guindy': { distKm: 10, recMin: 38, recFare: 25, fastMin: 31, fastFare: 35, lowMin: 44, lowFare: 15 },
  'Guindy-Chennai Central': { distKm: 10, recMin: 38, recFare: 25, fastMin: 31, fastFare: 35, lowMin: 44, lowFare: 15 },

  'Chennai Central-Tambaram': { distKm: 25, recMin: 68, recFare: 40, fastMin: 55, fastFare: 45, lowMin: 82, lowFare: 20 },
  'Tambaram-Chennai Central': { distKm: 25, recMin: 68, recFare: 40, fastMin: 55, fastFare: 45, lowMin: 82, lowFare: 20 },

  'Egmore-T. Nagar': { distKm: 5, recMin: 22, recFare: 15, fastMin: 17, fastFare: 20, lowMin: 27, lowFare: 10 },
  'T. Nagar-Egmore': { distKm: 5, recMin: 22, recFare: 15, fastMin: 17, fastFare: 20, lowMin: 27, lowFare: 10 },

  'Egmore-Koyambedu': { distKm: 9, recMin: 34, recFare: 22, fastMin: 27, fastFare: 28, lowMin: 42, lowFare: 14 },
  'Koyambedu-Egmore': { distKm: 9, recMin: 34, recFare: 22, fastMin: 27, fastFare: 28, lowMin: 42, lowFare: 14 },

  'Egmore-Guindy': { distKm: 8, recMin: 31, recFare: 20, fastMin: 25, fastFare: 25, lowMin: 38, lowFare: 12 },
  'Guindy-Egmore': { distKm: 8, recMin: 31, recFare: 20, fastMin: 25, fastFare: 25, lowMin: 38, lowFare: 12 },

  'Egmore-Tambaram': { distKm: 23, recMin: 63, recFare: 38, fastMin: 50, fastFare: 42, lowMin: 76, lowFare: 18 },
  'Tambaram-Egmore': { distKm: 23, recMin: 63, recFare: 38, fastMin: 50, fastFare: 42, lowMin: 76, lowFare: 18 },

  'T. Nagar-Koyambedu': { distKm: 6, recMin: 25, recFare: 18, fastMin: 19, fastFare: 22, lowMin: 30, lowFare: 11 },
  'Koyambedu-T. Nagar': { distKm: 6, recMin: 25, recFare: 18, fastMin: 19, fastFare: 22, lowMin: 30, lowFare: 11 },

  'T. Nagar-Guindy': { distKm: 5, recMin: 22, recFare: 15, fastMin: 17, fastFare: 20, lowMin: 27, lowFare: 10 },
  'Guindy-T. Nagar': { distKm: 5, recMin: 22, recFare: 15, fastMin: 17, fastFare: 20, lowMin: 27, lowFare: 10 },

  'T. Nagar-Tambaram': { distKm: 19, recMin: 54, recFare: 32, fastMin: 43, fastFare: 38, lowMin: 66, lowFare: 16 },
  'Tambaram-T. Nagar': { distKm: 19, recMin: 54, recFare: 32, fastMin: 43, fastFare: 38, lowMin: 66, lowFare: 16 },

  'Koyambedu-Guindy': { distKm: 9, recMin: 34, recFare: 22, fastMin: 27, fastFare: 28, lowMin: 42, lowFare: 14 },
  'Guindy-Koyambedu': { distKm: 9, recMin: 34, recFare: 22, fastMin: 27, fastFare: 28, lowMin: 42, lowFare: 14 },

  'Koyambedu-Tambaram': { distKm: 22, recMin: 60, recFare: 36, fastMin: 48, fastFare: 40, lowMin: 73, lowFare: 17 },
  'Tambaram-Koyambedu': { distKm: 22, recMin: 60, recFare: 36, fastMin: 48, fastFare: 40, lowMin: 73, lowFare: 17 },

  'Guindy-Tambaram': { distKm: 14, recMin: 44, recFare: 26, fastMin: 35, fastFare: 32, lowMin: 53, lowFare: 13 },
  'Tambaram-Guindy': { distKm: 14, recMin: 44, recFare: 26, fastMin: 35, fastFare: 32, lowMin: 53, lowFare: 13 }
};

export function getHubPairMetrics(originName, destName) {
  const o = (originName || 'Chennai Central').trim();
  const d = (destName || 'Guindy').trim();

  const key1 = `${o}-${d}`;
  const key2 = `${d}-${o}`;

  if (HUB_PAIR_ROUTE_METRICS[key1]) return HUB_PAIR_ROUTE_METRICS[key1];
  if (HUB_PAIR_ROUTE_METRICS[key2]) return HUB_PAIR_ROUTE_METRICS[key2];

  return { distKm: 10, recMin: 38, recFare: 25, fastMin: 31, fastFare: 35, lowMin: 44, lowFare: 15 };
}

/**
 * Asynchronously build dynamic route candidate polylines and metadata for any hub pair
 */
export async function fetchDynamicRouteData(originName = 'Chennai Central', destName = 'Guindy') {
  const startCoords = getCoordinatesForLocation(originName);
  const endCoords = getCoordinatesForLocation(destName);
  const metrics = getHubPairMetrics(originName, destName);
  const pairKey = `${originName}-${destName}`;

  const busRouteInfo = MTC_BUS_ROUTES_AND_FARES[pairKey] || MTC_BUS_ROUTES_AND_FARES[`${destName}-${originName}`] || { busNumber: '18A' };
  const busNumber = busRouteInfo.busNumber || '18A';

  // Recommended Route: OSRM Road polyline
  let recPolyline = [];
  try {
    recPolyline = await getOSRMRoutePath(startCoords, endCoords);
  } catch (e) {
    recPolyline = CHENNAI_CANDIDATE_ROUTES.recommended.coordinates;
  }

  // Fastest Route: Real Chennai Metro Track geometry (Green/Blue line if applicable, else OSRM)
  let fastPolyline = [];
  try {
    const isGreenLine = (originName.includes('Egmore') && destName.includes('Koyambedu')) || (originName.includes('Koyambedu') && destName.includes('Egmore'));
    const isBlueLine = (originName.includes('Central') && destName.includes('Guindy')) || (originName.includes('Guindy') && destName.includes('Central'));

    if (isGreenLine || isBlueLine) {
      fastPolyline = getMetroTrackSegment(startCoords, endCoords, isGreenLine ? 'Green Line' : 'Blue Line');
    } else {
      fastPolyline = await getOSRMRoutePath(startCoords, endCoords);
    }
  } catch (e) {
    fastPolyline = CHENNAI_CANDIDATE_ROUTES.fastest.coordinates;
  }

  // Lowest Cost Route: OSRM Road polyline
  let costPolyline = [];
  try {
    costPolyline = await getOSRMRoutePath(startCoords, endCoords);
  } catch (e) {
    costPolyline = CHENNAI_CANDIDATE_ROUTES.lowestCost.coordinates;
  }

  return {
    recommended: {
      ...CHENNAI_CANDIDATE_ROUTES.recommended,
      id: `rec-${pairKey}`,
      duration: metrics.recMin,
      durationMinutes: metrics.recMin,
      durationText: `${metrics.recMin} min`,
      fare: metrics.recFare,
      fareText: `₹${metrics.recFare}`,
      coordinates: recPolyline,
      segments: [
        {
          id: 1,
          type: 'walk',
          mode: 'Walk',
          distance: '120m',
          duration: '2 min',
          description: 'Step-free path to bus bay',
          icon: 'walk'
        },
        {
          id: 2,
          type: 'bus',
          mode: 'MTC Bus',
          badge: `MTC Bus ${busNumber}`,
          line: `MTC Bus ${busNumber}`,
          routeName: `Bus ${busNumber}`,
          duration: `${Math.max(5, Math.round(metrics.recMin * 0.6))} min`,
          description: 'Low-floor, Ramp equipped',
          icon: 'bus'
        },
        {
          id: 3,
          type: 'metro',
          mode: 'Chennai Metro',
          line: 'Chennai Metro',
          routeName: 'Metro Line',
          duration: `${Math.max(4, Math.round(metrics.recMin * 0.35))} min`,
          description: 'Step-free platform transfer',
          icon: 'metro'
        }
      ]
    },
    fastest: {
      ...CHENNAI_CANDIDATE_ROUTES.fastest,
      id: `fast-${pairKey}`,
      duration: metrics.fastMin,
      durationMinutes: metrics.fastMin,
      durationText: `${metrics.fastMin} min`,
      fare: metrics.fastFare,
      fareText: `₹${metrics.fastFare}`,
      coordinates: fastPolyline
    },
    lowestCost: {
      ...CHENNAI_CANDIDATE_ROUTES.lowestCost,
      id: `cost-${pairKey}`,
      duration: metrics.lowMin,
      durationMinutes: metrics.lowMin,
      durationText: `${metrics.lowMin} min`,
      fare: metrics.lowFare,
      fareText: `₹${metrics.lowFare}`,
      coordinates: costPolyline,
      segments: [
        {
          id: 1,
          type: 'bus',
          mode: 'MTC Bus',
          badge: `MTC Bus ${busNumber}`,
          line: `MTC Bus ${busNumber}`,
          routeName: `Bus ${busNumber}`,
          duration: `${metrics.lowMin} min`,
          description: 'Ordinary MTC Bus service',
          icon: 'bus'
        }
      ]
    }
  };
}
