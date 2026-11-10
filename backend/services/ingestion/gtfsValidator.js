/**
 * AccessRoute GTFS Static Feed Validator
 * Validates file structure, required columns, coordinate bounds, time formats,
 * duplicate identifiers, referential integrity, and service calendar freshness.
 */

export const DEFAULT_SPATIAL_BOUNDS = {
  minLatitude: 12.50,
  maxLatitude: 13.50,
  minLongitude: 79.50,
  maxLongitude: 80.40
};

export const TIME_REGEX = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/;
export const DATE_REGEX = /^[0-9]{8}$/;

export function validateGtfsTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const match = timeStr.trim().match(TIME_REGEX);
  if (!match) return false;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  return hours >= 0 && hours <= 48 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
}

export function timeStringToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(TIME_REGEX);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToTimeString(totalSec) {
  if (totalSec === null || totalSec === undefined || isNaN(totalSec) || totalSec < 0) return null;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function validateGtfsDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const cleaned = dateStr.trim();
  if (!DATE_REGEX.test(cleaned)) return false;
  const year = parseInt(cleaned.slice(0, 4), 10);
  const month = parseInt(cleaned.slice(4, 6), 10);
  const day = parseInt(cleaned.slice(6, 8), 10);
  if (year < 1900 || year > 2200) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}

/**
 * Analyzes trip timing sequence for chronological progression,
 * same-stop order, extended GTFS hours (>=24), and unnormalized modulo-24 rollovers.
 */
export function analyzeTripTiming(stops) {
  if (!stops || stops.length < 2) {
    return {
      status: 'INSUFFICIENT_STOPS',
      usableForRouting: false,
      normalizable: false,
      ambiguous: false,
      issues: ['Trip contains fewer than 2 stops']
    };
  }

  let hasSameStopInversion = false;
  let hasProgressionRegression = false;
  let hasSequenceDisorder = false;
  let isAlreadyExtendedHours = false;
  let lastDepSec = -1;
  let lastStopSeq = -1;
  const issues = [];

  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    const arrSec = timeStringToSeconds(st.arrival_time);
    const depSec = timeStringToSeconds(st.departure_time);
    const stopSeq = parseInt(st.stop_sequence, 10);

    if (!isNaN(stopSeq)) {
      if (lastStopSeq !== -1 && stopSeq <= lastStopSeq) {
        hasSequenceDisorder = true;
        issues.push(`Non-increasing stop sequence at index ${i} (${st.stop_id}): seq ${st.stop_sequence} <= previous seq ${lastStopSeq}`);
      }
      lastStopSeq = stopSeq;
    }

    if (arrSec === null || depSec === null) {
      return {
        status: 'INVALID_TIME_FORMAT',
        usableForRouting: false,
        normalizable: false,
        ambiguous: true,
        issues: [`Invalid time format in stop sequence ${st.stop_sequence}`]
      };
    }

    if (arrSec >= 86400 || depSec >= 86400) {
      isAlreadyExtendedHours = true;
    }

    if (arrSec > depSec) {
      hasSameStopInversion = true;
      issues.push(`Same-stop inversion at seq ${st.stop_sequence} (${st.stop_id}): arrival ${st.arrival_time} > departure ${st.departure_time}`);
    }

    if (lastDepSec !== -1 && arrSec < lastDepSec) {
      hasProgressionRegression = true;
      issues.push(`Progression regression at seq ${st.stop_sequence} (${st.stop_id}): arrival ${st.arrival_time} < previous departure (${lastDepSec}s)`);
    }

    lastDepSec = depSec;
  }

  if (hasSequenceDisorder) {
    return {
      status: 'AMBIGUOUS_TIME_PROGRESSION',
      usableForRouting: false,
      normalizable: false,
      ambiguous: true,
      issues
    };
  }

  if (!hasSameStopInversion && !hasProgressionRegression) {
    const firstArrSec = timeStringToSeconds(stops[0].arrival_time);
    const rawTotalDurationSec = lastDepSec - firstArrSec;
    if (rawTotalDurationSec <= 0) {
      return {
        status: 'AMBIGUOUS_TIME_PROGRESSION',
        usableForRouting: false,
        normalizable: false,
        ambiguous: true,
        issues: ['Multi-stop trip scheduled duration is zero or negative']
      };
    }

    return {
      status: isAlreadyExtendedHours ? 'VALID_EXTENDED_HOURS' : 'VALID_STANDARD',
      usableForRouting: true,
      normalizable: true,
      ambiguous: false,
      issues: [],
      normalizedStops: stops.map(s => ({
        seq: s.stop_sequence,
        stop: s.stop_id,
        arrSec: timeStringToSeconds(s.arrival_time),
        depSec: timeStringToSeconds(s.departure_time),
        arrival_time: s.arrival_time,
        departure_time: s.departure_time
      }))
    };
  }

  // Attempt unambiguous monotonic normalization (+24h after midnight rollover)
  let rolledOver = false;
  let normLastDepSec = -1;
  let ambiguous = false;
  const normalizedStops = [];

  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    let arrSec = timeStringToSeconds(st.arrival_time);
    let depSec = timeStringToSeconds(st.departure_time);

    // Case A: same-stop departure at midnight (e.g. arr 23:59:00, dep 00:00:00)
    if (arrSec > depSec && st.departure_time.startsWith('00:')) {
      const dwellSec = (86400 + depSec) - arrSec;
      // Dwell across midnight must be plausible (arr >= 22:00:00 and dwell <= 15 minutes)
      if (arrSec >= 79200 && dwellSec > 0 && dwellSec <= 900) {
        rolledOver = true;
        depSec += 86400;
      } else {
        ambiguous = true;
      }
    } else if (rolledOver) {
      if (arrSec < 43200) arrSec += 86400;
      if (depSec < 43200) depSec += 86400;
    } else if (normLastDepSec !== -1 && arrSec < normLastDepSec && st.arrival_time.startsWith('00:')) {
      const hopSec = (arrSec + 86400) - normLastDepSec;
      // Progression regression across midnight must be plausible (prev dep >= 21:00:00 and hop <= 3600s = 1 hour)
      if (normLastDepSec >= 75600 && hopSec > 0 && hopSec <= 3600) {
        rolledOver = true;
        arrSec += 86400;
        depSec += 86400;
      } else {
        ambiguous = true;
      }
    }

    if (arrSec > depSec || (normLastDepSec !== -1 && arrSec < normLastDepSec)) {
      ambiguous = true;
    }
    normLastDepSec = depSec;
    normalizedStops.push({
      seq: st.stop_sequence,
      stop: st.stop_id,
      arrSec,
      depSec,
      arrival_time: secondsToTimeString(arrSec),
      departure_time: secondsToTimeString(depSec)
    });
  }

  const totalDurationSec = normLastDepSec - normalizedStops[0].arrSec;
  if (totalDurationSec <= 0 || totalDurationSec > 18000) {
    ambiguous = true;
  }

  return {
    status: ambiguous ? 'AMBIGUOUS_TIME_PROGRESSION' : 'UNNORMALIZED_MIDNIGHT_ROLLOVER',
    usableForRouting: false,
    normalizable: !ambiguous,
    ambiguous,
    issues,
    normalizedDurationMinutes: !ambiguous ? Math.round(totalDurationSec / 60) : null,
    normalizedStops: !ambiguous ? normalizedStops : null
  };
}

