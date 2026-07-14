const express = require('express');
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createSubjectRules, updateSubjectRules } = require('../middleware/validators/subjectValidators');

const router = express.Router();

// All subject routes require authentication.
// Mutation routes (POST/PUT/DELETE) additionally require 'admin' role —
// enforced by the authorize() middleware at the route level.
router.use(protect);

router.route('/')
  .get(getSubjects)
  .post(authorize('admin'), createSubjectRules, validate, createSubject);

router.route('/:id')
  .get(getSubject)
  .put(authorize('admin'),    updateSubjectRules, validate, updateSubject)
  .delete(authorize('admin'), deleteSubject);

module.exports = router;
