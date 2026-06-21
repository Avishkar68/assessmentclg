const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Validates request body to start an exam attempt
 */
const startExamValidator = [
  body('examId')
    .notEmpty().withMessage('A valid examId is required.')
    .isMongoId().withMessage('A valid examId is required.'),
  validate
];

/**
 * Validates request parameters and body to save/update an answer
 */
const saveAnswerValidator = [
  param('id')
    .isMongoId().withMessage('A valid submission ID path parameter is required.'),
  body('questionId')
    .notEmpty().withMessage('A valid questionId in request body is required.')
    .isMongoId().withMessage('A valid questionId in request body is required.'),
  body('answerText')
    .exists().withMessage('answerText in request body is required and must be a string.')
    .isString().withMessage('answerText in request body is required and must be a string.'),
  validate
];

/**
 * Validates request parameters to submit an exam
 */
const submitExamValidator = [
  param('id')
    .isMongoId().withMessage('A valid submission ID path parameter is required.'),
  validate
];

/**
 * Validates request parameters and body to update violations
 */
const updateViolationsValidator = [
  param('id')
    .isMongoId().withMessage('A valid submission ID path parameter is required.'),
  body('tabSwitchCount')
    .optional()
    .isInt({ min: 0 }).withMessage('tabSwitchCount must be a non-negative integer.'),
  body('fullscreenExitCount')
    .optional()
    .isInt({ min: 0 }).withMessage('fullscreenExitCount must be a non-negative integer.'),
  body('copyPasteAttempts')
    .optional()
    .isInt({ min: 0 }).withMessage('copyPasteAttempts must be a non-negative integer.'),
  validate
];

/**
 * Validates request parameters to retrieve single submission detail
 */
const getSubmissionValidator = [
  param('id')
    .isMongoId().withMessage('A valid submission ID path parameter is required.'),
  validate
];

module.exports = {
  startExamValidator,
  saveAnswerValidator,
  submitExamValidator,
  updateViolationsValidator,
  getSubmissionValidator
};
