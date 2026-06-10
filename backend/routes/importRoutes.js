const express = require('express');
const {
  importDepartments,
  importClassrooms,
  importFaculty,
  importSubjects
} = require('../controllers/importController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All import routes require authentication
router.use(authorize('admin')); // All import routes require admin role

router.post('/departments', importDepartments);
router.post('/classrooms', importClassrooms);
router.post('/faculty', importFaculty);
router.post('/subjects', importSubjects);

module.exports = router;
