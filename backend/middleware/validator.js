import { validateAndResolveLocation, CHENNAI_COVERAGE_MESSAGE, UNSUPPORTED_CITIES_REGEX } from '../services/coverageService.js';

/**
 * Validation Middleware for AccessRoute API
 */

export function validateRouteSearch(req, res, next) {
  const { origin, destination } = req.body;

  if (!origin || typeof origin !== 'string' || origin.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: "origin" is required and must be a non-empty string.',
      field: 'origin'
    });
  }

  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: "destination" is required and must be a non-empty string.',
      field: 'destination'
    });
  }

  // Check explicit non-Chennai queries or out-of-scope destinations
  if (UNSUPPORTED_CITIES_REGEX.test(origin.trim())) {
    return res.status(400).json({
      error: CHENNAI_COVERAGE_MESSAGE,
      code: 'OUT_OF_COVERAGE',
      field: 'origin',
      notice: CHENNAI_COVERAGE_MESSAGE
    });
  }

  if (UNSUPPORTED_CITIES_REGEX.test(destination.trim())) {
    return res.status(400).json({
      error: CHENNAI_COVERAGE_MESSAGE,
      code: 'OUT_OF_COVERAGE',
      field: 'destination',
      notice: CHENNAI_COVERAGE_MESSAGE
    });
  }

  // Validate preferences object if present
  if (req.body.preferences && typeof req.body.preferences !== 'object') {
    return res.status(400).json({
      error: 'Invalid request: "preferences" must be an object.',
      field: 'preferences'
    });
  }

  next();
}

export function validateIssueReport(req, res, next) {
  // Support both spec schema { type, stationId, details } and frontend UI schema { issueType, station, description }
  const type = req.body.type || req.body.issueType;
  const stationId = req.body.stationId || req.body.station;
  const details = req.body.details || req.body.description;

  if (!type || typeof type !== 'string' || type.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: "type" (or "issueType") is required.',
      field: 'type'
    });
  }

  if (!stationId || typeof stationId !== 'string' || stationId.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: "stationId" (or "station") is required.',
      field: 'stationId'
    });
  }

  if (!details || typeof details !== 'string' || details.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: "details" (or "description") is required.',
      field: 'details'
    });
  }

  // Normalize into standard fields for downstream handler
  req.body.type = type.trim();
  req.body.stationId = stationId.trim();
  req.body.details = details.trim();

  next();
}

export function validateStationId(req, res, next) {
  const { stationId } = req.params;
  if (!stationId || stationId.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: stationId path parameter is required.',
      field: 'stationId'
    });
  }
  next();
}

export function validateRouteId(req, res, next) {
  const { routeId } = req.params;
  if (!routeId || routeId.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: routeId path parameter is required.',
      field: 'routeId'
    });
  }
  next();
}

export function validateAiExtract(req, res, next) {
  const text = req.body.text || req.body.userInput;
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request: "text" (or "userInput") is required and must be a non-empty string.',
      field: 'text'
    });
  }
  if (text.length > 2000) {
    return res.status(400).json({
      error: 'Invalid request: "text" exceeds maximum allowed length of 2000 characters.',
      field: 'text'
    });
  }
  req.body.text = text.trim();
  next();
}

export function validateAiExplain(req, res, next) {
  const { route } = req.body;
  if (!route || typeof route !== 'object' || Array.isArray(route)) {
    return res.status(400).json({
      error: 'Invalid request: "route" is required and must be an object.',
      field: 'route'
    });
  }
  next();
}

