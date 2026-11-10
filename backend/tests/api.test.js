import http from 'http';
import app from '../server.js';

const TEST_PORT = process.env.TEST_PORT || 5099;
const USE_PIPE = process.platform === 'win32';
const TEST_PIPE = `\\\\.\\pipe\\accessroute-api-test-${process.pid}-${Date.now()}`;
let server;

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

    if (body) {
      req.write(JSON.stringify(body));
    }
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
  console.log('🧪 Starting AccessRoute Backend API Test Suite');
  console.log('==================================================\n');

  server = app.listen(USE_PIPE ? TEST_PIPE : TEST_PORT);
  await new Promise((res) => setTimeout(res, 300));

  try {
    // 1. Health Check
    console.log('1. Testing Health Check (GET /api/health)');
    const healthRes = await makeRequest('/api/health');
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    assert(healthRes.body.status === 'ok', 'Health status is ok');

    // 2. Locations endpoint
    console.log('\n2. Testing Locations API (GET /api/locations)');
    const locRes = await makeRequest('/api/locations');
    assert(locRes.status === 200, 'GET /api/locations returns 200 OK');
    assert(Array.isArray(locRes.body), 'Locations response is an array');
    assert(locRes.body.length >= 2, 'Contains seeded Chennai locations');
    const hasChennaiCentral = locRes.body.some((l) => l.name.includes('Chennai Central'));
    const hasGuindy = locRes.body.some((l) => l.name.includes('Guindy'));
    assert(hasChennaiCentral, 'Contains Chennai Central location');
    assert(hasGuindy, 'Contains Guindy Metro location');

    // 3. Route Search endpoint
    console.log('\n3. Testing Route Search API (POST /api/routes/search)');
    const searchBody = {
      origin: 'location_1',
      destination: 'location_2',
      preferences: {
        wheelchair: true,
        avoidStairs: true,
        minimizeWalking: false,
        voiceGuidance: false
      }
    };
    const searchRes = await makeRequest('/api/routes/search', 'POST', searchBody);
    assert(searchRes.status === 200, 'POST /api/routes/search returns 200 OK');
    assert(Boolean(searchRes.body.recommended), 'Response has "recommended" route');
    assert(Boolean(searchRes.body.fastest), 'Response has "fastest" route');
    assert(Boolean(searchRes.body.lowestCost), 'Response has "lowestCost" route');
    assert(searchRes.body.recommended.accessibility.level === 'highly_accessible', 'Recommended route is highly accessible');
    assert(Array.isArray(searchRes.body.recommended.segments), 'Recommended route has segments array');
    assert(searchRes.body.isIllustrativePreview === true, 'Response explicitly flags illustrative preview');
    assert(searchRes.body.routingMode === 'illustrative_preview', 'Routing mode is illustrative_preview');

    // 3b. Timetable Routing Status API
    console.log('\n3b. Testing Timetable Status API (GET /api/routes/timetable/status)');
    const timetableStatusRes = await makeRequest('/api/routes/timetable/status');
    assert(timetableStatusRes.status === 200, 'GET /api/routes/timetable/status returns 200 OK');
    assert(timetableStatusRes.body.productionRoutingReady === false, 'productionRoutingReady is strictly false in current production state');
    assert(timetableStatusRes.body.eligibleFeedsCount === 0, 'eligibleFeedsCount is 0');
    assert(Boolean(timetableStatusRes.body.modes.chennai_metro), 'Includes Chennai Metro status');
    assert(Boolean(timetableStatusRes.body.modes.suburban_rail), 'Includes Suburban Rail status');
    assert(Boolean(timetableStatusRes.body.modes.mtc_bus), 'Includes MTC Bus status');

    // 3c. Strict Timetable Search API (No Fallback)
    console.log('\n3c. Testing Strict Timetable Search API (POST /api/routes/timetable-search)');
    const timetableSearchRes = await makeRequest('/api/routes/timetable-search', 'POST', searchBody);
    assert(timetableSearchRes.status === 503, 'POST /api/routes/timetable-search returns 503 Service Unavailable when no eligible feeds');
    assert(timetableSearchRes.body.code === 'ROUTING_DATA_UNAVAILABLE', 'Error code is ROUTING_DATA_UNAVAILABLE');
    assert(timetableSearchRes.body.details.productionRoutingReady === false, 'Reports productionRoutingReady as false');
    assert(Array.isArray(timetableSearchRes.body.details.feedBlockers), 'Returns specific feed blockers list');

    // 3d. Route Search with routingMode: 'timetable' (Prevention of Silent Fallback)
    console.log('\n3d. Testing Prevention of Fallback on POST /api/routes/search with routingMode: "timetable"');
    const strictSearchRes = await makeRequest('/api/routes/search', 'POST', {
      ...searchBody,
      routingMode: 'timetable'
    });
    assert(strictSearchRes.status === 503, 'POST /api/routes/search with routingMode: "timetable" returns 503 (no silent fallback)');
    assert(strictSearchRes.body.code === 'ROUTING_DATA_UNAVAILABLE', 'Returns honest ROUTING_DATA_UNAVAILABLE');

    // 4. Route Search Validation Error
    console.log('\n4. Testing Route Search Validation (Missing Fields)');
    const badSearchRes = await makeRequest('/api/routes/search', 'POST', { origin: '' });
    assert(badSearchRes.status === 400, 'Search with missing destination returns 400 Bad Request');
    assert(Boolean(badSearchRes.body.error), 'Returns descriptive error message');

    // 5. Route Details endpoint
    console.log('\n5. Testing Route Details API (GET /api/routes/:routeId)');
    const routeRes = await makeRequest('/api/routes/route_1');
    assert(routeRes.status === 200, 'GET /api/routes/route_1 returns 200 OK');
    assert(routeRes.body.id === 'route_1', 'Returns requested route ID');
    assert(routeRes.body.duration === 38, 'Route duration matches seed');

    const badRouteRes = await makeRequest('/api/routes/non_existent_route_999');
    assert(badRouteRes.status === 404, 'Unknown route ID returns 404 Not Found');

    // 6. Station Accessibility endpoint
    console.log('\n6. Testing Station Accessibility API (GET /api/stations/:stationId)');
    const stationRes = await makeRequest('/api/stations/station_guindy');
    assert(stationRes.status === 200, 'GET /api/stations/station_guindy returns 200 OK');
    assert(stationRes.body.verified === true, 'Station is verified');
    assert(stationRes.body.accessibility.elevators.count === 2, 'Guindy has 2 elevators');
    assert(stationRes.body.accessibility.ramps.available === true, 'Guindy has ramps');
    assert(stationRes.body.accessibility.stepFreeEntrance.gate === 'Gate 2', 'Gate 2 step-free entrance details present');

    const badStationRes = await makeRequest('/api/stations/unknown_station_xyz');
    assert(badStationRes.status === 404, 'Unknown station ID returns 404 Not Found');

    // 7. Issue Reporting endpoint
    console.log('\n7. Testing Issue Reporting API (POST /api/issues)');
    const issueBody = {
      type: 'elevator_broken',
      stationId: 'station_guindy',
      details: 'Elevator B not working',
      userContact: 'optional@test.com'
    };
    const issueRes = await makeRequest('/api/issues', 'POST', issueBody);
    assert(issueRes.status === 201, 'POST /api/issues returns 201 Created');
    assert(issueRes.body.success === true, 'Issue report response success is true');
    assert(Boolean(issueRes.body.issue.id), 'Issue has generated ID');

    // 8. Issue Reporting Validation Error
    console.log('\n8. Testing Issue Reporting Validation');
    const badIssueRes = await makeRequest('/api/issues', 'POST', { type: '' });
    assert(badIssueRes.status === 400, 'Issue with missing fields returns 400 Bad Request');

    // 9. Profile / Impact endpoint
    console.log('\n9. Testing Profile & Impact API (GET /api/profile)');
    const profileRes = await makeRequest('/api/profile');
    assert(profileRes.status === 200, 'GET /api/profile returns 200 OK');
    assert(profileRes.body.user.name === 'Chennai Commuter', 'User name is Chennai Commuter');
    assert(profileRes.body.impact.totalJourneys === 14, 'Total journeys count matches');
    assert(profileRes.body.impact.co2Avoided === 18.4, 'CO2 avoided matches');
    assert(profileRes.body.impact.estimatedSavings === 1240, 'Estimated savings matches');

    // 10. AI Gateway Status
    console.log('\n10. Testing AI Gateway Status (GET /api/ai/status)');
    const aiStatusRes = await makeRequest('/api/ai/status');
    assert(aiStatusRes.status === 200, 'GET /api/ai/status returns 200 OK');
    assert(typeof aiStatusRes.body.configured === 'boolean', 'Status reports configured boolean');
    assert(aiStatusRes.body.model === 'gemini-2.0-flash', 'Model is gemini-2.0-flash');

    // 11. AI Extraction Validation Error (Missing payload)
    console.log('\n11. Testing AI Extraction Validation (POST /api/ai/extract-preferences)');
    const badAiExtractRes = await makeRequest('/api/ai/extract-preferences', 'POST', { text: '' });
    assert(badAiExtractRes.status === 400, 'Empty text returns 400 Bad Request');
    assert(badAiExtractRes.body.field === 'text', 'Validation reports text field error');

    // 12. AI Extraction Missing-Key / Provider-Unavailable Handling
    console.log('\n12. Testing AI Extraction Missing-Key Handling');
    const aiExtractRes = await makeRequest('/api/ai/extract-preferences', 'POST', { text: 'I need wheelchair access to Guindy' });
    // In test environment without valid key, server must gracefully return 503 without crashing
    if (aiStatusRes.body.configured) {
      assert(aiExtractRes.status === 200 || aiExtractRes.status === 502, 'Configured Gemini returns 200 or 502');
    } else {
      assert(aiExtractRes.status === 503, 'Unconfigured Gemini returns 503 Service Unavailable');
      assert(aiExtractRes.body.providerAvailable === false, 'Reports providerAvailable as false');
    }

    // 13. AI Route Explanation Validation Error
    console.log('\n13. Testing AI Route Explanation Validation (POST /api/ai/explain-route)');
    const badAiExplainRes = await makeRequest('/api/ai/explain-route', 'POST', { route: 'not-an-object' });
    assert(badAiExplainRes.status === 400, 'Non-object route returns 400 Bad Request');

    // 14. AI Route Explanation Missing-Key Handling
    console.log('\n14. Testing AI Route Explanation Missing-Key Handling');
    const aiExplainRes = await makeRequest('/api/ai/explain-route', 'POST', { route: { durationMinutes: 38, fare: 25 } });
    if (aiStatusRes.body.configured) {
      assert(aiExplainRes.status === 200 || aiExplainRes.status === 502, 'Configured Gemini returns 200 or 502');
    } else {
      assert(aiExplainRes.status === 503, 'Unconfigured Gemini returns 503 Service Unavailable');
      assert(aiExplainRes.body.providerAvailable === false, 'Reports providerAvailable as false');
    }

    console.log('\n==================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
