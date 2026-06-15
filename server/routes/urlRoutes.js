const express = require('express');
const router = express.Router();
const { 
  createUrl, 
  getUrls, 
  getUrlById, 
  updateUrl, 
  deleteUrl,
  bulkCreateUrls,
  downloadQRCode
} = require('../controllers/urlController');
const { getPublicUrlAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Unprotected public routes
router.get('/public/analytics/:shortCode', getPublicUrlAnalytics);
router.get('/download-qr/:shortCode', downloadQRCode);

// Protected routes
router.post('/create', protect, createUrl);
router.get('/all', protect, getUrls);
router.get('/:id', protect, getUrlById);
router.put('/:id', protect, updateUrl);
router.delete('/:id', protect, deleteUrl);
router.post('/bulk', protect, bulkCreateUrls);

module.exports = router;
