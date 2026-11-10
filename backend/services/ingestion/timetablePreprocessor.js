import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseGtfsDirectory } from './gtfsParser.js';
import { validateGtfsTime, timeStringToSeconds, secondsToTimeString } from './gtfsValidator.js';

/**
 * AccessRoute Suburban Rail Timetable Preprocessor (Phase 06)
 *
 * Deterministic, isolated preprocessing layer that safely transforms eligible
 * suburban rail GTFS records into a derived, auditable representation for
 * future routing-engine development, while keeping production journey routing disabled.
 *
 * Raw source data in data/suburban_rail/imported/ is treated as strictly immutable.
 * Derived output is written exclusively to data/suburban_rail/derived/.
 */

export const MAX_MIDNIGHT_DWELL_SECONDS = 900;    // 15 minutes max dwell across midnight
export const MAX_MIDNIGHT_HOP_SECONDS = 3600;     // 60 minutes max hop across midnight
export const MAX_DAYTIME_DWELL_SECONDS = 1800;    // 30 minutes max normal dwell
export const MAX_DAYTIME_HOP_SECONDS = 7200;      // 120 minutes max normal hop
export const MAX_TRIP_DURATION_SECONDS = 18000;   // 5 hours max scheduled suburban trip duration

export const RAW_SOURCE_CHECKSUMS = {
  'agency.txt': '2ef8f11ce5c52eb8b62e02f87fbdc6865d0af3a4538754aa862dd5fbec7c4751',
  'calendar.txt': 'decf74ac0a5f7a060a93708b84e2f5c33ceff985b47d3437de0c721abc388087',
  'calendar_dates.txt': 'fba0b31d3f38b24804169c5aab9e8596eeb4abb3888aadec87ac465dec492fdd',
  'feed_info.txt': 'e1e3415e38e8e9f8516fc4ed05b04fc280fd2dc973d46a6e94ea73d1e9781ca8',
  'pathways.txt': '9a12074f0a387cd454d6cf319701982e3c2de8b7c20c8d5da1c21d1de22cdf76',
  'routes.txt': '357bfa08dcf31a3cf0dfa4e65ab344ffcd730f9cfcaf18e024ba93e3290ffa64',
  'stops.txt': '29bc27abb8e1ce94e312ad46c2a151f62a4174a279a520aa2ed442fc54588459',
  'stop_times.txt': '3f5a6d5f3bf76494e69d7b7a19199a3f73f208cfd3a7b19406059ac4a3f93e09',
  'trips.txt': 'fc2f72954e8a024f56dda1cdc02669751435048c683bab5a62f6d857fc587bab'
};

/**
 * Evaluates and normalizes stop times for a single trip.
 *
 * Rules:
 * 1. Preserves valid standard times and valid extended-hour times (>= 24:00:00).
 * 2. Normalizes modulo-24 rollover ONLY when stop ordering, chronology, dwell times,
 *    hop durations, and total duration pass explicit validation.
 * 3. Never normalizes unrelated daytime regressions or ambiguous timestamps.
 * 4. Excludes trips with fewer than 2 stops (incomplete shuttle trips).
 * 5. Returns a detailed transformation audit for any modified trip.
 */
