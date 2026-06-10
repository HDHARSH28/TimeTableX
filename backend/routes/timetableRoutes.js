const express = require('express');
const {
  generateTimetable,
  getTimetables,
  getTimetable,
  updateTimetableStatus,
  deleteTimetable,
  exportTimetable
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('admin', 'scheduler'), generateTimetable);
router.get('/', getTimetables);
router.get('/:id', getTimetable);
router.put('/:id/status', authorize('admin', 'scheduler'), updateTimetableStatus);
router.delete('/:id', authorize('admin'), deleteTimetable);
router.get('/:id/export', exportTimetable);

module.exports = router;
