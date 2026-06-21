const { body } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Validator for creating/updating a Question request body
 */
const createQuestionValidator = [
  body('type')
    .notEmpty().withMessage('Question type is required and must be either "MCQ" or "Short Answer".')
    .isIn(['MCQ', 'Short Answer']).withMessage('Question type is required and must be either "MCQ" or "Short Answer".'),
  body('questionText')
    .trim()
    .notEmpty().withMessage('Question text is required.'),
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be either "Easy", "Medium", or "Hard".'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required.'),
  body('chapter')
    .trim()
    .notEmpty().withMessage('Chapter is required.'),
  body('marks')
    .exists().withMessage('Marks must be a positive number of at least 1.')
    .isInt({ min: 1 }).withMessage('Marks must be a positive number of at least 1.'),
  body('questionImage')
    .optional()
    .isURL({ require_tld: false }).withMessage('Question image must be a valid URL.'),
  
  // Custom checks for MCQ/Short Answer
  body().custom((value) => {
    if (value.type === 'MCQ') {
      const { options, correctAnswer } = value;
      if (!options || !Array.isArray(options) || options.length < 2) {
        throw new Error('MCQ questions require an "options" array with at least 2 answers.');
      }
      const allStrings = options.every((opt) => typeof opt === 'string' && opt.trim() !== '');
      if (!allStrings) {
        throw new Error('All MCQ options must be non-empty strings.');
      }
      if (!correctAnswer || typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
        throw new Error('MCQ questions require a "correctAnswer" option value.');
      }
      if (!options.includes(correctAnswer)) {
        throw new Error('The correctAnswer must exactly match one of the items inside the options array.');
      }
    } else if (value.type === 'Short Answer') {
      const { expectedAnswer } = value;
      if (!expectedAnswer || typeof expectedAnswer !== 'string' || expectedAnswer.trim() === '') {
        throw new Error('Short Answer questions require an "expectedAnswer" string.');
      }
    }
    return true;
  }),
  validate
];

module.exports = {
  createQuestionValidator
};
