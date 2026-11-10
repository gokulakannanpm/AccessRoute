import path from 'path';
import { Router } from 'express';
import { dbClient } from '../db/dbClient.js';
import { validateRouteSearch, validateRouteId } from '../middleware/validator.js';
import { routingService, RoutingService, RoutingError } from '../services/routing/index.js';

const router = Router();

// Cached synthetic router instance for fixture evaluation / testing
let cachedSyntheticRouter = null;
function getSyntheticRouter() {
  if (!cachedSyntheticRouter) {
    cachedSyntheticRouter = new RoutingService();
    const synthDir = path.resolve(process.cwd(), 'backend', 'tests', 'fixtures', 'routing', 'synthetic_multimodal_feed');
    cachedSyntheticRouter.loadFeed(synthDir, { enforceEligibility: true, feedMode: 'synthetic_multimodal' });
  }
  return cachedSyntheticRouter;
}

/**
 * GET /api/routes/timetable/status
 * Returns timetable routing engine status and feed eligibility audit
 */
router.get('/timetable/status', (req, res) => {
  const audit = routingService.productionAudit || routingService.initializeProduction();
  res.status(200).json({
    service: 'AccessRoute Timetable Routing Engine',
    algorithm: 'Connection Scan Algorithm (CSA)',
    productionRoutingReady: audit.productionRoutingReady,
    totalModesAudited: audit.totalModesChecked,
    eligibleFeedsCount: audit.eligibleCount,
    modes: audit.modes,
    notice: audit.productionRoutingReady
      ? 'Timetable routing is ready for production service'
      : 'Production timetable routing is strictly disabled: unverified community scrapes, expired Metro timetables, and unresolved suburban datasets must not be used as operational service.'
  });
});

/**
 * POST /api/routes/timetable-search
 * Strict timetable-based routing search. Never falls back to illustrative routes.
 */
router.post('/timetable-search', validateRouteSearch, async (req, res, next) => {
  try {
    const { origin, destination, preferences = {}, departureTime, useSyntheticFixtures } = req.body;

    const routerInstance = useSyntheticFixtures ? getSyntheticRouter() : routingService;

    const result = routerInstance.searchJourney({
      origin,
      destination,
      departureTime: departureTime || '08:30:00',
      preferences
    });

    if (useSyntheticFixtures) {
      result.isSyntheticFixture = true;
      result.notice = 'Synthetic timetable test data (used strictly for verification). Not a production schedule.';
    }

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof RoutingError) {
      return res.status(error.statusCode || 400).json(error.toJSON());
    }
    next(error);
  }
});

/**
 * POST /api/routes/search
 * Search and rank routes based on origin, destination, and accessibility preferences.
 * - When routingMode === 'timetable', runs real timetable engine (no silent fallback).
 * - When illustrative preview is requested (or default), returns preview explicitly flagged as illustrative.
 */
router.post('/search', validateRouteSearch, async (req, res, next) => {
  try {
    const { origin, destination, preferences = {}, routingMode, departureTime, useSyntheticFixtures } = req.body;

    // Strict timetable routing mode requested
    if (routingMode === 'timetable') {
      try {
        const routerInstance = useSyntheticFixtures ? getSyntheticRouter() : routingService;
        const result = routerInstance.searchJourney({
          origin,
          destination,
          departureTime: departureTime || '08:30:00',
          preferences
        });
        if (useSyntheticFixtures) {
          result.isSyntheticFixture = true;
        }
        return res.status(200).json(result);
      } catch (err) {
        if (err instanceof RoutingError) {
          // Never fall back to fabricated data! Return honest error
          return res.status(err.statusCode || 400).json(err.toJSON());
        }
        throw err;
      }
    }

    // Retrieve illustrative preview routes from database/seed layer
    const routesResult = await dbClient.searchRoutes({
      origin,
      destination,
      preferences
    });

    // Explicitly flag as illustrative preview
    routesResult.isIllustrativePreview = true;
    routesResult.routingMode = 'illustrative_preview';
    routesResult.previewNotice = 'Illustrative journey preview based on road network and static stage fares. Real timetable calculation is unavailable due to unverified feeds.';

    if (routesResult.recommended) {
      routesResult.recommended.isIllustrativePreview = true;
    }
    if (routesResult.fastest) {
      routesResult.fastest.isIllustrativePreview = true;
    }
    if (routesResult.lowestCost) {
      routesResult.lowestCost.isIllustrativePreview = true;
    }

    return res.status(200).json(routesResult);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/routes/:routeId
 * Returns full route structure for a specific route ID
 */
router.get('/:routeId', validateRouteId, async (req, res, next) => {
  try {
    const { routeId } = req.params;
    const route = await dbClient.getRouteById(routeId);

    if (!route) {
      return res.status(404).json({
        error: `Route with ID "${routeId}" not found.`,
        routeId
      });
    }

    return res.status(200).json(route);
  } catch (error) {
    next(error);
  }
});

export default router;
