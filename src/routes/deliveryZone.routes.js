// backend/src/routes/deliveryZone.routes.js (Fixed)

/**
 * Delivery Zone Routes
 * ✅ Fixed: Route order corrected (specific routes before parameterized)
 * ✅ Fixed: All roles are lowercase
 * ✅ Fixed: Using correct middleware names (authenticateToken, authorizeRoles)
 */

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

// ✅ FIXED: Using correct middleware names
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================
// These MUST come BEFORE parameterized routes like /:id

/**
 * @route   GET /api/delivery-zones/active
 * @desc    Get all active delivery zones
 * @access  Public
 */
router.get('/active', getActiveZones);

/**
 * @route   GET /api/delivery-zones/pincode/:pincode
 * @desc    Find zone by PIN code
 * @access  Public
 */
router.get('/pincode/:pincode', getZoneByPinCode);

/**
 * @route   GET /api/delivery-zones/location
 * @desc    Find zone by geo-location (query: longitude, latitude)
 * @access  Public
 */
router.get('/location', getZoneByLocation);

// ============================================
// PERFORMANCE ROUTES (Before /:id)
// ============================================

/**
 * @route   GET /api/delivery-zones/top-performing
 * @desc    Get top performing zones
 * @access  Protected (All authenticated users)
 */
router.get('/top-performing', authenticateToken, getTopPerformingZones);

/**
 * @route   GET /api/delivery-zones/low-performing
 * @desc    Get low performing zones
 * @access  Manager, Owner
 */
router.get(
  '/low-performing',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  getLowPerformingZones
);

// ============================================
// BASIC CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/delivery-zones
 * @desc    Get all delivery zones (with filters)
 * @access  Public
 */
router.get('/', getAllDeliveryZones);

/**
 * @route   POST /api/delivery-zones
 * @desc    Create new delivery zone
 * @access  Manager, Owner
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  createDeliveryZone
);

// ============================================
// PARAMETERIZED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   POST /api/delivery-zones/:id/calculate-charge
 * @desc    Calculate delivery charge
 * @access  Public
 */
router.post('/:id/calculate-charge', calculateDeliveryCharge);

/**
 * @route   POST /api/delivery-zones/:id/assign-person
 * @desc    Assign delivery person to zone
 * @access  Manager, Owner
 */
router.post(
  '/:id/assign-person',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  assignDeliveryPerson
);

/**
 * @route   DELETE /api/delivery-zones/:id/remove-person/:personId
 * @desc    Remove delivery person from zone
 * @access  Manager, Owner
 */
router.delete(
  '/:id/remove-person/:personId',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  removeDeliveryPerson
);

/**
 * @route   POST /api/delivery-zones/:id/add-locality
 * @desc    Add locality to zone
 * @access  Manager, Owner
 */
router.post(
  '/:id/add-locality',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  addLocality
);

/**
 * @route   PUT /api/delivery-zones/:id/update-order-stats
 * @desc    Update order statistics
 * @access  Protected (All authenticated users)
 */
router.put(
  '/:id/update-order-stats',
  authenticateToken,
  updateOrderStats
);

/**
 * @route   POST /api/delivery-zones/:id/add-notification
 * @desc    Add notification to zone
 * @access  Manager, Owner
 */
router.post(
  '/:id/add-notification',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  addNotification
);

/**
 * @route   PUT /api/delivery-zones/:id/toggle-status
 * @desc    Toggle zone active/inactive status
 * @access  Manager, Owner
 */
router.put(
  '/:id/toggle-status',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  toggleZoneStatus
);

/**
 * @route   GET /api/delivery-zones/:id
 * @desc    Get single delivery zone by ID
 * @access  Public
 */
router.get('/:id', getDeliveryZoneById);

/**
 * @route   PUT /api/delivery-zones/:id
 * @desc    Update delivery zone
 * @access  Manager, Owner
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('manager', 'owner'), // ✅ FIXED: lowercase roles
  updateDeliveryZone
);

/**
 * @route   DELETE /api/delivery-zones/:id
 * @desc    Delete delivery zone
 * @access  Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'), // ✅ FIXED: lowercase role
  deleteDeliveryZone
);

module.exports = router;

/**
 * ============================================
 * API ENDPOINTS SUMMARY (CORRECT ORDER)
 * ============================================
 *
 * ============ পাবলিক (Public) ============
 * GET    /api/delivery-zones/active                  - Active zones
 * GET    /api/delivery-zones/pincode/:pincode        - Find by PIN code
 * GET    /api/delivery-zones/location                - Find by geo-location (query: longitude, latitude)
 * GET    /api/delivery-zones                         - All zones (with filters)
 * POST   /api/delivery-zones/:id/calculate-charge    - Calculate delivery charge
 * GET    /api/delivery-zones/:id                     - Get single zone
 *
 * ============ প্রোটেক্টেড (Protected - All Users) ============
 * GET    /api/delivery-zones/top-performing          - Top performing zones
 * PUT    /api/delivery-zones/:id/update-order-stats  - Update order stats
 *
 * ============ Manager & Owner Only ============
 * POST   /api/delivery-zones                         - Create new zone
 * PUT    /api/delivery-zones/:id                     - Update zone
 * GET    /api/delivery-zones/low-performing          - Low performing zones
 * POST   /api/delivery-zones/:id/assign-person       - Assign delivery person
 * DELETE /api/delivery-zones/:id/remove-person/:personId - Remove delivery person
 * POST   /api/delivery-zones/:id/add-locality        - Add locality
 * POST   /api/delivery-zones/:id/add-notification    - Add notification
 * PUT    /api/delivery-zones/:id/toggle-status       - Toggle status
 *
 * ============ Owner Only ============
 * DELETE /api/delivery-zones/:id                     - Delete zone
 */