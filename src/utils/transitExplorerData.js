import metroData from '../../data/chennai_metro/verified_stations.json' with { type: 'json' };
import suburbanData from '../../data/suburban_rail/verified_stations.json' with { type: 'json' };
import mtcData from '../../data/mtc_bus/verified_hubs.json' with { type: 'json' };
import expressData from '../../data/express_rail/verified_express_stops.json' with { type: 'json' };

/**
 * AccessRoute Transit Explorer Data Model
 * Curated 140 Chennai transit stations & interchange hubs across 4 transport modes:
 * - 41 Chennai Metro stations (Blue & Green lines)
 * - 70 Southern Railway suburban stations (South, West, North, MRTS lines)
 * - 21 MTC bus interchange hubs
 * - 8 Express rail major belt terminals
 */

export const TRANSIT_MODES = {
  chennai_metro: {
    id: 'chennai_metro',
    label: 'Chennai Metro',
    shortLabel: 'Metro',
    count: 41,
    color: '#0072CE',
    badge: 'M',
    operator: 'Chennai Metro Rail Limited (CMRL)',
    status: 'Provisional (Expired 2021 Calendar)',
    timetableStatus: 'EXPIRED_CALENDAR',
    badgeClass: 'bg-[#0072CE] text-white',
    borderClass: 'border-[#0072CE]'
  },
  suburban_rail: {
    id: 'suburban_rail',
    label: 'Suburban Rail',
    shortLabel: 'Suburban',
    count: 70,
    color: '#059669',
    badge: 'S',
    operator: 'Southern Railway (SR) — Chennai Division',
    status: 'Provisional (Distant Placeholder End Date)',
    timetableStatus: 'PLACEHOLDER_CALENDAR',
    badgeClass: 'bg-[#059669] text-white',
    borderClass: 'border-[#059669]'
  },
  mtc_bus: {
    id: 'mtc_bus',
    label: 'MTC Bus Hubs',
    shortLabel: 'MTC Hubs',
    count: 21,
    color: '#263B68',
    badge: 'B',
    operator: 'Metropolitan Transport Corporation (Chennai) Ltd.',
    status: 'Provisional (App Scrape / Proprietary GPS)',
    timetableStatus: 'COMMUNITY_APP_SCRAPE',
    badgeClass: 'bg-[#263B68] text-white',
    borderClass: 'border-[#263B68]'
  },
  express_rail: {
    id: 'express_rail',
    label: 'Express Rail',
    shortLabel: 'Express',
    count: 8,
    color: '#7C3AED',
    badge: 'X',
    operator: 'Indian Railways (Ministry of Railways)',
    status: 'Informational Only (PRS/UTS Segregated)',
    timetableStatus: 'NO_TIMETABLE_DATASET',
    badgeClass: 'bg-[#7C3AED] text-white',
    borderClass: 'border-[#7C3AED]'
  }
};

const corridorNameMap = {
  south_line: 'South Line (Beach ⟷ Chengalpattu / Tirumalpur)',
  west_line: 'West Line (Central MMC ⟷ Arakkonam)',
  north_line: 'North Line (Central MMC ⟷ Gummidipoondi)',
  mrts_line: 'MRTS Line (Beach ⟷ Velachery ⟷ St. Thomas Mount)'
};

