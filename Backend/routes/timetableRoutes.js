const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

router.post('/generate-timetable', timetableController.generateTimetable);
router.get('/timetable/:id', timetableController.getTimetable);

module.exports = router;
