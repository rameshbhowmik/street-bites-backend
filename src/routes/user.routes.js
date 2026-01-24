// backend/src/routes/user.routes.js (Fixed)

/**
 * User Routes
 * ✅ Fixed: All roles are lowercase
 * ✅ Fixed: Removed duplicate route
 * ✅ Route order is already correct
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadAndReplaceProfilePicture } = require('../middleware/upload.middleware');

// ============================================
// IMPORTANT: Route Order Matters!
// Specific routes MUST come BEFORE dynamic routes (/:id)
// ============================================

// ============================================
// PROTECTED ROUTES - All Authenticated Users
// ============================================

// ===== Profile Management (Specific routes first) =====

/**
 * @route   GET /api/users/profile/me
 * @desc    Get own profile
 * @access  Protected (All authenticated users)
 */
router.get(
  '/profile/me',
  authenticateToken,
  userController.getMyProfile
);

/**
 * @route   PUT /api/users/profile/me
 * @desc    Update own profile
 * @access  Protected (All authenticated users)
 */
router.put(
  '/profile/me',
  authenticateToken,
  userController.updateMyProfile
);

/**
 * @route   POST /api/users/profile/upload-image
 * @desc    Upload profile image
 * @access  Protected (All authenticated users)
 */
router.post(
  '/profile/upload-image',
  authenticateToken,
  uploadAndReplaceProfilePicture, // Multer middleware
  userController.uploadProfileImage
);

/**
 * @route   DELETE /api/users/profile/delete-image
 * @desc    Delete profile image
 * @access  Protected (All authenticated users)
 */
router.delete(
  '/profile/delete-image',
  authenticateToken,
  userController.deleteProfileImage
);

// ============================================
// MANAGER & OWNER ROUTES (Specific routes before /:id)
// ============================================

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Manager, Owner
 */
router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase
  userController.getUserStatistics
);

/**
 * @route   GET /api/users/employees
 * @desc    Get all employees
 * @access  Manager, Owner
 */
router.get(
  '/employees',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase
  userController.getAllEmployees
);

/**
 * @route   GET /api/users/investors
 * @desc    Get all investors
 * @access  Owner only
 */
router.get(
  '/investors',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase
  userController.getAllInvestors
);

/**
 * @route   PUT /api/users/employees/:id/assign-stall
 * @desc    Assign stall to employee
 * @access  Manager, Owner
 */
router.put(
  '/employees/:id/assign-stall',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase
  userController.assignStallToEmployee
);

// ============================================
// GENERAL LIST & CREATE
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users (with filters)
 * @access  Manager, Owner
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase
  userController.getAllUsers
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase
  userController.createUser
);

// ============================================
// PARAMETERIZED ROUTES (/:id) - MUST BE LAST
// ============================================

/**
 * @route   PUT /api/users/:id/toggle-block
 * @desc    Block/Unblock user
 * @access  Manager, Owner
 */
router.put(
  '/:id/toggle-block',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase
  userController.toggleBlockUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Protected (All authenticated users)
 */
router.get(
  '/:id',
  authenticateToken,
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Protected (All authenticated users)
 */
router.put(
  '/:id',
  authenticateToken,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase
  userController.deleteUser
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/users/profile/me                    - Get own profile
 * PUT    /api/users/profile/me                    - Update own profile
 * POST   /api/users/profile/upload-image          - Upload profile image
 * DELETE /api/users/profile/delete-image          - Delete profile image
 * GET    /api/users/:id                           - Get single user
 * PUT    /api/users/:id                           - Update user
 *
 * ============ Manager & Owner ============
 * GET    /api/users                               - Get all users
 * POST   /api/users                               - Create new user
 * GET    /api/users/stats                         - Get user statistics
 * GET    /api/users/employees                     - Get all employees
 * PUT    /api/users/:id/toggle-block              - Block/Unblock user
 * PUT    /api/users/employees/:id/assign-stall    - Assign stall to employee
 *
 * ============ Owner Only ============
 * GET    /api/users/investors                     - Get all investors
 * DELETE /api/users/:id                           - Delete user
 */