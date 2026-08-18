/**
 * AccessRoute - Chennai Seed Data
 * Contains realistic Chennai public transit datasets specifically crafted for accessibility.
 * Note: Clearly labeled as seeded/demo data for HackNova S3 hackathon.
 */

export const CHENNAI_LOCATIONS = [
  {
    id: 'location_1',
    name: 'Chennai Central',
    type: 'station',
    latitude: 13.0827,
    longitude: 80.2707,
    description: 'Chennai Central Railway & Metro Hub (MGR Central)'
  },
  {
    id: 'location_2',
    name: 'Guindy Metro',
    type: 'station',
    latitude: 13.0001,
    longitude: 80.2408,
    description: 'Guindy Metro Station & MTC Transit Interchange'
  },
  {
    id: 'location_3',
    name: 'Egmore Station',
    type: 'station',
    latitude: 13.0792,
    longitude: 80.2610,
    description: 'Chennai Egmore Railway & Metro Station'
  },
  {
    id: 'location_4',
    name: 'T. Nagar',
    type: 'stop',
    latitude: 13.0418,
    longitude: 80.2341,
    description: 'T. Nagar Bus Terminus & Commercial Hub'
  },
  {
    id: 'location_5',
    name: 'Apollo Hospital',
    type: 'landmark',
    latitude: 13.0604,
    longitude: 80.2520,
    description: 'Apollo Hospital Greams Road, Thousand Lights'
  },
  {
    id: 'location_6',
    name: 'Saidapet Metro',
    type: 'station',
    latitude: 13.0232,
    longitude: 80.2281,
    description: 'Saidapet Metro Station (Blue Line)'
  },
  {
    id: 'location_7',
    name: 'Alandur Metro',
    type: 'station',
    latitude: 13.0039,
    longitude: 80.2014,
    description: 'Alandur Elevated Metro Interchange (Blue & Green Lines)'
  },
  {
    id: 'location_8',
    name: 'Chennai Airport',
    type: 'station',
    latitude: 12.9815,
    longitude: 80.1636,
    description: 'Chennai International Airport Metro Terminal'
  }
];

export const CHENNAI_STATIONS_ACCESSIBILITY = {
  station_guindy: {
    id: 'station_guindy',
    name: 'Guindy Metro',
    verified: true,
    verificationDate: '2024-08-15',
    accessibility: {
      elevators: {
        count: 2,
        status: 'working',
        details: 'Gate B: operational, Gate C: operational'
      },
      ramps: {
        available: true,
        details: 'Main entrance has accessible ramp'
      },
      stairs: {
        present: true,
        count: 2,
        details: 'Present but bypass available via elevator'
      },
      stepFreeEntrance: {
        available: true,
        gate: 'Gate 2',
        details: 'Step-free access through Gate 2'
      },
      accessibleToilet: {
        available: true,
        details: 'Available on platform level'
      },
      lowFloorVehicles: {
        available: true,
        details: 'Metro trains have step-free access'
      }
    },
    knownIssues: [
      {
        id: 'issue_101',
        type: 'elevator_maintenance',
        details: 'Gate B elevator scheduled maintenance every Monday 2AM-4AM',
        status: 'notice'
      }
    ]
  },
  station_chennai_central: {
    id: 'station_chennai_central',
    name: 'Chennai Central',
    verified: true,
    verificationDate: '2024-08-10',
    accessibility: {
      elevators: {
        count: 4,
        status: 'working',
        details: 'Subway elevators operational at Wall Tax Rd & Poonamallee High Rd'
      },
      ramps: {
        available: true,
        details: 'Tactile pathway & ramp at Main Concourse Gate 1'
      },
      stairs: {
        present: true,
        count: 6,
        details: 'Bypass elevators available to all platforms'
      },
      stepFreeEntrance: {
        available: true,
        gate: 'Gate 1',
        details: 'Wide automatic doors with level boarding access'
      },
      accessibleToilet: {
        available: true,
        details: 'Accessible restroom near waiting hall'
      },
      lowFloorVehicles: {
        available: true,
        details: 'Blue and Green Line metro trains offer level boarding'
      }
    },
    knownIssues: []
  },
  station_egmore: {
    id: 'station_egmore',
    name: 'Egmore Station',
    verified: true,
    verificationDate: '2024-08-01',
    accessibility: {
      elevators: {
        count: 2,
        status: 'working',
        details: 'Elevators available at Platform 1 and Gandhi Irwin Rd entrance'
      },
      ramps: {
        available: true,
        details: 'Ramp entrance from main porch'
      },
      stairs: {
        present: true,
        count: 4,
        details: 'Staircases equipped with dual-height handrails'
      },
      stepFreeEntrance: {
        available: true,
        gate: 'Main Gate',
        details: 'Wheelchair access available via luggage concourse'
      },
      accessibleToilet: {
        available: true,
        details: 'Ground floor accessible toilet near VIP lounge'
      },
      lowFloorVehicles: {
        available: true,
        details: 'Metro connection is fully step-free'
      }
    },
    knownIssues: []
  }
};

