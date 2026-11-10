import http from 'http';
import app from '../server.js';
import { geoRoutingService, GeoRoutingService } from '../services/geoRoutingService.js';
import { validateAndResolveLocation, isCoordinateWithinChennai, CHENNAI_COVERAGE_MESSAGE } from '../services/coverageService.js';
import { PEDESTRIAN_INFRASTRUCTURE, getPedestrianFeatures } from '../services/pedestrianService.js';

const TEST_PORT = process.env.TEST_PORT || 5015;
const USE_PIPE = process.platform === 'win32';
const TEST_PIPE = `\\\\.\\pipe\\accessroute-georouting-test-${process.pid}-${Date.now()}`;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = USE_PIPE
      ? {
          socketPath: TEST_PIPE,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {})
          }
        }
      : {
          hostname: '127.0.0.1',
          port: TEST_PORT,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {})
          }
        };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

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
  console.log('🧪 Starting AccessRoute Phase 13 Geo Routing Test Suite');
  console.log('======================================================\n');

  const server = app.listen(USE_PIPE ? TEST_PIPE : TEST_PORT);
  await new Promise((res) => setTimeout(res, 300));

  try {
    // --- 1. Scenario 1: Tambaram to Chennai Central ---
    console.log('--- Scenario 1: Tambaram to Chennai Central ---');
    const sc1 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Tambaram',
      destination: 'Chennai Central',
      profile: 'driving'
    });
    assert(sc1.status === 200, 'POST /api/geo/route (Tambaram -> Central) returns 200 OK');
    assert(sc1.body.routingMode === 'geographical', 'Routing mode is geographical');
    assert(sc1.body.isVerifiedPublicTransport === false, 'Explicitly NOT a public transport claim');
    assert(sc1.body.distanceMeters > 20000, `Distance is realistic (> 20 km, got ${sc1.body.distanceMeters}m)`);
    assert(sc1.body.durationSeconds > 0, `Duration is calculated (${sc1.body.durationMinutes} min)`);
    assert(Array.isArray(sc1.body.coordinates) && sc1.body.coordinates.length >= 2, 'Returns route geometry coordinates');

    // --- 2. Scenario 2: Chennai Central to Airport ---
    console.log('\n--- Scenario 2: Chennai Central to Airport ---');
    const sc2 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Chennai Central',
      destination: 'Chennai Airport',
      profile: 'driving'
    });
    assert(sc2.status === 200, 'POST /api/geo/route (Central -> Airport) returns 200 OK');
    assert(sc2.body.origin.name.includes('Central'), 'Origin correctly resolved to Central');
    assert(sc2.body.destination.name.includes('Airport'), 'Destination correctly resolved to Airport');
    assert(sc2.body.distanceMeters > 15000, 'Distance from Central to Airport is > 15km');

    // --- 3. Scenario 3: Tambaram to a Supported Metro Interchange (Guindy) ---
    console.log('\n--- Scenario 3: Tambaram to Supported Metro Interchange (Guindy) ---');
    const sc3 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Tambaram',
      destination: 'Guindy',
      profile: 'walking'
    });
    assert(sc3.status === 200, 'POST /api/geo/route (Tambaram -> Guindy) returns 200 OK');
    assert(sc3.body.profile === 'walking', 'Route profile is walking');
    assert(sc3.body.distanceMeters > 10000, 'Walking distance is calculated');
    assert(Boolean(sc3.body.accessibility), 'Contains accessibility metadata');

    // --- 4. Scenario 4: Two Nearby Supported Chennai Locations (Central to Egmore) ---
    console.log('\n--- Scenario 4: Two Nearby Supported Chennai Locations (Central to Egmore) ---');
    const sc4 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Chennai Central',
      destination: 'Egmore',
      profile: 'walking'
    });
    assert(sc4.status === 200, 'POST /api/geo/route (Central -> Egmore) returns 200 OK');
    assert(sc4.body.distanceMeters >= 1000 && sc4.body.distanceMeters <= 5000, `Nearby distance is realistic (${sc4.body.distanceMeters}m)`);
    assert(sc4.body.steps.length >= 2, 'Turn-by-turn or topological steps included');

    // --- 5. Scenario 5: Journey Requiring a Pedestrian Connection ---
    console.log('\n--- Scenario 5: Journey Requiring a Pedestrian Connection ---');
    const sc5 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Saidapet',
      destination: 'Guindy',
      profile: 'walking',
      preferences: { wheelchair: true }
    });
    assert(sc5.status === 200, 'POST /api/geo/route (Saidapet -> Guindy) returns 200 OK');
    assert(sc5.body.accessibility.isStepFree === true, 'Wheelchair preference enforces step-free connectivity');
    assert(sc5.body.accessibility.infrastructure.elevators.length > 0, 'Detects pedestrian elevator connections along route');

    // --- 6. Scenario 6: Route Where Stairs Should Be Avoided ---
    console.log('\n--- Scenario 6: Route Where Stairs Should Be Avoided ---');
    const sc6 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Chennai Central',
      destination: 'Guindy',
      profile: 'walking',
      preferences: { avoidStairs: true }
    });
    assert(sc6.status === 200, 'POST /api/geo/route (Avoid Stairs) returns 200 OK');
    assert(sc6.body.accessibility.avoidStairsApplied === true, 'avoidStairsApplied is true');
    assert(sc6.body.accessibility.stairsBypassed === true || sc6.body.accessibility.hasStairs === false, 'Stairs avoided or bypassed by ramps/elevators');

    // --- 7. Scenario 7: Route Where Elevator Information is Unknown ---
    console.log('\n--- Scenario 7: Route Where Elevator Information is Unknown ---');
    const sc7 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Perungalathur',
      destination: 'Vandalur',
      profile: 'walking',
      preferences: { wheelchair: true }
    });
    assert(sc7.status === 200, 'POST /api/geo/route (Perungalathur -> Vandalur) returns 200 OK');
    assert(sc7.body.accessibility.confidence === 'unknown' || sc7.body.accessibility.confidence === 'provisional', 'Honest confidence status (not promised verified)');
    assert(!sc7.body.accessibility.confidenceLabel.includes('guarantee'), 'Does not fabricate false step-free guarantees');

    // --- 8. Scenario 8: Bengaluru to Chennai (Scope Rejection) ---
    console.log('\n--- Scenario 8: Bengaluru to Chennai (Scope Rejection) ---');
    const sc8 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Bengaluru',
      destination: 'Chennai Central'
    });
    assert(sc8.status === 400, 'POST /api/geo/route (Bengaluru -> Chennai) returns 400 Bad Request');
    assert(sc8.body.code === 'OUT_OF_COVERAGE', 'Error code is OUT_OF_COVERAGE');
    assert(sc8.body.error.includes('Chennai and its connected transit network'), 'Returns clear message: AccessRoute currently supports Chennai and its connected transit network');

    // --- 9. Scenario 9: Bengaluru to Bengaluru (Scope Rejection) ---
    console.log('\n--- Scenario 9: Bengaluru to Bengaluru (Scope Rejection) ---');
    const sc9 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Bengaluru',
      destination: 'Bangalore'
    });
    assert(sc9.status === 400, 'POST /api/geo/route (Bengaluru -> Bengaluru) returns 400 Bad Request');
    assert(sc9.body.code === 'OUT_OF_COVERAGE', 'Error code is OUT_OF_COVERAGE');

    // --- 10. Scenario 10: Unsupported or Invalid Destination ---
    console.log('\n--- Scenario 10: Unsupported or Invalid Destination ---');
    const sc10 = await makeRequest('/api/geo/route', 'POST', {
      origin: 'Chennai Central',
      destination: 'Random Nonexistent City XYZ 9999'
    });
    assert(sc10.status === 400, 'POST /api/geo/route (Unsupported destination) returns 400 Bad Request');
    assert(sc10.body.code === 'OUT_OF_COVERAGE' || sc10.body.code === 'INVALID_DESTINATION', 'Flags out of coverage / invalid destination');

    // --- 11. Scenario 11: Unavailable Routing Provider (Topological Fallback Graceful Handling) ---
    console.log('\n--- Scenario 11: Unavailable Routing Provider (Topological Fallback Handling) ---');
    const fallbackRouter = new GeoRoutingService();
    // Force OSRM method to reject to simulate total external network outage
    fallbackRouter.queryOSRM = () => Promise.reject(new Error('Network simulated offline'));
    const sc11 = await fallbackRouter.calculateRoute({
      origin: 'Tambaram',
      destination: 'Guindy',
      profile: 'walking'
    });
    assert(Boolean(sc11), 'Topological fallback returns valid route structure during external outage');
    assert(sc11.fallbackUsed === true, 'Flags fallbackUsed: true');
    assert(sc11.distanceMeters > 0, 'Distance is calculated');
    assert(sc11.coordinates.length >= 2, 'Route polyline coordinates generated');
    assert(sc11.isVerifiedPublicTransport === false, 'Strictly preserves public transport isolation');

    // --- 12. Scenario 12: Failed Geocoding Request ---
    console.log('\n--- Scenario 12: Failed Geocoding Request ---');
    const sc12a = await makeRequest('/api/geo/geocode?q=Mumbai');
    assert(sc12a.status === 400, 'GET /api/geo/geocode?q=Mumbai returns 400 Bad Request');
    assert(sc12a.body.supported === false, 'Supported is false for non-Chennai city');
    assert(sc12a.body.notice.includes('Chennai and its connected transit network'), 'Returns Chennai network notice');

    const sc12b = await makeRequest('/api/geo/geocode?q=');
    assert(sc12b.status === 400, 'GET /api/geo/geocode?q= (empty) returns 400 Bad Request');

    const sc12c = await makeRequest('/api/geo/geocode?q=Tambaram');
    assert(sc12c.status === 200, 'GET /api/geo/geocode?q=Tambaram returns 200 OK');
    assert(sc12c.body.supported === true, 'Tambaram is supported');
    assert(isCoordinateWithinChennai(sc12c.body.coordinates[1], sc12c.body.coordinates[0]), 'Tambaram coordinates inside Chennai bounds');

    // --- 13. Pedestrian Infrastructure Endpoints & Integrity ---
    console.log('\n--- Suite 13: Pedestrian Infrastructure Inventory ---');
    const pedRes = await makeRequest('/api/geo/pedestrian');
    assert(pedRes.status === 200, 'GET /api/geo/pedestrian returns 200 OK');
    assert(pedRes.body.totalCount >= 20, `Contains at least 20 curated pedestrian features (got ${pedRes.body.totalCount})`);

    const hasStairs = pedRes.body.features.some((f) => f.type === 'stairs');
    const hasElevators = pedRes.body.features.some((f) => f.type === 'elevator');
    const hasFootbridges = pedRes.body.features.some((f) => f.type === 'footbridge');
    const hasUnderpasses = pedRes.body.features.some((f) => f.type === 'underpass');
    const hasRamps = pedRes.body.features.some((f) => f.type === 'ramp');
    const hasEntrances = pedRes.body.features.some((f) => f.type === 'step_free_entrance');
    const hasCrossings = pedRes.body.features.some((f) => f.type === 'crossing');

    assert(hasStairs, 'Includes verified stairs');
    assert(hasElevators, 'Includes verified elevators');
    assert(hasFootbridges, 'Includes verified footbridges');
    assert(hasUnderpasses, 'Includes verified underpasses');
    assert(hasRamps, 'Includes verified ramps');
    assert(hasEntrances, 'Includes verified step-free entrances');
    assert(hasCrossings, 'Includes verified pedestrian crossings');

    const hasVerified = pedRes.body.features.some((f) => f.status === 'verified');
    const hasProvisional = pedRes.body.features.some((f) => f.status === 'provisional');
    const hasUnknown = pedRes.body.features.some((f) => f.status === 'unknown');
    assert(hasVerified, 'Includes verified confidence status');
    assert(hasProvisional, 'Includes provisional confidence status');
    assert(hasUnknown, 'Includes unknown confidence status');

    // --- 14. Autocomplete Coverage Verification ---
    console.log('\n--- Suite 14: Chennai Autocomplete ---');
    const autoRes = await makeRequest('/api/geo/autocomplete?q=Guindy');
    assert(autoRes.status === 200, 'GET /api/geo/autocomplete?q=Guindy returns 200 OK');
    assert(autoRes.body.outOfScope === false, 'Guindy is not out of scope');
    assert(autoRes.body.results.length >= 2, 'Finds Metro and Suburban Guindy matches');

    const autoBengaluru = await makeRequest('/api/geo/autocomplete?q=Bengaluru');
    assert(autoBengaluru.status === 200, 'GET /api/geo/autocomplete?q=Bengaluru returns 200 OK');
    assert(autoBengaluru.body.outOfScope === true, 'Bengaluru flagged out of scope');
    assert(autoBengaluru.body.results.length === 0, 'Zero results for out-of-scope city');

    // --- 15. Standard Route Search Scope Enforcement ---
    console.log('\n--- Suite 15: POST /api/routes/search Scope Enforcement ---');
    const outSearch = await makeRequest('/api/routes/search', 'POST', {
      origin: 'Bengaluru',
      destination: 'Chennai Central'
    });
    assert(outSearch.status === 400, 'POST /api/routes/search rejects Bengaluru origin with 400');
    assert(outSearch.body.code === 'OUT_OF_COVERAGE', 'Returns OUT_OF_COVERAGE error code');
    assert(outSearch.body.error.includes('Chennai and its connected transit network'), 'Returns clear Chennai coverage message');

    console.log('\n======================================================');
    console.log(`📊 Geo Routing Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();

