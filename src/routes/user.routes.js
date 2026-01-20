// backend/src/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadAndReplaceProfilePicture } = require('../middleware/upload.middleware'); // ⭐ ADD THIS

// ============================================
// IMPORTANT: Route Order Matters!
// Specific routes MUST come BEFORE dynamic routes (/:id)
// ============================================

// ============================================
// PROTECTED ROUTES - All Authenticated Users
// ============================================

// ===== Profile Management (Specific routes first) =====

// Get own profile - MUST be before /:id
router.get(
  '/profile/me',
  authenticateToken,
  userController.getMyProfile
);

// Update own profile - MUST be before /:id
router.put(
  '/profile/me',
  authenticateToken,
  userController.updateMyProfile
);

// Upload profile image - ⭐ WITH MULTER MIDDLEWARE
router.post(
  '/profile/upload-image',
  authenticateToken,
  uploadAndReplaceProfilePicture, // ⭐ Multer middleware for file upload
  userController.uploadProfileImage
);

// Delete profile image - ⭐ MUST be before /:id
router.delete(
  '/profile/delete-image',
  authenticateToken,
  userController.deleteProfileImage
);

// ============================================
// MANAGER & OWNER ROUTES
// ============================================

// Get user statistics - MUST be before /:id
router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.getUserStatistics
);

router.get(
  '/employees/list',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.getAllEmployees
);

// Get all employees
router.get(
  '/employees',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.getAllEmployees
);

// Block/Unblock user - specific route before /:id
router.put(
  '/:id/toggle-block',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.toggleBlockUser
);

// Assign stall to employee - specific route before /:id
router.put(
  '/employees/:id/assign-stall',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.assignStallToEmployee
);

// ============================================
// OWNER ONLY ROUTES
// ============================================

// Get all investors
router.get(
  '/investors',
  authenticateToken,
  authorizeRoles('Owner'),
  userController.getAllInvestors
);

// Get all users (with filters)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.getAllUsers
);

// Create new user
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Owner', 'Manager'),
  userController.createUser
);

// ============================================
// DYNAMIC ROUTES (/:id) - MUST BE LAST
// ============================================

// Get single user by ID - MUST be after all specific routes
router.get(
  '/:id',
  authenticateToken,
  userController.getUserById
);

// Update user - MUST be after all specific routes
router.put(
  '/:id',
  authenticateToken,
  userController.updateUser
);

// Delete user (soft delete) - MUST be after all specific routes
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('Owner'),
  userController.deleteUser
);

module.exports = router;