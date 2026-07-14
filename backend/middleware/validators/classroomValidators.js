const { body } = require('express-validator');

const createClassroomRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Classroom name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),

  body('capacity')
    .notEmpty().withMessage('Capacity is required')
    .isInt({ min: 1, max: 1000 }).withMessage('Capacity must be between 1 and 1000'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['classroom', 'lab']).withMessage("type must be 'classroom' or 'lab'")
];

const updateClassroomRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be blank')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Capacity must be between 1 and 1000'),

  body('type')
    .optional()
    .isIn(['classroom', 'lab']).withMessage("type must be 'classroom' or 'lab'")
];

module.exports = { createClassroomRules, updateClassroomRules };
