const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');

router.post('/classrooms', classroomController.addClassroom);
router.get('/classrooms', classroomController.getAllClassrooms);

module.exports = router;
