const AuditLog = require('../models/auditLog.model');
const ApiError = require('../utils/ApiError');

/**
 * Log an action in the database
 * @param {Object} logData - Audit details
 * @returns {Promise<Object>} The created audit log entry
 */
const logAction = async (logData) => {
  const { userId, action, details, ipAddress, userAgent } = logData;

  if (!userId || !action) {
    throw new ApiError(400, 'User ID and action are required.');
  }

  const log = await AuditLog.create({
    user: userId,
    action,
    details,
    ipAddress,
    userAgent
  });

  return log;
};

/**
 * Retrieve audit logs with filters, search and pagination
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated logs and metadata
 */
const getAuditLogs = async (query = {}) => {
  const { search, action, page = 1, limit = 50 } = query;
  const filter = {};

  if (action) {
    filter.action = action;
  }

  if (search) {
    const User = require('../models/user.model');
    // Find users whose name or email matches search
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { user: { $in: userIds } },
      { action: { $regex: search, $options: 'i' } },
      { ipAddress: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const logs = await AuditLog.find(filter)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await AuditLog.countDocuments(filter);

  return {
    logs,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  };
};

module.exports = {
  logAction,
  getAuditLogs
};
