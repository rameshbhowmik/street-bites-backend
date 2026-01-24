// backend/src/routes/expense.routes.js (Fixed)

/**
 * Expense Routes
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: Using correct middleware names (authenticateToken, authorizeRoles)
 * ✅ Fixed: All roles are lowercase
 */

const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getPendingApprovals,
  getExpensesByType,
  getExpensesByStall,
  getRecurringDues,
  approveExpense,
  rejectExpense,
  markAsPaid,
  calculateTotalExpense,
  getExpenseBreakdown
} = require('../controllers/expenseController');

// ✅ FIXED: Using correct middleware names
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// ============================================
// SPECIFIC ROUTES (Must come BEFORE parameterized routes)
// ============================================

/**
 * @route   GET /api/expenses/pending
 * @desc    Get pending approval expenses
 * @access  Manager, Owner
 */
router.get(
  '/pending',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  getPendingApprovals
);

/**
 * @route   GET /api/expenses/recurring-dues
 * @desc    Get recurring expenses due
 * @access  Manager, Owner
 */
router.get(
  '/recurring-dues',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  getRecurringDues
);

/**
 * @route   POST /api/expenses/calculate-total
 * @desc    Calculate total expenses for a period
 * @access  Protected (All authenticated users)
 */
router.post('/calculate-total', authenticateToken, calculateTotalExpense);

/**
 * @route   POST /api/expenses/breakdown
 * @desc    Get expense breakdown by category
 * @access  Protected (All authenticated users)
 */
router.post('/breakdown', authenticateToken, getExpenseBreakdown);

/**
 * @route   GET /api/expenses/type/:type
 * @desc    Get expenses by type
 * @access  Protected (All authenticated users)
 */
router.get('/type/:type', authenticateToken, getExpensesByType);

/**
 * @route   GET /api/expenses/stall/:stallId
 * @desc    Get expenses by stall
 * @access  Protected (All authenticated users)
 */
router.get('/stall/:stallId', authenticateToken, getExpensesByStall);

// ============================================
// BASIC CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses (with filters)
 * @access  Protected (All authenticated users)
 */
router.get('/', authenticateToken, getAllExpenses);

/**
 * @route   POST /api/expenses
 * @desc    Create new expense
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  createExpense
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   POST /api/expenses/:id/approve
 * @desc    Approve expense
 * @access  Manager, Owner
 */
router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  approveExpense
);

/**
 * @route   POST /api/expenses/:id/reject
 * @desc    Reject expense
 * @access  Manager, Owner
 */
router.post(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  rejectExpense
);

/**
 * @route   POST /api/expenses/:id/mark-paid
 * @desc    Mark expense as paid
 * @access  Manager, Owner
 */
router.post(
  '/:id/mark-paid',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  markAsPaid
);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get single expense by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', authenticateToken, getExpenseById);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase roles
  updateExpense
);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 * @access  Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  deleteExpense
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/expenses                         - Get all expenses (with filters)
 * GET    /api/expenses/:id                     - Get single expense
 * GET    /api/expenses/type/:type              - Get expenses by type
 * GET    /api/expenses/stall/:stallId          - Get expenses by stall
 * POST   /api/expenses/calculate-total         - Calculate total expenses
 * POST   /api/expenses/breakdown               - Get expense breakdown
 *
 * ============ Manager & Owner Only ============
 * POST   /api/expenses                         - Create new expense
 * PUT    /api/expenses/:id                     - Update expense
 * GET    /api/expenses/pending                 - Get pending approvals
 * GET    /api/expenses/recurring-dues          - Get recurring dues
 * POST   /api/expenses/:id/approve             - Approve expense
 * POST   /api/expenses/:id/reject              - Reject expense
 * POST   /api/expenses/:id/mark-paid           - Mark as paid
 *
 * ============ Owner Only ============
 * DELETE /api/expenses/:id                     - Delete expense
 */