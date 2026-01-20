// backend/src/routes/investor.routes.js
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
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - None

// Protected routes - All users can view
router.get('/', protect, getAllInvestors);
router.get('/active', protect, getActiveInvestors);
router.get('/top/:limit?', protect, getTopInvestors);
router.get('/:id', protect, getInvestorById);
router.get('/:id/payout-history', protect, getPayoutHistory);

// Manager & Owner routes
router.post('/', protect, authorize('owner', 'manager'), createInvestor);
router.put('/:id', protect, authorize('owner', 'manager'), updateInvestor);
router.get('/payments-due', protect, authorize('owner', 'manager'), getPaymentsDue);
router.post('/:id/payout', protect, authorize('owner', 'manager'), addPayout);
router.post('/:id/calculate-roi', protect, authorize('owner', 'manager'), calculateROI);
router.post('/:id/documents', protect, authorize('owner', 'manager'), addDocument);
router.post('/:id/notes', protect, authorize('owner', 'manager'), addNote);
router.get('/search/mobile/:mobile', protect, authorize('owner', 'manager'), searchByMobile);
router.get('/search/email/:email', protect, authorize('owner', 'manager'), searchByEmail);

// Owner only routes
router.delete('/:id', protect, authorize('owner'), deleteInvestor);

module.exports = router;