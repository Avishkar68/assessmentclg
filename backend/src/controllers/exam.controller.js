const examService = require('../services/exam.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/exams
 * Access: Private/Admin/Teacher
 * Create a new draft exam
 */
const createExam = asyncHandler(async (req, res, next) => {
  const exam = await examService.createExam(req.body, req.user);

  // Log exam creation
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'exam_created',
      details: { examId: exam._id, title: exam.title, type: 'manual' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for exam creation failed:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    data: exam
  });
});

/**
 * GET /api/exams
 * Access: Private/Admin/Teacher/Student
 * Get list of exams (Admins view all; Teachers view own; Students view published only)
 */
const getExams = asyncHandler(async (req, res, next) => {
  let filter = {};

  if (req.user.role === 'student') {
    filter = { status: 'published' };
  } else if (req.user.role === 'teacher') {
    filter = { createdBy: req.user._id };
  }

  const exams = await examService.getExams(filter);
  res.status(200).json({
    success: true,
    message: 'Exams retrieved successfully',
    data: {
      count: exams.length,
      exams: exams
    }
  });
});

/**
 * GET /api/exams/:id
 * Access: Private/Admin/Teacher/Student
 * Get single exam details
 */
const getExamById = asyncHandler(async (req, res, next) => {
  const exam = await examService.getExamById(req.params.id);

  // Verification check: Student can only view published exams
  if (req.user.role === 'student' && exam.status !== 'published') {
    return next(new ApiError(403, 'You are not authorized to view this exam details.'));
  }

  // Verification check: Teacher can only view their own exams
  if (req.user.role === 'teacher' && exam.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'You are not authorized to view this exam details.'));
  }

  res.status(200).json({
    success: true,
    message: 'Exam retrieved successfully',
    data: exam
  });
});

/**
 * PUT /api/exams/:id
 * Access: Private/Admin/Teacher
 * Update exam details
 */
const updateExam = asyncHandler(async (req, res, next) => {
  const exam = await examService.updateExam(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    message: 'Exam updated successfully',
    data: exam
  });
});

/**
 * DELETE /api/exams/:id
 * Access: Private/Admin/Teacher
 * Delete an exam
 */
const deleteExam = asyncHandler(async (req, res, next) => {
  await examService.deleteExam(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Exam deleted successfully.',
    data: {}
  });
});

/**
 * PATCH /api/exams/:id/publish
 * Access: Private/Admin/Teacher
 * Publish a draft exam (sets status to published if containing at least 1 question)
 */
const publishExam = asyncHandler(async (req, res, next) => {
  const exam = await examService.publishExam(req.params.id, req.user);

  // Log exam publication
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'exam_published',
      details: { examId: exam._id, title: exam.title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for exam publication failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Exam published successfully.',
    data: exam
  });
});

/**
 * POST /api/exams/generate
 * Access: Private/Admin/Teacher
 * Generate an exam automatically
 */
const generateExam = asyncHandler(async (req, res, next) => {
  const exam = await examService.generateSmartExam(req.body, req.user);

  // Log exam creation
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'exam_created',
      details: { examId: exam._id, title: exam.title, type: 'smart' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for exam smart-generation failed:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Exam automatically generated successfully',
    data: exam
  });
});

/**
 * POST /api/exams/blueprint-generate
 * Access: Private/Admin/Teacher
 * Generate an exam automatically using blueprint distributions
 */
const generateBlueprintExam = asyncHandler(async (req, res, next) => {
  const exam = await examService.generateBlueprintExam(req.body, req.user);

  // Log exam creation
  try {
    const auditService = require('../services/audit.service');
    await auditService.logAction({
      userId: req.user._id,
      action: 'exam_created',
      details: { examId: exam._id, title: exam.title, type: 'blueprint' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for exam blueprint-generation failed:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Exam generated successfully from blueprint.',
    data: exam
  });
});

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  generateExam,
  generateBlueprintExam
};
