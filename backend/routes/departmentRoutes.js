const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createDepartmentRules, updateDepartmentRules } = require('../middleware/validators/departmentValidators');

const router = express.Router();

// All department routes require authentication.
// Mutation routes (POST/PUT/DELETE) additionally require 'admin' role —
// enforced by the authorize() middleware at the route level.
router.use(protect);

router.route('/')
  .get(getDepartments)
  .post(authorize('admin'), createDepartmentRules, validate, createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(authorize('admin'),    updateDepartmentRules, validate, updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

module.exports = router;
