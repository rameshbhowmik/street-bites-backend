// backend/src/routes/payroll.routes.js (Fixed)

/**
 * Payroll Routes
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: Using correct middleware names (authenticateToken, authorizeRoles)
 * ✅ Fixed: All roles are lowercase
 */

const express = require('express');
const router = express.Router();
const {
  createPayroll,
  getAllPayroll,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollByMonth,
  getPayrollByEmployee,
  getPendingPayments,
  getPayrollByStall,
  approvePayroll,
  processPayment,
  markAsPaid,
  calculateMonthlyTotal,
  getTopEarners
} = require('../controllers/payrollController');

// ✅ FIXED: Using correct middleware names
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// ============================================
// SPECIFIC ROUTES (Must come BEFORE parameterized routes)
// ============================================

/**
 * @route   GET /api/payroll/pending-payments
 * @desc    Get pending payroll payments
 * @access  Manager, Owner
 */
router.get(
  '/pending-payments',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  getPendingPayments
);

/**
 * @route   POST /api/payroll/calculate-monthly
 * @desc    Calculate monthly payroll total
 * @access  Protected (All authenticated users)
 */
router.post('/calculate-monthly', authenticateToken, calculateMonthlyTotal);

/**
 * @route   GET /api/payroll/month/:monthYear
 * @desc    Get payroll by month (format: YYYY-MM)
 * @access  Protected (All authenticated users)
 */
router.get('/month/:monthYear', authenticateToken, getPayrollByMonth);

/**
 * @route   GET /api/payroll/employee/:employeeId
 * @desc    Get payroll records for an employee
 * @access  Protected (All authenticated users)
 */
router.get('/employee/:employeeId', authenticateToken, getPayrollByEmployee);

/**
 * @route   GET /api/payroll/stall/:stallId
 * @desc    Get payroll records for a stall
 * @access  Protected (All authenticated users)
 */
router.get('/stall/:stallId', authenticateToken, getPayrollByStall);

/**
 * @route   GET /api/payroll/top-earners/:monthYear/:limit?
 * @desc    Get top earning employees for a month
 * @access  Protected (All authenticated users)
 */
router.get('/top-earners/:monthYear/:limit?', authenticateToken, getTopEarners);

// ============================================
// BASIC CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/payroll
 * @desc    Get all payroll records (with filters)
 * @access  Protected (All authenticated users)
 */
router.get('/', authenticateToken, getAllPayroll);

/**
 * @route   POST /api/payroll
 * @desc    Create new payroll record
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  createPayroll
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   POST /api/payroll/:id/approve
 * @desc    Approve payroll
 * @access  Manager, Owner
 */
router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  approvePayroll
);

/**
 * @route   POST /api/payroll/:id/process
 * @desc    Process payroll payment
 * @access  Manager, Owner
 */
router.post(
  '/:id/process',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  processPayment
);

/**
 * @route   POST /api/payroll/:id/mark-paid
 * @desc    Mark payroll as paid
 * @access  Manager, Owner
 */
router.post(
  '/:id/mark-paid',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  markAsPaid
);

/**
 * @route   GET /api/payroll/:id
 * @desc    Get single payroll record by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', authenticateToken, getPayrollById);

/**
 * @route   PUT /api/payroll/:id
 * @desc    Update payroll record
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  updatePayroll
);

/**
 * @route   DELETE /api/payroll/:id
 * @desc    Delete payroll record
 * @access  Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  deletePayroll
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/payroll                          - Get all payroll records
 * GET    /api/payroll/:id                      - Get single payroll
 * GET    /api/payroll/month/:monthYear         - Get by month
 * GET    /api/payroll/employee/:employeeId     - Get by employee
 * GET    /api/payroll/stall/:stallId           - Get by stall
 * POST   /api/payroll/calculate-monthly        - Calculate monthly total
 * GET    /api/payroll/top-earners/:monthYear/:limit? - Get top earners
 *
 * ============ Manager & Owner Only ============
 * POST   /api/payroll                          - Create new payroll
 * PUT    /api/payroll/:id                      - Update payroll
 * GET    /api/payroll/pending-payments         - Get pending payments
 * POST   /api/payroll/:id/approve              - Approve payroll
 * POST   /api/payroll/:id/process              - Process payment
 * POST   /api/payroll/:id/mark-paid            - Mark as paid
 *
 * ============ Owner Only ============
 * DELETE /api/payroll/:id                      - Delete payroll
 */