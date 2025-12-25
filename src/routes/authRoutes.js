// Authentication Routes
// সব authentication endpoints

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// @route   POST /api/auth/register
// @desc    নতুন user registration
// @access  Public
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('সঠিক email address প্রদান করুন')
      .normalizeEmail(),
    body('phone')
      .matches(/^((\+88)?01[3-9]\d{8}|(\+91)?[6-9]\d{9})$/)
      .withMessage('সঠিক phone number প্রদান করুন (Bangladesh: 01XXXXXXXXX, India: XXXXXXXXXX)'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password কমপক্ষে ৮ অক্ষরের হতে হবে'),
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('পূর্ণ নাম প্রদান করুন')
      .isLength({ min: 2, max: 100 })
      .withMessage('নাম ২-১০০ অক্ষরের মধ্যে হতে হবে'),
    body('role')
      .optional()
      .isIn(['customer', 'employee', 'investor', 'owner'])
      .withMessage('সঠিক role select করুন')
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post(
  '/login',
  [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Email অথবা Phone number প্রদান করুন'),
    body('password')
      .notEmpty()
      .withMessage('Password প্রদান করুন')
  ],
  authController.login
);

// @route   POST /api/auth/forgot-password
// @desc    Password reset request
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('সঠিক email address প্রদান করুন')
      .normalizeEmail()
  ],
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    নতুন password set করা (token দিয়ে)
// @access  Public
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token প্রদান করুন'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('নতুন password কমপক্ষে ৮ অক্ষরের হতে হবে')
  ],
  authController.resetPassword
);

// @route   POST /api/auth/verify-otp
// @desc    OTP verification
// @access  Public
router.post(
  '/verify-otp',
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email অথবা Phone প্রদান করুন'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('৬ ডিজিটের OTP প্রদান করুন')
  ],
  authController.verifyOTP
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh-token',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token প্রদান করুন')
  ],
  authController.refreshAccessToken
);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// @route   GET /api/auth/profile
// @desc    Current user profile
// @access  Private
router.get('/profile', authenticateToken, authController.getProfile);

// @route   POST /api/auth/change-password
// @desc    Password change করা
// @access  Private
router.post(
  '/change-password',
  authenticateToken,
  [
    body('oldPassword')
      .notEmpty()
      .withMessage('পুরনো password প্রদান করুন'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('নতুন password কমপক্ষে ৮ অক্ষরের হতে হবে')
  ],
  authController.changePassword
);

// @route   POST /api/auth/logout
// @desc    User logout
// @access  Private
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;