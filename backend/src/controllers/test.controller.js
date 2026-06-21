const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller verifying admin role access
 */
const adminTest = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access successful',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    }
  });
});

/**
 * Controller verifying teacher role access
 */
const teacherTest = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Teacher access successful',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    }
  });
});

/**
 * Controller verifying student role access
 */
const studentTest = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student access successful',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    }
  });
});

module.exports = {
  adminTest,
  teacherTest,
  studentTest
};
