import http from 'http';
import app from '../server.js';
import { transitExplorerService } from '../services/transitExplorerService.js';

const TEST_PORT = process.env.TEST_PORT || 5002;
const USE_PIPE = process.platform === 'win32';
const TEST_PIPE = `\\\\.\\pipe\\accessroute-explorer-test-${process.pid}-${Date.now()}`;

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
  console.log('\n==================================================');
  console.log('🧪 Starting AccessRoute Phase 12 Transit Explorer Test Suite');
  console.log('==================================================\n');

  const server = app.listen(USE_PIPE ? TEST_PIPE : TEST_PORT);
  await new Promise((res) => setTimeout(res, 300));

  try {
    // 1. Direct Service Unit Tests
    console.log('--- Suite 1: Transit Explorer Service Unit Tests ---');
    const network = transitExplorerService.getNetwork();
    assert(network.totalStations === 140, 'Loads all 140 verified stations and hubs');
    assert(network.modes.chennai_metro.count === 41, 'Contains exactly 41 Chennai Metro stations');
    assert(network.modes.suburban_rail.count === 70, 'Contains exactly 70 Suburban Rail stations');
    assert(network.modes.mtc_bus.count === 21, 'Contains exactly 21 MTC bus hubs');
    assert(network.modes.express_rail.count === 8, 'Contains exactly 8 Express Rail stations');
    assert(network.corridors.length === 6, 'Contains 6 verified transit corridors');

    // 2. Network Endpoint Test
    console.log('\n--- Suite 2: GET /api/transit/network ---');
    const netRes = await makeRequest('/api/transit/network');
    assert(netRes.status === 200, 'GET /api/transit/network returns 200 OK');
    assert(netRes.body.totalStations === 140, 'Network summary reports 140 total stations');
    assert(Boolean(netRes.body.modes.chennai_metro), 'Includes Metro mode metadata');
    assert(Boolean(netRes.body.modes.suburban_rail), 'Includes Suburban Rail metadata');
    assert(Boolean(netRes.body.modes.mtc_bus), 'Includes MTC Bus metadata');
    assert(Boolean(netRes.body.modes.express_rail), 'Includes Express Rail metadata');

    // 3. Stations Endpoint Test (All stations)
    console.log('\n--- Suite 3: GET /api/transit/stations ---');
    const stRes = await makeRequest('/api/transit/stations');
    assert(stRes.status === 200, 'GET /api/transit/stations returns 200 OK');
    assert(stRes.body.count === 140, 'Returns 140 stations');
    assert(Array.isArray(stRes.body.stations), 'Stations is an array');

    // 4. Mode Filtering Tests
    console.log('\n--- Suite 4: Mode Visibility Filtering ---');
    const metroRes = await makeRequest('/api/transit/stations?mode=chennai_metro');
    assert(metroRes.status === 200, 'Filter by Metro returns 200 OK');
    assert(metroRes.body.count === 41, 'Filter by Metro returns exactly 41 stations');
    assert(metroRes.body.stations.every((s) => s.mode === 'chennai_metro'), 'All returned stations are Metro');

    const srrRes = await makeRequest('/api/transit/stations?mode=suburban_rail');
    assert(srrRes.status === 200, 'Filter by Suburban Rail returns 200 OK');
    assert(srrRes.body.count === 70, 'Filter by Suburban Rail returns exactly 70 stations');
    assert(srrRes.body.stations.every((s) => s.mode === 'suburban_rail'), 'All returned stations are Suburban');

    const mtcRes = await makeRequest('/api/transit/stations?mode=mtc_bus');
    assert(mtcRes.status === 200, 'Filter by MTC Bus returns 200 OK');
    assert(mtcRes.body.count === 21, 'Filter by MTC Bus returns exactly 21 hubs');
    assert(mtcRes.body.stations.every((s) => s.mode === 'mtc_bus'), 'All returned stations are MTC Bus');

    const expRes = await makeRequest('/api/transit/stations?mode=express_rail');
    assert(expRes.status === 200, 'Filter by Express Rail returns 200 OK');
    assert(expRes.body.count === 8, 'Filter by Express Rail returns exactly 8 stops');
    assert(expRes.body.stations.every((s) => s.mode === 'express_rail'), 'All returned stations are Express');

    // 5. Station Search Query Tests
    console.log('\n--- Suite 5: Station & Locality Search ---');
    const searchGuindy = await makeRequest('/api/transit/stations?q=Guindy');
    assert(searchGuindy.status === 200, 'Search for "Guindy" returns 200 OK');
    assert(searchGuindy.body.count >= 2, 'Search for "Guindy" returns both Metro and Suburban stations');
    assert(searchGuindy.body.stations.some((s) => s.code === 'SGD'), 'Matches Guindy Metro (SGD)');
    assert(searchGuindy.body.stations.some((s) => s.code === 'GDY'), 'Matches Guindy Suburban (GDY)');

    const searchAirport = await makeRequest('/api/transit/stations?q=Airport');
    assert(searchAirport.body.count >= 1, 'Search for "Airport" finds Chennai Airport');
    assert(searchAirport.body.stations[0].code === 'SAP', 'Airport station code is SAP');

    const searchCode = await makeRequest('/api/transit/stations?q=BWAY');
    assert(searchCode.body.count === 1, 'Search by station code "BWAY" matches Broadway Terminus');

    // 6. Corridor Sequence & Network Alignment
    console.log('\n--- Suite 6: Corridor Alignment & Station Sequences ---');
    const corrRes = await makeRequest('/api/transit/corridors');
    assert(corrRes.status === 200, 'GET /api/transit/corridors returns 200 OK');
    assert(corrRes.body.count === 6, 'Contains 6 corridors');

    const blueLine = corrRes.body.corridors.find((c) => c.id === 'blue_line');
    assert(Boolean(blueLine), 'Blue line corridor exists');
    assert(blueLine.stationCodes[0] === 'SWND', 'Blue line starts at Wimco Nagar Depot (SWND)');
    assert(blueLine.stationCodes[blueLine.stationCodes.length - 1] === 'SAP', 'Blue line terminates at Chennai Airport (SAP)');
    assert(blueLine.stations.length === 26, 'Blue line contains 26 verified stations');

    const southLine = corrRes.body.corridors.find((c) => c.id === 'south_line');
    assert(Boolean(southLine), 'South line corridor exists');
    assert(southLine.stationCodes[0] === 'MSB', 'South line starts at Chennai Beach (MSB)');
    assert(southLine.stationCodes[southLine.stationCodes.length - 1] === 'TMLP', 'South line reaches Tirumalpur (TMLP)');
    assert(southLine.stations.length === 31, 'South line contains 31 verified stations');

    // 7. Data Transparency & Status Labeling
    console.log('\n--- Suite 7: Data Transparency & Status Enforcement ---');
    const swndRes = await makeRequest('/api/transit/stations/cmrl_swnd');
    assert(swndRes.status === 200, 'GET /api/transit/stations/cmrl_swnd returns 200 OK');
    assert(swndRes.body.evidenceStatus === 'cross_checked', 'Wimco Depot has cross_checked evidence status');
    assert(swndRes.body.timetableStatus === 'EXPIRED_CALENDAR', 'Wimco Depot timetable status is EXPIRED_CALENDAR');
    assert(swndRes.body.timetableNote.includes('expired'), 'Timetable note clearly explains calendar expiration');
    assert(swndRes.body.stepFreeAccess === true, 'CMRL station is step-free');

    const bwayRes = await makeRequest('/api/transit/stations/mtc_bway');
    assert(bwayRes.status === 200, 'GET /api/transit/stations/mtc_bway returns 200 OK');
    assert(bwayRes.body.stepFreeAccess === false, 'MTC Bus hub honestly flagged stepFreeAccess false (high floor)');
    assert(bwayRes.body.timetableStatus === 'COMMUNITY_APP_SCRAPE', 'MTC hub timetable status is COMMUNITY_APP_SCRAPE');

    const expMasRes = await makeRequest('/api/transit/stations/exp_mas');
    assert(expMasRes.status === 200, 'GET /api/transit/stations/exp_mas returns 200 OK');
    assert(expMasRes.body.timetableStatus === 'NO_TIMETABLE_DATASET', 'Express station timetable status is NO_TIMETABLE_DATASET');

    // 8. Integration with /api/stations/:id
    console.log('\n--- Suite 8: Station Accessibility Lookup Integration ---');
    const srrStationRes = await makeRequest('/api/stations/srr_msb');
    assert(srrStationRes.status === 200, 'GET /api/stations/srr_msb returns 200 OK');
    assert(srrStationRes.body.name === 'Chennai Beach', 'Resolves Chennai Beach by ID');
    assert(srrStationRes.body.verified === true, 'Chennai Beach is verified');

    const nonExistent = await makeRequest('/api/transit/stations/non_existent_node');
    assert(nonExistent.status === 404, 'Unknown station returns 404 Not Found');

    console.log('\n==================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('==================================================\n');

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
