const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Validates manual grading request payload for teachers/admins
 */
const evaluateSubmissionValidator = [
  param('id')
    .isMongoId().withMessage('A valid submission ID path parameter is required.'),
  body('feedback')
    .optional()
    .isString().withMessage('Overall feedback parameter must be a string value.'),
  body('evaluations')
    .isArray({ min: 1 }).withMessage('evaluations parameter is required and must be a non-empty array.'),
  body('evaluations.*.questionId')
    .isMongoId().withMessage('Evaluation requires a valid questionId.'),
  body('evaluations.*.marksObtained')
    .isNumeric().withMessage('Evaluation requires a non-negative marksObtained number.')
    .custom((val) => {
      if (val < 0) {
        throw new Error('Evaluation requires a non-negative marksObtained number.');
      }
      return true;
    }),
  body('evaluations.*.isCorrect')
    .optional()
    .isBoolean().withMessage('Evaluation parameter isCorrect must be a boolean value.'),
  body('evaluations.*.feedback')
    .optional()
    .isString().withMessage('Evaluation parameter feedback must be a string value.'),
  validate
];

module.exports = {
  evaluateSubmissionValidator
};