export function normalizeTripTimes(stops, options = {}) {
  if (!Array.isArray(stops) || stops.length < 2) {
    return {
      eligible: false,
      transformed: false,
      status: 'INSUFFICIENT_STOPS',
      reason: 'INSUFFICIENT_STOPS: Trip contains fewer than 2 stops and lacks terminus',
      normalizedStops: null,
      originalStops: stops || [],
      transformationAudit: null,
      durationMinutes: null
    };
  }

  // 1. Verify stop sequence ordering & time formatting
  let lastStopSeq = -1;
  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    const seq = parseInt(st.stop_sequence, 10);
    if (isNaN(seq) || (lastStopSeq !== -1 && seq <= lastStopSeq)) {
      return {
        eligible: false,
        transformed: false,
        status: 'AMBIGUOUS_TIME_PROGRESSION',
        reason: `SEQUENCE_DISORDER: Non-increasing stop_sequence at index ${i} (${st.stop_sequence} <= ${lastStopSeq})`,
        normalizedStops: null,
        originalStops: stops,
        transformationAudit: null,
        durationMinutes: null
      };
    }
    lastStopSeq = seq;

    if (!validateGtfsTime(st.arrival_time) || !validateGtfsTime(st.departure_time)) {
      return {
        eligible: false,
        transformed: false,
        status: 'INVALID_TIME_FORMAT',
        reason: `INVALID_TIME_FORMAT: Invalid time format at seq ${st.stop_sequence} (arr=${st.arrival_time}, dep=${st.departure_time})`,
        normalizedStops: null,
        originalStops: stops,
        transformationAudit: null,
        durationMinutes: null
      };
    }
  }

  // 2. Check if trip is already monotonic throughout
  let isCleanMonotonic = true;
  let rawPrevDepSec = -1;
  let isAlreadyExtended = false;

  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    const arrSec = timeStringToSeconds(st.arrival_time);
    const depSec = timeStringToSeconds(st.departure_time);

    if (arrSec >= 86400 || depSec >= 86400) {
      isAlreadyExtended = true;
    }

    if (arrSec > depSec) {
      isCleanMonotonic = false;
      break;
    }
    if (rawPrevDepSec !== -1 && arrSec < rawPrevDepSec) {
      isCleanMonotonic = false;
      break;
    }

    const dwell = depSec - arrSec;
    if (dwell > MAX_DAYTIME_DWELL_SECONDS) {
      isCleanMonotonic = false;
      break;
    }
    if (rawPrevDepSec !== -1) {
      const hop = arrSec - rawPrevDepSec;
      if (hop > MAX_DAYTIME_HOP_SECONDS) {
        isCleanMonotonic = false;
        break;
      }
    }
    rawPrevDepSec = depSec;
  }

  if (isCleanMonotonic) {
    const firstArr = timeStringToSeconds(stops[0].arrival_time);
    const lastDep = timeStringToSeconds(stops[stops.length - 1].departure_time);
    const duration = lastDep - firstArr;

    if (duration <= 0 || duration > MAX_TRIP_DURATION_SECONDS) {
      return {
        eligible: false,
        transformed: false,
        status: 'AMBIGUOUS_TIME_PROGRESSION',
        reason: `Scheduled duration ${duration}s is non-positive or exceeds maximum threshold (${MAX_TRIP_DURATION_SECONDS}s)`,
        normalizedStops: null,
        originalStops: stops,
        transformationAudit: null,
        durationMinutes: null
      };
    }

    return {
      eligible: true,
      transformed: false,
      status: isAlreadyExtended ? 'VALID_EXTENDED_HOURS' : 'VALID_STANDARD',
      reason: null,
      normalizedStops: stops.map(s => ({
        trip_id: s.trip_id,
        stop_id: s.stop_id,
        stop_sequence: s.stop_sequence,
        arrival_time: s.arrival_time,
        departure_time: s.departure_time
      })),
      originalStops: stops,
      transformationAudit: null,
      durationMinutes: Math.round(duration / 60)
    };
  }

  // 3. Attempt strict unambiguous midnight modulo-24 rollover normalization
  let rolledOver = false;
  let rolloverStopIndex = -1;
  let transformationType = null;
  let dwellOrHopSeconds = null;
  let normLastDepSec = -1;
  let ambiguous = false;
  let ambiguousReason = null;

  const normalizedStops = [];
  const stopsDiff = [];

  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    let arrSec = timeStringToSeconds(st.arrival_time);
    let depSec = timeStringToSeconds(st.departure_time);

    // Case A: Same-stop departure at midnight (e.g. arr 23:59:00, dep 00:00:00)
    if (arrSec > depSec) {
      if (!rolledOver && arrSec >= 79200 && st.departure_time.startsWith('00:')) {
        const dwellSec = (86400 + depSec) - arrSec;
        if (dwellSec >= 0 && dwellSec <= MAX_MIDNIGHT_DWELL_SECONDS) {
          rolledOver = true;
          rolloverStopIndex = i;
          transformationType = 'SAME_STOP_MIDNIGHT_INVERSION';
          dwellOrHopSeconds = dwellSec;
          depSec += 86400;
        } else {
          ambiguous = true;
          ambiguousReason = `Excessive midnight dwell duration: ${dwellSec}s > ${MAX_MIDNIGHT_DWELL_SECONDS}s at seq ${st.stop_sequence}`;
        }
      } else {
        ambiguous = true;
        ambiguousReason = `Unresolvable same-stop time inversion at seq ${st.stop_sequence} (${st.stop_id}): arr ${st.arrival_time} > dep ${st.departure_time}`;
      }
    } else if (rolledOver) {
      // All subsequent stops after rollover
      if (arrSec < 43200) arrSec += 86400;
      if (depSec < 43200) depSec += 86400;
    } else if (normLastDepSec !== -1 && arrSec < normLastDepSec) {
      // Case B: Inter-stop progression regression across midnight (e.g. prev dep 23:48:00, arr 00:00:00)
      if (!rolledOver && normLastDepSec >= 75600 && st.arrival_time.startsWith('00:')) {
        const hopSec = (arrSec + 86400) - normLastDepSec;
        if (hopSec >= 0 && hopSec <= MAX_MIDNIGHT_HOP_SECONDS) {
          rolledOver = true;
          rolloverStopIndex = i;
          transformationType = 'INTER_STOP_MIDNIGHT_REGRESSION';
          dwellOrHopSeconds = hopSec;
          arrSec += 86400;
          depSec += 86400;
        } else {
          ambiguous = true;
          ambiguousReason = `Excessive midnight hop duration: ${hopSec}s > ${MAX_MIDNIGHT_HOP_SECONDS}s at seq ${st.stop_sequence}`;
        }
      } else {
        ambiguous = true;
        ambiguousReason = `Unresolvable daytime progression regression at seq ${st.stop_sequence} (${st.stop_id}): arr ${st.arrival_time} < prev dep (${normLastDepSec}s)`;
      }
    }

    // Verify post-adjustment chronology
    if (arrSec > depSec) {
      ambiguous = true;
      ambiguousReason = ambiguousReason || `Post-adjustment same-stop inversion at seq ${st.stop_sequence}`;
    }
    if (normLastDepSec !== -1 && arrSec < normLastDepSec) {
      ambiguous = true;
      ambiguousReason = ambiguousReason || `Post-adjustment progression regression at seq ${st.stop_sequence}`;
    }

    // Verify dwell & hop limits
    const dwell = depSec - arrSec;
    if (dwell < 0 || dwell > MAX_DAYTIME_DWELL_SECONDS) {
      ambiguous = true;
      ambiguousReason = ambiguousReason || `Dwell duration ${dwell}s out of plausible range [0, ${MAX_DAYTIME_DWELL_SECONDS}] at seq ${st.stop_sequence}`;
    }
    if (normLastDepSec !== -1) {
      const hop = arrSec - normLastDepSec;
      if (hop < 0 || hop > MAX_DAYTIME_HOP_SECONDS) {
        ambiguous = true;
        ambiguousReason = ambiguousReason || `Hop duration ${hop}s out of plausible range [0, ${MAX_DAYTIME_HOP_SECONDS}] at seq ${st.stop_sequence}`;
      }
    }

    normLastDepSec = depSec;

    const normArrStr = secondsToTimeString(arrSec);
    const normDepStr = secondsToTimeString(depSec);

    if (normArrStr !== st.arrival_time || normDepStr !== st.departure_time) {
      stopsDiff.push({
        stop_sequence: st.stop_sequence,
        stop_id: st.stop_id,
        raw_arrival_time: st.arrival_time,
        normalized_arrival_time: normArrStr,
        raw_departure_time: st.departure_time,
        normalized_departure_time: normDepStr,
        offset_seconds: 86400
      });
    }

    normalizedStops.push({
      trip_id: st.trip_id,
      stop_id: st.stop_id,
      stop_sequence: st.stop_sequence,
      arrival_time: normArrStr,
      departure_time: normDepStr
    });
  }

  if (!rolledOver) {
    return {
      eligible: false,
      transformed: false,
      status: 'AMBIGUOUS_TIME_PROGRESSION',
      reason: ambiguousReason || 'Unresolvable time progression anomaly outside midnight rollover',
      normalizedStops: null,
      originalStops: stops,
      transformationAudit: null,
      durationMinutes: null
    };
  }

  const firstArrSec = timeStringToSeconds(normalizedStops[0].arrival_time);
  const totalDurationSec = normLastDepSec - firstArrSec;

  if (totalDurationSec <= 0 || totalDurationSec > MAX_TRIP_DURATION_SECONDS) {
    return {
      eligible: false,
      transformed: false,
      status: 'AMBIGUOUS_TIME_PROGRESSION',
      reason: `Total normalized duration ${totalDurationSec}s out of plausible range (0, ${MAX_TRIP_DURATION_SECONDS}]`,
      normalizedStops: null,
      originalStops: stops,
      transformationAudit: null,
      durationMinutes: null
    };
  }

  if (ambiguous) {
    return {
      eligible: false,
      transformed: false,
      status: 'AMBIGUOUS_TIME_PROGRESSION',
      reason: ambiguousReason,
      normalizedStops: null,
      originalStops: stops,
      transformationAudit: null,
      durationMinutes: null
    };
  }

  const transformationAudit = {
    tripId: stops[0].trip_id,
    transformationType,
    rolloverStopSequence: stops[rolloverStopIndex]?.stop_sequence,
    rolloverStopId: stops[rolloverStopIndex]?.stop_id,
    dwellOrHopSeconds,
    totalStopsCount: stops.length,
    transformedStopsCount: stopsDiff.length,
    durationMinutes: Math.round(totalDurationSec / 60),
    firstDeparture: normalizedStops[0].departure_time,
    lastArrival: normalizedStops[normalizedStops.length - 1].arrival_time,
    stopsDiff
  };

  return {
    eligible: true,
    transformed: true,
    status: 'NORMALIZED_MIDNIGHT_ROLLOVER',
    reason: null,
    normalizedStops,
    originalStops: stops,
    transformationAudit,
    durationMinutes: transformationAudit.durationMinutes
  };
}

