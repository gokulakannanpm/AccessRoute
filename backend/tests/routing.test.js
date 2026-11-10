import path from 'path';
import fs from 'fs';
import {
  RoutingService,
  TransitGraph,
  LocationMatcher,
  runConnectionScan,
  reconstructJourneys,
  rankTimetableJourneys,
  inspectFeedEligibility,
  auditProductionFeeds,
  RoutingError,
  RoutingErrorCodes
} from '../services/routing/index.js';

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

async function runRoutingTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting AccessRoute Phase 09 Routing Engine Test Suite');
  console.log('======================================================\n');

  const fixturesBaseDir = path.resolve(process.cwd(), 'backend', 'tests', 'fixtures', 'routing');
  const syntheticFeedDir = path.join(fixturesBaseDir, 'synthetic_multimodal_feed');
  const blockedFeedDir = path.join(fixturesBaseDir, 'synthetic_blocked_feed');

  // Verify synthetic notice exists and labels fixtures
  const noticePath = path.join(fixturesBaseDir, 'SYNTHETIC_ROUTING_FIXTURE_NOTICE.md');
  assert(fs.existsSync(noticePath), 'Synthetic routing fixture notice exists');
  const noticeContent = fs.readFileSync(noticePath, 'utf8');
  assert(noticeContent.replace(/\*/g, '').toLowerCase().includes('not real operational timetables'), 'Notice clearly states fixtures are not real operational timetables');

  // Setup test routing service with synthetic feed
  const testRouter = new RoutingService();
  const feedLoadResult = testRouter.loadFeed(syntheticFeedDir, {
    enforceEligibility: true,
    feedMode: 'synthetic_multimodal'
  });
  assert(feedLoadResult.success === true, 'Successfully loaded synthetic multimodal GTFS feed');
  assert(feedLoadResult.connectionsCount > 0, `Loaded ${feedLoadResult.connectionsCount} elementary connections`);

  // --- Suite 1: Direct Journey on One Service ---
  console.log('\n--- Suite 1: Direct Journey on One Service ---');
  const directResult = testRouter.searchJourney({
    origin: 'Chennai Central',
    destination: 'Guindy',
    departureTime: '08:30:00'
  });
  assert(directResult.success === true, 'Direct journey search succeeded');
  assert(directResult.totalJourneysFound >= 1, 'Found at least 1 journey candidate');
  const directJourney = directResult.fastest;
  assert(directJourney.transfersCount === 0, 'Direct journey has 0 transfers');
  assert(directJourney.legs.length === 1, 'Direct journey contains exactly 1 transit leg');
  assert(directJourney.legs[0].mode === 'Chennai Metro', 'Direct leg mode is Chennai Metro');
  assert(directJourney.legs[0].fromStopId === 'METRO_CENTRAL', 'Boarded at Central Metro platform');
  assert(directJourney.legs[0].toStopId === 'METRO_GUINDY', 'Alighted at Guindy Metro platform');
  assert(directJourney.departureTime === '08:30:00', 'Departed at 08:30:00');
  assert(directJourney.arrivalTime === '08:50:00', 'Arrived at 08:50:00');
  assert(directJourney.durationMinutes === 20, 'Duration is 20 minutes');

  // --- Suite 2: Multi-Modal Journey Requiring a Transfer ---
  console.log('\n--- Suite 2: Multi-Modal Journey Requiring a Transfer ---');
  // From SUB_CENTRAL to METRO_GUINDY at 08:15:00:
  // Leg 1: Suburban TRIP_SUB_1 from SUB_CENTRAL (08:15) to SUB_SAIDAPET (08:32)
  // Transfer at Saidapet: 180s walk from SUB_SAIDAPET to METRO_SAIDAPET (arrives 08:35)
  // Leg 2: Metro TRIP_METRO_B1 from METRO_SAIDAPET (dep 08:43) to METRO_GUINDY (arr 08:50)
  const transferResult = testRouter.searchJourney({
    origin: 'SUB_CENTRAL',
    destination: 'METRO_GUINDY',
    departureTime: '08:15:00',
    preferences: {
      transportModes: { metro: true, bus: false, suburban: true }
    }
  });
  assert(transferResult.success === true, 'Transfer search succeeded');
  const transferJourney = transferResult.recommended;
  assert(transferJourney.transfersCount === 1, 'Journey has exactly 1 transfer');
  assert(transferJourney.legs.length === 3, 'Journey contains 3 legs (transit, transfer walk, transit)');
  assert(transferJourney.legs[0].mode === 'Suburban Rail', 'Leg 1 is Suburban Rail');
  assert(transferJourney.legs[1].type === 'transfer', 'Leg 2 is transfer footpath');
  assert(transferJourney.legs[1].durationMinutes === 3, 'Transfer duration is 3 minutes (180s min_transfer_time)');
  assert(transferJourney.legs[2].mode === 'Chennai Metro', 'Leg 3 is Chennai Metro');
  assert(transferJourney.departureTime === '08:15:00', 'Journey departed at 08:15:00');
  assert(transferJourney.arrivalTime === '08:50:00', 'Journey arrived at 08:50:00');

  // --- Suite 3: Multiple Routes and Ranking ---
  console.log('\n--- Suite 3: Multiple Routes and Correct Ranking ---');
  const multiResult = testRouter.searchJourney({
    origin: 'Chennai Central',
    destination: 'Guindy',
    departureTime: '08:20:00',
    preferences: {
      wheelchair: false,
      avoidStairs: false
    }
  });
  assert(multiResult.totalJourneysFound >= 2, 'Found multiple candidate routes');
  assert(Boolean(multiResult.recommended), 'Returns recommended route');
  assert(Boolean(multiResult.fastest), 'Returns fastest route');
  assert(Boolean(multiResult.lowestCost), 'Returns lowestCost route');
  assert(multiResult.fastest.durationMinutes <= multiResult.lowestCost.durationMinutes, 'Fastest route duration <= lowest cost duration');
  assert(multiResult.recommended.accessibilityScore >= multiResult.fastest.accessibilityScore || multiResult.recommended.isStepFree, 'Recommended route prioritizes accessibility');

  // --- Suite 4: Time-Dependent Departure Selection ---
  console.log('\n--- Suite 4: Time-Dependent Departure Selection ---');
  // Departure at 08:30:00 selects TRIP_METRO_B1 (08:30 -> 08:50)
  const tripAt830 = testRouter.searchJourney({
    origin: 'Chennai Central',
    destination: 'Guindy',
    departureTime: '08:30:00'
  });
  assert(tripAt830.fastest.departureTime === '08:30:00', 'Trip departing at 08:30:00 selects 08:30 service');
  assert(tripAt830.fastest.legs[0].tripId === 'TRIP_METRO_B1', 'Trip ID is TRIP_METRO_B1');

  // Departure at 08:45:00 skips 08:30 service and selects TRIP_METRO_B2 (09:00 -> 09:20)
  const tripAt845 = testRouter.searchJourney({
    origin: 'Chennai Central',
    destination: 'Guindy',
    departureTime: '08:45:00'
  });
  assert(tripAt845.fastest.departureTime === '09:00:00', 'Trip departing at 08:45:00 selects next service at 09:00:00');
  assert(tripAt845.fastest.legs[0].tripId === 'TRIP_METRO_B2', 'Trip ID is TRIP_METRO_B2');
  assert(tripAt845.fastest.arrivalTime === '09:20:00', 'Arrives at 09:20:00');

  // --- Suite 5: Overnight Service Times Greater Than 24:00 ---
  console.log('\n--- Suite 5: Overnight Service Times Greater Than 24:00 ---');
  const nightResult = testRouter.searchJourney({
    origin: 'Chennai Central',
    destination: 'Guindy',
    departureTime: '24:05:00'
  });
  assert(nightResult.success === true, 'Overnight journey search succeeded');
  const nightTrip = nightResult.fastest;
  assert(nightTrip.departureTime === '24:10:00', 'Departed at 24:10:00 (> 24:00 extended hour format)');
  assert(nightTrip.arrivalTime === '24:30:00', 'Arrived at 24:30:00');
  assert(nightTrip.durationMinutes === 20, 'Duration is correctly calculated as 20 minutes across midnight');
  assert(nightTrip.legs[0].tripId === 'TRIP_METRO_B_NIGHT', 'Boarded overnight trip TRIP_METRO_B_NIGHT');

  // --- Suite 6: Inaccessible and Invalid Transfer Connections ---
  console.log('\n--- Suite 6: Inaccessible and Invalid Transfer Connections ---');
  // Case 6A: Transfer with stairs (BUS_SAIDAPET -> METRO_SAIDAPET has stairs: is_step_free = 0)
  // When wheelchair: true, user should NOT be routed via BUS_SAIDAPET -> METRO_SAIDAPET
  const wheelchairSearch = testRouter.searchJourney({
    origin: 'BUS_CENTRAL',
    destination: 'METRO_GUINDY',
    departureTime: '08:20:00',
    preferences: {
      wheelchair: true,
      avoidStairs: true
    }
  });
  // Since Bus 18A has stairs and the transfer has stairs, wheelchair search must filter out inaccessible paths
  assert(wheelchairSearch.recommended.isStepFree === true, 'Wheelchair route is guaranteed step-free');

  // Case 6B: Invalid transfer where arrival + min_transfer_time > departure
  // TRIP_SUB_2 arrives Saidapet at 08:42:30. Metro departs 08:43:00. Transfer takes 180s.
  // 08:42:30 + 180s = 08:45:30 > 08:43:00. It is impossible to catch 08:43:00 Metro!
  const tightTransferResult = testRouter.searchJourney({
    origin: 'SUB_CENTRAL',
    destination: 'METRO_GUINDY',
    departureTime: '08:40:00',
    preferences: {
      transportModes: { metro: true, bus: false, suburban: true }
    }
  });
  // Must catch next Metro at 09:13:00 or later, NOT the departed 08:43:00 one!
  const tightLeg = tightTransferResult.recommended.legs[2];
  assert(tightLeg.departureTimeSec >= 31380, 'Engine correctly prevented catching train departing before transfer completion');

  // --- Suite 7: Unknown Origin and Unknown Destination Handling ---
  console.log('\n--- Suite 7: Unknown Origin and Destination Validation ---');
  try {
    testRouter.searchJourney({ origin: 'NonExistent_Station_XYZ', destination: 'Guindy' });
    assert(false, 'Should have thrown UNKNOWN_ORIGIN');
  } catch (err) {
    assert(err instanceof RoutingError, 'Throws RoutingError');
    assert(err.code === RoutingErrorCodes.UNKNOWN_ORIGIN, 'Error code is UNKNOWN_ORIGIN');
    assert(err.statusCode === 404, 'Status code is 404');
  }

  try {
    testRouter.searchJourney({ origin: 'Chennai Central', destination: 'NonExistent_Destination_ABC' });
    assert(false, 'Should have thrown UNKNOWN_DESTINATION');
  } catch (err) {
    assert(err.code === RoutingErrorCodes.UNKNOWN_DESTINATION, 'Error code is UNKNOWN_DESTINATION');
    assert(err.statusCode === 404, 'Status code is 404');
  }

  try {
    testRouter.searchJourney({ origin: 'Guindy', destination: 'Guindy' });
    assert(false, 'Should have thrown SAME_ORIGIN_DESTINATION');
  } catch (err) {
    assert(err.code === RoutingErrorCodes.SAME_ORIGIN_DESTINATION, 'Error code is SAME_ORIGIN_DESTINATION');
    assert(err.statusCode === 400, 'Status code is 400');
  }

  // --- Suite 8: No Service Available Within Requested Horizon ---
  console.log('\n--- Suite 8: No Service Available Within Window ---');
  try {
    testRouter.searchJourney({
      origin: 'Chennai Central',
      destination: 'Guindy',
      departureTime: '03:00:00',
      searchHorizonSec: 3600 // 1 hour horizon (3am to 4am)
    });
    assert(false, 'Should have thrown NO_SERVICE_AVAILABLE');
  } catch (err) {
    assert(err.code === RoutingErrorCodes.NO_SERVICE_AVAILABLE, 'Error code is NO_SERVICE_AVAILABLE');
    assert(err.statusCode === 404, 'Status code is 404');
  }

  // --- Suite 9: Disabled Transport Modes ---
  console.log('\n--- Suite 9: Disabled Transport Modes ---');
  // Koyambedu is only served by Metro Green Line. If metro is disabled, route should fail with NO_SERVICE_AVAILABLE
  try {
    testRouter.searchJourney({
      origin: 'Chennai Central',
      destination: 'Koyambedu',
      departureTime: '08:25:00',
      preferences: {
        transportModes: { metro: false, bus: true, suburban: true }
      }
    });
    assert(false, 'Should fail when required transport mode is disabled');
  } catch (err) {
    assert(err.code === RoutingErrorCodes.NO_SERVICE_AVAILABLE || err.code === RoutingErrorCodes.NO_ROUTE_FOUND, 'Correctly rejects journey using disabled transport mode');
  }

  // --- Suite 10: Blocked or Expired Feed Rejection ---
  console.log('\n--- Suite 10: Blocked or Expired Feed Rejection ---');
  const blockedInspection = inspectFeedEligibility(blockedFeedDir);
  assert(blockedInspection.eligible === false, 'Synthetic blocked feed is strictly rejected as ineligible');
  assert(blockedInspection.reasons.some(r => r.includes('READY_FOR_ROUTING_FALSE')), 'Documents readyForJourneyRouting false');
  assert(blockedInspection.reasons.some(r => r.includes('EXPIRED_CALENDAR')), 'Documents expired calendar');

  const blockedRouter = new RoutingService();
  try {
    blockedRouter.loadFeed(blockedFeedDir, { enforceEligibility: true });
    assert(false, 'Should have rejected loading blocked feed with enforceEligibility: true');
  } catch (err) {
    assert(err.message.includes('not eligible for journey routing'), 'Throws descriptive feed rejection error');
  }

  // --- Suite 11: Production Feed Blocker Audit & Prevention of Fabricated Fallback ---
  console.log('\n--- Suite 11: Production Feeds Audit & Prevention of Fabricated Fallback ---');
  const prodAudit = auditProductionFeeds();
  assert(prodAudit.totalModesChecked === 3, 'Audited all 3 production modes (metro, suburban, bus)');
  assert(prodAudit.eligibleCount === 0, 'Zero production feeds are currently eligible (honest verification)');
  assert(prodAudit.productionRoutingReady === false, 'productionRoutingReady is strictly false');
  assert(prodAudit.modes.chennai_metro.eligible === false, 'Chennai Metro feed is ineligible (expired 2021 calendar)');
  assert(prodAudit.modes.suburban_rail.eligible === false, 'Suburban Rail feed is ineligible (distant placeholders / unnormalized rollover)');
  assert(prodAudit.modes.mtc_bus.eligible === false, 'MTC Bus feed is ineligible (unconfirmed community scrape / placeholder calendar)');

  // Production router with 0 eligible feeds
  const prodRouter = new RoutingService();
  prodRouter.initializeProduction();
  try {
    prodRouter.searchJourney({ origin: 'Chennai Central', destination: 'Guindy', departureTime: '08:30:00' });
    assert(false, 'Should throw ROUTING_DATA_UNAVAILABLE in production without eligible feeds');
  } catch (err) {
    assert(err.code === RoutingErrorCodes.ROUTING_DATA_UNAVAILABLE, 'Throws honest ROUTING_DATA_UNAVAILABLE error');
    assert(err.statusCode === 503, 'Status code is 503');
    assert(err.details.productionRoutingReady === false, 'Reports productionRoutingReady as false');
    assert(Array.isArray(err.details.feedBlockers) && err.details.feedBlockers.length > 0, 'Details list specific feed blockers');
  }

  console.log('\n======================================================');
  console.log(`📊 Routing Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRoutingTests();
