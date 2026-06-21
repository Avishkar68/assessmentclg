const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');
const config = require('../config');

/**
 * Route protection middleware to verify JWT
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Retrieve token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Ensure token was provided
  if (!token) {
    return next(new ApiError(401, 'Not authorized to access this route. Token missing.'));
  }

  try {
    // Verify token signature
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user and attach to request
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(404, 'No user found with the provided credentials.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Your account is currently deactivated. Please contact support.'));
    }

    // Assign user metadata to request object
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Not authorized to access this route. Invalid token.'));
  }
});

/**
 * Authorization middleware to restrict route access to specific roles
 * @param  {...string} roles - List of allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(500, 'Authorization middleware called before authentication.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};
