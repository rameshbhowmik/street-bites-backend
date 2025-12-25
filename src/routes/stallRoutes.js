/**
 * ═══════════════════════════════════════════════════════════════
 * STALL ROUTES - FIXED VERSION
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middlewares
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, validateUploadedFile } = require('../middleware/upload');

// Controller - আমার নতুন enterprise controller use করুন
const stallController = require('../controllers/stallController');

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/stalls
 * সব stalls list
 * Access: Public
 */
router.get('/', stallController.getAllStalls);

/**
 * GET /api/stalls/:id
 * Stall details by ID
 * Access: Public
 */
router.get('/:id', stallController.getStallById);

// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Admin/Owner)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/stalls
 * নতুন stall তৈরি করা
 * Access: Owner only
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner'),
  [
    body('stall_name').trim().notEmpty().withMessage('Stall name প্রয়োজন'),
    body('stall_code').trim().notEmpty().withMessage('Stall code প্রয়োজন'),
    body('location').trim().notEmpty().withMessage('Location প্রয়োজন')
  ],
  stallController.createStall
);

/**
 * PUT /api/stalls/:id
 * Stall update করা
 * Access: Owner only
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  stallController.updateStall
);

/**
 * DELETE /api/stalls/:id
 * Stall delete করা
 * Access: Owner only
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  stallController.deleteStall
);

// ═══════════════════════════════════════════════════════════════
// IMAGE UPLOAD ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/stalls/:id/qr-code
 * QR Code upload করা (আলাদা folder এ সেভ হবে)
 * Access: Owner, Employee
 */
router.post(
  '/:id/qr-code',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  uploadSingle('qr_code', 'image'),
  validateUploadedFile,
  stallController.uploadQRCode
);

/**
 * POST /api/stalls/:id/photo
 * Stall photo upload করা (আলাদা folder এ সেভ হবে)
 * Access: Owner, Employee
 */
router.post(
  '/:id/photo',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  uploadSingle('photo', 'image'),
  validateUploadedFile,
  stallController.uploadStallPhoto
);

/**
 * POST /api/stalls/:id/hygiene-photos
 * Hygiene photos upload করা (Multiple - আলাদা folder এ)
 * Access: Owner, Employee
 */
router.post(
  '/:id/hygiene-photos',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  uploadMultiple('photos', 5, 'image'),
  validateUploadedFile,
  stallController.uploadHygienePhotos
);

// ═══════════════════════════════════════════════════════════════
// STATISTICS ROUTE
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/stalls/:id/statistics
 * Stall statistics
 * Access: Owner, Employee
 */
router.get(
  '/:id/statistics',
  authenticateToken,
  authorizeRoles('owner', 'employee'),
  stallController.getStallStatistics
);

module.exports = router;