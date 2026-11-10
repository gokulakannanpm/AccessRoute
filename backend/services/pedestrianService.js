/**
 * AccessRoute Pedestrian Infrastructure & Accessibility Service
 * Curates verified, provisional, and documented infrastructure across the Chennai transit network:
 * - Stairs
 * - Elevators / Lifts
 * - Footbridges and Pedestrian Overbridges (FOB)
 * - Underpasses / Subways
 * - Ramps
 * - Step-Free Entrances
 * - Pedestrian Crossings
 *
 * Enforces 3 distinct confidence levels:
 * - 'verified': physically inspected or documented in engineering standards (MoHUA, CMRL architectural blueprints, Amrit Bharat Divyangjan records)
 * - 'provisional': inferred from transit hub characteristics or community reports awaiting verification
 * - 'unknown': infrastructure existence is unconfirmed; never fabricated
 */

export const PEDESTRIAN_INFRASTRUCTURE = [
  // 1. Elevators / Lifts (CMRL Metro & Southern Railway Amrit Bharat Junctions)
  {
    id: 'elev_central_mgr',
    type: 'elevator',
    name: 'Puratchi Thalaivar Dr. M.G.R Central Metro Street-to-Concourse Lift A',
    stationId: 'cmrl_smc',
    stationName: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central',
    locality: 'Park Town / Central',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2709, 13.0829],
    isStepFree: true,
    source: 'CMRL Architectural Standard / MoHUA Harmonised Guidelines',
    details: 'Dual through-car elevator connecting Poonamallee High Road pavement to Concourse Level -1 with tactile button beacons.'
  },
  {
    id: 'elev_central_suburban_fob',
    type: 'elevator',
    name: 'Chennai Central Suburban MMC Platform 1-2 Divyangjan Lift',
    stationId: 'srr_mass',
    stationName: 'Chennai Central Suburban (MMC)',
    locality: 'Central / MMC',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2718, 13.0833],
    isStepFree: true,
    source: 'Southern Railway Chennai Division Amrit Bharat Scheme 2024-2025',
    details: 'Stainless-steel platform lift connecting MMC concourse to Suburban Island Platforms 1 & 2.'
  },
  {
    id: 'elev_egmore_concourse',
    type: 'elevator',
    name: 'Egmore Station Gandhi-Irwin Concourse Lift',
    stationId: 'srr_ms',
    stationName: 'Chennai Egmore',
    locality: 'Egmore',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2612, 13.0794],
    isStepFree: true,
    source: 'Southern Railway Divyangjan Accessibility Survey',
    details: 'Step-free lift connecting main ticketing foyer to Foot-Over-Bridge and Platforms 1-4.'
  },
  {
    id: 'elev_saidapet_b',
    type: 'elevator',
    name: 'Saidapet Metro Elevator B',
    stationId: 'cmrl_ssd',
    stationName: 'Saidapet Metro',
    locality: 'Saidapet',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2283, 13.0234],
    isStepFree: true,
    source: 'CMRL Station Directory / Architectural Survey',
    details: 'Step-free street to concourse and train platform elevator.'
  },
  {
    id: 'elev_guindy_gate_b',
    type: 'elevator',
    name: 'Guindy Metro Gate B Elevator',
    stationId: 'cmrl_sgd',
    stationName: 'Guindy Metro',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2410, 13.0004],
    isStepFree: true,
    source: 'CMRL Station Asset Directory',
    details: 'Provides step-free connection between GST Road pavement and Guindy elevated metro concourse.'
  },
  {
    id: 'elev_guindy_suburban',
    type: 'elevator',
    name: 'Guindy Suburban Railway FOB South Lift',
    stationId: 'srr_gdy',
    stationName: 'Guindy Suburban',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2415, 12.9998],
    isStepFree: true,
    source: 'Southern Railway Divyangjan Facility Registry',
    details: 'Suburban platform 1 to pedestrian overbridge lift.'
  },
  {
    id: 'elev_tambaram_east',
    type: 'elevator',
    name: 'Tambaram East Terminal Platform 1 Lift',
    stationId: 'srr_tbm',
    stationName: 'Tambaram',
    locality: 'Tambaram',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.1202, 12.9255],
    isStepFree: true,
    source: 'Southern Railway Amrit Bharat Redevelopment Audit',
    details: 'Heavy-duty elevator serving passengers with reduced mobility between East concourse and Island Platforms 1-2.'
  },
  {
    id: 'elev_airport_metro',
    type: 'elevator',
    name: 'Chennai International Airport Direct Terminal Skywalk Lift',
    stationId: 'cmrl_sap',
    stationName: 'Chennai International Airport',
    locality: 'Meenambakkam',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.1639, 12.9818],
    isStepFree: true,
    source: 'AAI / CMRL Multimodal Connector Blueprints',
    details: 'Step-free automated glass elevator connecting Metro platform directly to Airport Departure Level.'
  },
  {
    id: 'elev_alandur_bilevel',
    type: 'elevator',
    name: 'Alandur Bi-Level Interchange Transfer Elevator',
    stationId: 'cmrl_saln',
    stationName: 'Alandur',
    locality: 'Alandur',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2017, 13.0042],
    isStepFree: true,
    source: 'CMRL Engineering Specifications',
    details: 'Connects Concourse, Level 1 (Green Line), and Level 2 (Blue Line) without stairs.'
  },

  // 2. Stairs (Physical Barriers & Stairwells)
  {
    id: 'stairs_central_subway_north',
    type: 'stairs',
    name: 'Chennai Central North Pedestrian Subway Stairs',
    stationId: 'srr_mas',
    stationName: 'Chennai Central',
    locality: 'Central',
    status: 'verified',
    operationalStatus: 'warning',
    coordinates: [80.2718, 13.0838],
    isStepFree: false,
    stepsCount: 28,
    source: 'AccessRoute Infrastructure Audit 2026',
    details: '28 concrete steps without handrail ramp. Barrier for wheelchairs and prams (Use Gate 1 elevator bypass).'
  },
  {
    id: 'stairs_guindy_fob_north',
    type: 'stairs',
    name: 'Guindy GST Road Overpass North Flight',
    stationId: 'srr_gdy',
    stationName: 'Guindy',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'warning',
    coordinates: [80.2416, 12.9992],
    isStepFree: false,
    stepsCount: 42,
    source: 'OpenStreetMap (highway=steps, step_count=42)',
    details: 'Steep two-flight concrete staircase without ramp alternative.'
  },
  {
    id: 'stairs_tambaram_west_overbridge',
    type: 'stairs',
    name: 'Tambaram West Bus Stand Footbridge Stairs',
    stationId: 'srr_tbm',
    stationName: 'Tambaram',
    locality: 'Tambaram West',
    status: 'verified',
    operationalStatus: 'warning',
    coordinates: [80.1189, 12.9242],
    isStepFree: false,
    stepsCount: 36,
    source: 'Commuter Infrastructure Survey',
    details: 'High-gradient staircase from West bus terminal approach. Lift alternative located 90m south.'
  },
  {
    id: 'stairs_beach_fob',
    type: 'stairs',
    name: 'Chennai Beach Station Platform 4/5 Connecting Stairs',
    stationId: 'srr_msb',
    stationName: 'Chennai Beach',
    locality: 'George Town',
    status: 'verified',
    operationalStatus: 'warning',
    coordinates: [80.2925, 13.0920],
    isStepFree: false,
    stepsCount: 24,
    source: 'Southern Railway Station Guide',
    details: 'Narrow steel staircase connecting suburban platform 3 to MRTS platform 4.'
  },

  // 3. Footbridges and Pedestrian Overbridges (FOB)
  {
    id: 'fob_guindy_multimodal',
    type: 'footbridge',
    name: 'Guindy Integrated Multimodal Skywalk',
    stationId: 'srr_gdy',
    stationName: 'Guindy Interchange',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2412, 13.0001],
    isStepFree: true,
    source: 'Chennai Smart City / CUMTA Pedestrian Skywalk Scheme',
    details: 'Covered pedestrian overbridge with lift and escalator access connecting Metro concourse, Suburban platforms, and Race Course road.'
  },
  {
    id: 'fob_tambaram_spanning',
    type: 'footbridge',
    name: 'Tambaram Multi-Track Passenger Overbridge',
    stationId: 'srr_tbm',
    stationName: 'Tambaram',
    locality: 'Tambaram',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.1198, 12.9248],
    isStepFree: true,
    source: 'Southern Railway Engineering Department',
    details: 'Wide 12-meter spanning footbridge connecting GST Road (East) to Gandhi Road (West) with platform ramps and lifts.'
  },
  {
    id: 'fob_central_park_town',
    type: 'footbridge',
    name: 'Park Town - Central Footbridge Connector',
    stationId: 'srr_mpkt',
    stationName: 'Chennai Park Town (MRTS)',
    locality: 'Park Town',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2728, 13.0805],
    isStepFree: false,
    source: 'OpenStreetMap (highway=footway, bridge=yes)',
    details: 'Spans Buckingham Canal between Suburban Park station and MRTS Park Town with steps.'
  },

  // 4. Underpasses / Subways
  {
    id: 'underpass_central_metro_tunnel',
    type: 'underpass',
    name: 'Puratchi Thalaivar Dr. M.G.R Central Underground Pedestrian Subway',
    stationId: 'cmrl_smc',
    stationName: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central',
    locality: 'Central',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2707, 13.0822],
    isStepFree: true,
    source: 'CMRL Subsurface Engineering Plans',
    details: 'Fully air-conditioned, step-free tactile pathway beneath Poonamallee High Road connecting Central Main Station to Metro entrance.'
  },
  {
    id: 'underpass_saidapet_anna_salai',
    type: 'underpass',
    name: 'Saidapet Anna Salai Pedestrian Subway',
    stationId: 'cmrl_ssd',
    stationName: 'Saidapet',
    locality: 'Saidapet',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2280, 13.0230],
    isStepFree: true,
    source: 'Greater Chennai Corporation (GCC) Infrastructure Registry',
    details: 'Pedestrian subway with low-gradient ramps allowing safe crossing of Anna Salai arterial road.'
  },
  {
    id: 'underpass_guindy_subway',
    type: 'underpass',
    name: 'Guindy Railway Pedestrian Subway',
    stationId: 'srr_gdy',
    stationName: 'Guindy',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2405, 12.9995],
    isStepFree: true,
    source: 'Southern Railway Survey',
    details: 'Pedestrian subway equipped with anti-skid ramp for wheelchair and luggage passage.'
  },

  // 5. Ramps
  {
    id: 'ramp_central_gate1',
    type: 'ramp',
    name: 'Chennai Central Gate 1 Tactile Concourse Ramp',
    stationId: 'srr_mas',
    stationName: 'Chennai Central',
    locality: 'Central',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2702, 13.0823],
    isStepFree: true,
    slope: '1:12',
    source: 'MoHUA Harmonised Guidelines Audit 2026',
    details: 'Tactile guided 1:12 slope ramp with continuous dual-height handrails.'
  },
  {
    id: 'ramp_saidapet_entry',
    type: 'ramp',
    name: 'Saidapet Metro South Entry Ramp',
    stationId: 'cmrl_ssd',
    stationName: 'Saidapet Metro',
    locality: 'Saidapet',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2277, 13.0228],
    isStepFree: true,
    slope: '1:14',
    source: 'CMRL Architectural Standard',
    details: 'Direct street-level ramp into fare gate lobby.'
  },
  {
    id: 'ramp_guindy_main',
    type: 'ramp',
    name: 'Guindy Metro Main Entrance Ramp',
    stationId: 'cmrl_sgd',
    stationName: 'Guindy Metro',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2404, 12.9998],
    isStepFree: true,
    slope: '1:12',
    source: 'CMRL Station Directory',
    details: 'Wide anti-slip concrete ramp leading to ticketing counters.'
  },
  {
    id: 'ramp_tambaram_east',
    type: 'ramp',
    name: 'Tambaram East Terminal Entrance Ramp',
    stationId: 'srr_tbm',
    stationName: 'Tambaram',
    locality: 'Tambaram East',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.1205, 12.9252],
    isStepFree: true,
    slope: '1:12',
    source: 'Southern Railway Divyangjan Audit',
    details: 'Graduated ramp from auto stand to ticketing counter.'
  },

  // 6. Step-Free Entrances
  {
    id: 'entry_central_gate1',
    type: 'step_free_entrance',
    name: 'Chennai Central Gate 1 Step-Free Entrance',
    stationId: 'srr_mas',
    stationName: 'Chennai Central',
    locality: 'Central',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2705, 13.0825],
    isStepFree: true,
    source: 'MoHUA Accessibility Certification',
    details: 'Automatic wide sliding doors, flush threshold (no curb step), 1200mm passage.'
  },
  {
    id: 'entry_guindy_gate2',
    type: 'step_free_entrance',
    name: 'Guindy Metro Gate 2 Tactile Accessible Entrance',
    stationId: 'cmrl_sgd',
    stationName: 'Guindy Metro',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2408, 13.0001],
    isStepFree: true,
    source: 'CMRL MoHUA Compliance Certificate',
    details: 'Level boarding access, wheelchair fare gate, and audio-tactile ground pathway.'
  },
  {
    id: 'entry_airport_skywalk',
    type: 'step_free_entrance',
    name: 'Airport Metro Link Step-Free Gate',
    stationId: 'cmrl_sap',
    stationName: 'Chennai International Airport',
    locality: 'Meenambakkam',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.1636, 12.9815],
    isStepFree: true,
    source: 'AAI / CMRL Multimodal Standard',
    details: 'Level threshold travelator and wide automatic gate.'
  },

  // 7. Pedestrian Crossings (Signalized & Tactile)
  {
    id: 'crossing_central_wallajah',
    type: 'crossing',
    name: 'Chennai Central Wallajah Road Signalized Pelican Crossing',
    stationId: 'srr_mas',
    stationName: 'Chennai Central',
    locality: 'Central / Park',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2712, 13.0818],
    isStepFree: true,
    source: 'Greater Chennai Traffic Police / GCC Pedestrian Safety Registry',
    details: 'Push-button signalized pedestrian crossing with audible beeper and dropped kerbs.'
  },
  {
    id: 'crossing_guindy_mount_rd',
    type: 'crossing',
    name: 'Guindy Anna Salai / Race Course Road Pedestrian Crossing',
    stationId: 'cmrl_sgd',
    stationName: 'Guindy',
    locality: 'Guindy',
    status: 'verified',
    operationalStatus: 'operational',
    coordinates: [80.2412, 12.9996],
    isStepFree: true,
    source: 'GCC Smart City Traffic Signaling',
    details: 'Zebra crossing with kerb ramp cutouts and pedestrian green phase.'
  },
  {
    id: 'crossing_saidapet_bazaar',
    type: 'crossing',
    name: 'Saidapet Bazaar Road Pedestrian Crossing',
    stationId: 'cmrl_ssd',
    stationName: 'Saidapet',
    locality: 'Saidapet',
    status: 'provisional',
    operationalStatus: 'available',
    coordinates: [80.2285, 13.0225],
    isStepFree: true,
    source: 'OpenStreetMap (highway=crossing, crossing=marked)',
    details: 'Surface-painted zebra crossing across bazaar access lane with minor curb lip.'
  },

  // 8. Sample Unknown / Provisional Infrastructure Examples
  {
    id: 'elev_perungalathur_provisional',
    type: 'elevator',
    name: 'Perungalathur Railway Footbridge Lift (Under Construction / Unknown Operational Status)',
    stationId: 'srr_prgl',
    stationName: 'Perungalathur',
    locality: 'Perungalathur',
    status: 'unknown',
    operationalStatus: 'unknown',
    coordinates: [80.0898, 12.9062],
    isStepFree: false,
    source: 'Southern Railway Tenders (Unconfirmed on-site commissioning)',
    details: 'Lift structure planned under Amrit Bharat scheme; operational commissioning status is UNCONFIRMED. Never promised as step-free.'
  }
];

