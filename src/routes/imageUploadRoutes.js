/**
 * Image Upload Routes - Complete
 * সব ধরনের image upload এর routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { 
  uploadSingle, 
  uploadMultiple, 
  validateUploadedFile, 
  handleMulterError 
} = require('../middleware/upload');

// Controllers
const productImageController = require('../controllers/productImageController');
const profilePictureController = require('../controllers/profilePictureController');
const stallPhotoController = require('../controllers/stallPhotoController');
const receiptUploadController = require('../controllers/receiptUploadController');
const reviewImageController = require('../controllers/reviewImageController');

// ==========================================
// PRODUCT IMAGE ROUTES
// ==========================================

/**
 * POST /api/images/products/:id/upload
 * একটি product image upload
 */
router.post(
  '/products/:id/upload',
  authenticate,
  authorize(['owner', 'employee']),
  uploadSingle('image', 'image'),
  validateUploadedFile,
  productImageController.uploadProductImage
);

/**
 * POST /api/images/products/:id/upload-multiple
 * Multiple product images upload (gallery)
 */
router.post(
  '/products/:id/upload-multiple',
  authenticate,
  authorize(['owner']),
  uploadMultiple('images', 5, 'image'),
  validateUploadedFile,
  productImageController.uploadProductImages
);

/**
 * DELETE /api/images/products/:id
 * Product image delete
 */
router.delete(
  '/products/:id',
  authenticate,
  authorize(['owner']),
  productImageController.deleteProductImage
);

// ==========================================
// PROFILE PICTURE ROUTES
// ==========================================

/**
 * POST /api/images/profile/upload
 * Profile picture upload
 */
router.post(
  '/profile/upload',
  authenticate,
  uploadSingle('profile_picture', 'image'),
  validateUploadedFile,
  profilePictureController.uploadProfilePicture
);

/**
 * DELETE /api/images/profile
 * Profile picture delete
 */
router.delete(
  '/profile',
  authenticate,
  profilePictureController.deleteProfilePicture
);

// ==========================================
// STALL PHOTO ROUTES
// ==========================================

/**
 * POST /api/images/stalls/:id/upload
 * Stall photo upload
 */
router.post(
  '/stalls/:id/upload',
  authenticate,
  authorize(['owner', 'employee']),
  uploadSingle('photo', 'image'),
  validateUploadedFile,
  stallPhotoController.uploadStallPhoto
);

/**
 * POST /api/images/stalls/:id/hygiene
 * Hygiene checklist photos upload
 */
router.post(
  '/stalls/:id/hygiene',
  authenticate,
  authorize(['owner', 'employee']),
  uploadMultiple('photos', 5, 'image'),
  validateUploadedFile,
  stallPhotoController.uploadHygienePhotos
);

// ==========================================
// RECEIPT IMAGE ROUTES
// ==========================================

/**
 * POST /api/images/receipts/upload
 * Receipt image upload
 */
router.post(
  '/receipts/upload',
  authenticate,
  authorize(['owner', 'employee']),
  uploadSingle('receipt', 'receipt'),
  validateUploadedFile,
  receiptUploadController.uploadReceiptImage
);

/**
 * DELETE /api/images/receipts
 * Receipt image delete
 */
router.delete(
  '/receipts',
  authenticate,
  authorize(['owner', 'employee']),
  receiptUploadController.deleteReceiptImage
);

// ==========================================
// REVIEW IMAGE ROUTES
// ==========================================

/**
 * POST /api/images/reviews/upload
 * Review images upload (max 3)
 */
router.post(
  '/reviews/upload',
  authenticate,
  uploadMultiple('images', 3, 'image'),
  validateUploadedFile,
  reviewImageController.uploadReviewImages
);

/**
 * DELETE /api/images/reviews
 * Review image delete
 */
router.delete(
  '/reviews',
  authenticate,
  reviewImageController.deleteReviewImage
);

// ==========================================
// ERROR HANDLING
// ==========================================

// Multer error handling
router.use(handleMulterError);

module.exports = router;