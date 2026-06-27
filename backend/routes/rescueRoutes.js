const express = require('express');
const router = express.Router();
const { checkRescueStatus, activateRescueMode, getActiveRescuePlan, deactivateRescueMode, toggleTriageStep } = require('../controllers/rescueController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/status', checkRescueStatus);
router.post('/activate', activateRescueMode);
router.get('/plan', getActiveRescuePlan);
router.post('/deactivate', deactivateRescueMode);
router.post('/triage/:stepId/toggle', toggleTriageStep);

module.exports = router;
