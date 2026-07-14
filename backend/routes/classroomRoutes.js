const express = require('express');
const {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createClassroomRules, updateClassroomRules } = require('../middleware/validators/classroomValidators');

const router = express.Router();

// All classroom routes require authentication.
// Mutation routes (POST/PUT/DELETE) additionally require 'admin' role —
// enforced by the authorize() middleware at the route level.
router.use(protect);

router.route('/')
  .get(getClassrooms)
  .post(authorize('admin'), createClassroomRules, validate, createClassroom);

router.route('/:id')
  .get(getClassroom)
  .put(authorize('admin'),    updateClassroomRules, validate, updateClassroom)
  .delete(authorize('admin'), deleteClassroom);

module.exports = router;
