const ApiError = require('../utils/ApiError');

/**
 * Middleware to handle unmatched route requests (404 Not Found)
 */
const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

module.exports = notFoundHandler;
