// backend/src/routes/stallPerformance.routes.js
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

const { protect, authorize } = require('../middleware/auth.middleware');

// ============ পাবলিক রুটস ============
// (কোনো পাবলিক রুট নেই - সব protected)

// ============ প্রোটেক্টেড রুটস ============
// সব রুট authenticate করা প্রয়োজন
router.use(protect);

// বেসিক CRUD operations
router
  .route('/')
  .get(getAllPerformanceReports) // সব রিপোর্ট দেখুন
  .post(authorize('manager', 'owner'), createPerformanceReport); // নতুন রিপোর্ট তৈরি

router
  .route('/:id')
  .get(getPerformanceReportById) // নির্দিষ্ট রিপোর্ট দেখুন
  .put(authorize('manager', 'owner'), updatePerformanceReport) // রিপোর্ট আপডেট
  .delete(authorize('owner'), deletePerformanceReport); // রিপোর্ট মুছুন

// বিশেষ query routes
router.get('/stall/:stallId', getStallPerformance); // স্টল-ওয়াইজ পারফরম্যান্স
router.get('/top-performing', getTopPerformingStalls); // টপ পারফর্মিং স্টল
router.get('/low-performing', authorize('manager', 'owner'), getLowPerformingStalls); // লো পারফর্মিং
router.get('/high-wastage', authorize('manager', 'owner'), getHighWastageStalls); // হাই ওয়েস্টেজ

// রিপোর্ট ম্যানেজমেন্ট
router.post('/:id/complaint', addComplaint); // কমপ্লেইন যোগ
router.post('/:id/action-item', authorize('manager', 'owner'), addActionItem); // অ্যাকশন আইটেম
router.put('/:id/submit', authorize('manager'), submitReport); // রিপোর্ট সাবমিট
router.put('/:id/review', authorize('owner'), reviewReport); // রিপোর্ট রিভিউ

module.exports = router;

/**
 * API Endpoints Summary:
 * 
 * GET    /api/stall-performance                     - সব রিপোর্ট দেখুন (query: stallId, period, startDate, endDate)
 * POST   /api/stall-performance                     - নতুন রিপোর্ট তৈরি (Manager, Owner)
 * GET    /api/stall-performance/:id                 - নির্দিষ্ট রিপোর্ট দেখুন
 * PUT    /api/stall-performance/:id                 - রিপোর্ট আপডেট (Manager, Owner)
 * DELETE /api/stall-performance/:id                 - রিপোর্ট মুছুন (Owner)
 * 
 * GET    /api/stall-performance/stall/:stallId      - স্টল-ওয়াইজ পারফরম্যান্স
 * GET    /api/stall-performance/top-performing      - টপ পারফর্মিং স্টল
 * GET    /api/stall-performance/low-performing      - লো পারফর্মিং স্টল (Manager, Owner)
 * GET    /api/stall-performance/high-wastage        - হাই ওয়েস্টেজ স্টল (Manager, Owner)
 * 
 * POST   /api/stall-performance/:id/complaint       - কমপ্লেইন যোগ করুন
 * POST   /api/stall-performance/:id/action-item     - অ্যাকশন আইটেম যোগ (Manager, Owner)
 * PUT    /api/stall-performance/:id/submit          - রিপোর্ট সাবমিট (Manager)
 * PUT    /api/stall-performance/:id/review          - রিপোর্ট রিভিউ (Owner)
 */