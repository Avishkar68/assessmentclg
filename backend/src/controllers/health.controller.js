const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/health
 * Public health check endpoint
 */
const getHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server Running',
    data: {}
  });
});

module.exports = {
  getHealth
};
