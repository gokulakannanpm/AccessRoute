import { Router } from 'express';
import { dbClient } from '../db/dbClient.js';
import { validateIssueReport } from '../middleware/validator.js';

const router = Router();

/**
 * POST /api/issues
 * Report an accessibility or infrastructure barrier
 */
router.post('/', validateIssueReport, async (req, res, next) => {
  try {
    const { type, stationId, details, userContact } = req.body;

    const newIssue = await dbClient.createIssue({
      type,
      stationId,
      details,
      userContact
    });

    return res.status(201).json({
      success: true,
      issue: newIssue,
      message: 'Accessibility issue submitted successfully. Transport authorities have been notified.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/issues
 * List reported accessibility issues
 */
router.get('/', async (req, res, next) => {
  try {
    const issues = await dbClient.getIssues();
    return res.status(200).json(issues);
  } catch (error) {
    next(error);
  }
});

export default router;
