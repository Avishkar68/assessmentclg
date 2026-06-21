const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { createExamValidator, generateExamValidator, generateBlueprintExamValidator } = require('../validations/exam.validation');
const { protect, authorize } = require('../middleware/auth');

// CRUD endpoints with granular permissions
router
  .route('/')
  .post(protect, authorize('admin', 'teacher'), createExamValidator, examController.createExam)
  .get(protect, examController.getExams);

// Smart Exam Generation endpoint
router.post('/generate', protect, authorize('admin', 'teacher'), generateExamValidator, examController.generateExam);

// Blueprint Exam Generation endpoint
router.post('/blueprint-generate', protect, authorize('admin', 'teacher'), generateBlueprintExamValidator, examController.generateBlueprintExam);

router
  .route('/:id')
  .get(protect, examController.getExamById)
  .put(protect, authorize('admin', 'teacher'), createExamValidator, examController.updateExam)
  .delete(protect, authorize('admin', 'teacher'), examController.deleteExam);

// Publish endpoint
router.patch('/:id/publish', protect, authorize('admin', 'teacher'), examController.publishExam);

module.exports = router;
