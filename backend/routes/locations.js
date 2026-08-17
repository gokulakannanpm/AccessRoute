import { Router } from 'express';
import { dbClient } from '../db/dbClient.js';

const router = Router();

/**
 * GET /api/locations
 * Returns list of searchable locations (stations, stops, landmarks)
 */
router.get('/', async (req, res, next) => {
  try {
    const locations = await dbClient.getLocations();
    return res.status(200).json(locations);
  } catch (error) {
    next(error);
  }
});

export default router;
