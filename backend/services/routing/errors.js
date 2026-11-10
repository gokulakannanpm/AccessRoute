/**
 * Standard Routing Error Codes and Classes
 */

export const RoutingErrorCodes = {
  ROUTING_DATA_UNAVAILABLE: 'ROUTING_DATA_UNAVAILABLE',
  UNKNOWN_ORIGIN: 'UNKNOWN_ORIGIN',
  UNKNOWN_DESTINATION: 'UNKNOWN_DESTINATION',
  SAME_ORIGIN_DESTINATION: 'SAME_ORIGIN_DESTINATION',
  NO_SERVICE_AVAILABLE: 'NO_SERVICE_AVAILABLE',
  MODE_UNAVAILABLE: 'MODE_UNAVAILABLE',
  INACCESSIBLE_ROUTE: 'INACCESSIBLE_ROUTE',
  NO_ROUTE_FOUND: 'NO_ROUTE_FOUND',
  FEED_BLOCKED: 'FEED_BLOCKED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS'
};

export class RoutingError extends Error {
  constructor(code, message, details = {}, statusCode = 400) {
    super(message);
    this.name = 'RoutingError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      status: this.code,
      code: this.code,
      error: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}
