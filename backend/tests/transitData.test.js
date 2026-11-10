import path from 'path';
import fs from 'fs';
import { validateCoordinateBounds, validateProvenance, validateTransitData } from '../services/transitDataValidator.js';

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
  console.log('🧪 Starting AccessRoute Transit Data Foundation Test Suite');
  console.log('======================================================\n');

  const dataDir = path.resolve(process.cwd(), 'data');

  // Test 1: Network Scope and Multi-County Boundary
  console.log('--- Suite 1: Network Scope & Multi-County Bounding Box ---');
  const scopePath = path.join(dataDir, 'coverage', 'network_scope.json');
  assert(fs.existsSync(scopePath), 'network_scope.json exists');
  const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));

  assert(scope.spatialBounds.minLatitude === 12.50, 'minLatitude is 12.50');
  assert(scope.spatialBounds.maxLatitude === 13.50, 'maxLatitude is 13.50');
  assert(scope.spatialBounds.minLongitude === 79.50, 'minLongitude is 79.50');
  assert(scope.spatialBounds.maxLongitude === 80.40, 'maxLongitude is 80.40');
  assert(scope.coveredDistrictsAndCorridors.length === 4, 'Covers 4 regions (Chennai, Chengalpattu, Kanchipuram, Tiruvallur)');
  assert(scope.interchangeHubs.length >= 8, 'Defines at least 8 verified major interchange hubs');

  // Test 2: Category 2 - Chennai Metro (CMRL)
  console.log('\n--- Suite 2: Chennai Metro (CMRL) Foundation ---');
  const cmrlStationsPath = path.join(dataDir, 'chennai_metro', 'verified_stations.json');
  const cmrlProvPath = path.join(dataDir, 'chennai_metro', 'provenance.json');
  assert(fs.existsSync(cmrlStationsPath), 'CMRL verified_stations.json exists');
  assert(fs.existsSync(cmrlProvPath), 'CMRL provenance.json exists');

  const cmrlStations = JSON.parse(fs.readFileSync(cmrlStationsPath, 'utf8'));
  const cmrlProv = JSON.parse(fs.readFileSync(cmrlProvPath, 'utf8'));

  const cmrlProvCheck = validateProvenance(cmrlProv, 'chennai_metro');
  assert(cmrlProvCheck.valid, 'CMRL provenance contains all mandatory fields and sources');
  assert(cmrlStations.stations.length === 41, 'Contains exactly 41 operational CMRL stations');
  assert(cmrlStations.lines.length === 2, 'Defines Blue Line and Green Line');

  // Check that all CMRL stations have architectural stepFreeAccess design standard
  const allAccessible = cmrlStations.stations.every(s => s.stepFreeAccess === true);
  assert(allAccessible, 'All 41 CMRL stations have architectural step-free provision (design standard)');
  assert(cmrlStations.stations.every(s => s.evidenceStatus === 'cross_checked'), 'All CMRL stations have cross_checked evidence status');

  // Verify key interchanges
  const centralMetro = cmrlStations.stations.find(s => s.code === 'SMC');
  assert(centralMetro && centralMetro.lines.length === 2, 'Central Metro is a dual-line interchange');
  const alandurMetro = cmrlStations.stations.find(s => s.code === 'SAL');
  assert(alandurMetro && alandurMetro.lines.length === 2, 'Alandur Metro is a bi-level dual-line interchange');

  // Test 3: Category 3 - Suburban Rail & MRTS
  console.log('\n--- Suite 3: Southern Railway Suburban & MRTS Foundation ---');
  const srrStationsPath = path.join(dataDir, 'suburban_rail', 'verified_stations.json');
  const srrProvPath = path.join(dataDir, 'suburban_rail', 'provenance.json');
  assert(fs.existsSync(srrStationsPath), 'Suburban verified_stations.json exists');
  assert(fs.existsSync(srrProvPath), 'Suburban provenance.json exists');

  const srrStations = JSON.parse(fs.readFileSync(srrStationsPath, 'utf8'));
  const srrProv = JSON.parse(fs.readFileSync(srrProvPath, 'utf8'));

  const srrProvCheck = validateProvenance(srrProv, 'suburban_rail');
  assert(srrProvCheck.valid, 'Suburban Rail provenance is valid and references SR Chennai Division');
  assert(srrStations.corridors.length === 4, 'Defines 4 suburban corridors (South, West, North, MRTS)');
  assert(srrStations.stations.length >= 60, `Catalog contains ${srrStations.stations.length} verified suburban/MRTS stations`);

  // Verify multi-district spread
  const srrDistricts = new Set(srrStations.stations.map(s => s.district));
  assert(srrDistricts.has('Chennai'), 'Suburban network covers Chennai district');
  assert(srrDistricts.has('Chengalpattu'), 'Suburban network covers Chengalpattu district (Tambaram -> Chengalpattu)');
  assert(srrDistricts.has('Kanchipuram'), 'Suburban network covers Kanchipuram district (Walajabad, Kanchipuram, Tirumalpur)');
  assert(srrDistricts.has('Tiruvallur'), 'Suburban network covers Tiruvallur district (Avadi, Tiruvallur, Gummidipoondi)');

  // Verify MRTS March 2026 extension commissioning
  assert(srrStations.stations.some(s => s.code === 'PRTK'), 'MRTS extension station Puzhuthivakkam (PRTK) is included');
  assert(srrStations.stations.some(s => s.code === 'ADMB'), 'MRTS extension station Adambakkam (ADMB) is included');
  const stmSuburban = srrStations.stations.find(s => s.code === 'STM');
  assert(stmSuburban && stmSuburban.corridors.includes('mrts_line'), 'St. Thomas Mount is linked to mrts_line');

  // Test 4: Category 1 - MTC Bus Network
  console.log('\n--- Suite 4: MTC Bus Network Foundation ---');
  const mtcHubsPath = path.join(dataDir, 'mtc_bus', 'verified_hubs.json');
  const mtcProvPath = path.join(dataDir, 'mtc_bus', 'provenance.json');
  assert(fs.existsSync(mtcHubsPath), 'MTC verified_hubs.json exists');
  assert(fs.existsSync(mtcProvPath), 'MTC provenance.json exists');

  const mtcHubs = JSON.parse(fs.readFileSync(mtcHubsPath, 'utf8'));
  const mtcProv = JSON.parse(fs.readFileSync(mtcProvPath, 'utf8'));

  const mtcProvCheck = validateProvenance(mtcProv, 'mtc_bus');
  assert(mtcProvCheck.valid, 'MTC provenance is valid and notes app-scraped timetable source');
  assert(mtcHubs.interchangeHubs.length >= 20, `Catalog contains ${mtcHubs.interchangeHubs.length} verified MTC bus hubs & terminals`);
  assert(mtcHubs.fareCategories.length === 4, 'Models 4 MTC fare tiers: Ordinary, Express, Deluxe, AC Electric');
  assert(mtcHubs.interchangeHubs.every(h => h.evidenceStatus === 'manually_curated'), 'All MTC hubs tagged with manually_curated evidence status');
  assert(mtcHubs.interchangeHubs.every(h => h.stepFreeAccess === false), 'MTC hubs honestly tagged stepFreeAccess: false due to high-floor fleet');

  // Verify Vidiyal Payanam (free bus) rule
  const ordinaryTier = mtcHubs.fareCategories.find(f => f.code === 'ORD');
  assert(ordinaryTier && ordinaryTier.freeFareEligible === true, 'Ordinary bus fare tier is correctly marked freeFareEligible');
  const deluxeTier = mtcHubs.fareCategories.find(f => f.code === 'DLX');
  assert(deluxeTier && deluxeTier.freeFareEligible === false, 'Deluxe bus tier is correctly marked not freeFareEligible');

  // Test 5: Category 4 - Relevant Express Rail & Mode Isolation
  console.log('\n--- Suite 5: Relevant Express Rail & Strict Mode Isolation ---');
  const expStopsPath = path.join(dataDir, 'express_rail', 'verified_express_stops.json');
  const expProvPath = path.join(dataDir, 'express_rail', 'provenance.json');
  assert(fs.existsSync(expStopsPath), 'Express rail verified_express_stops.json exists');
  assert(fs.existsSync(expProvPath), 'Express rail provenance.json exists');

  const expStops = JSON.parse(fs.readFileSync(expStopsPath, 'utf8'));
  const expProv = JSON.parse(fs.readFileSync(expProvPath, 'utf8'));

  const expProvCheck = validateProvenance(expProv, 'express_rail');
  assert(expProvCheck.valid, 'Express rail provenance is valid');
  assert(expStops.commuterUtilityRules.strictIsolationFromSuburbanEMU === true, 'Strict isolation rule from Suburban EMU is enforced');
  assert(expStops.chennaiBeltStations.length >= 7, 'Identifies key commercial express stops in Chennai belt (MAS, MS, TBM, CGL, PER, TRL, AJJ)');
  assert(expStops.chennaiBeltStations.every(s => s.evidenceStatus === 'cross_checked'), 'All express stops tagged with cross_checked evidence status');

  // Verify ticketing distinction: suburban pass not valid on express
  const expressPassRules = expStops.trainTypes.every(t => t.suburbanSeasonPassAccepted === false);
  assert(expressPassRules, 'Suburban season passes are strictly rejected on Express / Superfast / Vande Bharat trains');

  // Test 6: Coordinate Validation Utility & End-to-End Ingestion Report
  console.log('\n--- Suite 6: Coordinate Bounds Utility & Comprehensive Ingestion Report ---');
  const validCoord = validateCoordinateBounds(13.0827, 80.2707, scope.spatialBounds);
  assert(validCoord.valid === true, 'Validates Chennai Central coordinate within bounds');

  const invalidCoord = validateCoordinateBounds(18.5204, 73.8567, scope.spatialBounds); // Pune coordinates
  assert(invalidCoord.valid === false, 'Rejects coordinate outside Chennai multi-county scope');

  const fullReport = validateTransitData(dataDir);
  assert(fullReport.valid === true, `Full transit dataset validation passed without errors (found ${fullReport.errors.length} errors)`);
  assert(fullReport.categoriesValidated === 4, 'All 4 transport categories validated');
  assert(fullReport.totalNodesValidated > 130, `Total validated stations/hubs: ${fullReport.totalNodesValidated}`);

  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    console.error(`💥 ${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('🎉 All transit data foundation tests passed successfully!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error during transit data test execution:', err);
  process.exit(1);
});
