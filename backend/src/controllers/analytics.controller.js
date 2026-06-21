const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/analytics/teacher
 * Access: Private/Teacher
 * Retrieve student analytics, difficulty averages, and exam scores for teacher's content
 */
const getTeacherAnalytics = asyncHandler(async (req, res, next) => {
  const analytics = await analyticsService.getTeacherAnalytics(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Teacher analytics retrieved successfully',
    data: analytics
  });
});

/**
 * GET /api/analytics/student
 * Access: Private/Student
 * Retrieve strong/weak topic lists and chronological progress metrics for logged-in student
 */
const getStudentAnalytics = asyncHandler(async (req, res, next) => {
  const analytics = await analyticsService.getStudentAnalytics(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Student analytics retrieved successfully',
    data: analytics
  });
});

/**
 * GET /api/analytics/admin
 * Access: Private/Admin
 * Retrieve platform-wide aggregates and collection volume summaries
 */
const getAdminAnalytics = asyncHandler(async (req, res, next) => {
  const analytics = await analyticsService.getAdminAnalytics();
  res.status(200).json({
    success: true,
    message: 'Admin analytics retrieved successfully',
    data: analytics
  });
});

module.exports = {
  getTeacherAnalytics,
  getStudentAnalytics,
  getAdminAnalytics
};
