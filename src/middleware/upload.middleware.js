// backend/src/middleware/upload.middleware.js

/**
 * Image Upload Middleware using Multer + Cloudinary
 * 
 * Features:
 * - Automatic compression
 * - Format conversion
 * - File size validation
 * - File type validation
 * - Error handling
 * - Old image deletion
 */

const multer = require('multer');
const { storage, helpers } = require('../config/cloudinary');

/**
 * File Filter - শুধুমাত্র images allow করবে
 */
const imageFileFilter = (req, file, cb) => {
  try {
    helpers.validateImage(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

/**
 * Document Filter - Images + PDFs allow করবে
 */
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('শুধুমাত্র JPG, PNG, WebP images এবং PDF documents অনুমোদিত'), false);
  }
};

/**
 * Error Handler for Multer
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ফাইল সাইজ বেশি বড়',
        error: 'File size too large (max 5MB)'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'অপ্রত্যাশিত ফাইল',
        error: 'Unexpected field'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'ফাইল আপলোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

/**
 * Profile Picture Upload Middleware
 * Single image, max 5MB
 */
const uploadProfilePicture = multer({
  storage: storage.profilePicture,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('profilePicture');

/**
 * Profile Picture Upload with Old Image Deletion
 */
const uploadAndReplaceProfilePicture = async (req, res, next) => {
  uploadProfilePicture(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    try {
      // যদি নতুন image upload হয়ে থাকে
      if (req.file) {
        // Check করুন user এর পুরানো profile picture আছে কিনা
        if (req.user && req.user.profilePicture) {
          // পুরানো image delete করুন
          await helpers.deleteImage(req.user.profilePicture);
          console.log('✅ Old profile picture deleted');
        }

        // নতুন image URL req.body তে যোগ করুন
        req.body.profilePicture = req.file.path;
      }

      next();
    } catch (error) {
      console.error('❌ Error in profile picture replacement:', error);
      // এমনকি পুরানো image delete এ error হলেও continue করুন
      next();
    }
  });
};

/**
 * Product Image Upload Middleware
 * Multiple images (max 5), each max 5MB
 */
const uploadProductImages = multer({
  storage: storage.product,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5 // Maximum 5 images
  }
}).array('productImages', 5);

/**
 * Product Images Upload with Old Images Deletion
 */
const uploadAndReplaceProductImages = async (req, res, next) => {
  uploadProductImages(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    try {
      if (req.files && req.files.length > 0) {
        // নতুন images এর URLs
        const newImageUrls = req.files.map(file => file.path);
        
        // যদি product update হচ্ছে এবং পুরানো images থাকে
        if (req.body.oldImages && Array.isArray(req.body.oldImages)) {
          // পুরানো images delete করুন
          await helpers.deleteMultipleImages(req.body.oldImages);
          console.log('✅ Old product images deleted');
        }

        // নতুন image URLs req.body তে যোগ করুন
        req.body.productImages = newImageUrls;
      }

      next();
    } catch (error) {
      console.error('❌ Error in product images replacement:', error);
      next();
    }
  });
};

/**
 * Stall Image Upload Middleware
 * Single or multiple images (max 10)
 */
const uploadStallImages = multer({
  storage: storage.stall,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  }
}).array('stallImages', 10);

/**
 * Document Upload Middleware
 * PDF or Images (max 3)
 */
const uploadDocuments = multer({
  storage: storage.document,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for PDFs
    files: 3
  }
}).array('documents', 3);

/**
 * Single Document Upload
 */
const uploadSingleDocument = multer({
  storage: storage.document,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
}).single('document');

/**
 * Generic Image Upload (any field name)
 */
const uploadImage = (fieldName, folder = 'misc') => {
  return multer({
    storage: storage.product, // Use product storage as default
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  }).single(fieldName);
};

/**
 * Multiple Images Upload (any field name)
 */
const uploadImages = (fieldName, maxCount = 5) => {
  return multer({
    storage: storage.product,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: maxCount
    }
  }).array(fieldName, maxCount);
};

/**
 * Validate Uploaded File
 * Upload এর পরে additional validation
 */
const validateUploadedFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'কোনো ফাইল আপলোড করা হয়নি',
      error: 'No file uploaded'
    });
  }

  next();
};

/**
 * Check File Size After Upload
 */
const checkFileSize = (maxSizeInMB) => {
  return (req, res, next) => {
    const maxBytes = maxSizeInMB * 1024 * 1024;

    if (req.file && req.file.size > maxBytes) {
      return res.status(400).json({
        success: false,
        message: `ফাইল সাইজ ${maxSizeInMB}MB এর বেশি হতে পারবে না`
      });
    }

    if (req.files && req.files.length > 0) {
      const oversizedFile = req.files.find(file => file.size > maxBytes);
      if (oversizedFile) {
        return res.status(400).json({
          success: false,
          message: `একটি বা একাধিক ফাইলের সাইজ ${maxSizeInMB}MB এর বেশি`
        });
      }
    }

    next();
  };
};

/**
 * Log Upload Info (Debugging)
 */
const logUploadInfo = (req, res, next) => {
  if (req.file) {
    console.log('📁 File uploaded:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      url: req.file.path
    });
  }

  if (req.files && req.files.length > 0) {
    console.log(`📁 ${req.files.length} files uploaded:`);
    req.files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
    });
  }

  next();
};

module.exports = {
  // Profile Picture
  uploadProfilePicture,
  uploadAndReplaceProfilePicture,

  // Product Images
  uploadProductImages,
  uploadAndReplaceProductImages,

  // Stall Images
  uploadStallImages,

  // Documents
  uploadDocuments,
  uploadSingleDocument,

  // Generic
  uploadImage,
  uploadImages,

  // Validators
  validateUploadedFile,
  checkFileSize,

  // Helpers
  handleMulterError,
  logUploadInfo
};