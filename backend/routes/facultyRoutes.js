const express = require('express');
const {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createFacultyRules, updateFacultyRules } = require('../middleware/validators/facultyValidators');

const router = express.Router();

// All faculty routes require authentication.
// Mutation routes (POST/PUT/DELETE) additionally require 'admin' role —
// enforced by the authorize() middleware registered in route middleware,
// so controllers themselves don't need role checks.
router.use(protect);

router.route('/')
  .get(getFaculties)
  .post(authorize('admin'), createFacultyRules, validate, createFaculty);

router.route('/:id')
  .get(getFaculty)
  .put(authorize('admin'),    updateFacultyRules, validate, updateFaculty)
  .delete(authorize('admin'), deleteFaculty);

module.exports = router;
