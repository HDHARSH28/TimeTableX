const { body } = require('express-validator');

const createSubjectRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required')
    .isLength({ max: 150 }).withMessage('Name must be at most 150 characters'),

  body('code')
    .trim()
    .notEmpty().withMessage('Subject code is required')
    .isLength({ max: 20 }).withMessage('Code must be at most 20 characters'),

  body('classesPerWeek')
    .notEmpty().withMessage('classesPerWeek is required')
    .isInt({ min: 1, max: 20 }).withMessage('classesPerWeek must be between 1 and 20'),

  body('semester')
    .notEmpty().withMessage('Semester is required')
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),

  body('departmentId')
    .notEmpty().withMessage('Department ID is required')
    .isInt({ min: 1 }).withMessage('Department ID must be a positive integer'),

  body('type')
    .optional()
    .isIn(['theory', 'lab', 'tutorial', 'both']).withMessage("type must be 'theory', 'lab', 'tutorial', or 'both'"),

  body('facultyId')
    .optional()
    .isInt({ min: 1 }).withMessage('facultyId must be a positive integer'),

  body('facultyIds')
    .optional()
    .isArray().withMessage('facultyIds must be an array')
    .custom((arr) => arr.every(id => Number.isInteger(id) && id > 0))
    .withMessage('Each facultyId must be a positive integer')
];

const updateSubjectRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be blank')
    .isLength({ max: 150 }).withMessage('Name must be at most 150 characters'),

  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('Code cannot be blank')
    .isLength({ max: 20 }).withMessage('Code must be at most 20 characters'),

  body('classesPerWeek')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('classesPerWeek must be between 1 and 20'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),

  body('departmentId')
    .optional()
    .isInt({ min: 1 }).withMessage('Department ID must be a positive integer'),

  body('type')
    .optional()
    .isIn(['theory', 'lab', 'tutorial', 'both']).withMessage("type must be 'theory', 'lab', 'tutorial', or 'both'"),

  body('facultyId')
    .optional()
    .isInt({ min: 1 }).withMessage('facultyId must be a positive integer'),

  body('facultyIds')
    .optional()
    .isArray().withMessage('facultyIds must be an array')
    .custom((arr) => arr.every(id => Number.isInteger(id) && id > 0))
    .withMessage('Each facultyId must be a positive integer')
];

module.exports = { createSubjectRules, updateSubjectRules };
