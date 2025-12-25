// User Routes
// User সংক্রান্ত সব endpoints

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middlewares - সঠিক import
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { uploadSingle, validateUploadedFile } = require('../middleware/upload');

// Controller
const userController = require('../controllers/userController');

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// @route   GET /api/users/profile
// @desc    নিজের profile দেখা
// @access  Private
router.get('/profile', authenticateToken, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Profile update করা
// @access  Private
router.put(
  '/profile',
  authenticateToken,
  [
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('নাম ২-১০০ অক্ষরের মধ্যে হতে হবে'),
    body('phone')
      .optional()
      .matches(/^(\+88)?01[3-9]\d{8}$/)
      .withMessage('সঠিক phone number প্রদান করুন'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('সঠিক email address প্রদান করুন')
  ],
  userController.updateProfile
);

// @route   POST /api/users/upload-picture
// @desc    Profile picture upload করা
// @access  Private
router.post(
  '/upload-picture',
  authenticateToken,
  uploadSingle('profile_picture', 'image'), // সঠিক middleware ব্যবহার
  validateUploadedFile,
  userController.uploadProfilePicture
);

// @route   DELETE /api/users/profile-picture
// @desc    Profile picture delete করা
// @access  Private
router.delete(
  '/profile-picture',
  authenticateToken,
  userController.deleteProfilePicture
);

// =============================================
// ADMIN ONLY ROUTES
// =============================================

// @route   GET /api/users/statistics/all
// @desc    User statistics (এটি /api/users এর আগে রাখতে হবে)
// @access  Private (Admin/Owner only)
router.get(
  '/statistics/all',
  authenticateToken,
  authorizeRoles('owner'),
  userController.getUserStatistics
);

// @route   GET /api/users
// @desc    সব users list
// @access  Private (Admin/Owner only)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('owner'),
  userController.getAllUsers
);

// @route   GET /api/users/:userId
// @desc    নির্দিষ্ট user দেখা
// @access  Private (Admin/Owner only)
router.get(
  '/:userId',
  authenticateToken,
  authorizeRoles('owner'),
  userController.getUserById
);

// @route   PUT /api/users/:userId/status
// @desc    User status change করা
// @access  Private (Admin/Owner only)
router.put(
  '/:userId/status',
  authenticateToken,
  authorizeRoles('owner'),
  [
    body('status')
      .isIn(['active', 'inactive', 'suspended', 'deleted'])
      .withMessage('সঠিক status select করুন')
  ],
  userController.updateUserStatus
);

module.exports = router;