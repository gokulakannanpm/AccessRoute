import { Router } from 'express';
import { dbClient } from '../db/dbClient.js';
import { validateStationId } from '../middleware/validator.js';

const router = Router();

/**
 * GET /api/stations/:stationId
 * Returns station accessibility details, audit verification, and known infrastructure issues
 */
router.get('/:stationId', validateStationId, async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const stationData = await dbClient.getStationAccessibility(stationId);

    if (!stationData) {
      return res.status(404).json({
        error: `Station with ID "${stationId}" not found.`,
        stationId
      });
    }

    return res.status(200).json(stationData);
  } catch (error) {
    next(error);
  }
});

export default router;
