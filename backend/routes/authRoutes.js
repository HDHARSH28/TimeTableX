const express = require('express');
const { registerUser, loginUser, getMe, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerRules, loginRules } = require('../middleware/validators/authValidators');

const router = express.Router();

router.post('/register', registerRules, validate, registerUser);
router.post('/login',    loginRules,    validate, loginUser);
router.get('/me',    protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;
