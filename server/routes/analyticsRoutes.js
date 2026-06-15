const express = require('express');
const router = express.Router();
const { getUrlAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:urlId', protect, getUrlAnalytics);

module.exports = router;
