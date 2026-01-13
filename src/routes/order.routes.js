// backend/src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { 
  authenticateToken, 
  authorizeRoles 
} = require('../middleware/auth.middleware');

/**
 * Order Routes - অর্ডার রাউটস
 * সব অর্ডার সম্পর্কিত API endpoints
 */

// ============================================
// Public Routes (কোন authentication লাগবে না)
// ============================================

// নতুন অর্ডার তৈরি করুন (Guest orders এর জন্য)
router.post('/create', orderController.createOrder);

// ============================================
// Protected Routes (Authentication required)
// ============================================

// সব অর্ডার দেখুন (Pagination)
router.get(
  '/',
  authenticateToken,
  authorizeRoles(['Owner', 'Manager', 'Employee']),
  orderController.getAllOrders
);

// আজকের অর্ডার
router.get(
  '/today',
  authenticateToken,
  authorizeRoles(['Owner', 'Manager', 'Employee']),
  orderController.getTodayOrders
);

// Pending অর্ডার
router.get(
  '/pending/:stallId',
  authenticateToken,
  authorizeRoles(['Owner', 'Manager', 'Employee']),
  orderController.getPendingOrders
);

// একটি অর্ডার দেখুন
router.get(
  '/:orderId',
  authenticateToken,
  orderController.getOrderById
);

// অর্ডার স্ট্যাটাস আপডেট করুন
router.put(
  '/:orderId/status',
  authenticateToken,
  authorizeRoles(['Owner', 'Manager', 'Employee']),
  orderController.updateOrderStatus
);

// পেমেন্ট কনফার্ম করুন
router.put(
  '/:orderId/confirm-payment',
  authenticateToken,
  authorizeRoles(['Owner', 'Manager', 'Employee']),
  orderController.confirmPayment
);

// ডেলিভারি পার্সন অ্যাসাইন করুন
router.put(
  '/:orderId/assign-delivery',
  authenticateToken,
  authorizeRoles(['Owner', 'Manager']),
  orderController.assignDeliveryPerson
);

// অর্ডার ক্যান্সেল করুন
router.put(
  '/:orderId/cancel',
  authenticateToken,
  orderController.cancelOrder
);

// রিভিউ যোগ করুন
router.post(
  '/:orderId/review',
  authenticateToken,
  authorizeRoles(['Customer']),
  orderController.addReview
);

// কমপ্লেইন রেজিস্টার করুন
router.post(
  '/:orderId/complaint',
  authenticateToken,
  authorizeRoles(['Customer']),
  orderController.registerComplaint
);

// কাস্টমার এর সব অর্ডার
router.get(
  '/customer/:customerId',
  authenticateToken,
  orderController.getCustomerOrders
);

// ডেলিভারি পার্সন এর অর্ডার
router.get(
  '/delivery-person/:personId',
  authenticateToken,
  authorizeRoles(['Delivery Person', 'Manager', 'Owner']),
  orderController.getDeliveryPersonOrders
);

module.exports = router;