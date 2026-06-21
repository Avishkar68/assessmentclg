const Notification = require('../models/notification.model');
const ApiError = require('../utils/ApiError');

/**
 * Create a new notification
 * @param {Object} data - Notification fields
 * @returns {Promise<Object>} The created notification
 */
const createNotification = async (data) => {
  const { recipient, title, message, type, link } = data;

  if (!recipient || !title || !message || !type) {
    throw new ApiError(400, 'Recipient, title, message, and type are required.');
  }

  const notification = await Notification.create({
    recipient,
    title,
    message,
    type,
    link
  });

  return notification;
};

/**
 * Get all notifications for a specific user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} List of user notifications sorted by most recent
 */
const getUserNotifications = async (userId) => {
  return await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 });
};

/**
 * Mark all notifications for a user as read
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} Update status
 */
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

/**
 * Mark a specific notification as read
 * @param {string} notificationId - ID of the notification
 * @param {string} userId - User ID (to verify ownership)
 * @returns {Promise<Object>} The updated notification
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found or unauthorized.');
  }

  notification.isRead = true;
  await notification.save();
  
  return notification;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAllAsRead,
  markAsRead
};
