import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { parseCsvLine, parseCsvString, parseGtfsDirectory } from '../services/ingestion/gtfsParser.js';
import { validateGtfsFeed, validateGtfsTime, validateGtfsDate, analyzeTripTiming, reconcileCuratedCatalogue } from '../services/ingestion/gtfsValidator.js';
import { runIngestion, ALLOWED_MODES } from '../services/ingestion/transitIngestionPipeline.js';
import {
  normalizeTripTimes,
  preprocessSuburbanRailFeed,
  RAW_SOURCE_CHECKSUMS,
  MAX_MIDNIGHT_DWELL_SECONDS,
  MAX_MIDNIGHT_HOP_SECONDS
} from '../services/ingestion/timetablePreprocessor.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting AccessRoute Transit Ingestion Test Suite');
  console.log('======================================================\n');

  const fixturesDir = path.resolve(process.cwd(), 'backend', 'tests', 'fixtures', 'gtfs');

  // Suite 1: GTFS CSV Line & String Parsing
  console.log('--- Suite 1: CSV Parser Edge Cases ---');
  const simpleLine = parseCsvLine('a,b,c');
  assert(simpleLine.length === 3 && simpleLine[0] === 'a' && simpleLine[2] === 'c', 'Parses simple comma separated values');

  const quotedLine = parseCsvLine('"Chennai Central, MAS",13.0827,"""Express"" Platform"');
  assert(quotedLine[0] === 'Chennai Central, MAS', 'Preserves commas within double quotes');
  assert(quotedLine[2] === '"Express" Platform', 'Handles RFC 4180 escaped double quotes');

  const backslashLine = parseCsvLine('"Station",12.98,"\\"AC\\" Coach"');
  assert(backslashLine[2] === '"AC" Coach', 'Handles backslash-escaped quotes');

  const csvString = parseCsvString('col1,col2\nval1,val2\r\nval3,val4');
  assert(csvString.headers.length === 2 && csvString.rows.length === 2, 'Parses multi-line CSV with mixed line endings');
  assert(csvString.rows[0].col1 === 'val1' && csvString.rows[1].col2 === 'val4', 'Extracts structured rows matching headers');

  // Suite 2: GTFS Time and Date Format Validation
  console.log('\n--- Suite 2: GTFS Time & Date Validation ---');
  assert(validateGtfsTime('06:30:00'), 'Accepts standard morning time 06:30:00');
  assert(validateGtfsTime('24:15:00'), 'Accepts GTFS post-midnight overnight time 24:15:00');
  assert(validateGtfsTime('28:45:00'), 'Accepts GTFS overnight time up to 48 hours');
  assert(!validateGtfsTime('25:61:00'), 'Rejects invalid minutes (> 59)');
  assert(!validateGtfsTime('invalid_time'), 'Rejects non-numeric time strings');
  assert(!validateGtfsTime(''), 'Rejects empty time string');

  assert(validateGtfsDate('20261026'), 'Accepts valid YYYYMMDD date 20261026');
  assert(!validateGtfsDate('20261301'), 'Rejects invalid month 13');
  assert(!validateGtfsDate('20261035'), 'Rejects invalid day 35');
  assert(!validateGtfsDate('2026-10-26'), 'Rejects hyphenated date format in GTFS field');

  // Suite 3: Ingestion of Valid GTFS Feed Fixture
  console.log('\n--- Suite 3: Valid GTFS Feed Ingestion ---');
  const validDir = path.join(fixturesDir, 'valid_feed');
  const validParsed = parseGtfsDirectory(validDir);
  assert(validParsed.foundFiles.length >= 6, 'Detects all standard GTFS files in valid feed');

  const validResult = runIngestion(validDir, {
    mode: 'chennai_metro',
    sourceUrl: 'https://chennaimetrorail.org/test_gtfs',
    publisher: 'CMRL Official Test Feed',
    license: 'ODbL'
  });

  assert(validResult.success === true, 'Valid feed passes ingestion pipeline');
  assert(validResult.manifest.status === 'VALIDATED', 'Manifest status is VALIDATED');
  assert(validResult.manifest.readyForJourneyRouting === true, 'Valid feed with active calendar marked ready for routing');
  assert(validResult.manifest.recordCounts.stops === 3, 'Accurately counts 3 stops');
  assert(validResult.manifest.recordCounts.trips === 2, 'Accurately counts 2 trips');
  assert(validResult.manifest.recordCounts.stopTimes === 6, 'Accurately counts 6 stop_times');
  assert(validResult.validation.errors.length === 0, 'Zero validation errors on valid feed');

  // Suite 4: Missing Required Files Detection
  console.log('\n--- Suite 4: Missing Required Files Detection ---');
  const missingDir = path.join(fixturesDir, 'missing_files_feed');
  const missingResult = runIngestion(missingDir, { mode: 'chennai_metro' });

  assert(missingResult.success === false, 'Rejects feed missing required files');
  assert(missingResult.validation.errors.some(e => e.includes('trips.txt')), 'Detects missing trips.txt');
  assert(missingResult.validation.errors.some(e => e.includes('stop_times.txt')), 'Detects missing stop_times.txt');
  assert(missingResult.validation.errors.some(e => e.includes('calendar')), 'Detects missing service calendar');

  // Suite 5: Broken Referential Integrity Detection
  console.log('\n--- Suite 5: Referential Integrity & Broken References ---');
  const brokenDir = path.join(fixturesDir, 'broken_references_feed');
  const brokenResult = runIngestion(brokenDir, { mode: 'suburban_rail' });

  assert(brokenResult.success === false, 'Rejects feed with broken foreign key references');
  assert(brokenResult.manifest.brokenReferencesCount > 0, `Identified ${brokenResult.manifest.brokenReferencesCount} broken references`);
  assert(brokenResult.validation.errors.some(e => e.includes('broken route_id references')), 'Flags broken route_id in trips');
  assert(brokenResult.validation.errors.some(e => e.includes('broken trip_id references')), 'Flags broken trip_id in stop_times');
  assert(brokenResult.validation.errors.some(e => e.includes('broken stop_id references')), 'Flags broken stop_id in stop_times');

  // Suite 6: Invalid & Out-of-Bounds Coordinates Detection
  console.log('\n--- Suite 6: Coordinate Validation & Geographic Bounds ---');
  const coordDir = path.join(fixturesDir, 'invalid_coordinates_feed');
  const coordResult = runIngestion(coordDir, { mode: 'mtc_bus' });

  assert(coordResult.success === false, 'Rejects feed with out-of-bounds coordinates');
  assert(coordResult.manifest.rejectionsCount >= 2, `Records ${coordResult.manifest.rejectionsCount} rejected records`);
  assert(coordResult.validation.errors.some(e => e.includes('out-of-bounds coordinates')), 'Flags out-of-bounds London stop and NaN stop');

  // Suite 7: Expired Service Calendar Detection (e.g. CMRL 2021)
  console.log('\n--- Suite 7: Expired Service Calendar Detection ---');
  const expiredDir = path.join(fixturesDir, 'expired_calendar_feed');
  
  // Strict mode: calendar expiry is a blocking error
  const expiredStrict = runIngestion(expiredDir, {
    mode: 'chennai_metro',
    referenceDate: '20261026',
    strictCalendar: true
  });
  assert(expiredStrict.success === false, 'Strict calendar mode rejects expired 2021 feed');
  assert(expiredStrict.manifest.calendarStatus === 'EXPIRED', 'Manifest calendarStatus is EXPIRED');
  assert(expiredStrict.manifest.readyForJourneyRouting === false, 'Expired feed flagged not ready for journey routing');

  // Non-strict mode: calendar expiry is recorded as warning and manifest reflects status
  const expiredPermissive = runIngestion(expiredDir, {
    mode: 'chennai_metro',
    referenceDate: '20261026',
    strictCalendar: false
  });
  assert(expiredPermissive.manifest.calendarStatus === 'EXPIRED', 'Non-strict mode flags calendarStatus as EXPIRED');
  assert(expiredPermissive.manifest.warnings.some(w => w.includes('expired')), 'Logs detailed warning about expired service dates');

  // Suite 8: Duplicate Identifier Detection
  console.log('\n--- Suite 8: Duplicate Identifiers Detection ---');
  const dupDir = path.join(fixturesDir, 'duplicate_ids_feed');
  const dupResult = runIngestion(dupDir, { mode: 'suburban_rail' });

  assert(dupResult.success === false, 'Rejects feed with duplicate identifiers');
  assert(dupResult.validation.errors.some(e => e.includes('duplicate stop_ids')), 'Flags duplicate stop_ids');
  assert(dupResult.validation.errors.some(e => e.includes('duplicate trip_ids')), 'Flags duplicate trip_ids');
  assert(dupResult.validation.errors.some(e => e.includes('duplicate route_ids')), 'Flags duplicate route_ids');

  // Suite 9: Transport Mode Isolation & Manifest Generation
  console.log('\n--- Suite 9: Transport Mode Isolation & Manifest Generation ---');
  let modeErrorThrown = false;
  try {
    runIngestion(validDir, { mode: 'invalid_mode_fusion' });
  } catch (err) {
    modeErrorThrown = true;
    assert(err.message.includes('Mode is mandatory'), 'Rejects unapproved mode name to prevent data pollution');
  }
  assert(modeErrorThrown, 'Enforces strict mode whitelist (chennai_metro, suburban_rail, mtc_bus, express_rail)');

  // Test output manifest writing
  const tempOutputDir = path.join(fixturesDir, 'output_test');
  const outputResult = runIngestion(validDir, {
    mode: 'chennai_metro',
    sourceUrl: 'https://chennaimetrorail.org',
    publisher: 'CMRL Official',
    license: 'Government Open Data',
    retrievalDate: '2026-10-26',
    outputDir: tempOutputDir
  });

  const manifestPath = path.join(tempOutputDir, 'ingestion_manifest.json');
  assert(fs.existsSync(manifestPath), 'Generates immutable ingestion_manifest.json on disk');
  const writtenManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(writtenManifest.mode === 'chennai_metro', 'Manifest preserves mode specification');
  assert(writtenManifest.provenance.publisher === 'CMRL Official', 'Manifest preserves source publisher');
  assert(writtenManifest.provenance.license === 'Government Open Data', 'Manifest preserves license metadata');

  // Clean up test output manifest
  fs.rmSync(tempOutputDir, { recursive: true, force: true });

  console.log('\n--- Suite 10: Southern Railway Real GTFS Import & Quality Validation ---');
  const srrImportedDir = path.resolve('data/suburban_rail/imported');
  const srrManifestPath = path.join(srrImportedDir, 'ingestion_manifest.json');
  assert(fs.existsSync(srrManifestPath), 'Suburban Rail imported manifest exists on disk');

  const srrManifest = JSON.parse(fs.readFileSync(srrManifestPath, 'utf8'));
  assert(srrManifest.mode === 'suburban_rail', 'Suburban Rail mode strictly isolated');
  assert(srrManifest.status === 'VALIDATED_WITH_WARNINGS', 'Status is VALIDATED_WITH_WARNINGS due to quality anomalies');
  assert(srrManifest.readyForJourneyRouting === false, 'Safely flagged NOT ready for production journey routing until normalized');
  assert(srrManifest.recordCounts.routes === 763, 'Captures exactly 763 suburban train routes');
  assert(srrManifest.recordCounts.trips === 763, 'Captures exactly 763 suburban trips');
  assert(srrManifest.recordCounts.stops === 708, 'Captures 708 parent/platform stops and boarding points');
  assert(srrManifest.recordCounts.stopTimes === 16135, 'Captures exactly 16,135 scheduled stop times');
  assert(srrManifest.brokenReferencesCount === 0, 'Zero broken referential foreign keys across all 16,135 stop_times');
  assert(srrManifest.duplicateCount === 0, 'Zero duplicate identifiers across routes, stops, and trips');
  assert(srrManifest.anomalies.singleStopTripsCount === 4, 'Correctly flags 4 single-stop shuttle trips');
  assert(srrManifest.anomalies.timeInversionsCount === 4, 'Flags 4 same-stop midnight modulo-24 time inversions');
  assert(srrManifest.anomalies.timeRegressionsCount === 15, 'Flags 15 inter-stop time progression regressions across midnight');
  assert(srrManifest.anomalies.distantCalendarServicesCount === 5, 'Flags 5 services with distant placeholder end dates (21700820)');
  assert(srrManifest.provenance.timetableValidityRange.calendarStartDate === '20250806', 'Recalculates exact minimum service date 20250806 from calendar.txt');
  assert(srrManifest.provenance.timetableValidityRange.calendarEndDate === '21700820', 'Recalculates exact maximum service date 21700820 from calendar.txt, resolving feed_info 21700822 discrepancy');

  // Verify separation: Curated station catalogue remains intact
  const curatedStationsPath = path.resolve('data/suburban_rail/verified_stations.json');
  assert(fs.existsSync(curatedStationsPath), 'Curated suburban station catalogue is preserved');
  const curatedStations = JSON.parse(fs.readFileSync(curatedStationsPath, 'utf8'));
  assert(Array.isArray(curatedStations.stations) && curatedStations.stations.length === 70, 'Curated catalogue maintains 70 verified stations');

  // Suite 11: Extended-Hours GTFS Times
  console.log('\n--- Suite 11: Extended-Hours GTFS Times (>=24h Format) ---');
  const extFeedDir = path.join(fixturesDir, 'extended_hours_feed');
  const extResult = runIngestion(extFeedDir, {
    mode: 'chennai_metro',
    license: 'Government Open Data'
  });
  assert(extResult.success === true, 'Extended-hours feed validates cleanly');
  assert(extResult.manifest.status === 'VALIDATED', 'Status is VALIDATED for extended-hours feed');
  assert(extResult.manifest.readyForJourneyRouting === true, 'Extended-hours feed is ready for journey routing');
  assert(extResult.validation.quarantinedTrips.length === 0, 'Zero quarantined trips in extended-hours feed');
  assert(extResult.validation.feedLevelBlockers.length === 0, 'Zero feed-level blockers for valid extended-hours feed');

  // Suite 12: Midnight Rollover Modulo-24 Anomalies & Normalization Analysis
  console.log('\n--- Suite 12: Midnight Rollover Modulo-24 & Normalization Analysis ---');
  const rollFeedDir = path.join(fixturesDir, 'midnight_rollover_feed');
  const rollResult = runIngestion(rollFeedDir, {
    mode: 'chennai_metro',
    license: 'Government Open Data'
  });
  assert(rollResult.success === true, 'Modulo-24 feed parses without structural fatal errors');
  assert(rollResult.manifest.readyForJourneyRouting === false, 'Blocked from routing due to unnormalized midnight rollovers');
  assert(rollResult.validation.quarantinedTrips.length === 2, 'Quarantines both rollover trips (progression regression & same-stop inversion)');
  assert(rollResult.validation.quarantinedTrips[0].normalizableWithoutAmbiguity === true, 'First rollover trip is normalizable without ambiguity');
  assert(rollResult.validation.quarantinedTrips[1].normalizableWithoutAmbiguity === true, 'Same-stop inversion trip is normalizable without ambiguity');
  assert(rollResult.validation.feedLevelBlockers.some(b => b.includes('FEED_UNNORMALIZED_MIDNIGHT_ROLLOVER')), 'Feed-level blocker recorded for midnight rollovers');

  // Edge Case 1: Sequence disorder (e.g. seq 1, 3, 2)
  const disorderedSeqAnalysis = analyzeTripTiming([
    { stop_sequence: 1, stop_id: 'S1', arrival_time: '08:00:00', departure_time: '08:00:00' },
    { stop_sequence: 3, stop_id: 'S3', arrival_time: '08:15:00', departure_time: '08:15:00' },
    { stop_sequence: 2, stop_id: 'S2', arrival_time: '08:30:00', departure_time: '08:30:00' }
  ]);
  assert(disorderedSeqAnalysis.ambiguous === true && disorderedSeqAnalysis.normalizable === false, 'Rejects disordered stop sequence as ambiguous and non-normalizable');

  // Edge Case 2: Unrelated daytime regression (14:30 -> 14:15)
  const daylightRegAnalysis = analyzeTripTiming([
    { stop_sequence: 1, stop_id: 'S1', arrival_time: '14:00:00', departure_time: '14:00:00' },
    { stop_sequence: 2, stop_id: 'S2', arrival_time: '14:30:00', departure_time: '14:30:00' },
    { stop_sequence: 3, stop_id: 'S3', arrival_time: '14:15:00', departure_time: '14:15:00' }
  ]);
  assert(daylightRegAnalysis.ambiguous === true && daylightRegAnalysis.normalizable === false, 'Rejects unrelated daytime regression as ambiguous and non-normalizable');

  // Edge Case 3: Zero-duration multi-stop trip
  const zeroDurAnalysis = analyzeTripTiming([
    { stop_sequence: 1, stop_id: 'S1', arrival_time: '10:00:00', departure_time: '10:00:00' },
    { stop_sequence: 2, stop_id: 'S2', arrival_time: '10:00:00', departure_time: '10:00:00' }
  ]);
  assert(zeroDurAnalysis.ambiguous === true && zeroDurAnalysis.normalizable === false, 'Rejects physically impossible zero-duration multi-stop trip');

  // Edge Case 4: Verify all 19 real suburban rollover trips against their raw ordered stop times
  const srrParsed = parseGtfsDirectory(srrImportedDir);
  const srrTripStops = new Map();
  for (const st of srrParsed.tables.stop_times.rows) {
    if (!srrTripStops.has(st.trip_id)) srrTripStops.set(st.trip_id, []);
    srrTripStops.get(st.trip_id).push(st);
  }

  const expectedRolloverIds = [
    '40089_T1', '40091_T1', '40093_T1', '40206_T1', '40208_T1',
    '40381_T1', '40383_T1', '40385_T1', '40396_T1', '40571_T1',
    '40572_T1', '40660_T1', '40661_T1', '40662_T1', '42035_T1',
    '42037_T1', '43253_T1', '43441_T1', '43524_T1'
  ];

  let allRolloversVerified = true;
  for (const tid of expectedRolloverIds) {
    const stops = srrTripStops.get(tid);
    const analysis = analyzeTripTiming(stops);
    if (analysis.status !== 'UNNORMALIZED_MIDNIGHT_ROLLOVER' || !analysis.normalizable || analysis.ambiguous) {
      allRolloversVerified = false;
      console.error(`Rollover verification failure on real trip ${tid}:`, analysis);
    }
  }
  assert(allRolloversVerified, 'All 19 real Suburban Rail rollover trips independently tested and verified against raw stop times');

  // Suite 13: Incomplete Shuttle Trips & Missing Terminus Quarantine
  console.log('\n--- Suite 13: Incomplete Shuttle Trips & Missing Terminus Quarantine ---');
  const incFeedDir = path.join(fixturesDir, 'incomplete_shuttle_feed');
  const incResult = runIngestion(incFeedDir, {
    mode: 'chennai_metro',
    license: 'Government Open Data'
  });
  assert(incResult.manifest.readyForJourneyRouting === false, 'Blocked from routing due to incomplete single-stop trip');
  assert(incResult.validation.quarantinedTrips.length === 1, 'Quarantines single-stop trip');
  assert(incResult.validation.quarantinedTrips[0].normalizableWithoutAmbiguity === false, 'Cannot fabricate missing terminus; marked non-normalizable');
  assert(incResult.validation.feedLevelBlockers.some(b => b.includes('FEED_INCOMPLETE_SHUTTLE_TRIPS')), 'Feed-level blocker recorded for single-stop trips');

  // Suite 14: Suspicious Far-Future Calendar & Blocker Enforcement
  console.log('\n--- Suite 14: Suspicious Far-Future Calendar & Blocker Enforcement ---');
  const suspFeedDir = path.join(fixturesDir, 'suspicious_calendar_feed');
  const suspResult = runIngestion(suspFeedDir, {
    mode: 'chennai_metro',
    license: 'Government Open Data'
  });
  assert(suspResult.manifest.readyForJourneyRouting === false, 'Blocked from routing due to suspicious far-future calendar');
  assert(suspResult.validation.feedLevelBlockers.some(b => b.includes('FEED_SUSPICIOUS_CALENDAR_EXPIRY')), 'Feed blocker recorded for distant calendar end date');
  assert(suspResult.validation.warnings.some(w => w.includes('placeholder date')), 'Warns that 2170 date is an open-ended placeholder');

  // Suite 15: Broken Calendar Dates Service References
  console.log('\n--- Suite 15: Broken Calendar Dates Service References ---');
  const bcdFeedDir = path.join(fixturesDir, 'broken_calendar_dates_feed');
  const bcdResult = runIngestion(bcdFeedDir, {
    mode: 'chennai_metro',
    license: 'Government Open Data'
  });
  assert(bcdResult.success === false, 'Fails validation due to nonexistent service in calendar_dates');
  assert(bcdResult.validation.errors.some(e => e.includes('GHOST_SERVICE')), 'Reports error referencing nonexistent service_id');

  // Suite 16: Source-File Immutability & Checksum Integrity
  console.log('\n--- Suite 16: Source-File Immutability & Checksum Integrity ---');
  const expectedHashes = {
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

  let immutabilityVerified = true;
  for (const [filename, expectedSha] of Object.entries(expectedHashes)) {
    const fullPath = path.join(srrImportedDir, filename);
    assert(fs.existsSync(fullPath), `Source file ${filename} exists in imported directory`);
    const buf = fs.readFileSync(fullPath);
    const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
    if (actualSha !== expectedSha) {
      immutabilityVerified = false;
      console.error(`Hash mismatch on ${filename}: expected ${expectedSha}, got ${actualSha}`);
    }
  }
  assert(immutabilityVerified, 'All 9 imported Southern Railway source files remain strictly immutable');
  assert(srrManifest.fileInventory && Object.keys(srrManifest.fileInventory).length === 9, 'Manifest captures exact 9-file inventory with checksums');

  // Suite 17: Transparent Classification: Valid Records vs Quarantined vs Feed Blockers
  console.log('\n--- Suite 17: Transparent Record Classification & Feed Blockers ---');
  assert(srrManifest.qualityClassification.sourceValidTripsCount === 740, 'Identifies exactly 740 source-valid trips (97.0%)');
  assert(srrManifest.qualityClassification.quarantinedTripsCount === 23, 'Identifies exactly 23 quarantined trips (3.0%)');
  assert(srrManifest.qualityClassification.sourceValidTripsCount + srrManifest.qualityClassification.quarantinedTripsCount === srrManifest.recordCounts.trips, '740 + 23 partition accounts for 100% of the 763 trips without overlap or omission');
  assert(srrManifest.feedLevelBlockers.length === 5, 'Records exactly 5 feed-level blockers preventing routing');
  assert(srrManifest.feedLevelBlockers.some(b => b.includes('FEED_UNCONFIRMED_DATA_LICENSE')), 'Records UNCONFIRMED data license as feed blocker');
  assert(srrManifest.readyForJourneyRouting === false, 'Routing readiness remains false while blockers exist');

  // Suite 18: Catalogue Reconciliation & Corridor Exceptions
  console.log('\n--- Suite 18: Catalogue Reconciliation & Corridor Exceptions ---');
  assert(srrManifest.catalogueReconciliation.exactMatchedStations === 66, 'Reconciles 66 exact station code matches');
  assert(srrManifest.catalogueReconciliation.aliasMappedStations.length === 2, 'Reconciles 2 alias mappings (MASS->MAS, VPY->VJM)');
  assert(srrManifest.catalogueReconciliation.unmatchedExtensionStations.length === 2, 'Accounts for 2 missing MRTS extensions (PRTK, ADMB)');
  assert(srrManifest.catalogueReconciliation.reconciliationRate === '97.1%', 'Catalogue reconciliation rate is 97.1% (68/70 feed matches); extension stations PRTK & ADMB are missing from feed');
  assert(srrManifest.catalogueReconciliation.unmatchedExtensionStations.every(s => s.reason === 'MRTS_PHASE_2_EXTENSION_POSTDATES_SNAPSHOT'), 'Extension stations are documented as postdating snapshot and missing from feed');
  assert(srrManifest.catalogueReconciliation.catalogueTotalStations === 70, 'Accounts for 100% of curated 70 stations');
  assert(srrManifest.provenance.verifiedOperationalCurrency === 'UNVERIFIED_HISTORICAL', 'Provenance marks operational currency as UNVERIFIED_HISTORICAL');
  assert(srrManifest.provenance.licensing.timetableSchedules === 'UNCONFIRMED', 'Provenance marks timetable schedule data license as UNCONFIRMED');

  // Suite 19: Phase 06 Isolated Suburban Rail Timetable Preprocessor Execution & Derived Representation
  console.log('\n--- Suite 19: Isolated Suburban Rail Preprocessor & Derived Manifest ---');
  const derivedDir = path.resolve('data/suburban_rail/derived');
  const derivedManifestPath = path.join(derivedDir, 'derived_manifest.json');
  assert(fs.existsSync(derivedManifestPath), 'Derived manifest exists on disk in data/suburban_rail/derived/');

  const derivedManifest = JSON.parse(fs.readFileSync(derivedManifestPath, 'utf8'));
  assert(derivedManifest.manifestVersion === '1.2.0-derived-experimental', 'Manifest version is 1.2.0-derived-experimental');
  assert(derivedManifest.status === 'EXPERIMENTAL_DERIVED_REPRESENTATION', 'Derived status is EXPERIMENTAL_DERIVED_REPRESENTATION');
  assert(derivedManifest.readyForJourneyRouting === false, 'Production journey routing remains STRICTLY FALSE in derived manifest');
  assert(derivedManifest.operationalVerification === 'UNVERIFIED_HISTORICAL', 'Operational currency is explicitly UNVERIFIED_HISTORICAL');
  assert(derivedManifest.licenseNotice === 'UNCONFIRMED', 'Timetable data redistribution license is UNCONFIRMED');

  assert(derivedManifest.counts.totalSourceTrips === 763, 'Processes all 763 source trips from immutable imported snapshot');
  assert(derivedManifest.counts.eligibleDerivedTrips === 759, 'Derives exactly 759 eligible trips (740 source-valid + 19 normalized rollover)');
  assert(derivedManifest.counts.sourceValidUnmodifiedTrips === 740, 'Preserves 740 source-valid trips unmodified');
  assert(derivedManifest.counts.normalizedRolloverTrips === 19, 'Safely normalizes all 19 midnight rollover trips');
  assert(derivedManifest.counts.excludedTrips === 4, 'Strictly excludes the 4 incomplete shuttle trips');
  assert(derivedManifest.counts.totalSourceStopTimes === 16135, 'Accounts for all 16,135 raw source stop times');
  assert(derivedManifest.counts.totalDerivedStopTimes === 16131, 'Contains exactly 16,131 derived stop times (16,135 - 4 excluded)');
  assert(derivedManifest.counts.excludedStopTimes === 4, 'Records exactly 4 excluded stop times matching 4 single-stop shuttles');

  // Verify derived GTFS files exist
  const derivedFiles = ['agency.txt', 'calendar.txt', 'calendar_dates.txt', 'feed_info.txt', 'pathways.txt', 'routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt', 'DERIVED_DATA_NOTICE.md', 'transformation_audit.json'];
  let allDerivedFilesExist = true;
  for (const f of derivedFiles) {
    if (!fs.existsSync(path.join(derivedDir, f))) allDerivedFilesExist = false;
  }
  assert(allDerivedFilesExist, 'All 9 derived GTFS files plus notice and audit documents exist in derived directory');

  // Verify derived notice
  const noticePath = path.join(derivedDir, 'DERIVED_DATA_NOTICE.md');
  const noticeContent = fs.readFileSync(noticePath, 'utf8');
  assert(noticeContent.includes('EXPERIMENTAL ARTIFACT'), 'Derived notice clearly warns experimental status');
  assert(noticeContent.includes('readyForJourneyRouting: false'), 'Derived notice explicitly documents routing disabled');

  // Suite 20: Preprocessor Determinism Across Repeated Runs
  console.log('\n--- Suite 20: Preprocessor Determinism Across Repeated Runs ---');
  const testRunDir1 = path.join(fixturesDir, 'preprocessor_test_run1');
  const testRunDir2 = path.join(fixturesDir, 'preprocessor_test_run2');

  const run1 = preprocessSuburbanRailFeed(srrImportedDir, testRunDir1, { preprocessingTimestamp: '2026-10-27T12:00:00.000Z' });
  const run2 = preprocessSuburbanRailFeed(srrImportedDir, testRunDir2, { preprocessingTimestamp: '2026-10-27T12:00:00.000Z' });

  assert(run1.deterministicContentHash === run2.deterministicContentHash, 'Derived content SHA-256 hash is bit-for-bit identical across runs');
  assert(run1.counts.eligibleDerivedTrips === run2.counts.eligibleDerivedTrips, 'Eligible trip counts match across runs');

  // Compare file contents between runs
  let identicalFiles = true;
  for (const f of ['trips.txt', 'stop_times.txt', 'routes.txt', 'stops.txt', 'derived_manifest.json', 'transformation_audit.json']) {
    const f1 = fs.readFileSync(path.join(testRunDir1, f), 'utf8');
    const f2 = fs.readFileSync(path.join(testRunDir2, f), 'utf8');
    if (f1 !== f2) identicalFiles = false;
  }
  assert(identicalFiles, 'Generated derived files are 100% byte-for-byte identical across repeated runs');

  // Clean up temporary test runs
  fs.rmSync(testRunDir1, { recursive: true, force: true });
  fs.rmSync(testRunDir2, { recursive: true, force: true });

  // Suite 21: Real Affected Trips & Transformation Audit Verification
  console.log('\n--- Suite 21: Real Affected Trips & Transformation Audit Verification ---');
  const auditPath = path.join(derivedDir, 'transformation_audit.json');
  assert(fs.existsSync(auditPath), 'Transformation audit log exists on disk');

  const auditLog = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  assert(auditLog.length === 19, 'Transformation audit records exactly 19 transformed trips');

  const sameStopInversions = auditLog.filter(t => t.transformationType === 'SAME_STOP_MIDNIGHT_INVERSION');
  const progressionRegressions = auditLog.filter(t => t.transformationType === 'INTER_STOP_MIDNIGHT_REGRESSION');
  assert(sameStopInversions.length === 4, 'Audit confirms exactly 4 same-stop midnight inversions');
  assert(progressionRegressions.length === 15, 'Audit confirms exactly 15 inter-stop progression regressions');

  let totalModifiedStops = 0;
  let allOffsets86400 = true;
  let allDurationsPlausible = true;

  for (const record of auditLog) {
    totalModifiedStops += record.transformedStopsCount;
    if (record.durationMinutes < 30 || record.durationMinutes > 240) allDurationsPlausible = false;
    for (const diff of record.stopsDiff) {
      if (diff.offset_seconds !== 86400) allOffsets86400 = false;
    }
  }
  assert(totalModifiedStops === 142, `Audit confirms exactly 142 individual stop records transformed across all 19 trips`);
  assert(allOffsets86400, 'All 142 stop record adjustments apply exact +86,400s (+24h) offset');
  assert(allDurationsPlausible, 'All 19 normalized trips have physically plausible durations (55 to 136 min)');

  // Verify real trip 40208_T1 (same-stop inversion at seq 15 MBM_P_2)
  const audit40208 = auditLog.find(t => t.tripId === '40208_T1');
  assert(audit40208 && audit40208.transformationType === 'SAME_STOP_MIDNIGHT_INVERSION', 'Trip 40208_T1 logged as SAME_STOP_MIDNIGHT_INVERSION');
  assert(audit40208.transformedStopsCount === 8, 'Trip 40208_T1 has 8 transformed stops (seq 15 to 22)');
  assert(audit40208.durationMinutes === 80, 'Trip 40208_T1 normalized duration is exactly 80 minutes');

  // Verify real trip 40089_T1 (progression regression at seq 18 TBM_P_1)
  const audit40089 = auditLog.find(t => t.tripId === '40089_T1');
  assert(audit40089 && audit40089.transformationType === 'INTER_STOP_MIDNIGHT_REGRESSION', 'Trip 40089_T1 logged as INTER_STOP_MIDNIGHT_REGRESSION');
  assert(audit40089.transformedStopsCount === 1, 'Trip 40089_T1 has exactly 1 transformed stop (TBM_P_1 at 24:00:00)');
  assert(audit40089.durationMinutes === 55, 'Trip 40089_T1 normalized duration is exactly 55 minutes');

  // Suite 22: Strict Exclusion & Quarantine of Incomplete Shuttle Trips
  console.log('\n--- Suite 22: Strict Exclusion & Quarantine of Incomplete Shuttle Trips ---');
  assert(derivedManifest.excludedTripsAudit.length === 4, 'Derived manifest records exactly 4 excluded trips');

  const excludedIds = ['43551_T1', '43552_T1', '43553_T1', '43554_T1'];
  const auditExcludedIds = derivedManifest.excludedTripsAudit.map(t => t.tripId);
  assert(excludedIds.every(id => auditExcludedIds.includes(id)), 'All 4 single-stop shuttle trips (43551_T1 to 43554_T1) are recorded in excluded audit');
  assert(derivedManifest.excludedTripsAudit.every(t => t.stopCount === 1 && t.status === 'INSUFFICIENT_STOPS'), 'All 4 exclusions document status INSUFFICIENT_STOPS');
  assert(derivedManifest.excludedTripsAudit.every(t => t.reason.includes('Trip contains fewer than 2 stops')), 'All 4 exclusions record missing terminus reason');

  // Check derived trips.txt and stop_times.txt strictly do NOT contain excluded trips
  const derivedTripsCsv = fs.readFileSync(path.join(derivedDir, 'trips.txt'), 'utf8');
  const derivedStopTimesCsv = fs.readFileSync(path.join(derivedDir, 'stop_times.txt'), 'utf8');
  assert(excludedIds.every(id => !derivedTripsCsv.includes(id)), 'None of the 4 excluded trips appear in derived trips.txt');
  assert(excludedIds.every(id => !derivedStopTimesCsv.includes(id)), 'None of the 4 excluded trips appear in derived stop_times.txt');

  // Suite 23: Rejection of Ambiguous & Unnormalizable Edge Cases
  console.log('\n--- Suite 23: Rejection of Ambiguous & Unnormalizable Edge Cases ---');

  // Case 1: Sequence disorder (seq 1, 3, 2)
  const disorderedRes = normalizeTripTimes([
    { trip_id: 'TEST_DISORDER', stop_sequence: 1, stop_id: 'S1', arrival_time: '08:00:00', departure_time: '08:00:00' },
    { trip_id: 'TEST_DISORDER', stop_sequence: 3, stop_id: 'S3', arrival_time: '08:15:00', departure_time: '08:15:00' },
    { trip_id: 'TEST_DISORDER', stop_sequence: 2, stop_id: 'S2', arrival_time: '08:30:00', departure_time: '08:30:00' }
  ]);
  assert(disorderedRes.eligible === false && disorderedRes.reason.includes('SEQUENCE_DISORDER'), 'Rejects non-increasing stop_sequence');

  // Case 2: Unrelated daytime regression (14:30 -> 14:15)
  const daytimeRegRes = normalizeTripTimes([
    { trip_id: 'TEST_DAYTIME', stop_sequence: 1, stop_id: 'S1', arrival_time: '14:00:00', departure_time: '14:00:00' },
    { trip_id: 'TEST_DAYTIME', stop_sequence: 2, stop_id: 'S2', arrival_time: '14:30:00', departure_time: '14:30:00' },
    { trip_id: 'TEST_DAYTIME', stop_sequence: 3, stop_id: 'S3', arrival_time: '14:15:00', departure_time: '14:15:00' }
  ]);
  assert(daytimeRegRes.eligible === false && daytimeRegRes.status === 'AMBIGUOUS_TIME_PROGRESSION', 'Rejects unrelated daytime regression as ambiguous');

  // Case 3: Excessive dwell across midnight (> 900s / 15 mins)
  const excessDwellRes = normalizeTripTimes([
    { trip_id: 'TEST_DWELL', stop_sequence: 1, stop_id: 'S1', arrival_time: '23:30:00', departure_time: '23:30:00' },
    { trip_id: 'TEST_DWELL', stop_sequence: 2, stop_id: 'S2', arrival_time: '23:50:00', departure_time: '00:20:00' },
    { trip_id: 'TEST_DWELL', stop_sequence: 3, stop_id: 'S3', arrival_time: '00:30:00', departure_time: '00:30:00' }
  ]);
  assert(excessDwellRes.eligible === false && excessDwellRes.reason.includes('Excessive midnight dwell'), 'Rejects excessive dwell across midnight');

  // Case 4: Excessive hop duration across midnight (> 3600s / 60 mins)
  const excessHopRes = normalizeTripTimes([
    { trip_id: 'TEST_HOP', stop_sequence: 1, stop_id: 'S1', arrival_time: '23:10:00', departure_time: '23:15:00' },
    { trip_id: 'TEST_HOP', stop_sequence: 2, stop_id: 'S2', arrival_time: '00:45:00', departure_time: '00:45:00' }
  ]);
  assert(excessHopRes.eligible === false && excessHopRes.reason.includes('Excessive midnight hop'), 'Rejects excessive hop across midnight');

  // Case 5: Zero-duration multi-stop trip
  const zeroDurRes = normalizeTripTimes([
    { trip_id: 'TEST_ZERO', stop_sequence: 1, stop_id: 'S1', arrival_time: '10:00:00', departure_time: '10:00:00' },
    { trip_id: 'TEST_ZERO', stop_sequence: 2, stop_id: 'S2', arrival_time: '10:00:00', departure_time: '10:00:00' }
  ]);
  assert(zeroDurRes.eligible === false && zeroDurRes.status === 'AMBIGUOUS_TIME_PROGRESSION', 'Rejects zero-duration multi-stop trip');

  // Case 6: Excessive total duration (> 18000s / 5 hours)
  const excessDurRes = normalizeTripTimes([
    { trip_id: 'TEST_LONG', stop_sequence: 1, stop_id: 'S1', arrival_time: '06:00:00', departure_time: '06:00:00' },
    { trip_id: 'TEST_LONG', stop_sequence: 2, stop_id: 'S2', arrival_time: '12:00:00', departure_time: '12:00:00' }
  ]);
  assert(excessDurRes.eligible === false && excessDurRes.status === 'AMBIGUOUS_TIME_PROGRESSION', 'Rejects excessive trip duration (>5h)');

  // Suite 24: Preservation of Valid Extended-Hour Times (>= 24:00:00)
  console.log('\n--- Suite 24: Preservation of Valid Extended-Hour Times (>= 24:00:00) ---');
  const extTripRes = normalizeTripTimes([
    { trip_id: 'TEST_EXT', stop_sequence: 1, stop_id: 'S1', arrival_time: '23:45:00', departure_time: '23:50:00' },
    { trip_id: 'TEST_EXT', stop_sequence: 2, stop_id: 'S2', arrival_time: '24:05:00', departure_time: '24:06:00' },
    { trip_id: 'TEST_EXT', stop_sequence: 3, stop_id: 'S3', arrival_time: '24:20:00', departure_time: '24:20:00' }
  ]);
  assert(extTripRes.eligible === true, 'Trip with existing extended-hour times is eligible');
  assert(extTripRes.transformed === false, 'Existing extended-hour trip is preserved without transformation');
  assert(extTripRes.status === 'VALID_EXTENDED_HOURS', 'Status is accurately VALID_EXTENDED_HOURS');
  assert(extTripRes.normalizedStops[1].arrival_time === '24:05:00', 'Preserves exact extended-hour time 24:05:00');
  assert(extTripRes.transformationAudit === null, 'No transformation audit logged for already-valid extended-hours trip');

  // Suite 25: Source-Data Immutability Verification
  console.log('\n--- Suite 25: Absolute Immutability of Raw Imported Source Files ---');
  let sourceFilesUntouched = true;
  for (const [fName, expSha] of Object.entries(RAW_SOURCE_CHECKSUMS)) {
    const rawBuf = fs.readFileSync(path.join(srrImportedDir, fName));
    const actSha = crypto.createHash('sha256').update(rawBuf).digest('hex');
    if (actSha !== expSha) sourceFilesUntouched = false;
  }
  assert(sourceFilesUntouched, 'All 9 raw source files in data/suburban_rail/imported/ remain 100% byte-for-byte immutable');
  const sourceManifestRaw = JSON.parse(fs.readFileSync(srrManifestPath, 'utf8'));
  assert(sourceManifestRaw.readyForJourneyRouting === false, 'Source manifest readyForJourneyRouting remains false');

  // Suite 26: Production Routing Readiness & Blocker Enforcement
  console.log('\n--- Suite 26: Production Routing Readiness & Blocker Enforcement ---');
  assert(derivedManifest.readyForJourneyRouting === false, 'Derived manifest readyForJourneyRouting is false');
  assert(derivedManifest.activeBlockers.length >= 5, 'Derived manifest retains all active feed blockers');
  assert(derivedManifest.activeBlockers.some(b => b.includes('ROUTING_DISABLED')), 'Documents explicit ROUTING_DISABLED blocker');
  assert(derivedManifest.activeBlockers.some(b => b.includes('FEED_SUSPICIOUS_CALENDAR_EXPIRY')), 'Retains suspicious calendar expiry blocker (21700820)');
  assert(derivedManifest.activeBlockers.some(b => b.includes('FEED_UNCONFIRMED_DATA_LICENSE')), 'Retains unconfirmed data license blocker');
  assert(derivedManifest.activeBlockers.some(b => b.includes('FEED_MISSING_EXTENSION_TIMETABLES')), 'Retains missing MRTS extension timetables blocker');

  // Independent GTFS validation of derived dataset
  const derivedFeedParsed = parseGtfsDirectory(derivedDir);
  const derivedValidation = validateGtfsFeed(derivedFeedParsed, {
    referenceDate: '20261026',
    strictCalendar: false,
    corridorExceptions: ['AKM', 'AKM_1', 'AKM_P_1', 'AKM_P_2', 'AKM_P_3', 'AKM_P_4']
  });
  assert(derivedValidation.valid === true, 'Derived feed validates cleanly with zero structural/referential errors');
  assert(derivedValidation.errors.length === 0, 'Derived feed has exactly 0 errors');
  assert(derivedValidation.readyForJourneyRouting === false, 'Derived feed remains strictly NOT ready for journey routing due to feed blockers');
  assert(derivedValidation.stats.sourceValidTripsCount === 759, 'Derived feed contains 759 valid monotonic trips (740 standard + 19 extended hours)');
  assert(derivedValidation.stats.quarantinedTripsCount === 0, 'Derived feed contains 0 quarantined trips (all eligible trips normalized; incomplete trips excluded)');
  assert(derivedValidation.stats.brokenReferencesCount === 0, 'Zero broken foreign key references in derived feed');

  // Suite 27: Chennai Metro Source Verification & File Inventory
  console.log('\n--- Suite 27: Chennai Metro Source Verification & File Inventory ---');
  const metroDir = path.resolve('data/chennai_metro/imported');
  const metroManifestPath = path.join(metroDir, 'ingestion_manifest.json');
  assert(fs.existsSync(metroDir), 'Chennai Metro imported directory exists');
  assert(fs.existsSync(metroManifestPath), 'Chennai Metro ingestion manifest exists');

  const EXPECTED_METRO_CHECKSUMS = {
    'agency.txt': '8e96c79f3d2fff5b5a982f1c2c95b30508259a0977997833a50d6cbbc611fe5e',
    'calendar.txt': '00c8d79e1bffa04abfecce8d05606101b24cc76c41e8e44c80c86c5349e7aebc',
    'fare_attributes.txt': '52ea5b7b3dc2ddcf25485d141570b77796f060272ea863f49ae59d7ad2b5bdcc',
    'fare_rules.txt': '786917869bf3a56860f3213ccd093d580c252e09ba2aa7ca88f80e1bd9074c3a',
    'routes.txt': '46ee8a8673029c0526ee783b6c946070c6987f8790f4c3e8836dc6f6939f10d4',
    'shapes.txt': '901e08e7e8a06661b18d426048a6154f6bac317b85159046773a9a5a29dcb8ab',
    'stops.txt': '618bf5eb45ee2445bcd29acd61837cfa174d65fd8fbbaee6534e3c2309bd2304',
    'stop_times.txt': '1e2f355ba0c97e8570267777b05ec7562b5ccdf0b53ed60d91f2096faff518b0',
    'transfers.txt': '52937473eb8c9314fab8dfb41f46d0b79e543871c0caf7a06eb8b010c1637dad',
    'trips.txt': '2ae2e6c419cc6280ba023dad96454f37729223cb8d49d4c72d7c2772dbe86e40'
  };

  for (const [file, expectedHash] of Object.entries(EXPECTED_METRO_CHECKSUMS)) {
    const filePath = path.join(metroDir, file);
    assert(fs.existsSync(filePath), `Source file ${file} exists in chennai_metro/imported/`);
    const fileBuf = fs.readFileSync(filePath);
    const actualHash = crypto.createHash('sha256').update(fileBuf).digest('hex');
    assert(actualHash === expectedHash, `Source file ${file} matches SHA-256 hash ${expectedHash.slice(0, 8)}...`);
  }

  const metroManifest = JSON.parse(fs.readFileSync(metroManifestPath, 'utf8'));
  assert(metroManifest.mode === 'chennai_metro', 'Metro manifest specifies mode chennai_metro');
  assert(metroManifest.status === 'EXPIRED_CALENDAR', 'Metro manifest status is EXPIRED_CALENDAR');
  assert(metroManifest.readyForJourneyRouting === false, 'Metro manifest readyForJourneyRouting is strictly false');
  assert(metroManifest.provenance.publisher.includes('Chennai Metro Rail Limited'), 'Manifest publisher attributes CMRL / CUMTA');
  assert(metroManifest.provenance.sourceCommit === 'af0742dba777f9657ed6fda2046d6c2a721d630b', 'Manifest documents exact source commit af0742d');

  // Suite 28: Chennai Metro Record Counts & Referential Integrity
  console.log('\n--- Suite 28: Chennai Metro Record Counts & Referential Integrity ---');
  const metroFeed = parseGtfsDirectory(metroDir);
  assert(metroFeed.foundFiles.length === 10, 'Finds all 10 GTFS files in imported directory');
  assert(metroFeed.tables.agency.rows.length === 1, 'Contains exactly 1 agency (CMRL)');
  assert(metroFeed.tables.agency.rows[0].agency_id === 'CMRL', 'Agency ID is CMRL');
  assert(metroFeed.tables.agency.rows[0].agency_timezone === 'Asia/Kolkata', 'Agency timezone is Asia/Kolkata');
  assert(metroFeed.tables.routes.rows.length === 28, 'Contains exactly 28 routes');
  assert(metroFeed.tables.routes.rows.every(r => r.route_type === '1'), 'All 28 routes are type 1 (Subway/Metro)');
  assert(metroFeed.tables.stops.rows.length === 254, 'Contains exactly 254 stop/platform/entrance nodes');
  const metroParents = metroFeed.tables.stops.rows.filter(s => s.location_type === '1');
  assert(metroParents.length === 41, 'Contains exactly 41 parent stations');
  assert(metroFeed.tables.trips.rows.length === 625, 'Contains exactly 625 trips');
  assert(metroFeed.tables.stop_times.rows.length === 12503, 'Contains exactly 12,503 stop times');
  assert(metroFeed.tables.calendar.rows.length === 1, 'Contains exactly 1 calendar row');
  assert(metroFeed.tables.fare_attributes.rows.length === 7, 'Contains 7 fare attribute tiers');
  assert(metroFeed.tables.fare_rules.rows.length === 1600, 'Contains 1,600 zone fare rules');
  assert(metroFeed.tables.transfers.rows.length === 50, 'Contains 50 internal station transfers');

  // Foreign key and coordinate validation
  const metroValidation = validateGtfsFeed(metroFeed, { strictCalendar: false });
  assert(metroValidation.stats.brokenReferencesCount === 0, 'Zero broken foreign key references in Metro feed');
  assert(metroValidation.stats.duplicateCount === 0, 'Zero duplicate identifiers in Metro feed');
  assert(metroValidation.stats.invalidCoordinatesCount === 0, 'All 254 stop coordinates within Chennai bounds');

  // Suite 29: Chennai Metro Monotonic Trip Timing & Operational Bounds
  console.log('\n--- Suite 29: Chennai Metro Monotonic Trip Timing & Operational Bounds ---');
  assert(metroValidation.stats.sourceValidTripsCount === 625, 'All 625 trips are source-valid with monotonic timing');
  assert(metroValidation.stats.quarantinedTripsCount === 0, 'Zero trips quarantined (no broken or single-stop trips)');
  assert(metroValidation.stats.timeInversionCount === 0, 'Zero same-stop time inversions');
  assert(metroValidation.stats.timeRegressionCount === 0, 'Zero inter-stop time regressions');
  assert(metroValidation.stats.singleStopTripsCount === 0, 'Zero single-stop trips');
  assert(metroValidation.stats.midnightRolloverTripsCount === 0, 'Zero midnight rollovers (standard daytime/evening service)');

  let minMetroDep = '99:99:99';
  let maxMetroArr = '00:00:00';
  for (const st of metroFeed.tables.stop_times.rows) {
    if (st.departure_time < minMetroDep) minMetroDep = st.departure_time;
    if (st.arrival_time > maxMetroArr) maxMetroArr = st.arrival_time;
  }
  assert(minMetroDep === '05:27:03', 'Earliest Metro departure is 05:27:03');
  assert(maxMetroArr === '21:48:57', 'Latest Metro arrival is 21:48:57');

  // Suite 30: Chennai Metro Expired Calendar & Blocker Enforcement
  console.log('\n--- Suite 30: Chennai Metro Expired Calendar & Blocker Enforcement ---');
  const metroStrictValidation = validateGtfsFeed(metroFeed, { strictCalendar: true });
  assert(metroStrictValidation.valid === false, 'Strict validation correctly fails due to expired calendar');
  assert(metroStrictValidation.calendarStatus === 'EXPIRED', 'Strict validation calendarStatus is EXPIRED');
  assert(metroStrictValidation.feedLevelBlockers.some(b => b.includes('FEED_EXPIRED_CALENDAR')), 'Records FEED_EXPIRED_CALENDAR feed blocker');
  assert(metroManifest.feedLevelBlockers.some(b => b.includes('FEED_EXPIRED_CALENDAR')), 'Manifest retains FEED_EXPIRED_CALENDAR blocker');
  assert(metroManifest.feedLevelBlockers.some(b => b.includes('FEED_UNCONFIRMED_DATA_LICENSE')), 'Manifest retains FEED_UNCONFIRMED_DATA_LICENSE blocker');
  assert(metroManifest.feedLevelBlockers.some(b => b.includes('FEED_MISSING_EXTENSION_TIMETABLES')), 'Manifest retains FEED_MISSING_EXTENSION_TIMETABLES blocker');
  assert(metroManifest.readyForJourneyRouting === false, 'Production journey routing strictly disabled');

  // Suite 31: Chennai Metro Station Reconciliation & Mode Isolation
  console.log('\n--- Suite 31: Chennai Metro Station Reconciliation & Mode Isolation ---');
  const metroCatPath = path.resolve('data/chennai_metro/verified_stations.json');
  const metroCatData = JSON.parse(fs.readFileSync(metroCatPath, 'utf8'));
  const metroRecon = reconcileCuratedCatalogue(metroFeed.tables.stops.rows, metroCatData.stations, { mode: 'chennai_metro' });
  assert(metroRecon.catalogueTotalStations === 41, 'Reconciles all 41 curated Metro stations');
  assert(metroRecon.exactMatchedStations === 20, 'Identifies 20 exact code matches between catalogue and GTFS zone_id (48.8%)');
  assert(metroRecon.aliasMappedStations.length === 21, 'Identifies 21 code alias mappings');
  assert(metroRecon.confirmedAliases.length === 0, 'Zero aliases have authoritative external published crosswalk evidence');
  assert(metroRecon.divergentFacilityAliases.length === 2, 'Identifies 2 divergent facility/centroid aliases (SCMBT, SNG)');
  assert(metroRecon.provisionalAliases.length === 19, 'Identifies 19 provisional aliases (13 proximity/name inferences including SMC, SGD, STMNT + 4 corridor offsets + 2 unserved extensions)');
  assert(metroRecon.unresolvedAliases.length === 0, 'Zero unresolved aliases in feed');
  assert(metroRecon.confirmedMatches === 20, 'Identifies 20 code-matched stations (20 exact code matches + 0 confirmed aliases, 48.8%); no aliases conflated as verified without external evidence');
  assert(metroRecon.unmatchedStations.length === 0, 'Zero unmatched physical stations in catalogue');
  assert(metroRecon.physicalRepresentationRate === '100.0%', 'Physical station representation rate is 100.0%');
  assert(metroRecon.reconciliationRate === '100.0%', 'Legacy reconciliation rate remains 100.0%');
  assert(metroRecon.unmatchedExtensionStations.length === 2, 'Flags 2 stations postdating snapshot (SWND, STVT)');
  assert(metroRecon.unmatchedExtensionStations.some(s => s.code === 'SWND'), 'Wimco Nagar Depot flagged as extension postdating snapshot');
  assert(metroRecon.unmatchedExtensionStations.some(s => s.code === 'STVT'), 'Tiruvottiyur Theradi flagged as extension postdating snapshot');

  // Verify unresolved aliases cannot silently count as verified matches
  const dummyCat = [{ code: 'NONEXISTENT_STATION', name: 'Nonexistent Station' }];
  const dummyRecon = reconcileCuratedCatalogue(metroFeed.tables.stops.rows, dummyCat, { mode: 'chennai_metro' });
  assert(dummyRecon.unmatchedStations.length === 1, 'Unknown station rejected in unmatchedStations');
  assert(dummyRecon.aliasMappedStations.length === 0, 'Unknown station not counted as alias match');
  assert(dummyRecon.confirmedMatches === 0, 'Zero confirmed matches for unknown station');

  // Strict isolation checks
  assert(metroManifest.mode === 'chennai_metro', 'Metro manifest isolated to chennai_metro mode');
  assert(!metroManifest.fileInventory['pathways.txt'], 'Metro imported feed does not have pathways.txt (isolated from SRR)');
  assert(srrManifest.mode === 'suburban_rail', 'Suburban Rail manifest isolated to suburban_rail mode');
  assert(srrManifest.fileInventory['pathways.txt'], 'Suburban Rail feed retains pathways.txt');

  // Suite 32: MTC Bus Source Verification & File Inventory
  console.log('\n--- Suite 32: MTC Bus Source Verification & File Inventory ---');
  const mtcDir = path.resolve('data/mtc_bus/imported');
  const mtcManifestPath = path.join(mtcDir, 'ingestion_manifest.json');
  assert(fs.existsSync(mtcDir), 'MTC Bus imported directory exists');
  assert(fs.existsSync(mtcManifestPath), 'MTC Bus ingestion manifest exists');

  const mtcExpectedHashes = {
    'agency.txt': '6fbcead3ef9398e1784facbe71030772e6abebdb86137632178747815cce4da6',
    'calendar.txt': 'fca05f8f64ff8068da65f03439ff1320b0a5c556e9154b84e34c4f6e7d05a730',
    'feed_info.txt': 'ff68288fa3ed754b9c2262a8ba6d5ae4dccf7cc0edca934213f93b20042adac1',
    'routes.txt': '3f933bdd0f64b69359a1eef24cf0a5464494e1affce144da995ce164a17e0028',
    'stops.txt': '24ef742ee8312d27c9474a840330a5fbf271d2bbdd59514309d646cc4ea30c85',
    'stop_times.txt': 'aa80ad6804323964689b4a862c3d8dbcd497c386a9dc305e5f7e4badb4cad3cd',
    'trips.txt': '0264fe39cf23ceac6ce096f5bbcfad16c47cc48849ece657b287df392eedfa86'
  };

  for (const [file, expectedHash] of Object.entries(mtcExpectedHashes)) {
    const filePath = path.join(mtcDir, file);
    assert(fs.existsSync(filePath), `Source file ${file} exists in mtc_bus/imported/`);
    const fileBuf = fs.readFileSync(filePath);
    const actualHash = crypto.createHash('sha256').update(fileBuf).digest('hex');
    assert(actualHash === expectedHash, `Source file ${file} matches SHA-256 hash ${expectedHash.slice(0, 8)}...`);
  }

  const mtcManifest = JSON.parse(fs.readFileSync(mtcManifestPath, 'utf8'));
  assert(mtcManifest.mode === 'mtc_bus', 'MTC manifest specifies mode mtc_bus');
  assert(mtcManifest.status === 'VALIDATED', 'MTC manifest status is VALIDATED');
  assert(mtcManifest.readyForJourneyRouting === false, 'MTC manifest readyForJourneyRouting is strictly false');
  assert(mtcManifest.provenance.publisher.includes('UngalSoththu'), 'Manifest publisher notes UngalSoththu community mirror');
  assert(mtcManifest.provenance.sourceCommit === 'af0742dba777f9657ed6fda2046d6c2a721d630b', 'Manifest documents exact source commit af0742d');

  // Suite 33: MTC Bus Record Counts & Referential Integrity
  console.log('\n--- Suite 33: MTC Bus Record Counts & Referential Integrity ---');
  const mtcFeed = parseGtfsDirectory(mtcDir);
  assert(mtcFeed.foundFiles.length === 7, 'Finds all 7 GTFS files in imported directory');
  assert(mtcFeed.tables.agency.rows.length === 1, 'Contains exactly 1 agency (MTC)');
  assert(mtcFeed.tables.agency.rows[0].agency_id === '69', 'Agency ID is 69');
  assert(mtcFeed.tables.agency.rows[0].agency_timezone === 'Asia/Kolkata', 'Agency timezone is Asia/Kolkata');
  assert(mtcFeed.tables.routes.rows.length === 4611, 'Contains exactly 4,611 routes');
  assert(mtcFeed.tables.routes.rows.every(r => r.route_type === '3'), 'All 4,611 routes are type 3 (Bus)');
  assert(mtcFeed.tables.stops.rows.length === 5580, 'Contains exactly 5,580 stop nodes');
  assert(mtcFeed.tables.trips.rows.length === 47047, 'Contains exactly 47,047 trips');
  assert(mtcFeed.tables.stop_times.rows.length === 1360443, 'Contains exactly 1,360,443 stop times');
  assert(mtcFeed.tables.calendar.rows.length === 6, 'Contains 6 calendar service rows');

  // Foreign key and coordinate validation
  const mtcValidation = validateGtfsFeed(mtcFeed, { strictCalendar: false });
  assert(mtcValidation.stats.brokenReferencesCount === 0, 'Zero broken foreign key references in MTC feed');
  assert(mtcValidation.stats.duplicateCount === 0, 'Zero duplicate identifiers in MTC feed');
  assert(mtcValidation.stats.invalidCoordinatesCount === 0, 'All 5,580 stop coordinates within Chennai bounds');

  // Suite 34: MTC Bus Operational Timing, Placeholders & Trip Monotonicity
  console.log('\n--- Suite 34: MTC Bus Operational Timing, Placeholders & Trip Monotonicity ---');
  assert(mtcValidation.stats.sourceValidTripsCount === 47047, 'All 47,047 trips are source-valid with monotonic timing');
  assert(mtcValidation.stats.quarantinedTripsCount === 0, 'Zero trips quarantined');
  assert(mtcValidation.stats.timeInversionCount === 0, 'Zero same-stop time inversions');
  assert(mtcValidation.stats.timeRegressionCount === 0, 'Zero inter-stop time regressions');
  assert(mtcValidation.stats.singleStopTripsCount === 0, 'Zero single-stop trips');
  assert(mtcFeed.tables.calendar.rows.some(r => r.service_id.includes('script')), 'Documents scraper test artifact service in calendar');
  assert(mtcFeed.tables.calendar.rows[0].start_date === '20240501', 'Calendar start date is 20240501');
  assert(mtcFeed.tables.calendar.rows[0].end_date === '20300501', 'Calendar end date is artificial placeholder 20300501');

  // Suite 35: MTC Bus Hub Catalogue Reconciliation & Mode Isolation
  console.log('\n--- Suite 35: MTC Bus Hub Catalogue Reconciliation & Mode Isolation ---');
  const mtcCatPath = path.resolve('data/mtc_bus/verified_hubs.json');
  const mtcCatData = JSON.parse(fs.readFileSync(mtcCatPath, 'utf8'));
  const mtcRecon = reconcileCuratedCatalogue(mtcFeed.tables.stops.rows, mtcCatData.interchangeHubs, { mode: 'mtc_bus' });
  assert(mtcRecon.catalogueTotalStations === 21, 'Reconciles all 21 curated MTC interchange hubs');
  assert(mtcRecon.exactMatchedStations === 0, 'Zero exact acronym matches (GTFS uses numeric stop IDs)');
  assert(mtcRecon.confirmedAliases.length === 0, 'Zero confirmed aliases (no published official acronym crosswalk)');
  assert(mtcRecon.provisionalAliases.length === 21, 'Identifies 21 provisional hub-to-stop spatial alignments');
  assert(mtcRecon.unresolvedAliases.length === 0, 'Zero unresolved aliases');
  assert(mtcRecon.physicalStationsRepresented === 21, 'All 21 hubs physically represented in feed');
  assert(mtcRecon.physicalRepresentationRate === '100.0%', 'Physical representation rate is 100.0%');

  // Feed blockers and strict isolation checks
  assert(mtcManifest.feedLevelBlockers.some(b => b.includes('FEED_UNCONFIRMED_DATA_LICENSE')), 'Retains unconfirmed data license blocker');
  assert(mtcManifest.feedLevelBlockers.some(b => b.includes('FEED_COMMUNITY_SCRAPE_ORIGIN')), 'Retains community scrape origin blocker');
  assert(mtcManifest.feedLevelBlockers.some(b => b.includes('FEED_SUSPICIOUS_CALENDAR_PLACEHOLDER')), 'Retains calendar placeholder blocker');
  assert(mtcManifest.feedLevelBlockers.some(b => b.includes('FEED_MISSING_SHAPES_AND_FARES')), 'Retains missing shapes and fares blocker');
  assert(mtcManifest.readyForJourneyRouting === false, 'MTC journey routing strictly disabled');
  assert(!mtcManifest.fileInventory['shapes.txt'], 'MTC imported feed lacks shapes.txt (straight-line only)');
  assert(!mtcManifest.fileInventory['fare_attributes.txt'], 'MTC imported feed lacks fare_attributes.txt');
  assert(!mtcManifest.fileInventory['pathways.txt'], 'MTC imported feed isolated from SRR pathways.txt');

  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    console.error(`💥 ${failed} ingestion test(s) failed.`);
    process.exit(1);
  } else {
    console.log('🎉 All transit ingestion pipeline tests passed successfully!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error during ingestion test execution:', err);
  process.exit(1);
});
