import http from 'http';
import app from '../server.js';

const TEST_PORT = 5099;
let server;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
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

  server = app.listen(TEST_PORT);
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
