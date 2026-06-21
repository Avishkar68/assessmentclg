const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validations/auth.validation');
const { protect } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

// Multer Config for Profile Images
const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const hasAllowedMime = allowedMimeTypes.includes(file.mimetype);
    const hasAllowedExt = /\.(jpg|jpeg|png|webp)$/i.test(file.originalname);

    if (hasAllowedMime || hasAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WEBP image formats are supported.'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB file size limit
  }
});

const handleImageUploadMiddleware = (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File size limit exceeded. Maximum allowed size is 2MB.'));
      }
      return next(new ApiError(400, err.message));
    }
    next();
  });
};

// Public routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/password', protect, authController.updatePassword);
router.post('/profile-picture', protect, handleImageUploadMiddleware, authController.uploadProfilePicture);
router.post('/logout', protect, authController.logout);

module.exports = router;