/**
 * Executes the suburban rail timetable preprocessing pipeline.
 */
export function preprocessSuburbanRailFeed(sourceDir, outputDir, options = {}) {
  const src = path.resolve(sourceDir || 'data/suburban_rail/imported');
  const dest = path.resolve(outputDir || 'data/suburban_rail/derived');
  const timestamp = options.preprocessingTimestamp || '2026-10-27T12:00:00.000Z';
  const preprocessorVersion = options.preprocessorVersion || '1.0.0';

  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  // 1. Verify source immutability against checksums
  const currentChecksums = {};
  for (const [fileName, expectedHash] of Object.entries(RAW_SOURCE_CHECKSUMS)) {
    const fPath = path.join(src, fileName);
    if (!fs.existsSync(fPath)) {
      throw new Error(`Mandatory raw source file missing from imported directory: ${fileName}`);
    }
    const buf = fs.readFileSync(fPath);
    const actualHash = crypto.createHash('sha256').update(buf).digest('hex');
    if (actualHash !== expectedHash) {
      throw new Error(`SOURCE INTEGRITY VIOLATION: Checksum mismatch on ${fileName}! Expected ${expectedHash}, got ${actualHash}`);
    }
    currentChecksums[fileName] = {
      bytes: buf.length,
      sha256: actualHash
    };
  }

  // 2. Parse feed from immutable source
  const parsedFeed = parseGtfsDirectory(src);

  // 3. Group stop_times by trip_id
  const tripStopsMap = new Map();
  for (const st of parsedFeed.tables.stop_times.rows) {
    if (!tripStopsMap.has(st.trip_id)) {
      tripStopsMap.set(st.trip_id, []);
    }
    tripStopsMap.get(st.trip_id).push(st);
  }

  // 4. Index trips metadata
  const tripsMetaMap = new Map();
  for (const t of parsedFeed.tables.trips.rows) {
    tripsMetaMap.set(t.trip_id, t);
  }

  // 5. Run normalization across all trips
  const derivedTrips = [];
  const derivedStopTimes = [];
  const excludedTrips = [];
  const transformationsAudit = [];

  let unmodifiedTripsCount = 0;
  let normalizedTripsCount = 0;
  let excludedStopTimesCount = 0;

  // Process trips in stable sorted order by trip_id
  const sortedTripIds = Array.from(tripsMetaMap.keys()).sort();

  for (const tripId of sortedTripIds) {
    const tripMeta = tripsMetaMap.get(tripId);
    const stops = tripStopsMap.get(tripId) || [];

    const normResult = normalizeTripTimes(stops, options);

    if (normResult.eligible) {
      derivedTrips.push(tripMeta);
      for (const st of normResult.normalizedStops) {
        derivedStopTimes.push(st);
      }

      if (normResult.transformed) {
        normalizedTripsCount++;
        transformationsAudit.push({
          ...normResult.transformationAudit,
          routeId: tripMeta.route_id,
          tripHeadsign: tripMeta.trip_headsign
        });
      } else {
        unmodifiedTripsCount++;
      }
    } else {
      excludedStopTimesCount += stops.length;
      excludedTrips.push({
        tripId,
        routeId: tripMeta.route_id,
        tripHeadsign: tripMeta.trip_headsign,
        stopCount: stops.length,
        status: normResult.status,
        reason: normResult.reason,
        normalizableWithoutAmbiguity: false
      });
    }
  }

  // 6. Referential integrity check on derived dataset
  const derivedTripIds = new Set(derivedTrips.map(t => t.trip_id));
  const derivedRouteIds = new Set(derivedTrips.map(t => t.route_id));

  // In GTFS, stops.txt contains parent stations (MSB, TBM), platform stops (MSB_P_4),
  // and pathway interchange nodes. We preserve all stops to maintain 100% integrity
  // for pathways.txt (2,076 links) and curated station catalogue reconciliation.
  const derivedStops = parsedFeed.tables.stops.rows;
  const derivedRoutes = parsedFeed.tables.routes.rows;

  // Sort derived tables deterministically
  derivedTrips.sort((a, b) => a.trip_id.localeCompare(b.trip_id));
  derivedStopTimes.sort((a, b) => {
    const tripCmp = a.trip_id.localeCompare(b.trip_id);
    if (tripCmp !== 0) return tripCmp;
    return parseInt(a.stop_sequence, 10) - parseInt(b.stop_sequence, 10);
  });
  derivedRoutes.sort((a, b) => a.route_id.localeCompare(b.route_id));
  derivedStops.sort((a, b) => a.stop_id.localeCompare(b.stop_id));

  // 7. Format CSV strings (using standard LF)
  const tripsCsv = 'route_id,service_id,trip_id,trip_headsign\n' +
    derivedTrips.map(t => `${t.route_id},${t.service_id},${t.trip_id},${t.trip_headsign || ''}`).join('\n') + '\n';

  const stopTimesCsv = 'trip_id,stop_id,stop_sequence,arrival_time,departure_time\n' +
    derivedStopTimes.map(st => `${st.trip_id},${st.stop_id},${st.stop_sequence},${st.arrival_time},${st.departure_time}`).join('\n') + '\n';

  const routesCsv = 'route_id,agency_id,route_short_name,route_long_name,route_type,route_color,route_text_color\n' +
    derivedRoutes.map(r => `${r.route_id},${r.agency_id || ''},${r.route_short_name || ''},${r.route_long_name || ''},${r.route_type},${r.route_color || ''},${r.route_text_color || ''}`).join('\n') + '\n';

  const stopsCsv = 'stop_id,stop_code,stop_name,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,platform_code,wheelchair_boarding\n' +
    derivedStops.map(s => `${s.stop_id},${s.stop_code || ''},${s.stop_name || ''},${s.stop_lat},${s.stop_lon},${s.zone_id || ''},${s.stop_url || ''},${s.location_type || ''},${s.parent_station || ''},${s.platform_code || ''},${s.wheelchair_boarding || ''}`).join('\n') + '\n';

  // Compute deterministic hash of derived GTFS tables
  const derivedHasher = crypto.createHash('sha256');
  derivedHasher.update(tripsCsv);
  derivedHasher.update(stopTimesCsv);
  derivedHasher.update(routesCsv);
  derivedHasher.update(stopsCsv);
  const deterministicContentHash = derivedHasher.digest('hex');

  // 8. Build derived manifest
  const derivedManifest = {
    manifestVersion: '1.2.0-derived-experimental',
    artifactType: 'isolated_suburban_rail_derived_timetable',
    status: 'EXPERIMENTAL_DERIVED_REPRESENTATION',
    readyForJourneyRouting: false,
    operationalVerification: 'UNVERIFIED_HISTORICAL',
    licenseNotice: 'UNCONFIRMED',
    statementOfPurpose: 'Deterministic derived timetable representation for offline routing-engine research and development. Strictly disabled from passenger-facing journey routing.',
    sourceMetadata: {
      sourceDirectory: 'data/suburban_rail/imported',
      sourceCommit: 'af0742dba777f9657ed6fda2046d6c2a721d630b',
      sourceRelease: 'v0.2.0',
      sourceChecksums: currentChecksums
    },
    preprocessingMetadata: {
      preprocessorVersion,
      preprocessingTimestamp: timestamp,
      deterministic: true,
      deterministicContentHash
    },
    counts: {
      totalSourceTrips: sortedTripIds.length,
      eligibleDerivedTrips: derivedTrips.length,
      sourceValidUnmodifiedTrips: unmodifiedTripsCount,
      normalizedRolloverTrips: normalizedTripsCount,
      excludedTrips: excludedTrips.length,
      quarantinedTrips: excludedTrips.length,
      totalSourceStopTimes: parsedFeed.tables.stop_times.rows.length,
      totalDerivedStopTimes: derivedStopTimes.length,
      excludedStopTimes: excludedStopTimesCount,
      activeRoutesCount: derivedRouteIds.size,
      totalRoutesCount: derivedRoutes.length,
      totalStopsCount: derivedStops.length
    },
    activeBlockers: [
      'ROUTING_DISABLED: Derived representation is strictly isolated from production journey routing and map engines',
      'FEED_SUSPICIOUS_CALENDAR_EXPIRY: 5 services specify distant placeholder end dates (21700820)',
      'FEED_UNCONFIRMED_DATA_LICENSE: Underlying Southern Railway timetable data redistribution rights are UNCONFIRMED',
      'FEED_MISSING_EXTENSION_TIMETABLES: Stations PRTK and ADMB lack commercial schedules in this snapshot',
      'UNVERIFIED_OPERATIONAL_CURRENCY: Southern Railway operational schedule revisions and engineering blocks unverified',
      'EXCLUDED_SHUTTLE_SERVICES: 4 single-stop shuttle trips (43551_T1, 43552_T1, 43553_T1, 43554_T1) excluded due to missing terminus'
    ],
    excludedTripsAudit: excludedTrips,
    transformationsSummary: {
      totalTransformedTrips: transformationsAudit.length,
      sameStopInversionsCount: transformationsAudit.filter(t => t.transformationType === 'SAME_STOP_MIDNIGHT_INVERSION').length,
      interStopRegressionsCount: transformationsAudit.filter(t => t.transformationType === 'INTER_STOP_MIDNIGHT_REGRESSION').length,
      totalStopTimesModified: transformationsAudit.reduce((acc, t) => acc + t.transformedStopsCount, 0),
      transformedTripIds: transformationsAudit.map(t => t.tripId)
    }
  };

  // 9. Write derived output files
  fs.mkdirSync(dest, { recursive: true });

  // Notice document
  const noticeMd = `# AccessRoute — Experimental Derived Suburban Rail Timetable Notice

> [!WARNING]
> **EXPERIMENTAL ARTIFACT — NOT OPERATIONALLY VERIFIED — PRODUCTION ROUTING DISABLED**
> 
> This directory contains a deterministic, derived representation of the Southern Railway Suburban and MRTS timetable, produced by the Phase 06 preprocessor.
>
> - **Operational Currency**: \`UNVERIFIED_HISTORICAL\` (Schedules from October 2026 snapshot with placeholder calendar end dates \`21700820\`).
> - **Redistribution Rights**: \`UNCONFIRMED\` (Underlying Indian Railways passenger schedule data redistribution rights unconfirmed).
> - **Production Readiness**: \`readyForJourneyRouting: false\` (Strictly disabled).
> - **Eligible Trips**: 759 trips (740 unmodified daytime schedules + 19 safely normalized midnight rollover trips).
> - **Excluded Trips**: 4 incomplete shuttle trips (\`43551_T1\`, \`43552_T1\`, \`43553_T1\`, \`43554_T1\`) lacking terminus stations.
> - **Usage Boundaries**: This artifact is intended EXCLUSIVELY for offline routing-engine algorithm development, test fixtures, and network graph research. It MUST NOT be presented to passengers, journey planners, or map UIs as a live/current timetable.

---
**Preprocessor Version**: ${preprocessorVersion}  
**Deterministic Content Hash (SHA-256)**: \`${deterministicContentHash}\`  
**Preprocessing Timestamp**: \`${timestamp}\`  
`;

  fs.writeFileSync(path.join(dest, 'DERIVED_DATA_NOTICE.md'), noticeMd, 'utf8');
  fs.writeFileSync(path.join(dest, 'derived_manifest.json'), JSON.stringify(derivedManifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(dest, 'transformation_audit.json'), JSON.stringify(transformationsAudit, null, 2), 'utf8');

  // Write normalized GTFS tables
  fs.writeFileSync(path.join(dest, 'trips.txt'), tripsCsv, 'utf8');
  fs.writeFileSync(path.join(dest, 'stop_times.txt'), stopTimesCsv, 'utf8');
  fs.writeFileSync(path.join(dest, 'routes.txt'), routesCsv, 'utf8');
  fs.writeFileSync(path.join(dest, 'stops.txt'), stopsCsv, 'utf8');

  // Copy non-trip ancillary GTFS tables verbatim from immutable source
  for (const staticFile of ['agency.txt', 'calendar.txt', 'calendar_dates.txt', 'feed_info.txt', 'pathways.txt']) {
    const srcFile = path.join(src, staticFile);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(dest, staticFile));
    }
  }

  return {
    success: true,
    sourceDirectory: src,
    derivedDirectory: dest,
    readyForJourneyRouting: false,
    counts: derivedManifest.counts,
    deterministicContentHash,
    manifest: derivedManifest,
    transformationsAudit,
    excludedTrips
  };
}

