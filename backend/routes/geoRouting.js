import { Router } from 'express';
import {
  geoRoutingService
} from '../services/geoRoutingService.js';
import {
  loadAllSupportedLocations,
  validateAndResolveLocation,
  isCoordinateWithinChennai,
  CHENNAI_BOUNDS,
  CHENNAI_COVERAGE_MESSAGE
} from '../services/coverageService.js';
import {
  getPedestrianFeatures,
  PEDESTRIAN_INFRASTRUCTURE
} from '../services/pedestrianService.js';

const router = Router();

/**
 * POST /api/geo/route
 * Calculate geographical road or pedestrian route geometry
 */
router.post('/route', async (req, res, next) => {
  try {
    const { origin, destination, profile = 'walking', preferences = {} } = req.body;

    if (!origin) {
      return res.status(400).json({
        error: 'Invalid request: "origin" is required.',
        code: 'MISSING_ORIGIN',
        field: 'origin'
      });
    }

    if (!destination) {
      return res.status(400).json({
        error: 'Invalid request: "destination" is required.',
        code: 'MISSING_DESTINATION',
        field: 'destination'
      });
    }

    const route = await geoRoutingService.calculateRoute({
      origin,
      destination,
      profile,
      preferences
    });

    return res.status(200).json(route);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code || 'ROUTING_ERROR',
        details: error.details || {}
      });
    }
    next(error);
  }
});

/**
 * GET /api/geo/geocode
 * Geocode a location within Chennai network boundary
 */
router.get('/geocode', (req, res) => {
  const query = req.query.q;
  if (!query || String(query).trim() === '') {
    return res.status(400).json({
      error: 'Query parameter "q" is required.',
      code: 'MISSING_QUERY'
    });
  }

  const result = validateAndResolveLocation(query);
  if (!result.valid) {
    return res.status(400).json({
      error: result.reason,
      code: result.outOfScope ? 'OUT_OF_COVERAGE' : 'NOT_FOUND',
      supported: false,
      notice: CHENNAI_COVERAGE_MESSAGE
    });
  }

  return res.status(200).json({
    supported: true,
    name: result.location.name,
    code: result.location.code,
    category: result.location.category || 'location',
    district: result.location.district || 'Chennai',
    coordinates: result.coordinates,
    stepFreeAccess: result.location.stepFreeAccess ?? null,
    confidence: 'verified'
  });
});

/**
 * GET /api/geo/autocomplete
 * Search autocomplete for Chennai locations, stations, and hubs
 */
router.get('/autocomplete', (req, res) => {
  const query = req.query.q ? String(req.query.q).trim().toLowerCase() : '';
  const { list } = loadAllSupportedLocations();

  if (!query) {
    // Return top 8 prominent interchange hubs
    const topHubs = list
      .filter((l) => ['cmrl_smc', 'cmrl_sgd', 'srr_mas', 'srr_tbm', 'cmrl_sap', 'mtc_bway', 'cmrl_saln', 'srr_ms'].includes(l.id))
      .slice(0, 8);
    return res.status(200).json(topHubs);
  }

  // Check out of scope city
  const nonChennaiRegex = /\b(bengaluru|bangalore|mumbai|delhi|hyderabad|kolkata|pune)\b/i;
  if (nonChennaiRegex.test(query)) {
    return res.status(200).json({
      outOfScope: true,
      message: CHENNAI_COVERAGE_MESSAGE,
      results: []
    });
  }

  const matches = list
    .filter((l) =>
      l.name.toLowerCase().includes(query) ||
      l.code.toLowerCase().includes(query) ||
      (l.tamilName && l.tamilName.includes(query)) ||
      l.district.toLowerCase().includes(query)
    )
    .slice(0, 10);

  return res.status(200).json({
    outOfScope: false,
    results: matches
  });
});

/**
 * GET /api/geo/coverage
 * Returns the active Chennai spatial boundary and configuration
 */
router.get('/coverage', (req, res) => {
  res.status(200).json({
    service: 'AccessRoute Chennai Coverage Scope',
    bounds: CHENNAI_BOUNDS,
    message: CHENNAI_COVERAGE_MESSAGE,
    defaultCenter: CHENNAI_BOUNDS.defaultCenter,
    defaultZoom: CHENNAI_BOUNDS.defaultZoom,
    supportedDistricts: ['Chennai', 'Chengalpattu', 'Kanchipuram', 'Tiruvallur']
  });
});

/**
 * GET /api/geo/pedestrian
 * List pedestrian infrastructure and accessibility features
 */
router.get('/pedestrian', (req, res) => {
  const { type, stationId, stepFreeOnly, avoidStairs, verifiedOnly } = req.query;
  const features = getPedestrianFeatures({
    type,
    stationId,
    stepFreeOnly: stepFreeOnly === 'true',
    avoidStairs: avoidStairs === 'true',
    verifiedOnly: verifiedOnly === 'true'
  });

  return res.status(200).json({
    totalCount: features.length,
    features
  });
});

export default router;

