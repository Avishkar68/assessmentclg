const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');

router.get(
  '/teacher',
  protect,
  authorize('teacher'),
  analyticsController.getTeacherAnalytics
);

router.get(
  '/student',
  protect,
  authorize('student'),
  analyticsController.getStudentAnalytics
);

router.get(
  '/admin',
  protect,
  authorize('admin'),
  analyticsController.getAdminAnalytics
);

module.exports = router;
