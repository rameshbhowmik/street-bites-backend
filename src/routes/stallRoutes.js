// Stall Routes
// Stall সংক্রান্ত সব endpoints

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const stallController = require('../controllers/stallController');

// =============================================
// PUBLIC/CUSTOMER ROUTES
// =============================================

// @route   GET /api/stalls
// @desc    সব stalls list
// @access  Public
router.get('/', optionalAuth, stallController.getAllStalls);

// @route   GET /api/stalls/active
// @desc    শুধুমাত্র active stalls
// @access  Public
router.get('/active', stallController.getActiveStalls);

// @route   GET /api/stalls/nearby
// @desc    নিকটবর্তী stalls (GPS based)
// @access  Public
router.get('/nearby', stallController.findNearbyStalls);

// @route   GET /api/stalls/:id
// @desc    একটি stall details
// @access  Public
router.get('/:id', stallController.getStallById);

// @route   GET /api/stalls/:id/employees
// @desc    Stall এর employees সহ info
// @access  Public
router.get('/:id/employees', stallController.getStallWithEmployees);

// @route   GET /api/stalls/:id/inventory
// @desc    Stall এর inventory
// @access  Private (Employee/Owner)
router.get(
  '/:id/inventory',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  stallController.getStallInventory
);

// @route   GET /api/stalls/:id/statistics
// @desc    Stall এর statistics
// @access  Private (Employee/Owner)
router.get(
  '/:id/statistics',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  stallController.getStallStatistics
);

// =============================================
// OWNER ONLY ROUTES
// =============================================

// @route   POST /api/stalls
// @desc    নতুন stall তৈরি করা
// @access  Private (Owner only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner'),
  [
    body('stall_name')
      .trim()
      .notEmpty()
      .withMessage('Stall name প্রদান করুন')
      .isLength({ min: 2, max: 255 })
      .withMessage('Stall name ২-২৫৫ অক্ষরের মধ্যে হতে হবে'),
    body('stall_code')
      .trim()
      .notEmpty()
      .withMessage('Stall code প্রদান করুন')
      .isLength({ min: 3, max: 50 })
      .withMessage('Stall code ৩-৫০ অক্ষরের মধ্যে হতে হবে'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location প্রদান করুন'),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('সঠিক latitude প্রদান করুন'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('সঠিক longitude প্রদান করুন')
  ],
  stallController.createStall
);

// @route   PUT /api/stalls/:id
// @desc    Stall update করা
// @access  Private (Owner only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  stallController.updateStall
);

// @route   DELETE /api/stalls/:id
// @desc    Stall delete করা
// @access  Private (Owner only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  stallController.deleteStall
);

// @route   PATCH /api/stalls/:id/status
// @desc    Stall status update করা
// @access  Private (Owner only)
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('owner'),
  [
    body('status')
      .isIn(['active', 'closed', 'maintenance', 'temporary_closed'])
      .withMessage('সঠিক status select করুন')
  ],
  stallController.updateStallStatus
);

module.exports = router;