function buildStationList() {
  const stations = [];

  // 1. Chennai Metro (41 stations)
  for (const st of metroData.stations) {
    const lines = [];
    if (st.lines.includes('blue_line')) lines.push('Blue Line (Corridor 1)');
    if (st.lines.includes('green_line')) lines.push('Green Line (Corridor 2)');

    stations.push({
      id: st.id || `cmrl_${st.code.toLowerCase()}`,
      code: st.code,
      name: st.name,
      tamilName: st.tamilName || '',
      mode: 'chennai_metro',
      modeLabel: 'Chennai Metro',
      modeColor: '#0072CE',
      markerBadge: 'M',
      latitude: st.latitude,
      longitude: st.longitude,
      lines,
      corridors: st.lines || [],
      stationType: st.stationType || 'elevated',
      district: st.latitude > 13.1 ? 'Tiruvallur Border' : 'Chennai',
      platforms: st.isInterchange ? 4 : 2,
      stepFreeAccess: Boolean(st.stepFreeAccess),
      hasElevator: Boolean(st.hasElevator),
      hasRamp: true,
      hasEscalator: Boolean(st.hasEscalator),
      isInterchange: Boolean(st.isInterchange),
      interchangeWith: Array.isArray(st.interchangeWith) ? st.interchangeWith : [],
      accessibilitySource: 'MoHUA Harmonised Guidelines / CMRL Architectural Standard (Dual lift connectivity street-to-concourse and concourse-to-platform)',
      timetableStatus: 'EXPIRED_CALENDAR',
      timetableNote: 'CMRL static GTFS calendar expired on 2021-12-31. Live operating headways and timetables are not published as authorized open data.',
      operator: 'Chennai Metro Rail Limited (CMRL)'
    });
  }

  // 2. Southern Railway Suburban & MRTS (70 stations)
  // 11 verified Divyangjan Scheme platform-lift equipped suburban junction stations
  const suburbanDivyangjanStations = new Set([
    'MS', 'MBM', 'GDY', 'STM', 'TBM', 'CGL', 'MASS', 'PER', 'AVD', 'TRL', 'AJJ'
  ]);

  for (const st of suburbanData.stations) {
    const lines = (st.corridors || []).map((c) => corridorNameMap[c] || c);
    const isDivyangjanEquipped = suburbanDivyangjanStations.has(st.code) || Boolean(st.stepFreeAccess);

    stations.push({
      id: st.id || `srr_${st.code.toLowerCase()}`,
      code: st.code,
      name: st.name,
      tamilName: st.tamilName || '',
      mode: 'suburban_rail',
      modeLabel: 'Suburban Rail',
      modeColor: '#059669',
      markerBadge: 'S',
      latitude: st.latitude,
      longitude: st.longitude,
      lines,
      corridors: st.corridors || [],
      stationType: st.stationType || 'at_grade',
      district: st.district || 'Chennai',
      platforms: st.platforms || 2,
      stepFreeAccess: isDivyangjanEquipped,
      hasElevator: isDivyangjanEquipped,
      hasRamp: isDivyangjanEquipped,
      hasEscalator: false,
      isInterchange: Boolean(st.isInterchange),
      interchangeWith: Array.isArray(st.interchangeWith) ? st.interchangeWith : [],
      evidenceStatus: st.evidenceStatus || 'source_verified',
      accessibilitySource: isDivyangjanEquipped
        ? 'Divyangjan / Amrit Bharat Railway Scheme (Platform Lifts & Step-Free Concourse)'
        : 'Southern Railway Station Survey (Foot-Over-Bridge Concrete Stairs Only; No Passenger Lift)',
      timetableStatus: 'PLACEHOLDER_CALENDAR',
      timetableNote: 'Southern Railway schedule dataset uses placeholder calendar end date (2170) and unconfirmed redistribution rights. Production routing disabled.',
      operator: 'Southern Railway (SR) — Chennai Division'
    });
  }

  // 3. MTC Bus Hubs (21 hubs)
  for (const hub of mtcData.interchangeHubs) {
    stations.push({
      id: hub.id || `mtc_${hub.code.toLowerCase()}`,
      code: hub.code,
      name: hub.name,
      tamilName: hub.tamilName || '',
      mode: 'mtc_bus',
      modeLabel: 'MTC Bus Hub',
      modeColor: '#263B68',
      markerBadge: 'B',
      latitude: hub.latitude,
      longitude: hub.longitude,
      lines: ['MTC Chennai Bus Network'],
      corridors: ['mtc_bus_network'],
      stationType: hub.facilityType || 'bus_terminus',
      district: hub.district || 'Chennai',
      platforms: hub.platforms || hub.busBays || 10,
      stepFreeAccess: false,
      hasElevator: false,
      hasRamp: true,
      hasEscalator: false,
      isInterchange: true,
      interchangeWith: Array.isArray(hub.interchangeConnections) ? hub.interchangeConnections : [],
      evidenceStatus: hub.evidenceStatus || 'manually_curated',
      accessibilitySource: 'MTC Vehicle Fleet Reality (Standard high-floor chassis with 850mm–900mm entrance steps; boarding is not step-free)',
      timetableStatus: 'COMMUNITY_APP_SCRAPE',
      timetableNote: 'Feed is an unauthenticated reverse-engineering scrape of MTC mobile app API. Live GPS (Chalo) is proprietary and closed.',
      operator: 'Metropolitan Transport Corporation (Chennai) Ltd.'
    });
  }

  // 4. Express Rail (8 stations)
  for (const st of expressData.chennaiBeltStations) {
    stations.push({
      id: `exp_${st.code.toLowerCase()}`,
      code: st.code,
      name: st.name,
      tamilName: st.tamilName || '',
      mode: 'express_rail',
      modeLabel: 'Express Rail',
      modeColor: '#7C3AED',
      markerBadge: 'X',
      latitude: st.latitude,
      longitude: st.longitude,
      lines: ['Indian Railways Passenger Express'],
      corridors: [st.corridor || 'express_corridor'],
      stationType: st.terminalType || 'major_terminal',
      district: st.district || 'Chennai',
      platforms: st.code === 'MAS' ? 12 : (st.code === 'MS' ? 9 : 4),
      stepFreeAccess: Boolean(st.stepFreeAccess),
      hasElevator: Boolean(st.stepFreeAccess),
      hasRamp: true,
      hasEscalator: false,
      isInterchange: true,
      interchangeWith: ['Suburban EMU (Segregated Booking Required)', 'MTC City Buses'],
      evidenceStatus: st.evidenceStatus || 'cross_checked',
      accessibilitySource: 'Indian Railways Commercial Passenger Terminal Standard (Platform lifts present; coach boarding requires steep steps)',
      timetableStatus: 'NO_TIMETABLE_DATASET',
      timetableNote: 'Express rail stops catalogued for intermodal boundaries. No timetable trip database in repo; PRS/UTS ticketing separation strictly enforced.',
      operator: 'Indian Railways (Ministry of Railways)'
    });
  }

  return stations;
}

