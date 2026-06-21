const express = require('express');
const router = express.Router();
const multer = require('multer');
const questionController = require('../controllers/question.controller');
const uploadController = require('../controllers/upload.controller');
const { createQuestionValidator } = require('../validations/question.validation');
const ApiError = require('../utils/ApiError');

// Configure multer storage in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isExcel = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.originalname.endsWith('.xlsx');
    const isCsv = file.mimetype === 'text/csv' || 
                  file.mimetype === 'application/vnd.ms-excel' || 
                  file.originalname.endsWith('.csv');
                  
    if (isExcel || isCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx) and CSV (.csv) file formats are supported.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  }
});

// Custom middleware to handle multer errors gracefully
const handleUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }
    next();
  });
};

// Bulk upload endpoint
router.post('/upload', handleUploadMiddleware, uploadController.uploadBulkQuestions);

router
  .route('/')
  .post(createQuestionValidator, questionController.createQuestion)
  .get(questionController.getQuestions);

// Template download endpoints
router.get('/template/excel', questionController.downloadExcelTemplate);
router.get('/template/csv', questionController.downloadCsvTemplate);

router
  .route('/:id')
  .get(questionController.getQuestionById)
  .put(createQuestionValidator, questionController.updateQuestion)
  .delete(questionController.deleteQuestion);

module.exports = router;
