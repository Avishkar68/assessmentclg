const resultService = require('../services/result.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/results/student
 * Access: Private/Student
 * Get exam results for the logged-in student
 */
const getStudentResults = asyncHandler(async (req, res, next) => {
  const results = await resultService.getStudentResults(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Student results retrieved successfully',
    data: {
      count: results.length,
      results: results
    }
  });
});

/**
 * GET /api/results/teacher
 * Access: Private/Teacher
 * Get results of students for exams created by the teacher
 */
const getTeacherResults = asyncHandler(async (req, res, next) => {
  const results = await resultService.getTeacherResults(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Teacher results retrieved successfully',
    data: {
      count: results.length,
      results: results
    }
  });
});

/**
 * GET /api/results/admin
 * Access: Private/Admin
 * Get all student results globally
 */
const getAdminResults = asyncHandler(async (req, res, next) => {
  const results = await resultService.getAdminResults();
  res.status(200).json({
    success: true,
    message: 'Admin results retrieved successfully',
    data: {
      count: results.length,
      results: results
    }
  });
});

module.exports = {
  getStudentResults,
  getTeacherResults,
  getAdminResults
};