// CLI runner
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('timetablePreprocessor.js')) {
  try {
    console.log('\n======================================================');
    console.log('🚆 AccessRoute Suburban Rail Timetable Preprocessor');
    console.log('======================================================\n');
    const result = preprocessSuburbanRailFeed();
    console.log('✅ Preprocessing completed successfully!');
    console.log(`📁 Source: ${result.sourceDirectory}`);
    console.log(`📁 Derived: ${result.derivedDirectory}`);
    console.log(`📊 Total Source Trips: ${result.counts.totalSourceTrips}`);
    console.log(`  ├── Eligible Derived Trips: ${result.counts.eligibleDerivedTrips}`);
    console.log(`  │   ├── Unmodified Valid Trips: ${result.counts.sourceValidUnmodifiedTrips}`);
    console.log(`  │   └── Normalized Rollover Trips: ${result.counts.normalizedRolloverTrips}`);
    console.log(`  └── Excluded Trips (Quarantined): ${result.counts.excludedTrips}`);
    console.log(`🕒 Total Stop Times: ${result.counts.totalDerivedStopTimes} (Excluded: ${result.counts.excludedStopTimes})`);
    console.log(`🔒 readyForJourneyRouting: ${result.readyForJourneyRouting}`);
    console.log(`🔑 Content Hash: ${result.deterministicContentHash}\n`);
  } catch (err) {
    console.error('❌ Preprocessor failed:', err.message);
    process.exit(1);
  }
}