export const CHENNAI_ROUTES = {
  recommended: {
    id: 'route_1',
    duration: 38,
    durationText: '38 min',
    fare: 25,
    fareCurrency: '₹',
    walkingDistance: 180,
    walkingDistanceText: '180 m',
    transfers: 1,
    estimatedCabFare: 165,
    estimatedSavings: 140,
    // Frontend compatibility helpers
    type: 'recommended',
    label: 'RECOMMENDED FOR YOU',
    fareText: '₹25',
    cabSavingsText: '₹140 cheaper than estimated cab',
    durationMinutes: 38,
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
    accessibility: {
      level: 'highly_accessible',
      elevators: 2,
      stairs: 0,
      ramps: 1,
      lowFloorBus: true,
      details: '2 elevators, 0 stairs, ramp available, low-floor bus'
    },
    segments: [
      {
        id: 1,
        type: 'walk',
        mode: 'Walk',
        distance: 120,
        distanceText: '120m',
        duration: 2,
        durationText: '2 min',
        description: 'Walk to bus stop',
        accessibility: 'step-free',
        icon: 'walk'
      },
      {
        id: 2,
        type: 'bus',
        mode: 'MTC Bus',
        line: 'MTC Bus 21',
        badge: 'MTC Bus 21',
        routeName: 'Bus 21',
        accessibility: 'low-floor, ramp',
        duration: 15,
        durationText: '18 min',
        description: 'Low-floor, Ramp',
        icon: 'bus'
      },
      {
        id: 3,
        type: 'walk',
        mode: 'Walk',
        distance: 80,
        distanceText: '80m',
        duration: 2,
        durationText: '2 min',
        description: 'Transfer to metro',
        accessibility: 'smooth',
        icon: 'walk'
      },
      {
        id: 4,
        type: 'elevator',
        mode: 'Elevator',
        location: 'Guindy Metro Gate B',
        elevatorName: 'Elevator B',
        accessibility: 'step-free to platform',
        duration: 1,
        durationText: '1 min',
        description: 'Step-free to platform',
        icon: 'elevator'
      },
      {
        id: 5,
        type: 'metro',
        mode: 'Chennai Metro',
        line: 'Chennai Metro Line 2',
        routeName: 'Blue Line',
        accessibility: 'step-free platform',
        duration: 10,
        durationText: '14 min',
        description: 'Board train',
        icon: 'metro'
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
    duration: 31,
    durationText: '31 min',
    fare: 35,
    fareCurrency: '₹',
    walkingDistance: 620,
    walkingDistanceText: '620 m',
    transfers: 1,
    estimatedCabFare: 165,
    estimatedSavings: 130,
    // Frontend compatibility helpers
    type: 'fastest',
    label: 'FASTEST',
    fareText: '₹35',
    durationMinutes: 31,
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
    accessibility: {
      level: 'limited',
      elevators: 0,
      stairs: 2,
      ramps: 0,
      lowFloorBus: false,
      details: '2 flights of stairs, 620m walking'
    },
    segments: [
      {
        id: 1,
        type: 'walk',
        mode: 'Walk',
        distance: 300,
        distanceText: '300m',
        duration: 5,
        durationText: '5 min',
        description: 'Walk to metro (stairs required)',
        accessibility: 'stairs-only',
        icon: 'walk'
      },
      {
        id: 2,
        type: 'metro',
        mode: 'Chennai Metro',
        line: 'Chennai Metro Line 2',
        routeName: 'Blue Line',
        accessibility: 'step-free platform',
        duration: 20,
        durationText: '20 min',
        description: 'Direct train',
        icon: 'metro'
      },
      {
        id: 3,
        type: 'walk',
        mode: 'Walk',
        distance: 320,
        distanceText: '320m',
        duration: 6,
        durationText: '6 min',
        description: 'Overpass stairs to exit',
        accessibility: 'overpass stairs',
        icon: 'walk'
      }
    ]
  },
  lowestCost: {
    id: 'route_3',
    duration: 44,
    durationText: '44 min',
    fare: 15,
    fareCurrency: '₹',
    walkingDistance: 300,
    walkingDistanceText: '300 m',
    transfers: 1,
    estimatedCabFare: 165,
    estimatedSavings: 150,
    // Frontend compatibility helpers
    type: 'lowest_cost',
    label: 'LOWEST COST',
    fareText: '₹15',
    durationMinutes: 44,
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
    accessibility: {
      level: 'good',
      elevators: 1,
      stairs: 0,
      ramps: 1,
      lowFloorBus: false,
      details: 'Ramp available'
    },
    segments: [
      {
        id: 1,
        type: 'walk',
        mode: 'Walk',
        distance: 150,
        distanceText: '150m',
        duration: 3,
        durationText: '3 min',
        description: 'Walk to bus stop via ramp',
        accessibility: 'ramp entrance',
        icon: 'walk'
      },
      {
        id: 2,
        type: 'bus',
        mode: 'MTC Bus',
        line: 'MTC Bus 18G',
        badge: 'MTC Bus 18G',
        routeName: 'Bus 18G',
        accessibility: 'standard bus, low step',
        duration: 38,
        durationText: '38 min',
        description: 'Standard bus, Low step',
        icon: 'bus'
      },
      {
        id: 3,
        type: 'walk',
        mode: 'Walk',
        distance: 150,
        distanceText: '150m',
        duration: 3,
        durationText: '3 min',
        description: 'Paved sidewalk to destination',
        accessibility: 'paved sidewalk',
        icon: 'walk'
      }
    ]
  }
};

export const CHENNAI_USER_PROFILE = {
  user: {
    name: 'Chennai Commuter',
    subtitle: 'My Impact',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    preferences: {
      wheelchair: true,
      avoidStairs: true,
      minimizeWalking: false,
      voiceGuidance: false
    }
  },
  impact: {
    totalJourneys: 14,
    accessibleJourneys: 9,
    estimatedSavings: 1240,
    co2Avoided: 18.4,
    issuesReported: 3,
    // Frontend compatibility helpers
    publicTransportJourneys: 14,
    co2AvoidedKg: 18.4
  }
};

export const INITIAL_ISSUES = [
  {
    id: 'issue_1',
    type: 'elevator_broken',
    stationId: 'station_guindy',
    station: 'Guindy Metro',
    details: 'Elevator B not working, technicians notified',
    description: 'Elevator B not working, technicians notified',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'issue_2',
    type: 'ramp_blocked',
    stationId: 'station_chennai_central',
    station: 'Chennai Central',
    details: 'Temporary barricade near Gate 1 ramp',
    description: 'Temporary barricade near Gate 1 ramp',
    status: 'resolved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];
