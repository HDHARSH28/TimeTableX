const { body } = require('express-validator');

const createDepartmentRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Department name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),

  body('code')
    .trim()
    .notEmpty().withMessage('Department code is required')
    .isLength({ max: 10 }).withMessage('Code must be at most 10 characters')
    .toUpperCase()
];

const updateDepartmentRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be blank')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),

  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('Code cannot be blank')
    .isLength({ max: 10 }).withMessage('Code must be at most 10 characters')
    .toUpperCase()
];

module.exports = { createDepartmentRules, updateDepartmentRules };
