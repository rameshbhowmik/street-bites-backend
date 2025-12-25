/**
 * Product Image Routes
 * Product image upload এর routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, validateUploadedFile, handleMulterError } = require('../middleware/upload');
const productImageController = require('../controllers/productImageController');

/**
 * POST /api/products/:id/upload-image
 * একটি product image upload করা
 * শুধুমাত্র Owner এবং Employee upload করতে পারবে
 */
router.post(
  '/:id/upload-image',
  authenticate,
  authorize(['owner', 'employee']),
  uploadSingle('image', 'image'), // 'image' field name, 'image' file type
  validateUploadedFile,
  productImageController.uploadProductImage
);

/**
 * POST /api/products/:id/upload-images
 * Multiple product images upload করা (gallery)
 * শুধুমাত্র Owner upload করতে পারবে
 */
router.post(
  '/:id/upload-images',
  authenticate,
  authorize(['owner']),
  uploadMultiple('images', 5, 'image'), // 'images' field name, max 5 files
  validateUploadedFile,
  productImageController.uploadProductImages
);

/**
 * DELETE /api/products/:id/delete-image
 * Product image delete করা
 * শুধুমাত্র Owner delete করতে পারবে
 */
router.delete(
  '/:id/delete-image',
  authenticate,
  authorize(['owner']),
  productImageController.deleteProductImage
);

// Multer error handling
router.use(handleMulterError);

module.exports = router;