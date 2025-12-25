// Product Routes
// Product সংক্রান্ত সব endpoints

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

// ✅ এই লাইন ঠিক করা হয়েছে - uploadSingleImage এর জায়গায় uploadSingle
const { uploadSingle } = require('../middleware/upload');

const productController = require('../controllers/productController');

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// @route   GET /api/products
// @desc    সব products list
// @access  Public
router.get('/', optionalAuth, productController.getAllProducts);

// @route   GET /api/products/search
// @desc    Product search করা
// @access  Public
router.get('/search', productController.searchProducts);

// @route   GET /api/products/popular
// @desc    জনপ্রিয় products
// @access  Public
router.get('/popular', productController.getPopularProducts);

// @route   GET /api/products/category/:category
// @desc    Category অনুযায়ী products
// @access  Public
router.get('/category/:category', productController.getProductsByCategory);

// @route   GET /api/products/:id
// @desc    একটি product details
// @access  Public
router.get('/:id', productController.getProductById);

// =============================================
// ADMIN ONLY ROUTES
// =============================================

// @route   POST /api/products
// @desc    নতুন product add করা
// @access  Private (Admin/Owner only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  // ✅ এই লাইন ঠিক করা হয়েছে - uploadSingle ব্যবহার করা হয়েছে
  uploadSingle('image', 'image'),
  [
    body('product_name')
      .trim()
      .notEmpty()
      .withMessage('Product name প্রদান করুন')
      .isLength({ min: 2, max: 255 })
      .withMessage('Product name ২-২৫৫ অক্ষরের মধ্যে হতে হবে'),
    body('category')
      .notEmpty()
      .withMessage('Category select করুন')
      .isIn([
        'fast_food',
        'beverages',
        'snacks',
        'desserts',
        'main_course',
        'breakfast',
        'appetizer',
        'special'
      ])
      .withMessage('সঠিক category select করুন'),
    body('base_price')
      .isFloat({ min: 0 })
      .withMessage('Price ০ বা তার বেশি হতে হবে')
  ],
  productController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Product update করা
// @access  Private (Admin/Owner only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  // ✅ এই লাইন ঠিক করা হয়েছে - uploadSingle ব্যবহার করা হয়েছে
  uploadSingle('image', 'image'),
  productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Product delete করা
// @access  Private (Admin/Owner only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  productController.deleteProduct
);

// @route   PATCH /api/products/:id/availability
// @desc    Product availability toggle করা
// @access  Private (Admin/Owner only)
router.patch(
  '/:id/availability',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  [
    body('is_available')
      .isBoolean()
      .withMessage('is_available true অথবা false হতে হবে')
  ],
  productController.toggleAvailability
);

// @route   GET /api/products/statistics/all
// @desc    Product statistics
// @access  Private (Admin/Owner only)
router.get(
  '/statistics/all',
  authenticateToken,
  authorizeRoles('owner'),
  productController.getProductStatistics
);

module.exports = router;