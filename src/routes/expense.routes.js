// backend/src/routes/expense.routes.js
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
const { protect, authorize } = require('../middleware/auth.middleware');

// Protected routes - All users can view
router.get('/', protect, getAllExpenses);
router.get('/:id', protect, getExpenseById);
router.get('/type/:type', protect, getExpensesByType);
router.get('/stall/:stallId', protect, getExpensesByStall);
router.post('/calculate-total', protect, calculateTotalExpense);
router.post('/breakdown', protect, getExpenseBreakdown);

// Manager & Owner routes
router.post('/', protect, authorize('owner', 'manager'), createExpense);
router.put('/:id', protect, authorize('owner', 'manager'), updateExpense);
router.get('/pending', protect, authorize('owner', 'manager'), getPendingApprovals);
router.get('/recurring-dues', protect, authorize('owner', 'manager'), getRecurringDues);
router.post('/:id/approve', protect, authorize('owner', 'manager'), approveExpense);
router.post('/:id/reject', protect, authorize('owner', 'manager'), rejectExpense);
router.post('/:id/mark-paid', protect, authorize('owner', 'manager'), markAsPaid);

// Owner only routes
router.delete('/:id', protect, authorize('owner'), deleteExpense);

module.exports = router;