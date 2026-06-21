const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Helper utility to sign and send a standard JWT response
 * @param {Object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'User registered successfully' : 'Login successful',
    data: {
      token,
      user: userObj
    }
  });
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Verify uniqueness of email address
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ApiError(400, 'Email address is already registered.'));
  }

  // Create user record in DB
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  if (role === 'teacher') {
    try {
      const notificationService = require('../services/notification.service');
      const admins = await User.find({ role: 'admin', isActive: true });
      for (let admin of admins) {
        await notificationService.createNotification({
          recipient: admin._id,
          title: 'New Teacher Added',
          message: `A new teacher "${name}" (${email}) has registered.`,
          type: 'new_teacher_added',
          link: '/admin/dashboard'
        });
      }
    } catch (notificationErr) {
      console.error('Error triggering new teacher notification:', notificationErr);
    }
  }

  sendTokenResponse(user, 201, res);
});

/**
 * POST /api/auth/login
 * Login existing user
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Retrieve user matching email (explicity selecting password)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ApiError(401, 'Invalid credentials.'));
  }

  // Check user status
  if (!user.isActive) {
    return next(new ApiError(403, 'Your account is deactivated. Please contact support.'));
  }

  // Verify entered password matches database hash
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid credentials.'));
  }

  // Log login action
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: user._id,
      action: 'login',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for login failed:', err);
  }

  sendTokenResponse(user, 200, res);
});

/**
 * GET /api/auth/me
 * Fetch profile of current logged-in user
 */
const getMe = asyncHandler(async (req, res, next) => {
  // req.user is populated by protect middleware
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: req.user
    }
  });
});

/**
 * PUT /api/auth/profile
 * Update profile details (name)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Please provide a valid name.'));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ApiError(404, 'User not found.'));
  }

  user.name = name.trim();
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: userObj
    }
  });
});

/**
 * PUT /api/auth/password
 * Change current password
 */
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Please provide current and new passwords.'));
  }

  if (newPassword.length < 6) {
    return next(new ApiError(400, 'New password must be at least 6 characters.'));
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ApiError(404, 'User not found.'));
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid current password.'));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

/**
 * POST /api/auth/profile-picture
 * Process image and upload to Cloudinary for profile picture
 */
const uploadProfilePicture = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'Please upload a valid image file.'));
  }

  const cloudinaryService = require('../services/cloudinary.service');
  const imageUrl = await cloudinaryService.uploadImage(req.file.buffer, req.file.mimetype);

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ApiError(404, 'User not found.'));
  }

  user.profilePicture = imageUrl;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    success: true,
    message: 'Profile picture uploaded successfully',
    data: {
      user: userObj
    }
  });
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
const logout = asyncHandler(async (req, res, next) => {
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'logout',
      details: { email: req.user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for logout failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  uploadProfilePicture,
  logout
};
