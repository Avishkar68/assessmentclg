const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { studentTest } = require('../controllers/test.controller');
const { getStudentDashboard } = require('../controllers/dashboard.controller');

// Restricted to students only
router.get('/test', protect, authorize('student'), studentTest);
router.get('/dashboard', protect, authorize('student'), getStudentDashboard);

module.exports = router;
