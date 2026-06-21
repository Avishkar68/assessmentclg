/**
 * Async wrapper to catch errors in Express routes and pass them to the next middleware
 * @param {Function} fn - The asynchronous route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = asyncHandler;
