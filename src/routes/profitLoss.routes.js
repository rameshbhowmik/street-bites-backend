// backend/src/routes/profitLoss.routes.js (Fixed)

/**
 * Profit/Loss Routes
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: Using correct middleware names (authenticateToken, authorizeRoles)
 * ✅ Fixed: All roles are lowercase
 */

const express = require('express');
const router = express.Router();
const {
  createProfitLossReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  getLatestReports,
  getReportsByPeriod,
  getReportsByStall,
  getMostProfitable,
  getLossPeriods,
  finalizeReport,
  approveReport,
  getOverallStats,
  addInvestorShare
} = require('../controllers/profitLossController');

// ✅ FIXED: Using correct middleware names
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// ============================================
// SPECIFIC ROUTES (Must come BEFORE parameterized routes)
// ============================================

/**
 * @route   GET /api/profit-loss/latest/:limit?
 * @desc    Get latest profit/loss reports
 * @access  Protected (All authenticated users)
 */
router.get('/latest/:limit?', authenticateToken, getLatestReports);

/**
 * @route   GET /api/profit-loss/period/:type
 * @desc    Get reports by period type (daily, weekly, monthly, etc.)
 * @access  Protected (All authenticated users)
 */
router.get('/period/:type', authenticateToken, getReportsByPeriod);

/**
 * @route   GET /api/profit-loss/stall/:stallId
 * @desc    Get reports by stall
 * @access  Protected (All authenticated users)
 */
router.get('/stall/:stallId', authenticateToken, getReportsByStall);

/**
 * @route   GET /api/profit-loss/profitable/:limit?
 * @desc    Get most profitable periods
 * @access  Protected (All authenticated users)
 */
router.get('/profitable/:limit?', authenticateToken, getMostProfitable);

/**
 * @route   GET /api/profit-loss/loss-periods
 * @desc    Get loss periods
 * @access  Manager, Owner
 */
router.get(
  '/loss-periods',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  getLossPeriods
);

/**
 * @route   POST /api/profit-loss/overall-stats
 * @desc    Get overall statistics for a date range
 * @access  Protected (All authenticated users)
 */
router.post('/overall-stats', authenticateToken, getOverallStats);

// ============================================
// BASIC CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/profit-loss
 * @desc    Get all profit/loss reports (with filters)
 * @access  Protected (All authenticated users)
 */
router.get('/', authenticateToken, getAllReports);

/**
 * @route   POST /api/profit-loss
 * @desc    Create new profit/loss report
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  createProfitLossReport
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   POST /api/profit-loss/:id/finalize
 * @desc    Finalize profit/loss report
 * @access  Manager, Owner
 */
router.post(
  '/:id/finalize',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  finalizeReport
);

/**
 * @route   POST /api/profit-loss/:id/approve
 * @desc    Approve profit/loss report
 * @access  Owner only
 */
router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  approveReport
);

/**
 * @route   POST /api/profit-loss/:id/add-investor-share
 * @desc    Add investor share to report
 * @access  Manager, Owner
 */
router.post(
  '/:id/add-investor-share',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  addInvestorShare
);

/**
 * @route   GET /api/profit-loss/:id
 * @desc    Get single profit/loss report by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', authenticateToken, getReportById);

/**
 * @route   PUT /api/profit-loss/:id
 * @desc    Update profit/loss report
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  updateReport
);

/**
 * @route   DELETE /api/profit-loss/:id
 * @desc    Delete profit/loss report
 * @access  Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  deleteReport
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/profit-loss                      - Get all reports
 * GET    /api/profit-loss/:id                  - Get single report
 * GET    /api/profit-loss/latest/:limit?       - Get latest reports
 * GET    /api/profit-loss/period/:type         - Get by period type
 * GET    /api/profit-loss/stall/:stallId       - Get by stall
 * GET    /api/profit-loss/profitable/:limit?   - Get most profitable
 * POST   /api/profit-loss/overall-stats        - Get overall statistics
 *
 * ============ Manager & Owner Only ============
 * POST   /api/profit-loss                      - Create new report
 * PUT    /api/profit-loss/:id                  - Update report
 * GET    /api/profit-loss/loss-periods         - Get loss periods
 * POST   /api/profit-loss/:id/finalize         - Finalize report
 * POST   /api/profit-loss/:id/add-investor-share - Add investor share
 *
 * ============ Owner Only ============
 * DELETE /api/profit-loss/:id                  - Delete report
 * POST   /api/profit-loss/:id/approve          - Approve report
 */