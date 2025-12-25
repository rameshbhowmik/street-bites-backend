/**
 * Upload Middleware - Multer Configuration
 * Image upload এর জন্য middleware
 */

const multer = require('multer');
const path = require('path');

// File size limits (MB তে)
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB for images
  receipt: 10 * 1024 * 1024,   // 10MB for receipts
  document: 5 * 1024 * 1024    // 5MB for documents
};

// Allowed file types
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  receipt: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
};

/**
 * Multer memory storage configuration
 * File memory তে store করা হবে, Cloudinary তে upload এর আগে
 */
const storage = multer.memoryStorage();

/**
 * File filter function - file type validate করার জন্য
 * @param {object} req - Express request
 * @param {object} file - Uploaded file
 * @param {function} cb - Callback function
 */
const fileFilter = (fileType = 'image') => {
  return (req, file, cb) => {
    // Mime type check করা
    if (ALLOWED_FILE_TYPES[fileType].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `শুধুমাত্র ${ALLOWED_FILE_TYPES[fileType].join(', ')} ফাইল upload করা যাবে`
        ),
        false
      );
    }
  };
};

/**
 * Error handler for multer
 * @param {object} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Next middleware
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ফাইলের size অনেক বড়',
        error: err.message
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'অনেক বেশি ফাইল upload করা হয়েছে',
        error: err.message
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name',
        error: err.message
      });
    }
  }
  
  // Other errors
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Single image upload middleware
const uploadSingle = (fieldName = 'image', fileType = 'image') => {
  return multer({
    storage: storage,
    limits: { fileSize: FILE_SIZE_LIMITS[fileType] },
    fileFilter: fileFilter(fileType)
  }).single(fieldName);
};

// Multiple images upload middleware
const uploadMultiple = (fieldName = 'images', maxCount = 5, fileType = 'image') => {
  return multer({
    storage: storage,
    limits: { 
      fileSize: FILE_SIZE_LIMITS[fileType],
      files: maxCount
    },
    fileFilter: fileFilter(fileType)
  }).array(fieldName, maxCount);
};

// Multiple fields upload middleware
const uploadFields = (fields, fileType = 'image') => {
  return multer({
    storage: storage,
    limits: { fileSize: FILE_SIZE_LIMITS[fileType] },
    fileFilter: fileFilter(fileType)
  }).fields(fields);
};

// Any file upload middleware
const uploadAny = (fileType = 'image') => {
  return multer({
    storage: storage,
    limits: { fileSize: FILE_SIZE_LIMITS[fileType] },
    fileFilter: fileFilter(fileType)
  }).any();
};

/**
 * Validate uploaded file middleware
 * File upload হওয়ার পর validate করা
 */
const validateUploadedFile = (req, res, next) => {
  // Single file check
  if (req.file) {
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `শুধুমাত্র ${allowedExtensions.join(', ')} ফাইল upload করা যাবে`
      });
    }
  }
  
  // Multiple files check
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: `${file.originalname} - শুধুমাত্র ${allowedExtensions.join(', ')} ফাইল upload করা যাবে`
        });
      }
    }
  }
  
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadAny,
  validateUploadedFile,
  handleMulterError,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES
};