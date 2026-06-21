const config = require('../config');
const ApiError = require('../utils/ApiError');

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let parsedErrors = [];

    // Handle Mongoose Validation Error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      parsedErrors = Object.values(error.errors).map((el) => ({
        field: el.path,
        message: el.message
      }));
    }
    // Handle Mongoose CastError (e.g., invalid ObjectId)
    else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Resource not found';
      parsedErrors = [{
        field: error.path,
        message: `Invalid format for field '${error.path}': ${error.value}`
      }];
    }
    // Handle Mongoose Duplicate Key Error (MongoDB error code 11000)
    else if (error.code === 11000) {
      statusCode = 400;
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      message = 'Duplicate field value entered';
      parsedErrors = [{
        field,
        message: `Duplicate value entered for field: '${field}'. Please use another value.`
      }];
    }

    error = new ApiError(statusCode, message, parsedErrors, false, err.stack);
  }

  const { statusCode, message, errors } = error;

  const response = {
    success: false,
    message,
    errors: errors || [],
    ...(config.env === 'development' && { stack: error.stack })
  };

  // Log the error stack to console in development
  if (config.env === 'development') {
    console.error(err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
