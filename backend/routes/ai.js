import { Router } from 'express';
import {
  extractPreferencesWithGemini,
  explainRouteWithGemini,
  isGeminiConfigured
} from '../services/geminiService.js';
import { validateAiExtract, validateAiExplain } from '../middleware/validator.js';

const router = Router();

/**
 * GET /api/ai/status
 * Returns current Gemini AI integration readiness
 */
router.get('/status', (req, res) => {
  const configured = isGeminiConfigured();
  return res.status(200).json({
    service: 'AccessRoute Gemini AI Gateway',
    configured,
    model: 'gemini-2.0-flash',
    message: configured
      ? 'Gemini AI service is configured and ready.'
      : 'Gemini AI service unconfigured: GEMINI_API_KEY environment variable is not set.'
  });
});

/**
 * POST /api/ai/extract-preferences
 * Extracts structured accessibility preferences using server-side Gemini
 */
router.post('/extract-preferences', validateAiExtract, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI service is not configured on the server.',
        providerAvailable: false
      });
    }

    const preferences = await extractPreferencesWithGemini(text);

    return res.status(200).json({
      success: true,
      providerAvailable: true,
      preferences
    });
  } catch (error) {
    if (error.code === 'GEMINI_UNCONFIGURED') {
      return res.status(503).json({
        success: false,
        error: error.message,
        providerAvailable: false
      });
    }
    // Generic Gemini API error (quota, network, etc.) - do not log prompt or user query
    console.warn('[AI Route] Gemini preference extraction failed:', error.message);
    return res.status(502).json({
      success: false,
      error: 'Gemini AI provider encountered an error processing the request.',
      providerAvailable: false
    });
  }
});

/**
 * POST /api/ai/explain-route
 * Generates an accessible route explanation using server-side Gemini
 */
router.post('/explain-route', validateAiExplain, async (req, res, next) => {
  try {
    const { route } = req.body;

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI service is not configured on the server.',
        providerAvailable: false
      });
    }

    const explanation = await explainRouteWithGemini(route);

    return res.status(200).json({
      success: true,
      providerAvailable: true,
      explanation
    });
  } catch (error) {
    if (error.code === 'GEMINI_UNCONFIGURED') {
      return res.status(503).json({
        success: false,
        error: error.message,
        providerAvailable: false
      });
    }
    console.warn('[AI Route] Gemini route explanation failed:', error.message);
    return res.status(502).json({
      success: false,
      error: 'Gemini AI provider encountered an error generating route explanation.',
      providerAvailable: false
    });
  }
});

export default router;
