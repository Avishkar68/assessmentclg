const uploadService = require('../services/upload.service');
const cloudinaryService = require('../services/cloudinary.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/questions/upload
 * Access: Private/Admin/Teacher
 * Process multipart file upload containing bulk questions
 */
const uploadBulkQuestions = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'Please upload a valid Excel (.xlsx) or CSV (.csv) file.'));
  }

  // Coerce preview flag from query (default to false if not specified)
  const isPreview = req.query.preview === 'true';

  const results = await uploadService.processBulkQuestions(req.file.buffer, req.user, isPreview);

  res.status(200).json({
    success: true,
    message: isPreview 
      ? 'Bulk upload spreadsheet parsed and validated successfully (Preview Mode).' 
      : `Bulk upload completed. Successfully imported ${results.importedCount} questions.`,
    data: results
  });
});

/**
 * POST /api/uploads/question-image
 * Access: Private/Admin/Teacher
 * Process image file upload and upload to Cloudinary
 */
const uploadQuestionImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'Please upload a valid image file.'));
  }

  const imageUrl = await cloudinaryService.uploadImage(req.file.buffer, req.file.mimetype);

  res.status(200).json({
    success: true,
    message: 'Question image uploaded successfully.',
    data: {
      imageUrl
    }
  });
});

module.exports = {
  uploadBulkQuestions,
  uploadQuestionImage
};
