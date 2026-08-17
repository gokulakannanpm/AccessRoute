import { Router } from 'express';
import { dbClient } from '../db/dbClient.js';

const router = Router();

/**
 * GET /api/profile
 * Returns user profile and cumulative accessibility / environmental impact statistics
 */
router.get('/', async (req, res, next) => {
  try {
    const profileData = await dbClient.getUserProfile();
    return res.status(200).json(profileData);
  } catch (error) {
    next(error);
  }
});

export default router;
