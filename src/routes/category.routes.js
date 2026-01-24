// backend/src/routes/category.routes.js (Role Fixed)

/**
 * Category Routes - ক্যাটাগরি রুটস
 *
 * Features:
 * - Complete CRUD endpoints
 * - Image upload
 * - Category tree
 * - Authorization & validation
 * - 11 total endpoints
 * ✅ Fixed: All roles are now lowercase for consistency
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Controllers
const categoryController = require('../controllers/categoryController');

// Middleware
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { validate } = require('../utils/validators');
const { uploadImage } = require('../middleware/upload.middleware');

// ============================================
// PUBLIC ROUTES (কোনো authentication লাগবে না)
// ============================================

/**
 * @route   GET /api/categories
 * @desc    Get all active categories
 * @access  Public
 */
router.get(
  '/',
  [
    query('includeSubcategories')
      .optional()
      .isBoolean()
      .withMessage('includeSubcategories must be boolean'),
    validate
  ],
  categoryController.getAllCategories
);

/**
 * @route   GET /api/categories/tree
 * @desc    Get hierarchical category tree
 * @access  Public
 */
router.get('/tree', categoryController.getCategoryTree);

/**
 * @route   GET /api/categories/parents
 * @desc    Get only parent categories
 * @access  Public
 */
router.get('/parents', categoryController.getParentCategories);

/**
 * @route   GET /api/categories/featured
 * @desc    Get featured categories
 * @access  Public
 */
router.get(
  '/featured',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be 1-20'),
    validate
  ],
  categoryController.getFeaturedCategories
);

/**
 * @route   GET /api/categories/:identifier
 * @desc    Get single category by ID or slug
 * @access  Public
 */
router.get(
  '/:identifier',
  [
    param('identifier').notEmpty().withMessage('Category ID বা slug প্রয়োজন'),
    validate
  ],
  categoryController.getCategoryById
);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  uploadImage('categoryImage'), // Single image upload
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('ক্যাটাগরি নাম প্রয়োজন')
      .isLength({ max: 50 })
      .withMessage('নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে'),
    body('nameBengali')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('বাংলা নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('বর্ণনা সর্বোচ্চ ৫০০ অক্ষরের হতে পারে'),
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('সঠিক parent category ID প্রয়োজন'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order ০ বা তার বেশি হতে হবে'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured boolean হতে হবে'),
    validate
  ],
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  [
    param('id').isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('নাম খালি হতে পারবে না')
      .isLength({ max: 50 })
      .withMessage('নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে'),
    body('nameBengali')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('বাংলা নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('বর্ণনা সর্বোচ্চ ৫০০ অক্ষরের হতে পারে'),
    body('parentCategory')
      .optional()
      .custom((value, { req }) => {
        if (value && value === req.params.id) {
          throw new Error('ক্যাটাগরি নিজেকে parent হিসেবে সেট করতে পারবে না');
        }
        return true;
      })
      .isMongoId()
      .withMessage('সঠিক parent category ID প্রয়োজন'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order ০ বা তার বেশি হতে হবে'),
    validate
  ],
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Owner
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  [
    param('id').isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    validate
  ],
  categoryController.deleteCategory
);

// ============================================
// IMAGE MANAGEMENT ROUTES
// ============================================

/**
 * @route   POST /api/categories/:id/image
 * @desc    Upload/Update category image
 * @access  Manager, Owner
 */
router.post(
  '/:id/image',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  uploadImage('categoryImage'), // Single image upload
  [
    param('id').isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    validate
  ],
  categoryController.uploadCategoryImage
);

// ============================================
// UTILITY ROUTES
// ============================================

/**
 * @route   PATCH /api/categories/:id/update-count
 * @desc    Manually update product count
 * @access  Manager, Owner
 */
router.patch(
  '/:id/update-count',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  [
    param('id').isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    validate
  ],
  categoryController.updateProductCount
);

/**
 * @route   PATCH /api/categories/:id/featured
 * @desc    Toggle featured status
 * @access  Manager, Owner
 */
router.patch(
  '/:id/featured',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  [
    param('id').isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    validate
  ],
  categoryController.toggleFeatured
);

// ============================================
// ROUTE ORDER IS IMPORTANT!
// ============================================
// Specific routes (like /tree, /parents, /featured) MUST come BEFORE
// parameterized routes (like /:id) to avoid conflicts

module.exports = router;