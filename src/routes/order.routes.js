// backend/src/routes/order.routes.js (Fixed)

/**
 * Order Routes - অর্ডার রাউটস
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: All roles are lowercase
 * ✅ Fixed: authorizeRoles accepts multiple arguments, NOT array
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/auth.middleware');

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * @route   POST /api/orders/create
 * @desc    Create new order (Guest orders allowed)
 * @access  Public
 */
router.post('/create', orderController.createOrder);

// ============================================
// SPECIFIC ROUTES (Must come BEFORE parameterized routes)
// ============================================

/**
 * @route   GET /api/orders/today
 * @desc    Get today's orders
 * @access  Owner, Manager, Employee
 */
router.get(
  '/today',
  authenticateToken,
  authorizeRoles('owner', 'manager', 'employee'), // ✅ FIXED: lowercase, no array
  orderController.getTodayOrders
);

/**
 * @route   GET /api/orders/pending/:stallId
 * @desc    Get pending orders for a stall
 * @access  Owner, Manager, Employee
 */
router.get(
  '/pending/:stallId',
  authenticateToken,
  authorizeRoles('owner', 'manager', 'employee'), // ✅ FIXED: lowercase, no array
  orderController.getPendingOrders
);

/**
 * @route   GET /api/orders/customer/:customerId
 * @desc    Get all orders for a customer
 * @access  Protected (All authenticated users)
 */
router.get(
  '/customer/:customerId',
  authenticateToken,
  orderController.getCustomerOrders
);

/**
 * @route   GET /api/orders/delivery-person/:personId
 * @desc    Get orders for a delivery person
 * @access  Delivery Person, Manager, Owner
 */
router.get(
  '/delivery-person/:personId',
  authenticateToken,
  authorizeRoles('delivery_person', 'manager', 'owner'), // ✅ FIXED: lowercase with underscore
  orderController.getDeliveryPersonOrders
);

// ============================================
// GENERAL LIST ROUTE
// ============================================

/**
 * @route   GET /api/orders
 * @desc    Get all orders (with pagination and filters)
 * @access  Owner, Manager, Employee
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('owner', 'manager', 'employee'), // ✅ FIXED: lowercase, no array
  orderController.getAllOrders
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get single order by ID
 * @access  Protected (All authenticated users)
 */
router.get(
  '/:orderId',
  authenticateToken,
  orderController.getOrderById
);

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Owner, Manager, Employee
 */
router.put(
  '/:orderId/status',
  authenticateToken,
  authorizeRoles('owner', 'manager', 'employee'), // ✅ FIXED: lowercase, no array
  orderController.updateOrderStatus
);

/**
 * @route   PUT /api/orders/:orderId/confirm-payment
 * @desc    Confirm payment for order
 * @access  Owner, Manager, Employee
 */
router.put(
  '/:orderId/confirm-payment',
  authenticateToken,
  authorizeRoles('owner', 'manager', 'employee'), // ✅ FIXED: lowercase, no array
  orderController.confirmPayment
);

/**
 * @route   PUT /api/orders/:orderId/assign-delivery
 * @desc    Assign delivery person to order
 * @access  Owner, Manager
 */
router.put(
  '/:orderId/assign-delivery',
  authenticateToken,
  authorizeRoles('owner', 'manager'), // ✅ FIXED: lowercase, no array
  orderController.assignDeliveryPerson
);

/**
 * @route   PUT /api/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Protected (All authenticated users)
 */
router.put(
  '/:orderId/cancel',
  authenticateToken,
  orderController.cancelOrder
);

/**
 * @route   POST /api/orders/:orderId/review
 * @desc    Add review to order
 * @access  Customer
 */
router.post(
  '/:orderId/review',
  authenticateToken,
  authorizeRoles('customer'), // ✅ FIXED: lowercase, no array
  orderController.addReview
);

/**
 * @route   POST /api/orders/:orderId/complaint
 * @desc    Register complaint for order
 * @access  Customer
 */
router.post(
  '/:orderId/complaint',
  authenticateToken,
  authorizeRoles('customer'), // ✅ FIXED: lowercase, no array
  orderController.registerComplaint
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ Public ============
 * POST   /api/orders/create                    - Create new order
 *
 * ============ Protected (All Authenticated Users) ============
 * GET    /api/orders/:orderId                  - Get single order
 * GET    /api/orders/customer/:customerId      - Get customer orders
 * PUT    /api/orders/:orderId/cancel           - Cancel order
 *
 * ============ Owner, Manager, Employee ============
 * GET    /api/orders                           - Get all orders
 * GET    /api/orders/today                     - Get today's orders
 * GET    /api/orders/pending/:stallId          - Get pending orders
 * PUT    /api/orders/:orderId/status           - Update order status
 * PUT    /api/orders/:orderId/confirm-payment  - Confirm payment
 *
 * ============ Owner, Manager ============
 * PUT    /api/orders/:orderId/assign-delivery  - Assign delivery person
 *
 * ============ Customer ============
 * POST   /api/orders/:orderId/review           - Add review
 * POST   /api/orders/:orderId/complaint        - Register complaint
 *
 * ============ Delivery Person, Manager, Owner ============
 * GET    /api/orders/delivery-person/:personId - Get delivery person orders
 */