/**
 * Filter pedestrian features by type, station, or step-free requirement
 */
export function getPedestrianFeatures(filters = {}) {
  const { type, stationId, stepFreeOnly, avoidStairs, verifiedOnly } = filters;
  let results = [...PEDESTRIAN_INFRASTRUCTURE];

  if (type) {
    results = results.filter((f) => f.type === type);
  }
  if (stationId) {
    const sId = String(stationId).toLowerCase();
    results = results.filter(
      (f) =>
        f.stationId.toLowerCase() === sId ||
        f.stationName.toLowerCase().includes(sId)
    );
  }
  if (stepFreeOnly) {
    results = results.filter((f) => f.isStepFree === true);
  }
  if (avoidStairs) {
    results = results.filter((f) => f.type !== 'stairs');
  }
  if (verifiedOnly) {
    results = results.filter((f) => f.status === 'verified');
  }

  return results;
}

/**
 * Find pedestrian features along or near a route coordinate sequence
 */
export function findFeaturesNearPath(coords = [], maxDistanceKm = 0.8) {
  if (!Array.isArray(coords) || coords.length === 0) return [];

  return PEDESTRIAN_INFRASTRUCTURE.filter((feature) => {
    const [fLon, fLat] = feature.coordinates;
    return coords.some(([cLon, cLat]) => {
      // Rough distance approximation (in km)
      const dLat = (fLat - cLat) * 111;
      const dLon = (fLon - cLon) * 111 * Math.cos((cLat * Math.PI) / 180);
      const dist = Math.hypot(dLat, dLon);
      return dist <= maxDistanceKm;
    });
  });
}
