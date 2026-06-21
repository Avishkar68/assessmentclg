const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const {
  startExamValidator,
  saveAnswerValidator,
  submitExamValidator,
  updateViolationsValidator,
  getSubmissionValidator
} = require('../validations/submission.validation');
const { evaluateSubmissionValidator } = require('../validations/evaluation.validation');
const { protect, authorize } = require('../middleware/auth');

// All submission routes are restricted to students only
router.post(
  '/start',
  protect,
  authorize('student'),
  startExamValidator,
  submissionController.startExam
);

// Retrieve submissions with pending evaluations
router.get(
  '/pending',
  protect,
  authorize('admin', 'teacher'),
  submissionController.getPendingSubmissions
);

router.post(
  '/:id/save',
  protect,
  authorize('student'),
  saveAnswerValidator,
  submissionController.saveAnswer
);

router.post(
  '/:id/submit',
  protect,
  authorize('student'),
  submitExamValidator,
  submissionController.submitExam
);

// Manual evaluation route for teachers/admins
router.put(
  '/:id/evaluate',
  protect,
  authorize('admin', 'teacher'),
  evaluateSubmissionValidator,
  submissionController.evaluateSubmission
);

// Update violations (Student only, while exam is active)
router.patch(
  '/:id/violations',
  protect,
  authorize('student'),
  updateViolationsValidator,
  submissionController.updateViolations
);

// Retrieve all submissions for the logged-in student
router.get(
  '/my-submissions',
  protect,
  authorize('student'),
  submissionController.getMySubmissions
);

// Get submission by ID (accessible by student, teacher, admin with RBAC check in service)
router.get(
  '/:id',
  protect,
  authorize('student', 'teacher', 'admin'),
  getSubmissionValidator,
  submissionController.getSubmissionById
);

module.exports = router;
