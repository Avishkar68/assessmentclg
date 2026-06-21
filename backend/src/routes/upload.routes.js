const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const ApiError = require('../utils/ApiError');

// Configure multer storage in memory for images
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

// Custom middleware to handle multer errors gracefully
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

router.post('/question-image', handleImageUploadMiddleware, uploadController.uploadQuestionImage);

module.exports = router;
