// backend/src/routes/deliveryZone.routes.js
const express = require('express');
const router = express.Router();
const {
  createDeliveryZone,
  getAllDeliveryZones,
  getDeliveryZoneById,
  updateDeliveryZone,
  getZoneByPinCode,
  getZoneByLocation,
  getActiveZones,
  getTopPerformingZones,
  getLowPerformingZones,
  assignDeliveryPerson,
  removeDeliveryPerson,
  addLocality,
  calculateDeliveryCharge,
  updateOrderStats,
  addNotification,
  toggleZoneStatus,
  deleteDeliveryZone
} = require('../controllers/deliveryZoneController');

const { protect, authorize } = require('../middleware/auth.middleware');

// ============ পাবলিক রুটস ============
// কাস্টমাররা এই routes ব্যবহার করতে পারবে

// অ্যাক্টিভ জোন দেখুন
router.get('/active', getActiveZones);

// পিনকোড দিয়ে জোন খুঁজুন
router.get('/pincode/:pincode', getZoneByPinCode);

// জিও-লোকেশন দিয়ে জোন খুঁজুন
router.get('/location', getZoneByLocation);

// ডেলিভারি চার্জ ক্যালকুলেট করুন
router.post('/:id/calculate-charge', calculateDeliveryCharge);

// ============ প্রোটেক্টেড রুটস ============
// বাকি সব routes authenticate করা প্রয়োজন

// বেসিক CRUD operations
router
  .route('/')
  .get(getAllDeliveryZones) // সব জোন দেখুন
  .post(protect, authorize('manager', 'owner'), createDeliveryZone); // নতুন জোন তৈরি

router
  .route('/:id')
  .get(getDeliveryZoneById) // নির্দিষ্ট জোন দেখুন
  .put(protect, authorize('manager', 'owner'), updateDeliveryZone) // জোন আপডেট
  .delete(protect, authorize('owner'), deleteDeliveryZone); // জোন মুছুন

// পারফরম্যান্স রুটস
router.get('/top-performing', protect, getTopPerformingZones); // টপ পারফর্মিং জোন
router.get('/low-performing', protect, authorize('manager', 'owner'), getLowPerformingZones); // লো পারফর্মিং

// ডেলিভারি পার্সন ম্যানেজমেন্ট
router.post(
  '/:id/assign-person',
  protect,
  authorize('manager', 'owner'),
  assignDeliveryPerson
); // পার্সন অ্যাসাইন

router.delete(
  '/:id/remove-person/:personId',
  protect,
  authorize('manager', 'owner'),
  removeDeliveryPerson
); // পার্সন রিমুভ

// লোকালিটি ম্যানেজমেন্ট
router.post(
  '/:id/add-locality',
  protect,
  authorize('manager', 'owner'),
  addLocality
); // লোকালিটি যোগ

// অর্ডার এবং স্ট্যাটাস ম্যানেজমেন্ট
router.put(
  '/:id/update-order-stats',
  protect,
  updateOrderStats
); // অর্ডার স্ট্যাট আপডেট

router.post(
  '/:id/add-notification',
  protect,
  authorize('manager', 'owner'),
  addNotification
); // নোটিফিকেশন যোগ

router.put(
  '/:id/toggle-status',
  protect,
  authorize('manager', 'owner'),
  toggleZoneStatus
); // স্ট্যাটাস পরিবর্তন

module.exports = router;

/**
 * API Endpoints Summary:
 * 
 * ============ পাবলিক (Public) ============
 * GET    /api/delivery-zones/active                  - অ্যাক্টিভ জোন সব দেখুন
 * GET    /api/delivery-zones/pincode/:pincode        - পিনকোড দিয়ে জোন খুঁজুন
 * GET    /api/delivery-zones/location                - জিও-লোকেশন দিয়ে খুঁজুন (query: longitude, latitude)
 * POST   /api/delivery-zones/:id/calculate-charge    - ডেলিভারি চার্জ ক্যালকুলেট
 * 
 * ============ প্রোটেক্টেড (Protected) ============
 * GET    /api/delivery-zones                         - সব জোন দেখুন (query: status, page, limit)
 * POST   /api/delivery-zones                         - নতুন জোন তৈরি (Manager, Owner)
 * GET    /api/delivery-zones/:id                     - নির্দিষ্ট জোন দেখুন
 * PUT    /api/delivery-zones/:id                     - জোন আপডেট (Manager, Owner)
 * DELETE /api/delivery-zones/:id                     - জোন মুছুন (Owner)
 * 
 * GET    /api/delivery-zones/top-performing          - টপ পারফর্মিং জোন
 * GET    /api/delivery-zones/low-performing          - লো পারফর্মিং জোন (Manager, Owner)
 * 
 * POST   /api/delivery-zones/:id/assign-person       - ডেলিভারি পার্সন অ্যাসাইন (Manager, Owner)
 * DELETE /api/delivery-zones/:id/remove-person/:personId - পার্সন রিমুভ (Manager, Owner)
 * POST   /api/delivery-zones/:id/add-locality        - লোকালিটি যোগ (Manager, Owner)
 * PUT    /api/delivery-zones/:id/update-order-stats  - অর্ডার স্ট্যাট আপডেট
 * POST   /api/delivery-zones/:id/add-notification    - নোটিফিকেশন যোগ (Manager, Owner)
 * PUT    /api/delivery-zones/:id/toggle-status       - স্ট্যাটাস পরিবর্তন (Manager, Owner)
 */