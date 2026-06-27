const express = require('express');
const router = express.Router();
const { uploadProof, getProofs } = require('../controllers/proofController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', uploadProof);
router.get('/:taskId', getProofs);

module.exports = router;
