const auditService = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/audit
 * Access: Private/Admin
 * Retrieve audit logs list
 */
const getAuditLogs = asyncHandler(async (req, res, next) => {
  const result = await auditService.getAuditLogs(req.query);
  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: result
  });
});

module.exports = {
  getAuditLogs
};
