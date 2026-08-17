/**
 * Standardized Error Handling Middleware
 */

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('[AccessRoute Error Handler]:', err.stack || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    statusCode: status,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
