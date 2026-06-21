const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/admin/dashboard
 * Access: Private/Admin
 * Retrieve admin dashboard statistics
 */
const getAdminDashboard = asyncHandler(async (req, res, next) => {
  const stats = await dashboardService.getAdminStats();
  res.status(200).json({
    success: true,
    message: 'Admin dashboard stats retrieved successfully',
    data: stats
  });
});

/**
 * GET /api/teacher/dashboard
 * Access: Private/Teacher
 * Retrieve teacher dashboard statistics
 */
const getTeacherDashboard = asyncHandler(async (req, res, next) => {
  const stats = await dashboardService.getTeacherStats(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Teacher dashboard stats retrieved successfully',
    data: stats
  });
});

/**
 * GET /api/student/dashboard
 * Access: Private/Student
 * Retrieve student dashboard statistics
 */
const getStudentDashboard = asyncHandler(async (req, res, next) => {
  const stats = await dashboardService.getStudentStats(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Student dashboard stats retrieved successfully',
    data: stats
  });
});

module.exports = {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard
};
