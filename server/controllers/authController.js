const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_url_shortener_jwt_key_2026_hackathon',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, name, email, password } = req.body;

  try {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        errors: [{ field: 'email', message: 'Email already registered' }]
      });
    }

    // Name fallback to username if not explicitly supplied (since register view might only collect username/email/password)
    const displayName = name || username || email.split('@')[0];

    const user = await User.create({
      name: displayName,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during signup' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        errors: [{ field: 'email', message: 'Invalid email or password' }]
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errors: [{ field: 'password', message: 'Invalid email or password' }]
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

// @desc    Logout user (token clearance)
// @route   POST /api/auth/logout
// @access  Private
exports.logoutUser = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error fetching profile details' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  const { name, fullName, email, phoneNumber, company, timezone } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      user.email = email;
    }

    // Map name and fullName (both are display name)
    if (name !== undefined) user.name = name;
    if (fullName !== undefined) user.name = fullName;

    // Use Mongoose's flexible document saving for other fields (which might be requested from profile settings)
    if (phoneNumber !== undefined) user.set('phoneNumber', phoneNumber);
    if (company !== undefined) user.set('company', company);
    if (timezone !== undefined) user.set('timezone', timezone);

    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/password (or part of update profile)
// @access  Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect current password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ success: false, error: 'Server error changing password' });
  }
};

// @desc    Get active login sessions/devices
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const sessions = [
      {
        id: 'session-1',
        device: 'Chrome on Windows',
        ip: req.ip || '127.0.0.1',
        isCurrent: true,
        lastActive: 'Active now'
      },
      {
        id: 'session-2',
        device: 'Safari on iPhone',
        ip: '192.168.1.45',
        isCurrent: false,
        lastActive: '2 hours ago'
      }
    ];

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error fetching sessions' });
  }
};

// @desc    Update notifications settings
// @route   PUT /api/auth/notifications
// @access  Private
exports.updateNotifications = async (req, res) => {
  const { emailNotifications, analyticsAlerts, weeklyReports } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const notifications = user.get('notifications') || {};
    if (emailNotifications !== undefined) notifications.emailNotifications = emailNotifications;
    if (analyticsAlerts !== undefined) notifications.analyticsAlerts = analyticsAlerts;
    if (weeklyReports !== undefined) notifications.weeklyReports = weeklyReports;
    
    user.set('notifications', notifications);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error updating notifications' });
  }
};

// @desc    Delete user account and all links/clicks
// @route   DELETE /api/auth/delete
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const Url = require('../models/Url');
    const Analytics = require('../models/Analytics');
    
    const userUrls = await Url.find({ userId });
    const urlIds = userUrls.map(u => u._id);

    await Analytics.deleteMany({ urlId: { $in: urlIds } });
    await Url.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ success: false, error: 'Server error deleting account' });
  }
};
