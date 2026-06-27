const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { analyzeTask, getAgentLogs } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 AI requests per minute
  message: { message: 'Too many AI requests. Please wait a moment before trying again.' }
});

router.post('/analyze', aiLimiter, analyzeTask);
router.get('/logs/:taskId', getAgentLogs);

module.exports = router;
