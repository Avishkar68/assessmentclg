const questionService = require('../services/question.service');
const uploadService = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/questions
 * Access: Private/Admin/Teacher
 * Create a new question
 */
const createQuestion = asyncHandler(async (req, res, next) => {
  const question = await questionService.createQuestion(req.body, req.user);

  // Log question creation
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'question_created',
      details: { questionId: question._id, questionText: question.questionText },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for question creation failed:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: question
  });
});

/**
 * GET /api/questions
 * Access: Private/Admin/Teacher
 * Retrieve questions list (Teachers are filtered to see only their own questions; Admins can see all)
 */
const getQuestions = asyncHandler(async (req, res, next) => {
  const result = await questionService.getQuestions(req.query, req.user);
  res.status(200).json({
    success: true,
    message: 'Questions retrieved successfully',
    data: {
      total: result.total,
      page: result.page,
      pages: result.pages,
      results: result.results
    }
  });
});

/**
 * GET /api/questions/:id
 * Access: Private/Admin/Teacher
 * Get single question details with authorization checks
 */
const getQuestionById = asyncHandler(async (req, res, next) => {
  const question = await questionService.getQuestionById(req.params.id);

  // Verification check: Only owner or admin can access detail
  if (req.user.role !== 'admin' && question.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'You are not authorized to view this question.'));
  }

  res.status(200).json({
    success: true,
    message: 'Question retrieved successfully',
    data: question
  });
});

/**
 * PUT /api/questions/:id
 * Access: Private/Admin/Teacher
 * Update a question details with ownership checking
 */
const updateQuestion = asyncHandler(async (req, res, next) => {
  const question = await questionService.updateQuestion(req.params.id, req.body, req.user);

  // Log question update
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'question_updated',
      details: { questionId: question._id, questionText: question.questionText },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for question update failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Question updated successfully',
    data: question
  });
});

/**
 * DELETE /api/questions/:id
 * Access: Private/Admin/Teacher
 * Delete a question with ownership checking
 */
const deleteQuestion = asyncHandler(async (req, res, next) => {
  await questionService.deleteQuestion(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Question deleted successfully.',
    data: {}
  });
});

/**
 * GET /api/questions/template/excel
 * Access: Private/Admin/Teacher
 * Download Excel template for bulk question upload
 */
const downloadExcelTemplate = asyncHandler(async (req, res, next) => {
  const buffer = uploadService.generateExcelTemplate();
  res.setHeader('Content-Disposition', 'attachment; filename="questions_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.status(200).send(buffer);
});

/**
 * GET /api/questions/template/csv
 * Access: Private/Admin/Teacher
 * Download CSV template for bulk question upload
 */
const downloadCsvTemplate = asyncHandler(async (req, res, next) => {
  const buffer = uploadService.generateCsvTemplate();
  res.setHeader('Content-Disposition', 'attachment; filename="questions_template.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.status(200).send(buffer);
});

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  downloadExcelTemplate,
  downloadCsvTemplate
};
