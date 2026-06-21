const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getNotifications);
router.patch('/read', protect, notificationController.markAllAsRead);
router.patch('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
