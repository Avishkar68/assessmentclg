const { body } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Validator for user registration request body
 */
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required and must be a valid string')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student']).withMessage('Role must be admin, teacher, or student'),
  validate
];

/**
 * Validator for user login request body
 */
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator
};
