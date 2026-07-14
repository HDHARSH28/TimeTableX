const { body } = require('express-validator');

const createFacultyRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Faculty name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('departmentId')
    .notEmpty().withMessage('Department ID is required')
    .isInt({ min: 1 }).withMessage('Department ID must be a positive integer'),

  body('maxClassesPerDay')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('maxClassesPerDay must be between 1 and 10'),

  body('workingDays')
    .optional()
    .matches(/^[1-7](,[1-7])*$/).withMessage('workingDays must be a comma-separated list of day numbers (1–7)')
];

const updateFacultyRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be blank')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('departmentId')
    .optional()
    .isInt({ min: 1 }).withMessage('Department ID must be a positive integer'),

  body('maxClassesPerDay')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('maxClassesPerDay must be between 1 and 10'),

  body('workingDays')
    .optional()
    .matches(/^[1-7](,[1-7])*$/).withMessage('workingDays must be a comma-separated list of day numbers (1–7)')
];

module.exports = { createFacultyRules, updateFacultyRules };
