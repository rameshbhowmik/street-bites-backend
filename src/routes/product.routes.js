// backend/src/routes/product.routes.js (Fixed)

/**
 * Product Routes - প্রোডাক্ট রুটস
 *
 * Features:
 * - Complete CRUD endpoints
 * - Image upload endpoints
 * - Search, filter, sort
 * - Authorization & validation
 * - 18 total endpoints
 * ✅ Fixed: Route order corrected
 * ✅ Fixed: All roles are lowercase
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Controllers
const productController = require('../controllers/productController');

// Middleware
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { validate } = require('../utils/validators');
const {
  uploadProductImages,
  uploadAndReplaceProductImages
} = require('../middleware/upload.middleware');

// ============================================
// PUBLIC ROUTES - SPECIFIC PATHS FIRST
// ============================================

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get(
  '/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    validate
  ],
  productController.getFeaturedProducts
);

/**
 * @route   GET /api/products/trending
 * @desc    Get trending products
 * @access  Public
 */
router.get(
  '/trending',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    validate
  ],
  productController.getTrendingProducts
);

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('অনুসন্ধান টেক্সট প্রয়োজন'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validate
  ],
  productController.searchProducts
);

/**
 * @route   GET /api/products/management/low-stock
 * @desc    Get low stock products
 * @access  Manager, Owner
 */
router.get(
  '/management/low-stock',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  productController.getLowStockProducts
);

/**
 * @route   GET /api/products/category/:categorySlug
 * @desc    Get products by category
 * @access  Public
 */
router.get(
  '/category/:categorySlug',
  [
    param('categorySlug').notEmpty().withMessage('Category slug প্রয়োজন'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validate
  ],
  productController.getProductsByCategory
);

// ============================================
// PUBLIC ROUTES - GENERAL LIST
// ============================================

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
    query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be 0-5'),
    validate
  ],
  productController.getAllProducts
);

// ============================================
// PROTECTED ROUTES - CREATE
// ============================================

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  uploadProductImages, // Multer middleware for multiple images
  [
    body('productName').trim().notEmpty().withMessage('প্রোডাক্টের নাম প্রয়োজন'),
    body('categoryId').isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    body('productType').notEmpty().withMessage('Product type প্রয়োজন'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('সঠিক বিক্রয় মূল্য প্রয়োজন'),
    body('costPrice').isFloat({ min: 0 }).withMessage('সঠিক খরচ মূল্য প্রয়োজন'),
    body('availableStock').isInt({ min: 0 }).withMessage('সঠিক স্টক পরিমাণ প্রয়োজন'),
    body('stallId').isMongoId().withMessage('সঠিক stall ID প্রয়োজন'),
    body('stallName').trim().notEmpty().withMessage('Stall name প্রয়োজন'),
    validate
  ],
  productController.createProduct
);

// ============================================
// PARAMETERIZED ROUTES - SPECIFIC ACTIONS FIRST
// ============================================

/**
 * @route   DELETE /api/products/:id/permanent
 * @desc    Permanently delete product with images
 * @access  Owner
 */
router.delete(
  '/:id/permanent',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    validate
  ],
  productController.permanentDeleteProduct
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Manager, Owner, Employee
 */
router.patch(
  '/:id/stock',
  authenticateToken,
  authorizeRoles('manager', 'owner', 'employee'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    body('quantity').isInt({ min: 1 }).withMessage('সঠিক পরিমাণ প্রয়োজন'),
    body('operation').isIn(['add', 'subtract']).withMessage('Operation add বা subtract হতে হবে'),
    validate
  ],
  productController.updateStock
);

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload images to product
 * @access  Manager, Owner
 */
router.post(
  '/:id/images',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  uploadProductImages, // Multer middleware
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    validate
  ],
  productController.uploadProductImages
);

/**
 * @route   DELETE /api/products/:id/images/:publicId
 * @desc    Delete a product image
 * @access  Manager, Owner
 */
router.delete(
  '/:id/images/:publicId',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    param('publicId').notEmpty().withMessage('Image public ID প্রয়োজন'),
    validate
  ],
  productController.deleteProductImage
);

/**
 * @route   PATCH /api/products/:id/images/:publicId/primary
 * @desc    Set primary image
 * @access  Manager, Owner
 */
router.patch(
  '/:id/images/:publicId/primary',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    param('publicId').notEmpty().withMessage('Image public ID প্রয়োজন'),
    validate
  ],
  productController.setPrimaryImage
);

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Add review to product
 * @access  Authenticated Users
 */
router.post(
  '/:id/reviews',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating ১ থেকে ৫ এর মধ্যে হতে হবে'),
    body('comment').optional().trim(),
    validate
  ],
  productController.addProductReview
);

/**
 * @route   PATCH /api/products/:id/featured
 * @desc    Toggle featured status
 * @access  Manager, Owner
 */
router.patch(
  '/:id/featured',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    validate
  ],
  productController.toggleFeatured
);

/**
 * @route   PATCH /api/products/:id/trending
 * @desc    Toggle trending status
 * @access  Manager, Owner
 */
router.patch(
  '/:id/trending',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    validate
  ],
  productController.toggleTrending
);

/**
 * @route   GET /api/products/:identifier
 * @desc    Get single product by ID or slug
 * @access  Public
 */
router.get(
  '/:identifier',
  [
    param('identifier').notEmpty().withMessage('Product ID বা slug প্রয়োজন'),
    validate
  ],
  productController.getProductById
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    body('productName').optional().trim().notEmpty().withMessage('প্রোডাক্টের নাম খালি হতে পারবে না'),
    body('categoryId').optional().isMongoId().withMessage('সঠিক category ID প্রয়োজন'),
    body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('সঠিক মূল্য প্রয়োজন'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('সঠিক মূল্য প্রয়োজন'),
    body('availableStock').optional().isInt({ min: 0 }).withMessage('সঠিক স্টক পরিমাণ প্রয়োজন'),
    validate
  ],
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @access  Owner
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase
  [
    param('id').isMongoId().withMessage('সঠিক product ID প্রয়োজন'),
    validate
  ],
  productController.deleteProduct
);

// ============================================
// ROUTE ORDER IS IMPORTANT!
// ============================================
// Specific routes (like /featured, /trending, /search) MUST come BEFORE
// parameterized routes (like /:id) to avoid conflicts

module.exports = router;