/**
 * Reconciles GTFS stops with AccessRoute curated 70-station catalogue.
 */
export function reconcileCuratedCatalogue(gtfsStopsRows, catalogueStations, options = {}) {
  if (!Array.isArray(catalogueStations) || catalogueStations.length === 0) {
    return null;
  }

  const mode = (typeof options === 'string' ? options : options.mode) || 'suburban_rail';

  const gtfsStops = new Set();
  for (const s of gtfsStopsRows || []) {
    if (s.stop_id) gtfsStops.add(s.stop_id);
    if (s.parent_station) gtfsStops.add(s.parent_station);
    if (s.zone_id) gtfsStops.add(s.zone_id);
  }

  let aliasDefinitions = {};
  let knownExtensions = new Set();
  let extensionReason = 'EXTENSION_POSTDATES_SNAPSHOT';

  if (mode === 'chennai_metro') {
    aliasDefinitions = {
      // Divergent Facilities / Access Points (Class 2: Related interchange / catchment area, but distinct physical facilities or access centroids)
      'SCMBT': { gtfsCode: 'SCM', classification: 'DIVERGENT_FACILITY', confidence: 'MEDIUM', notes: 'Catalogue coordinate is MTC CMBT bus bays concourse centroid (996m from elevated metro station on 100 Feet Rd; modeled as distinct nodes with intermodal connection)' },
      'SNG': { gtfsCode: 'SOT', classification: 'DIVERGENT_FACILITY', confidence: 'MEDIUM', notes: 'Catalogue coordinate is residential Nanganallur neighborhood centroid (1,091m from GST Rd elevated metro station)' },

      // Provisional / Likely Matches (Class 3: Plausible corridor match, but lacking authoritative independent external crosswalk or has coordinate discrepancy / unserved status)
      // 3A. Major Interchange Hubs (Downgraded to PROVISIONAL in Phase 07.4.1: name and topological inference, but lacking independently published authoritative crosswalk)
      'SMC': { gtfsCode: 'SCC', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Chennai Central Metro: Topological and name alignment with Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro (218m offset); hub listed in internal network_scope.json, but internal catalogue code SMC has no independently published authoritative crosswalk to GTFS zone SCC' },
      'SGD': { gtfsCode: 'SGU', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Guindy Metro: Name alignment and proximity (184m offset) adjacent to Southern Railway GDY; hub listed in internal network_scope.json, but internal catalogue code SGD has no independently published authoritative crosswalk to GTFS zone SGU' },
      'STMNT': { gtfsCode: 'SMM', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'St. Thomas Mount: Name alignment and proximity (111m offset) at multi-modal terminal; hub listed in internal network_scope.json, but internal catalogue code STMNT has no independently published authoritative crosswalk to GTFS zone SMM' },

      // 3B. Close Proximity Local Inferences (delta <= 500m, but established via name/distance inference rather than authoritative crosswalk)
      'SSD': { gtfsCode: 'SSA', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Saidapet: Close spatial alignment (19m) and matching name, but local inference without official CMRL acronym crosswalk' },
      'SKB': { gtfsCode: 'SKO', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Koyambedu: Close spatial alignment (21m) and matching name, but local inference without official CMRL acronym crosswalk' },
      'SND': { gtfsCode: 'SCR', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Nandanam: Close spatial alignment (61m) and matching name, but local inference (SCR zone code diverges from SND acronym)' },
      'STM': { gtfsCode: 'STI', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Thirumangalam: Spatial alignment (222m) and matching name, but local inference (catalogue reused STM which conflicts with Southern Railway St. Thomas Mount)' },
      'SDMS': { gtfsCode: 'SGM', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'AG-DMS: Spatial alignment (228m) and matching name, but local inference (SGM zone code diverges from SDMS acronym)' },
      'SVD': { gtfsCode: 'SVA', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Vadapalani: Spatial alignment (242m) and matching name; catalogue coordinate pinned to MTC bus terminus' },
      'SMD': { gtfsCode: 'SMA', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Mannadi: Spatial alignment (262m) and matching name, but local inference without official CMRL acronym crosswalk' },
      'SLIC': { gtfsCode: 'SLI', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'LIC: Spatial alignment (339m) and matching name, but local inference without official CMRL acronym crosswalk' },
      'STN': { gtfsCode: 'STE', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Teynampet: Spatial alignment (408m) and matching name, but local inference without official CMRL acronym crosswalk' },
      'SEK': { gtfsCode: 'SSI', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Ekkattuthangal: Spatial alignment (499m) and matching name, but local inference (SSI zone code diverges from SEK acronym)' },

      // 3C. Corridor / Coordinate Discrepancies (delta 635m–944m)
      'SMB': { gtfsCode: 'SME', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Meenambakkam: Corridor topological match, but catalogue coordinate exhibits 635m eastward discrepancy' },
      'SWP': { gtfsCode: 'SWA', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Washermanpet: Corridor topological match, but catalogue coordinate exhibits 811m southeast discrepancy' },
      'STP': { gtfsCode: 'STR', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Tondiarpet: Corridor topological match, but catalogue coordinate exhibits 937m southeast discrepancy' },
      'SAB': { gtfsCode: 'SAR', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Arumbakkam: Corridor topological match, but catalogue coordinate exhibits 944m westward discrepancy towards CMBT' },

      // 3D. Unserved Commercial Extensions (zero scheduled commercial trips in 2021 feed)
      'SWND': { gtfsCode: 'SWD', classification: 'PROVISIONAL', confidence: 'LOW_MEDIUM', notes: 'Wimco Nagar Depot: Physical parent stop 141 in stops.txt, but 0 commercial trips in 2021 feed (opened March 2022); 1,027m catalogue offset' },
      'STVT': { gtfsCode: 'STT', classification: 'PROVISIONAL', confidence: 'LOW_MEDIUM', notes: 'Tiruvottiyur Theradi: Physical parent stop 144 in stops.txt, but 0 commercial trips in 2021 feed (opened March 2022); 904m catalogue offset' }
    };
    knownExtensions = new Set(['SWND', 'STVT']);
    extensionReason = 'CMRL_PHASE_1_EXTENSION_POSTDATES_2021_SNAPSHOT';
  } else if (mode === 'mtc_bus') {
    aliasDefinitions = {
      // MTC Bus Hub Terminals to GTFS Bus Stops (Provisional mappings: spatial delta <= 500m to nearest stop, but no official acronym crosswalk in feed)
      'BWAY': { gtfsCode: '2', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Broadway Bus Terminus: Stop 2 [Broadway] at 52m' },
      'CMBT': { gtfsCode: '9607', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'CMBT Koyambedu: Stop 9607 [Koyambedu Metro] at 435m' },
      'KCBT': { gtfsCode: '6379', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Kilambakkam KCBT: Stop 6379 [Urappakam] at 112m' },
      'TNGR': { gtfsCode: '10225', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'T. Nagar: Stop 10225 [Duraiswamy Subway Or Pothys] at 80m' },
      'TBMW': { gtfsCode: '6681', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Tambaram West: Stop 6681 [Tambaram Railway Station] at 27m' },
      'TBME': { gtfsCode: '6663', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Tambaram East: Stop 6663 [Tambaram Railway Station East] at 330m' },
      'GDY': { gtfsCode: '11108', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Guindy Hub: Stop 11108 [Guindy Race Cource] at 31m' },
      'SDPT': { gtfsCode: '9146', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Saidapet: Stop 9146 [Saidapet Market] at 180m' },
      'TYMR': { gtfsCode: '5349', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Thiruvanmiyur: Stop 5349 [Thiruvanmiyur Depot] at 55m' },
      'PMLE': { gtfsCode: '5782', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Poonamallee: Stop 5782 [Poonamallee Government Hospital] at 118m' },
      'AVD': { gtfsCode: '6939', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Avadi: Stop 6939 [Avadi Market] at 338m' },
      'ABOT': { gtfsCode: '10422', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Ambattur O.T: Stop 10422 [Amma Hotel - Near Ambattur O.T] at 62m' },
      'RDHL': { gtfsCode: '10574', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Red Hills: Stop 10574 [Red Hills Eb Or Azhinjivakkam Road Junction] at 463m' },
      'TLGT': { gtfsCode: '7198', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Tollgate: Stop 7198 [Nagara Thottam] at 58m' },
      'VDPL': { gtfsCode: '9431', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Vadapalani: Stop 9431 [Kamala Theatre] at 219m' },
      'VLCY': { gtfsCode: '8701', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Velachery: Stop 8701 [Mageshwari Nagar] at 222m' },
      'ADYR': { gtfsCode: '8993', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Adyar: Stop 8993 [Adyar Signal] at 14m' },
      'CGLB': { gtfsCode: '9927', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Chengalpattu: Stop 9927 [Chengalpet] at 338m' },
      'SPBD': { gtfsCode: '8576', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Sriperumbudur: Stop 8576 [Sriperumbudur Theradi] at 266m' },
      'GUDV': { gtfsCode: '6295', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Guduvancheri: Stop 6295 [Guduvancheri Railway Station] at 259m' },
      'TPRR': { gtfsCode: '6016', classification: 'PROVISIONAL', confidence: 'MEDIUM', notes: 'Thiruporur: Stop 6016 [Kandhaswami Temple Tank Thiruporur] at 139m' }
    };
    knownExtensions = new Set();
    extensionReason = null;
  } else {
    // Default: suburban_rail
    aliasDefinitions = {
      'MASS': { gtfsCode: 'MAS', classification: 'CONFIRMED', confidence: 'HIGH' },
      'VPY': { gtfsCode: 'VJM', classification: 'CONFIRMED', confidence: 'HIGH' }
    };
    knownExtensions = new Set(['PRTK', 'ADMB']);
    extensionReason = 'MRTS_PHASE_2_EXTENSION_POSTDATES_SNAPSHOT';
  }

  const exactMatches = [];
  const aliasMatches = [];
  const confirmedAliases = [];
  const divergentFacilityAliases = [];
  const provisionalAliases = [];
  const unresolvedAliases = [];
  const missingExtensionStations = [];
  const unmatchedStations = [];

  for (const st of catalogueStations) {
    if (knownExtensions.has(st.code)) {
      missingExtensionStations.push({ code: st.code, name: st.name, reason: extensionReason });
    }

    if (gtfsStops.has(st.code)) {
      exactMatches.push({ code: st.code, name: st.name });
    } else if (aliasDefinitions[st.code]) {
      const aliasDef = aliasDefinitions[st.code];
      const targetFound = gtfsStops.has(aliasDef.gtfsCode);

      const record = {
        catalogueCode: st.code,
        gtfsCode: aliasDef.gtfsCode,
        name: st.name,
        classification: aliasDef.classification,
        confidence: aliasDef.confidence,
        targetFound,
        notes: aliasDef.notes || null
      };

      if (!targetFound || aliasDef.classification === 'UNRESOLVED') {
        unresolvedAliases.push(record);
        unmatchedStations.push({ code: st.code, name: st.name, reason: 'UNRESOLVED_ALIAS' });
      } else {
        aliasMatches.push(record);
        if (aliasDef.classification === 'CONFIRMED') {
          confirmedAliases.push(record);
        } else if (aliasDef.classification === 'DIVERGENT_FACILITY') {
          divergentFacilityAliases.push(record);
        } else if (aliasDef.classification === 'PROVISIONAL') {
          provisionalAliases.push(record);
        }
      }
    } else if (!knownExtensions.has(st.code)) {
      unmatchedStations.push({ code: st.code, name: st.name, reason: 'UNMATCHED_STATION' });
    }
  }

  const physicalStationsRepresented = exactMatches.length + aliasMatches.length;
  const confirmedMatches = exactMatches.length + confirmedAliases.length;

  return {
    catalogueTotalStations: catalogueStations.length,
    exactMatchedStations: exactMatches.length,
    aliasMappedStations: aliasMatches,
    confirmedAliases,
    divergentFacilityAliases,
    provisionalAliases,
    unresolvedAliases,
    unmatchedExtensionStations: missingExtensionStations,
    unmatchedStations,
    physicalStationsRepresented,
    physicalRepresentationRate: ((physicalStationsRepresented / catalogueStations.length) * 100).toFixed(1) + '%',
    confirmedMatches,
    confirmedMatchRate: ((confirmedMatches / catalogueStations.length) * 100).toFixed(1) + '%',
    // Retain legacy reconciliationRate for backward compatibility with existing tests
    reconciliationRate: ((physicalStationsRepresented / catalogueStations.length) * 100).toFixed(1) + '%'
  };
}

export function validateGtfsFeed(feedData, options = {}) {
  const bounds = options.bounds || DEFAULT_SPATIAL_BOUNDS;
  const referenceDate = options.referenceDate || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const strictCalendar = options.strictCalendar !== undefined ? options.strictCalendar : true;
  const corridorExceptions = new Set(options.corridorExceptions || []);

  const errors = [];
  const warnings = [];
  const rejectedRecords = [];
  const feedLevelBlockers = [];

  const tables = feedData.tables || {};

  // 1. Check required tables
  const requiredTables = ['agency', 'routes', 'stops', 'trips', 'stop_times'];
  for (const table of requiredTables) {
    if (!tables[table] || !Array.isArray(tables[table].rows)) {
      errors.push(`Missing mandatory GTFS file: ${table}.txt`);
    }
  }

  // Either calendar.txt or calendar_dates.txt must be present
  const hasCalendar = tables.calendar && Array.isArray(tables.calendar.rows) && tables.calendar.rows.length > 0;
  const hasCalendarDates = tables.calendar_dates && Array.isArray(tables.calendar_dates.rows) && tables.calendar_dates.rows.length > 0;
  if (!hasCalendar && !hasCalendarDates) {
    errors.push('Missing service calendar: either calendar.txt or calendar_dates.txt must be provided');
  }

  // If mandatory tables are missing, return early
  if (errors.length > 0) {
    return {
      valid: false,
      readyForJourneyRouting: false,
      errors,
      warnings,
      rejectedRecords,
      feedLevelBlockers: ['FEED_MISSING_MANDATORY_TABLES'],
      quarantinedTrips: [],
      calendarStatus: 'MISSING',
      stats: { recordCounts: {}, rejectedCount: 0 }
    };
  }

  // 2. Validate agency.txt
  const agencyHeaders = tables.agency.headers;
  for (const col of ['agency_name', 'agency_url', 'agency_timezone']) {
    if (!agencyHeaders.includes(col)) {
      errors.push(`agency.txt missing required column: ${col}`);
    }
  }

  // 3. Validate routes.txt & collect route_ids
  const routeHeaders = tables.routes.headers;
  for (const col of ['route_id', 'route_type']) {
    if (!routeHeaders.includes(col)) {
      errors.push(`routes.txt missing required column: ${col}`);
    }
  }
  if (!routeHeaders.includes('route_short_name') && !routeHeaders.includes('route_long_name')) {
    errors.push('routes.txt must contain at least one of route_short_name or route_long_name');
  }

  const routeIds = new Set();
  const duplicateRouteIds = new Set();
  for (const r of tables.routes.rows) {
    if (!r.route_id) {
      errors.push('routes.txt contains row with empty route_id');
      continue;
    }
    if (routeIds.has(r.route_id)) {
      duplicateRouteIds.add(r.route_id);
    }
    routeIds.add(r.route_id);
  }
  if (duplicateRouteIds.size > 0) {
    errors.push(`routes.txt contains duplicate route_ids: ${Array.from(duplicateRouteIds).slice(0, 5).join(', ')}`);
  }

  // 4. Validate stops.txt, coordinates, & collect stop_ids
  const stopHeaders = tables.stops.headers;
  for (const col of ['stop_id', 'stop_name', 'stop_lat', 'stop_lon']) {
    if (!stopHeaders.includes(col)) {
      errors.push(`stops.txt missing required column: ${col}`);
    }
  }

  const stopIds = new Set();
  const duplicateStopIds = new Set();
  let invalidCoordCount = 0;
  let corridorExceptionsCount = 0;

  for (let i = 0; i < tables.stops.rows.length; i++) {
    const s = tables.stops.rows[i];
    if (!s.stop_id) {
      errors.push(`stops.txt row ${i + 1} has empty stop_id`);
      continue;
    }
    if (stopIds.has(s.stop_id)) {
      duplicateStopIds.add(s.stop_id);
    }
    stopIds.add(s.stop_id);

    const lat = parseFloat(s.stop_lat);
    const lon = parseFloat(s.stop_lon);

    if (isNaN(lat) || isNaN(lon)) {
      invalidCoordCount++;
      rejectedRecords.push({ table: 'stops', id: s.stop_id, reason: `NaN coordinates: lat=${s.stop_lat}, lon=${s.stop_lon}` });
    } else if (lat < bounds.minLatitude || lat > bounds.maxLatitude || lon < bounds.minLongitude || lon > bounds.maxLongitude) {
      if (corridorExceptions.has(s.stop_id)) {
        corridorExceptionsCount++;
        warnings.push(`Stop ${s.stop_id} (${s.stop_name || 'unnamed'}) at (${lat}, ${lon}) sits beyond bounds; documented as legitimate commuter rail corridor exception`);
      } else {
        invalidCoordCount++;
        rejectedRecords.push({
          table: 'stops',
          id: s.stop_id,
          reason: `Coordinates (${lat}, ${lon}) out of bounds [${bounds.minLatitude}-${bounds.maxLatitude}, ${bounds.minLongitude}-${bounds.maxLongitude}]`
        });
      }
    }
  }

  if (duplicateStopIds.size > 0) {
    errors.push(`stops.txt contains duplicate stop_ids: ${Array.from(duplicateStopIds).slice(0, 5).join(', ')}`);
  }
  if (invalidCoordCount > 0) {
    errors.push(`stops.txt contains ${invalidCoordCount} stops with invalid or out-of-bounds coordinates`);
  }

  // 5. Validate service calendar & freshness
  const serviceIds = new Set();
  const calendarServiceIds = new Set();
  let calendarStatus = 'ACTIVE';
  let activeServicesCount = 0;
  let expiredServicesCount = 0;
  let distantCalendarServicesCount = 0;
  let minCalendarStartDate = null;
  let maxCalendarEndDate = null;
  let minCalendarDatesDate = null;
  let maxCalendarDatesDate = null;

  if (hasCalendar) {
    for (const c of tables.calendar.rows) {
      if (!c.service_id) continue;
      serviceIds.add(c.service_id);
      calendarServiceIds.add(c.service_id);

      const validStart = validateGtfsDate(c.start_date);
      const validEnd = validateGtfsDate(c.end_date);

      if (validStart) {
        if (!minCalendarStartDate || c.start_date < minCalendarStartDate) {
          minCalendarStartDate = c.start_date;
        }
      }
      if (validEnd) {
        if (!maxCalendarEndDate || c.end_date > maxCalendarEndDate) {
          maxCalendarEndDate = c.end_date;
        }
      }

      if (!validStart || !validEnd) {
        errors.push(`calendar.txt service ${c.service_id} has invalid date format: start=${c.start_date}, end=${c.end_date}`);
      } else if (c.end_date < c.start_date) {
        errors.push(`calendar.txt service ${c.service_id} has end_date ${c.end_date} before start_date ${c.start_date}`);
      } else if (c.end_date < referenceDate) {
        expiredServicesCount++;
      } else {
        activeServicesCount++;
        const endYear = parseInt(c.end_date.slice(0, 4), 10);
        const refYear = parseInt(referenceDate.slice(0, 4), 10);
        if (endYear - refYear > 5) {
          distantCalendarServicesCount++;
          warnings.push(`calendar.txt service ${c.service_id} has distant future end_date ${c.end_date} (${endYear - refYear} years in future). Treat as open-ended placeholder date.`);
        }
      }
    }
  }

  if (hasCalendarDates) {
    for (let idx = 0; idx < tables.calendar_dates.rows.length; idx++) {
      const cd = tables.calendar_dates.rows[idx];
      if (!cd.service_id) {
        errors.push(`calendar_dates.txt row ${idx + 1} has empty service_id`);
        continue;
      }

      // If calendar.txt exists, check that service_id references a valid service in calendar.txt
      if (hasCalendar && !calendarServiceIds.has(cd.service_id)) {
        errors.push(`calendar_dates.txt references nonexistent service_id: ${cd.service_id}`);
      }

      const validDate = validateGtfsDate(cd.date);
      if (validDate) {
        if (!minCalendarDatesDate || cd.date < minCalendarDatesDate) {
          minCalendarDatesDate = cd.date;
        }
        if (!maxCalendarDatesDate || cd.date > maxCalendarDatesDate) {
          maxCalendarDatesDate = cd.date;
        }
      } else {
        errors.push(`calendar_dates.txt row ${idx + 1} has invalid date format: ${cd.date}`);
      }

      if (cd.exception_type !== '1' && cd.exception_type !== '2') {
        warnings.push(`calendar_dates.txt row ${idx + 1} has unusual exception_type: ${cd.exception_type} (expected 1 or 2)`);
      }

      serviceIds.add(cd.service_id);
    }
  }

  const minServiceDate = minCalendarStartDate && minCalendarDatesDate
    ? (minCalendarStartDate < minCalendarDatesDate ? minCalendarStartDate : minCalendarDatesDate)
    : (minCalendarStartDate || minCalendarDatesDate || null);
  const maxServiceDate = maxCalendarEndDate && maxCalendarDatesDate
    ? (maxCalendarEndDate > maxCalendarDatesDate ? maxCalendarEndDate : maxCalendarDatesDate)
    : (maxCalendarEndDate || maxCalendarDatesDate || null);

  if (expiredServicesCount > 0 && activeServicesCount === 0) {
    calendarStatus = 'EXPIRED';
    const msg = `Service calendar is expired: all ${expiredServicesCount} services ended before reference date ${referenceDate}`;
    if (strictCalendar) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
    feedLevelBlockers.push(`FEED_EXPIRED_CALENDAR: All ${expiredServicesCount} calendar services expired before ${referenceDate}`);
  } else if (expiredServicesCount > 0) {
    warnings.push(`${expiredServicesCount} services in calendar are expired; ${activeServicesCount} remain active`);
  }

  if (distantCalendarServicesCount > 0) {
    feedLevelBlockers.push(`FEED_SUSPICIOUS_CALENDAR_EXPIRY: ${distantCalendarServicesCount} services specify distant placeholder end dates (>5 years in future)`);
  }

  // 6. Validate trips.txt & collect trip_ids
  const tripHeaders = tables.trips.headers;
  for (const col of ['route_id', 'service_id', 'trip_id']) {
    if (!tripHeaders.includes(col)) {
      errors.push(`trips.txt missing required column: ${col}`);
    }
  }

  const tripIds = new Set();
  const duplicateTripIds = new Set();
  let brokenRouteRefs = 0;
  let brokenServiceRefs = 0;

  for (let i = 0; i < tables.trips.rows.length; i++) {
    const t = tables.trips.rows[i];
    if (!t.trip_id) {
      errors.push(`trips.txt row ${i + 1} has empty trip_id`);
      continue;
    }
    if (tripIds.has(t.trip_id)) {
      duplicateTripIds.add(t.trip_id);
    }
    tripIds.add(t.trip_id);

    // Foreign key check: route_id in routes
    if (!routeIds.has(t.route_id)) {
      brokenRouteRefs++;
      rejectedRecords.push({ table: 'trips', id: t.trip_id, reason: `Unknown route_id: ${t.route_id}` });
    }

    // Foreign key check: service_id in calendar/calendar_dates
    if (!serviceIds.has(t.service_id)) {
      brokenServiceRefs++;
      rejectedRecords.push({ table: 'trips', id: t.trip_id, reason: `Unknown service_id: ${t.service_id}` });
    }
  }

  if (duplicateTripIds.size > 0) {
    errors.push(`trips.txt contains duplicate trip_ids: ${Array.from(duplicateTripIds).slice(0, 5).join(', ')}`);
  }
  if (brokenRouteRefs > 0) {
    errors.push(`trips.txt contains ${brokenRouteRefs} trips with broken route_id references`);
  }
  if (brokenServiceRefs > 0) {
    errors.push(`trips.txt contains ${brokenServiceRefs} trips with broken service_id references`);
  }

  // 7. Validate stop_times.txt & referential integrity
  const stopTimesHeaders = tables.stop_times.headers;
  for (const col of ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence']) {
    if (!stopTimesHeaders.includes(col)) {
      errors.push(`stop_times.txt missing required column: ${col}`);
    }
  }

  let brokenTripRefs = 0;
  let brokenStopRefs = 0;
  let invalidTimeCount = 0;
  let timeInversionCount = 0;
  let timeRegressionCount = 0;

  const tripStopsMap = new Map();

  for (let i = 0; i < tables.stop_times.rows.length; i++) {
    const st = tables.stop_times.rows[i];

    if (!tripStopsMap.has(st.trip_id)) {
      tripStopsMap.set(st.trip_id, []);
    }
    tripStopsMap.get(st.trip_id).push(st);

    // Foreign key check: trip_id in trips
    if (!tripIds.has(st.trip_id)) {
      brokenTripRefs++;
      if (brokenTripRefs <= 10) {
        rejectedRecords.push({ table: 'stop_times', id: `row_${i + 1}`, reason: `Unknown trip_id: ${st.trip_id}` });
      }
    }

    // Foreign key check: stop_id in stops
    if (!stopIds.has(st.stop_id)) {
      brokenStopRefs++;
      if (brokenStopRefs <= 10) {
        rejectedRecords.push({ table: 'stop_times', id: `row_${i + 1}`, reason: `Unknown stop_id: ${st.stop_id}` });
      }
    }

    // Validate times
    const validArr = validateGtfsTime(st.arrival_time);
    const validDep = validateGtfsTime(st.departure_time);
    if (!validArr || !validDep) {
      invalidTimeCount++;
      if (invalidTimeCount <= 10) {
        rejectedRecords.push({
          table: 'stop_times',
          id: `trip_${st.trip_id}_seq_${st.stop_sequence}`,
          reason: `Invalid time format: arr=${st.arrival_time}, dep=${st.departure_time}`
        });
      }
    }
  }

  // Analyze timing and quarantine trips
  const quarantinedTrips = [];
  let sourceValidTripsCount = 0;
  let singleStopTripsCount = 0;
  let midnightRolloverTripsCount = 0;

  for (const [tripId, stops] of tripStopsMap.entries()) {
    const analysis = analyzeTripTiming(stops);
    if (analysis.status === 'VALID_STANDARD' || analysis.status === 'VALID_EXTENDED_HOURS') {
      sourceValidTripsCount++;
    } else {
      quarantinedTrips.push({
        tripId,
        status: analysis.status,
        stopCount: stops.length,
        usableForRouting: false,
        normalizableWithoutAmbiguity: analysis.normalizable,
        ambiguous: analysis.ambiguous,
        issues: analysis.issues,
        normalizedDurationMinutes: analysis.normalizedDurationMinutes
      });

      if (analysis.status === 'INSUFFICIENT_STOPS') {
        singleStopTripsCount++;
      } else if (analysis.status === 'UNNORMALIZED_MIDNIGHT_ROLLOVER' || analysis.status === 'AMBIGUOUS_TIME_PROGRESSION') {
        midnightRolloverTripsCount++;
        for (const issue of analysis.issues) {
          if (issue.includes('Same-stop inversion')) timeInversionCount++;
          if (issue.includes('Progression regression')) timeRegressionCount++;
        }
      }
    }
  }

  if (singleStopTripsCount > 0) {
    feedLevelBlockers.push(`FEED_INCOMPLETE_SHUTTLE_TRIPS: ${singleStopTripsCount} trips have fewer than 2 stops and lack destination terminus`);
    warnings.push(`trips contain ${singleStopTripsCount} total single-stop trips unsuitable for journey planning`);
  }

  if (midnightRolloverTripsCount > 0) {
    feedLevelBlockers.push(`FEED_UNNORMALIZED_MIDNIGHT_ROLLOVER: ${midnightRolloverTripsCount} trips have unnormalized modulo-24 midnight wrap that breaks chronological traversal in raw source`);
  }

  if (timeInversionCount > 0) {
    warnings.push(`stop_times.txt contains ${timeInversionCount} total instances where arrival_time is after departure_time`);
  }
  if (timeRegressionCount > 0) {
    warnings.push(`stop_times.txt contains ${timeRegressionCount} total time progression regressions across stops (unnormalized midnight rollovers)`);
  }

  if (brokenTripRefs > 0) {
    errors.push(`stop_times.txt contains ${brokenTripRefs} rows with broken trip_id references`);
  }
  if (brokenStopRefs > 0) {
    errors.push(`stop_times.txt contains ${brokenStopRefs} rows with broken stop_id references`);
  }
  if (invalidTimeCount > 0) {
    errors.push(`stop_times.txt contains ${invalidTimeCount} rows with invalid time format`);
  }

  const isValid = errors.length === 0;
  const isReadyForRouting = isValid && calendarStatus === 'ACTIVE' && feedLevelBlockers.length === 0;

  return {
    valid: isValid,
    readyForJourneyRouting: isReadyForRouting,
    errors,
    warnings,
    feedLevelBlockers,
    quarantinedTrips,
    rejectedRecords,
    calendarStatus,
    stats: {
      recordCounts: {
        agencies: tables.agency?.rows.length || 0,
        routes: tables.routes?.rows.length || 0,
        stops: tables.stops?.rows.length || 0,
        trips: tables.trips?.rows.length || 0,
        stopTimes: tables.stop_times?.rows.length || 0,
        calendarServices: hasCalendar ? tables.calendar.rows.length : 0
      },
      serviceDates: {
        minServiceDate,
        maxServiceDate,
        calendarMinStart: minCalendarStartDate,
        calendarMaxEnd: maxCalendarEndDate,
        calendarDatesMin: minCalendarDatesDate,
        calendarDatesMax: maxCalendarDatesDate
      },
      duplicateCount: duplicateRouteIds.size + duplicateStopIds.size + duplicateTripIds.size,
      brokenReferencesCount: brokenRouteRefs + brokenServiceRefs + brokenTripRefs + brokenStopRefs,
      invalidCoordinatesCount: invalidCoordCount,
      corridorExceptionsCount,
      invalidTimeCount,
      timeInversionCount,
      timeRegressionCount,
      singleStopTripsCount,
      midnightRolloverTripsCount,
      distantCalendarServicesCount,
      sourceValidTripsCount,
      quarantinedTripsCount: quarantinedTrips.length,
      rejectedCount: rejectedRecords.length
    }
  };
}
