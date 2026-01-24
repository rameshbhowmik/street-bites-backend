// backend/src/routes/stallPerformance.routes.js (Fixed)

/**
 * Stall Performance Routes
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: Using correct middleware names (authenticateToken, authorizeRoles)
 * ✅ Fixed: All roles are lowercase
 */

const express = require('express');
const router = express.Router();
const {
  createPerformanceReport,
  getAllPerformanceReports,
  getPerformanceReportById,
  updatePerformanceReport,
  getStallPerformance,
  getTopPerformingStalls,
  getLowPerformingStalls,
  getHighWastageStalls,
  addComplaint,
  addActionItem,
  submitReport,
  reviewReport,
  deletePerformanceReport
} = require('../controllers/stallPerformanceController');

// ✅ FIXED: Using correct middleware names
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticateToken);

// ============================================
// SPECIFIC ROUTES (Must come BEFORE parameterized routes)
// ============================================

/**
 * @route   GET /api/stall-performance/top-performing
 * @desc    Get top performing stalls
 * @access  Protected (All authenticated users)
 */
router.get('/top-performing', getTopPerformingStalls);

/**
 * @route   GET /api/stall-performance/low-performing
 * @desc    Get low performing stalls
 * @access  Manager, Owner
 */
router.get(
  '/low-performing',
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  getLowPerformingStalls
);

/**
 * @route   GET /api/stall-performance/high-wastage
 * @desc    Get high wastage stalls
 * @access  Manager, Owner
 */
router.get(
  '/high-wastage',
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  getHighWastageStalls
);

/**
 * @route   GET /api/stall-performance/stall/:stallId
 * @desc    Get performance for a specific stall
 * @access  Protected (All authenticated users)
 */
router.get('/stall/:stallId', getStallPerformance);

// ============================================
// BASIC CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/stall-performance
 * @desc    Get all performance reports (with filters)
 * @access  Protected (All authenticated users)
 */
router.get('/', getAllPerformanceReports);

/**
 * @route   POST /api/stall-performance
 * @desc    Create new performance report
 * @access  Manager, Owner
 */
router.post(
  '/',
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  createPerformanceReport
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   POST /api/stall-performance/:id/complaint
 * @desc    Add complaint to performance report
 * @access  Protected (All authenticated users)
 */
router.post('/:id/complaint', addComplaint);

/**
 * @route   POST /api/stall-performance/:id/action-item
 * @desc    Add action item to performance report
 * @access  Manager, Owner
 */
router.post(
  '/:id/action-item',
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  addActionItem
);

/**
 * @route   PUT /api/stall-performance/:id/submit
 * @desc    Submit performance report
 * @access  Manager
 */
router.put(
  '/:id/submit',
  authorizeRoles('manager'), // ✅ FIXED: lowercase role
  submitReport
);

/**
 * @route   PUT /api/stall-performance/:id/review
 * @desc    Review performance report
 * @access  Owner
 */
router.put(
  '/:id/review',
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  reviewReport
);

/**
 * @route   GET /api/stall-performance/:id
 * @desc    Get single performance report by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', getPerformanceReportById);

/**
 * @route   PUT /api/stall-performance/:id
 * @desc    Update performance report
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  updatePerformanceReport
);

/**
 * @route   DELETE /api/stall-performance/:id
 * @desc    Delete performance report
 * @access  Owner only
 */
router.delete(
  '/:id',
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  deletePerformanceReport
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/stall-performance                     - Get all reports
 * GET    /api/stall-performance/:id                 - Get single report
 * GET    /api/stall-performance/top-performing      - Get top performing stalls
 * GET    /api/stall-performance/stall/:stallId      - Get stall performance
 * POST   /api/stall-performance/:id/complaint       - Add complaint
 *
 * ============ Manager & Owner ============
 * POST   /api/stall-performance                     - Create new report
 * PUT    /api/stall-performance/:id                 - Update report
 * GET    /api/stall-performance/low-performing      - Get low performing stalls
 * GET    /api/stall-performance/high-wastage        - Get high wastage stalls
 * POST   /api/stall-performance/:id/action-item     - Add action item
 *
 * ============ Manager Only ============
 * PUT    /api/stall-performance/:id/submit          - Submit report
 *
 * ============ Owner Only ============
 * DELETE /api/stall-performance/:id                 - Delete report
 * PUT    /api/stall-performance/:id/review          - Review report
 */