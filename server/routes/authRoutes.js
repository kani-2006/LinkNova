const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  logoutUser,
  getUserProfile, 
  updateUserProfile,
  changePassword,
  getSessions,
  updateNotifications,
  deleteAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Additional endpoints to keep UI settings functional
router.put('/password', protect, changePassword);
router.get('/sessions', protect, getSessions);
router.put('/notifications', protect, updateNotifications);
router.delete('/delete', protect, deleteAccount);

module.exports = router;
