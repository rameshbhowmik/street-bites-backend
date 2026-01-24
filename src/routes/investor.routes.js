// backend/src/routes/investor.routes.js (Fixed)

/**
 * Investor Routes
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: Using correct middleware names (authenticateToken, authorizeRoles)
 * ✅ Fixed: All roles are lowercase
 */

const express = require('express');
const router = express.Router();
const {
  createInvestor,
  getAllInvestors,
  getInvestorById,
  updateInvestor,
  deleteInvestor,
  getActiveInvestors,
  getTopInvestors,
  getPaymentsDue,
  addPayout,
  calculateROI,
  addDocument,
  addNote,
  getPayoutHistory,
  searchByMobile,
  searchByEmail
} = require('../controllers/investorController');

// ✅ FIXED: Using correct middleware names
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// ============================================
// SPECIFIC ROUTES (Must come BEFORE parameterized routes)
// ============================================

/**
 * @route   GET /api/investors/active
 * @desc    Get all active investors
 * @access  Protected (All authenticated users)
 */
router.get('/active', authenticateToken, getActiveInvestors);

/**
 * @route   GET /api/investors/top/:limit?
 * @desc    Get top investors by investment amount
 * @access  Protected (All authenticated users)
 */
router.get('/top/:limit?', authenticateToken, getTopInvestors);

/**
 * @route   GET /api/investors/payments-due
 * @desc    Get investors with payments due
 * @access  Manager, Owner
 */
router.get(
  '/payments-due',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  getPaymentsDue
);

/**
 * @route   GET /api/investors/search/mobile/:mobile
 * @desc    Search investor by mobile number
 * @access  Manager, Owner
 */
router.get(
  '/search/mobile/:mobile',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  searchByMobile
);

/**
 * @route   GET /api/investors/search/email/:email
 * @desc    Search investor by email
 * @access  Manager, Owner
 */
router.get(
  '/search/email/:email',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  searchByEmail
);

// ============================================
// BASIC CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/investors
 * @desc    Get all investors (with filters)
 * @access  Protected (All authenticated users)
 */
router.get('/', authenticateToken, getAllInvestors);

/**
 * @route   POST /api/investors
 * @desc    Create new investor
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  createInvestor
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   GET /api/investors/:id/payout-history
 * @desc    Get payout history for an investor
 * @access  Protected (All authenticated users)
 */
router.get('/:id/payout-history', authenticateToken, getPayoutHistory);

/**
 * @route   POST /api/investors/:id/payout
 * @desc    Add payout to investor
 * @access  Manager, Owner
 */
router.post(
  '/:id/payout',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  addPayout
);

/**
 * @route   POST /api/investors/:id/calculate-roi
 * @desc    Calculate ROI for investor
 * @access  Manager, Owner
 */
router.post(
  '/:id/calculate-roi',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  calculateROI
);

/**
 * @route   POST /api/investors/:id/documents
 * @desc    Add document to investor
 * @access  Manager, Owner
 */
router.post(
  '/:id/documents',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  addDocument
);

/**
 * @route   POST /api/investors/:id/notes
 * @desc    Add note to investor
 * @access  Manager, Owner
 */
router.post(
  '/:id/notes',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  addNote
);

/**
 * @route   GET /api/investors/:id
 * @desc    Get single investor by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', authenticateToken, getInvestorById);

/**
 * @route   PUT /api/investors/:id
 * @desc    Update investor
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  updateInvestor
);

/**
 * @route   DELETE /api/investors/:id
 * @desc    Delete investor
 * @access  Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  deleteInvestor
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/investors                        - Get all investors
 * GET    /api/investors/active                 - Get active investors
 * GET    /api/investors/top/:limit?            - Get top investors
 * GET    /api/investors/:id                    - Get single investor
 * GET    /api/investors/:id/payout-history     - Get payout history
 *
 * ============ Manager & Owner Only ============
 * POST   /api/investors                        - Create new investor
 * PUT    /api/investors/:id                    - Update investor
 * GET    /api/investors/payments-due           - Get payments due
 * POST   /api/investors/:id/payout             - Add payout
 * POST   /api/investors/:id/calculate-roi      - Calculate ROI
 * POST   /api/investors/:id/documents          - Add document
 * POST   /api/investors/:id/notes              - Add note
 * GET    /api/investors/search/mobile/:mobile  - Search by mobile
 * GET    /api/investors/search/email/:email    - Search by email
 *
 * ============ Owner Only ============
 * DELETE /api/investors/:id                    - Delete investor
 */