const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

router.post('/faculty', facultyController.addFaculty);
router.get('/faculty', facultyController.getAllFaculty);

module.exports = router;
