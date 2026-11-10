import path from 'path';
import { TransitGraph } from './transitGraph.js';
import { LocationMatcher } from './locationMatcher.js';
import { runConnectionScan } from './connectionScanAlgorithm.js';
import { reconstructJourneys, rankTimetableJourneys } from './journeyReconstructor.js';
import { inspectFeedEligibility, auditProductionFeeds } from './feedEligibility.js';
import { RoutingError, RoutingErrorCodes } from './errors.js';
import { timeStringToSeconds } from '../ingestion/gtfsValidator.js';

/**
 * AccessRoute Timetable Journey Routing Engine
 *
 * Implements timetable-based multi-modal journey routing across eligible
 * Chennai transit feeds using the Connection Scan Algorithm (CSA).
 */

export class RoutingService {
  constructor(options = {}) {
    this.transitGraph = new TransitGraph();
    this.locationMatcher = new LocationMatcher(this.transitGraph);
    this.baseDataDir = options.baseDataDir || path.resolve(process.cwd(), 'data');
    this.productionAudit = null;
    this.isInitialized = false;
  }

  /**
   * Scans production feeds in data/, audits manifests, and loads ONLY eligible feeds.
   */
  initializeProduction() {
    this.productionAudit = auditProductionFeeds(this.baseDataDir);

    if (this.productionAudit.eligibleFeeds.length > 0) {
      for (const feed of this.productionAudit.eligibleFeeds) {
        this.transitGraph.loadFeed(feed.dir, {
          enforceEligibility: true,
          feedMode: feed.mode
        });
      }
    }

    this.isInitialized = true;
    return this.productionAudit;
  }

  /**
   * Load an explicit feed directory (used for testing and extensible feed additions)
   */
  loadFeed(feedDir, options = {}) {
    const result = this.transitGraph.loadFeed(feedDir, options);
    return result;
  }

  /**
   * Calculate timetable journey between origin and destination.
   */
  searchJourney({
    origin,
    destination,
    departureTime = '08:00:00',
    preferences = {},
    searchHorizonSec = 7200,
    maxTransfers = 3,
    maxWalkingDistanceMeters = 800
  }) {
    // 1. Check if graph has any loaded connections
    if (this.transitGraph.connections.length === 0) {
      const blockers = [];
      if (this.productionAudit) {
        for (const [mode, info] of Object.entries(this.productionAudit.modes)) {
          if (!info.eligible) {
            blockers.push(`${mode}: ${info.reasons.join(', ')}`);
          }
        }
      }
      throw new RoutingError(
        RoutingErrorCodes.ROUTING_DATA_UNAVAILABLE,
        'No eligible timetable feeds are available for production journey routing. Active feeds are blocked by data currency, licensing, or verification blockers.',
        {
          feedBlockers: blockers,
          readyForJourneyRouting: false,
          productionRoutingReady: false
        },
        503
      );
    }

    // 2. Validate Origin
    if (!origin || (typeof origin === 'string' && origin.trim() === '')) {
      throw new RoutingError(RoutingErrorCodes.UNKNOWN_ORIGIN, 'Origin is required', { field: 'origin' }, 400);
    }
    const originMatch = this.locationMatcher.resolveLocation(origin);
    if (!originMatch || !originMatch.stopIds || originMatch.stopIds.length === 0) {
      throw new RoutingError(
        RoutingErrorCodes.UNKNOWN_ORIGIN,
        `Origin "${origin}" could not be matched to any known transit stop or station`,
        { origin },
        404
      );
    }

    // 3. Validate Destination
    if (!destination || (typeof destination === 'string' && destination.trim() === '')) {
      throw new RoutingError(RoutingErrorCodes.UNKNOWN_DESTINATION, 'Destination is required', { field: 'destination' }, 400);
    }
    const destMatch = this.locationMatcher.resolveLocation(destination);
    if (!destMatch || !destMatch.stopIds || destMatch.stopIds.length === 0) {
      throw new RoutingError(
        RoutingErrorCodes.UNKNOWN_DESTINATION,
        `Destination "${destination}" could not be matched to any known transit stop or station`,
        { destination },
        404
      );
    }

    // 4. Same origin & destination check
    const isSameLocation = originMatch.stopIds.some(s => destMatch.stopIds.includes(s));
    if (isSameLocation) {
      throw new RoutingError(
        RoutingErrorCodes.SAME_ORIGIN_DESTINATION,
        'Origin and destination resolve to the same stop or station',
        { origin, destination },
        400
      );
    }

    // 5. Parse departure time
    let depTimeSec;
    if (typeof departureTime === 'number') {
      depTimeSec = departureTime;
    } else {
      try {
        depTimeSec = timeStringToSeconds(departureTime);
      } catch {
        depTimeSec = 28800; // default 08:00:00
      }
    }

    // 6. Execute Connection Scan Algorithm
    const csaResult = runConnectionScan(this.transitGraph, {
      originStopIds: originMatch.stopIds,
      destinationStopIds: destMatch.stopIds,
      departureTimeSec: depTimeSec,
      searchHorizonSec,
      maxTransfers,
      maxWalkingDistanceMeters,
      preferences
    });

    if (csaResult.rawCandidatesCount === 0) {
      throw new RoutingError(
        RoutingErrorCodes.NO_SERVICE_AVAILABLE,
        `No scheduled service found between ${originMatch.name || origin} and ${destMatch.name || destination} departing at or after ${departureTime} within the ${Math.round(searchHorizonSec / 3600)}h search window`,
        { origin, destination, departureTime, searchHorizonSec },
        404
      );
    }

    // 7. Reconstruct complete journeys
    const journeys = reconstructJourneys(csaResult.rawCandidates, this.transitGraph, originMatch.stopIds, preferences);

    if (journeys.length === 0) {
      throw new RoutingError(
        RoutingErrorCodes.NO_ROUTE_FOUND,
        `No complete valid route found meeting accessibility preferences between ${originMatch.name || origin} and ${destMatch.name || destination}`,
        { origin, destination, preferences },
        404
      );
    }

    // 8. Rank journeys into recommended, fastest, lowestCost
    const ranked = rankTimetableJourneys(journeys, preferences);

    return {
      success: true,
      routingMode: 'timetable',
      isRealTimetable: true,
      origin: originMatch,
      destination: destMatch,
      departureTime,
      totalJourneysFound: journeys.length,
      recommended: ranked.recommended,
      fastest: ranked.fastest,
      lowestCost: ranked.lowestCost,
      candidates: ranked.candidates
    };
  }
}

// Singleton instance for application-wide routing service
export const routingService = new RoutingService();
// Initialize on import to audit production feeds
routingService.initializeProduction();

export {
  TransitGraph,
  LocationMatcher,
  runConnectionScan,
  reconstructJourneys,
  rankTimetableJourneys,
  inspectFeedEligibility,
  auditProductionFeeds,
  RoutingError,
  RoutingErrorCodes
};
