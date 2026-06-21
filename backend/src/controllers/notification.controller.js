const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/notifications
 * Get notifications for current logged-in user
 */
const getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getUserNotifications(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: notifications
  });
});

/**
 * PATCH /api/notifications/read
 * Mark all user notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res, next) => {
  await notificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

module.exports = {
  getNotifications,
  markAllAsRead,
  markAsRead
};
