const express = require('express');
const {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getClassrooms)
  .post(authorize('admin'), createClassroom);

router.route('/:id')
  .get(getClassroom)
  .put(authorize('admin'), updateClassroom)
  .delete(authorize('admin'), deleteClassroom);

module.exports = router;
