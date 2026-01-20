// backend/src/routes/profitLoss.routes.js
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
const { protect, authorize } = require('../middleware/auth.middleware');

// Protected routes - All users can view
router.get('/', protect, getAllReports);
router.get('/latest/:limit?', protect, getLatestReports);
router.get('/period/:type', protect, getReportsByPeriod);
router.get('/stall/:stallId', protect, getReportsByStall);
router.get('/profitable/:limit?', protect, getMostProfitable);
router.get('/:id', protect, getReportById);
router.post('/overall-stats', protect, getOverallStats);

// Manager & Owner routes
router.post('/', protect, authorize('owner', 'manager'), createProfitLossReport);
router.put('/:id', protect, authorize('owner', 'manager'), updateReport);
router.get('/loss-periods', protect, authorize('owner', 'manager'), getLossPeriods);
router.post('/:id/finalize', protect, authorize('owner', 'manager'), finalizeReport);
router.post('/:id/add-investor-share', protect, authorize('owner', 'manager'), addInvestorShare);

// Owner only routes
router.delete('/:id', protect, authorize('owner'), deleteReport);
router.post('/:id/approve', protect, authorize('owner'), approveReport);

module.exports = router;