export const ALL_TRANSIT_STATIONS = buildStationList();

// Disambiguated station lookup: indexes by unique ID, mode:code, and code
const stationLookup = new Map();
for (const s of ALL_TRANSIT_STATIONS) {
  stationLookup.set(s.id.toLowerCase(), s);
  stationLookup.set(`${s.mode}:${s.code}`.toLowerCase(), s);
  if (!stationLookup.has(s.code)) {
    stationLookup.set(s.code, s);
  }
}

export const TRANSIT_CORRIDORS = [
  {
    id: 'blue_line',
    mode: 'chennai_metro',
    name: 'Blue Line (Corridor 1)',
    color: '#0072CE',
    connectionType: 'verified_physical',
    connectionTypeLabel: 'Verified physical station sequence',
    terminals: ['Wimco Nagar Depot', 'Chennai International Airport'],
    stationCodes: [
      'SWND', 'SWN', 'STV', 'STVT', 'SKP', 'STG', 'SNW', 'STP', 'STC', 'SWP',
      'SMD', 'SHC', 'SMC', 'SGE', 'SLIC', 'STL', 'SDMS', 'STN', 'SND', 'SSD',
      'SLM', 'SGD', 'SAL', 'SNG', 'SMB', 'SAP'
    ]
  },
  {
    id: 'green_line',
    mode: 'chennai_metro',
    name: 'Green Line (Corridor 2)',
    color: '#008850',
    connectionType: 'verified_physical',
    connectionTypeLabel: 'Verified physical station sequence',
    terminals: ['Puratchi Thalaivar Dr. M.G.R Central', 'St. Thomas Mount'],
    stationCodes: [
      'SMC', 'SEG', 'SNP', 'SKM', 'SPC', 'SSN', 'SAE', 'SAT', 'cmrl_stm', 'SKB', 'SCMBT',
      'SAB', 'SVD', 'SAN', 'SEK', 'SAL', 'STMNT'
    ]
  },
  {
    id: 'south_line',
    mode: 'suburban_rail',
    name: 'South Line',
    color: '#008080',
    connectionType: 'historical_timetable',
    connectionTypeLabel: 'Historical timetable-supported connection',
    terminals: ['Chennai Beach', 'Chengalpattu Junction', 'Tirumalpur'],
    stationCodes: [
      'MSB', 'MSF', 'MPK', 'MS', 'MSC', 'NBK', 'MKK', 'MBM', 'SP', 'GDY',
      'srr_stm', 'PZA', 'MN', 'TLM', 'PV', 'CMP', 'TBMS', 'TBM', 'PRGL', 'VDR',
      'UPM', 'GI', 'POTI', 'CTM', 'MMNK', 'SKL', 'PWU', 'CGL', 'WJ', 'CJ', 'TMLP'
    ]
  },
  {
    id: 'west_line',
    mode: 'suburban_rail',
    name: 'West Line',
    color: '#DA291C',
    connectionType: 'historical_timetable',
    connectionTypeLabel: 'Historical timetable-supported connection',
    terminals: ['Chennai Central (MMC)', 'Arakkonam Junction'],
    stationCodes: [
      'MASS', 'BBQ', 'VPY', 'PER', 'PCW', 'PEW', 'VLK', 'KOTR', 'PVM', 'ABU',
      'TMVL', 'ANNR', 'AVD', 'PAB', 'TI', 'TRL', 'KBT', 'AJJ'
    ]
  },
  {
    id: 'north_line',
    mode: 'suburban_rail',
    name: 'North Line',
    color: '#4B0082',
    connectionType: 'provisional_catalogue',
    connectionTypeLabel: 'Provisional catalogue relationship',
    terminals: ['Chennai Central (MMC)', 'Gummidipoondi'],
    stationCodes: [
      'MASS', 'BBQ', 'ENR', 'MJR', 'PON', 'GPD'
    ]
  },
  {
    id: 'mrts_line',
    mode: 'suburban_rail',
    name: 'MRTS Line',
    color: '#FF8C00',
    connectionType: 'physical_alignment',
    connectionTypeLabel: 'Physical corridor alignment (elevated suburban)',
    connectionNote: 'Beach–Chintadripet track modifications ongoing; March 2026 Velachery–St. Thomas Mount extension commissioned; operational schedules not inferred.',
    terminals: ['Chennai Beach', 'St. Thomas Mount'],
    stationCodes: [
      'MSB', 'MSF', 'MPKT', 'MCPT', 'MCPK', 'MTCN', 'MLHS', 'MTMY',
      'MNDY', 'GWYR', 'KTPM', 'KTBR', 'INDR', 'TYMR', 'TRMN', 'PRGD', 'VLCY',
      'PRTK', 'ADMB', 'srr_stm'
    ]
  }
].map((corr) => {
  const stations = corr.stationCodes
    .map((codeOrId) => {
      return (
        stationLookup.get(codeOrId.toLowerCase()) ||
        stationLookup.get(`${corr.mode}:${codeOrId}`.toLowerCase()) ||
        stationLookup.get(codeOrId)
      );
    })
    .filter(Boolean);
  return {
    ...corr,
    stations,
    coordinates: stations.map((st) => [st.longitude, st.latitude])
  };
});

