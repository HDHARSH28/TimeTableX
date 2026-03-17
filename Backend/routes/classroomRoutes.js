const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');

router.post('/classrooms', classroomController.addClassroom);
router.get('/classrooms', classroomController.getAllClassrooms);
router.get('/classrooms/:id', classroomController.getClassroomById);
router.put('/classrooms/:id', classroomController.updateClassroom);
router.delete('/classrooms/:id', classroomController.deleteClassroom);

module.exports = router;
