const express = require('express');
const rateLimit = require('express-rate-limit');
const { googleLogin, emailRegister, emailLogin } = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' }
});

router.post('/google', authLimiter, googleLogin);
router.post('/register', authLimiter, emailRegister);
router.post('/login', authLimiter, emailLogin);

module.exports = router;
