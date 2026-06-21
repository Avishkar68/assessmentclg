const { body } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Validator for creating/updating an Exam request body
 */
const createExamValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Exam title is required and must be a string.'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required and must be a string.'),
  body('duration')
    .exists().withMessage('Duration must be a positive number representing minutes.')
    .isInt({ min: 1 }).withMessage('Duration must be a positive number representing minutes.'),
  body('startTime')
    .notEmpty().withMessage('A valid startTime is required.')
    .custom((val) => {
      if (isNaN(Date.parse(val))) {
        throw new Error('A valid startTime is required.');
      }
      return true;
    }),
  body('endTime')
    .notEmpty().withMessage('A valid endTime is required.')
    .custom((val, { req }) => {
      if (isNaN(Date.parse(val))) {
        throw new Error('A valid endTime is required.');
      }
      if (req.body.startTime && !isNaN(Date.parse(req.body.startTime))) {
        if (new Date(val) <= new Date(req.body.startTime)) {
          throw new Error('The endTime must be later than the startTime.');
        }
      }
      return true;
    }),
  body('totalMarks')
    .exists().withMessage('Total marks must be a positive number of at least 1.')
    .isInt({ min: 1 }).withMessage('Total marks must be a positive number of at least 1.'),
  body('questions')
    .optional()
    .isArray().withMessage('Questions parameter must be an array of question reference IDs.'),
  validate
];

/**
 * Validator for generating an Exam automatically
 */
const generateExamValidator = [
  ...createExamValidator.slice(0, -1), // Spread the validations except the final 'validate' middleware
  body('easyCount')
    .exists().withMessage('easyCount is required and must be a non-negative integer.')
    .isInt({ min: 0 }).withMessage('easyCount is required and must be a non-negative integer.'),
  body('mediumCount')
    .exists().withMessage('mediumCount is required and must be a non-negative integer.')
    .isInt({ min: 0 }).withMessage('mediumCount is required and must be a non-negative integer.'),
  body('hardCount')
    .exists().withMessage('hardCount is required and must be a non-negative integer.')
    .isInt({ min: 0 }).withMessage('hardCount is required and must be a non-negative integer.'),
  body().custom((value) => {
    const { easyCount, mediumCount, hardCount } = value;
    if (easyCount + mediumCount + hardCount < 1) {
      throw new Error('Total requested questions (easyCount + mediumCount + hardCount) must be at least 1.');
    }
    return true;
  }),
  validate
];

/**
 * Validator for blueprint based exam generation
 */
const generateBlueprintExamValidator = [
  ...createExamValidator.slice(0, -1), // Reuse title, subject, duration, startTime, endTime, totalMarks
  body('totalQuestionsCount')
    .exists().withMessage('totalQuestionsCount is required and must be a positive integer.')
    .isInt({ min: 1 }).withMessage('totalQuestionsCount is required and must be a positive integer.'),
  body('chapters')
    .exists().withMessage('chapters is required and must be a non-empty object containing chapter weights.')
    .isObject().withMessage('chapters is required and must be a non-empty object containing chapter weights.')
    .custom((val) => {
      const keys = Object.keys(val);
      if (keys.length === 0) {
        throw new Error('chapters must contain at least one chapter-to-percentage mapping.');
      }
      let sum = 0;
      for (const k of keys) {
        const pct = val[k];
        if (typeof pct !== 'number' || pct < 0 || pct > 100) {
          throw new Error(`Weight for chapter '${k}' must be a number between 0 and 100.`);
        }
        sum += pct;
      }
      if (Math.abs(sum - 100) > 0.01) {
        throw new Error(`The sum of chapter weights must equal exactly 100. Current sum: ${sum}`);
      }
      return true;
    }),
  body('difficulties')
    .exists().withMessage('difficulties is required and must be a non-empty object containing difficulty weights.')
    .isObject().withMessage('difficulties is required and must be a non-empty object containing difficulty weights.')
    .custom((val) => {
      const keys = Object.keys(val);
      if (keys.length === 0) {
        throw new Error('difficulties must contain at least one difficulty-to-percentage mapping.');
      }
      let sum = 0;
      for (const k of keys) {
        if (!['Easy', 'Medium', 'Hard'].includes(k)) {
          throw new Error(`Invalid difficulty value: '${k}'. Allowed: 'Easy', 'Medium', 'Hard'.`);
        }
        const pct = val[k];
        if (typeof pct !== 'number' || pct < 0 || pct > 100) {
          throw new Error(`Weight for difficulty '${k}' must be a number between 0 and 100.`);
        }
        sum += pct;
      }
      if (Math.abs(sum - 100) > 0.01) {
        throw new Error(`The sum of difficulty weights must equal exactly 100. Current sum: ${sum}`);
      }
      return true;
    }),
  validate
];

module.exports = {
  createExamValidator,
  generateExamValidator,
  generateBlueprintExamValidator
};
