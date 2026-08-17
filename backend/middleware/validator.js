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
