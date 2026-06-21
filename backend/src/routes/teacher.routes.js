const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { teacherTest } = require('../controllers/test.controller');
const { getTeacherDashboard } = require('../controllers/dashboard.controller');

// Restricted to teachers only
router.get('/test', protect, authorize('teacher'), teacherTest);
router.get('/dashboard', protect, authorize('teacher'), getTeacherDashboard);

module.exports = router;
