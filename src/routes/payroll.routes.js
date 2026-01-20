// backend/src/routes/payroll.routes.js
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
const { protect, authorize } = require('../middleware/auth.middleware');

// Protected routes - All users can view their own
router.get('/', protect, getAllPayroll);
router.get('/:id', protect, getPayrollById);
router.get('/month/:monthYear', protect, getPayrollByMonth);
router.get('/employee/:employeeId', protect, getPayrollByEmployee);
router.get('/stall/:stallId', protect, getPayrollByStall);
router.post('/calculate-monthly', protect, calculateMonthlyTotal);
router.get('/top-earners/:monthYear/:limit?', protect, getTopEarners);

// Manager & Owner routes
router.post('/', protect, authorize('owner', 'manager'), createPayroll);
router.put('/:id', protect, authorize('owner', 'manager'), updatePayroll);
router.get('/pending-payments', protect, authorize('owner', 'manager'), getPendingPayments);
router.post('/:id/approve', protect, authorize('owner', 'manager'), approvePayroll);
router.post('/:id/process', protect, authorize('owner', 'manager'), processPayment);
router.post('/:id/mark-paid', protect, authorize('owner', 'manager'), markAsPaid);

// Owner only routes
router.delete('/:id', protect, authorize('owner'), deletePayroll);

module.exports = router;