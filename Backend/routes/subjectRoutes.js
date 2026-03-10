const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

router.post('/subjects', subjectController.addSubject);
router.get('/subjects', subjectController.getAllSubjects);

module.exports = router;
