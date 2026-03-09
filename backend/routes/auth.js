const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generateTokens, verifyRefreshToken } = require('../utils/jwtUtils');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { profilePicStorage } = require('../config/cloudinary');

const upload = multer({
  storage: profilePicStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth route is working',
    timestamp: new Date().toISOString()
  });
});

// Create superadmin (for testing)
router.post('/create-superadmin', async (req, res) => {
  try {
    const adminEmail = 'admin@orvantahealth.com';
    const adminPassword = 'Welcomeadmin';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Superadmin already exists',
        data: {
          email: adminEmail,
          role: existingAdmin.role,
          isActive: existingAdmin.isActive
        }
      });
    }

    // Create new admin
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '1234567890',
        gender: 'other',
        address: 'Hospital HQ'
      },
      isActive: true
    });

    await admin.save();

    res.json({
      success: true,
      message: 'Superadmin created successfully',
      data: {
        email: adminEmail,
        password: adminPassword
      }
    });
  } catch (error) {
    console.error('Create superadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating superadmin',
      error: error.message
    });
  }
});

// Register new patient (public signup)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').optional(),
], async (req, res) => {
  console.log('Register Request Body:', req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, dateOfBirth, gender, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role: 'patient',
      profile: {
        firstName,
        lastName,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        address: address || undefined
      }
    });

    await user.save();

    // Create patient profile
    const patient = new Patient({ userId: user._id });
    await patient.save();

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        user,
        tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account not active'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Remove refresh token from user
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let profileData = null;

    // Get additional profile data based on role
    if (req.user.role === 'patient') {
      profileData = await Patient.findOne({ userId: req.user._id });
    } else if (req.user.role === 'doctor') {
      profileData = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'email profile');
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user profile - for staff members (date of birth, gender, address)
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { dateOfBirth, gender, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'profile.dateOfBirth': dateOfBirth,
        'profile.gender': gender,
        'profile.address': address
      },
      { new: true }
    ).select('-password -refreshToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// Upload profile picture (avatar)
router.post('/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update avatar in profile
    user.profile.avatar = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        avatar: req.file.path,
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile picture'
    });
  }
});

module.exports = router;