/**
 * Filter stations by search term, modes, corridor, or accessibility
 */
export function filterStations(options = {}) {
  const { modes = [], corridor = '', q = '', stepFreeOnly = false } = options;
  let results = ALL_TRANSIT_STATIONS;

  if (modes.length > 0) {
    results = results.filter((s) => modes.includes(s.mode));
  }

  if (corridor) {
    results = results.filter((s) => s.corridors.includes(corridor));
  }

  if (stepFreeOnly) {
    results = results.filter((s) => s.stepFreeAccess === true);
  }

  if (q && q.trim()) {
    const term = q.toLowerCase().trim();
    results = results.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      (s.tamilName && s.tamilName.includes(term)) ||
      s.district.toLowerCase().includes(term) ||
      s.lines.some((l) => l.toLowerCase().includes(term)) ||
      s.modeLabel.toLowerCase().includes(term)
    );
  }

  return results;
}

/**
 * Lookup station by ID, code, or name
 */
export function getStationById(idOrCode) {
  if (!idOrCode) return null;
  const q = String(idOrCode).toLowerCase().trim();
  const stripped = q.replace(/^(mtc|srr|cmrl|exp)_/, '');

  return (
    ALL_TRANSIT_STATIONS.find(
      (s) =>
        s.id.toLowerCase() === q ||
        s.code.toLowerCase() === q ||
        s.code.toLowerCase() === stripped ||
        s.name.toLowerCase() === q ||
        s.name.toLowerCase().includes(q)
    ) || null
  );
}
