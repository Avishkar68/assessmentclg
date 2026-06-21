const submissionService = require('../services/submission.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/submissions/start
 * Access: Private/Student
 * Start or resume an exam attempt
 */
const startExam = asyncHandler(async (req, res, next) => {
  const submission = await submissionService.startExam(req.body.examId, req.user);
  res.status(201).json({
    success: true,
    message: 'Exam attempt started successfully',
    data: submission
  });
});

/**
 * POST /api/submissions/:id/save
 * Access: Private/Student
 * Save or update a single answer for an active attempt
 */
const saveAnswer = asyncHandler(async (req, res, next) => {
  const submission = await submissionService.saveAnswer(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    message: 'Answer saved successfully.',
    data: submission
  });
});

/**
 * POST /api/submissions/:id/submit
 * Access: Private/Student
 * Submit and finalize an active exam attempt
 */
const submitExam = asyncHandler(async (req, res, next) => {
  const submission = await submissionService.submitExam(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Exam submitted successfully.',
    data: submission
  });
});

/**
 * PUT /api/submissions/:id/evaluate
 * Access: Private/Admin/Teacher
 * Evaluate and grade short answer questions in a submission manually
 */
const evaluateSubmission = asyncHandler(async (req, res, next) => {
  const submission = await submissionService.evaluateShortAnswers(
    req.params.id,
    req.body.evaluations,
    req.body.feedback,
    req.user
  );

  // Log evaluation submission
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'evaluation_submitted',
      details: { submissionId: submission._id, examId: submission.exam },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for evaluation submission failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Submission evaluated successfully.',
    data: submission
  });
});

/**
 * GET /api/submissions/pending
 * Access: Private/Admin/Teacher
 * View list of submitted attempts with pending questions
 */
const getPendingSubmissions = asyncHandler(async (req, res, next) => {
  const submissions = await submissionService.getPendingSubmissions(req.user);
  res.status(200).json({
    success: true,
    message: 'Pending submissions retrieved successfully',
    data: {
      count: submissions.length,
      submissions: submissions
    }
  });
});

/**
 * PATCH /api/submissions/:id/violations
 * Access: Private/Student
 * Update violation metrics of an active submission
 */
const updateViolations = asyncHandler(async (req, res, next) => {
  const submission = await submissionService.updateViolations(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    message: 'Exam security violations updated successfully.',
    data: submission
  });
});

/**
 * GET /api/submissions/:id
 * Access: Private/Admin/Teacher/Student
 * Fetch single submission details with violation metrics
 */
const getSubmissionById = asyncHandler(async (req, res, next) => {
  const submission = await submissionService.getSubmissionById(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Submission details retrieved successfully.',
    data: submission
  });
});

/**
 * GET /api/submissions/my-submissions
 * Access: Private/Student
 * Retrieve all submissions for the logged-in student
 */
const getMySubmissions = asyncHandler(async (req, res, next) => {
  const submissions = await submissionService.getMySubmissions(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Student submissions retrieved successfully.',
    data: submissions
  });
});

module.exports = {
  startExam,
  saveAnswer,
  submitExam,
  evaluateSubmission,
  getPendingSubmissions,
  updateViolations,
  getSubmissionById,
  getMySubmissions
};
