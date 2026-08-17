import { Router } from 'express';
import { dbClient } from '../db/dbClient.js';
import { validateRouteSearch, validateRouteId } from '../middleware/validator.js';

const router = Router();

/**
 * POST /api/routes/search
 * Search and rank routes based on origin, destination, and accessibility preferences
 */
router.post('/search', validateRouteSearch, async (req, res, next) => {
  try {
    const { origin, destination, preferences = {} } = req.body;

    // Retrieve ranked routes from database layer
    const routesResult = await dbClient.searchRoutes({
      origin,
      destination,
      preferences
    });

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
