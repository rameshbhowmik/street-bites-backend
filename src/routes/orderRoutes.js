// Order Routes
// Order সংক্রান্ত সব endpoints

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// =============================================
// CUSTOMER ROUTES
// =============================================

// @route   POST /api/orders
// @desc    নতুন order তৈরি করা
// @access  Private (Customer)
router.post(
  '/',
  authenticateToken,
  [
    body('stall_id')
      .isInt({ min: 1 })
      .withMessage('সঠিক stall select করুন'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('কমপক্ষে একটি item select করুন'),
    body('items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('সঠিক product select করুন'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity কমপক্ষে ১ হতে হবে'),
    body('items.*.unit_price')
      .isFloat({ min: 0 })
      .withMessage('সঠিক price প্রদান করুন'),
    body('order_type')
      .optional()
      .isIn(['delivery', 'pickup', 'dine_in'])
      .withMessage('সঠিক order type select করুন'),
    body('delivery_address')
      .if(body('order_type').equals('delivery'))
      .notEmpty()
      .withMessage('Delivery order এর জন্য address প্রদান করুন')
  ],
  orderController.createOrder
);

// @route   GET /api/orders/my
// @desc    নিজের সব orders
// @access  Private (Customer)
router.get('/my', authenticateToken, orderController.getMyOrders);

// @route   GET /api/orders/:id
// @desc    Order details দেখা
// @access  Private
router.get('/:id', authenticateToken, orderController.getOrderById);

// @route   POST /api/orders/:id/cancel
// @desc    Order cancel করা
// @access  Private (Customer/Owner)
router.post('/:id/cancel', authenticateToken, orderController.cancelOrder);

// =============================================
// EMPLOYEE/OWNER ROUTES
// =============================================

// @route   GET /api/orders/customer/:customerId
// @desc    নির্দিষ্ট customer এর orders
// @access  Private (Owner only)
router.get(
  '/customer/:customerId',
  authenticateToken,
  orderController.getCustomerOrders
);

// @route   GET /api/orders/stall/:stallId
// @desc    নির্দিষ্ট stall এর orders
// @access  Private (Employee/Owner)
router.get(
  '/stall/:stallId',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  orderController.getStallOrders
);

// @route   PUT /api/orders/:id/status
// @desc    Order status update করা
// @access  Private (Employee/Owner)
router.put(
  '/:id/status',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  [
    body('status')
      .isIn([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'completed',
        'cancelled',
        'rejected'
      ])
      .withMessage('সঠিক status select করুন')
  ],
  orderController.updateOrderStatus
);

// @route   PUT /api/orders/:id/payment
// @desc    Payment status update করা
// @access  Private (Employee/Owner)
router.put(
  '/:id/payment',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  [
    body('payment_status')
      .isIn(['pending', 'paid', 'failed', 'refunded', 'partial'])
      .withMessage('সঠিক payment status select করুন'),
    body('payment_method')
      .optional()
      .isIn(['cash', 'bkash', 'nagad', 'card', 'bank_transfer'])
      .withMessage('সঠিক payment method select করুন')
  ],
  orderController.updatePaymentStatus
);

// =============================================
// STATISTICS & REPORTS (OWNER ONLY)
// =============================================

// @route   GET /api/orders/stats/today
// @desc    আজকের statistics
// @access  Private (Owner/Employee)
router.get(
  '/stats/today',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  orderController.getTodayStats
);

// @route   GET /api/orders/all/list
// @desc    সব orders list (Admin)
// @access  Private (Owner only)
router.get(
  '/all/list',
  authenticateToken,
  authorizeRoles('owner'),
  orderController.getAllOrders
);

module.exports = router;