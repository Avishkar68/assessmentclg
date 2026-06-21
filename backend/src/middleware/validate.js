const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Reusable express-validator runner and error formatting middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const message = 'Validation failed';
  const errorDetails = errors.array().map((err) => ({
    field: err.path,
    message: err.msg
  }));
  return next(new ApiError(400, message, errorDetails));
};

module.exports = validate;
