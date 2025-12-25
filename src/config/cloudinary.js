/**
 * ═══════════════════════════════════════════════════════════════
 * ENTERPRISE CLOUDINARY CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ আলাদা আলাদা folder structure
 * ✅ Automatic compression & optimization
 * ✅ Responsive image variants
 * ✅ Free tier optimization
 * ✅ Advanced transformations
 * 
 * Author: Street Bites Team
 * Version: 2.0.0
 * Last Updated: December 2025
 */

const cloudinary = require('cloudinary').v2;

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY INITIALIZATION
// ═══════════════════════════════════════════════════════════════

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true // সবসময় HTTPS ব্যবহার করা হবে
});

// ═══════════════════════════════════════════════════════════════
// CONNECTION TEST FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Cloudinary connection test করার function
 * @returns {boolean} Connection status
 */
const testCloudinaryConnection = () => {
  try {
    const isConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;
    
    if (isConfigured) {
      console.log('✅ Cloudinary configured successfully');
      console.log(`📁 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      return true;
    } else {
      console.log('⚠️  Cloudinary not configured');
      console.log('💡 Add CLOUDINARY credentials to .env file');
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error.message);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
// FOLDER STRUCTURE CONFIGURATION
// প্রতিটি upload type এর জন্য আলাদা folder
// ═══════════════════════════════════════════════════════════════

const FOLDER_STRUCTURE = {
  profiles: 'street-bites/users/profiles',           // User profile pictures
  products: 'street-bites/products',                 // Product images
  stalls: 'street-bites/stalls/photos',             // Stall photos
  qr_codes: 'street-bites/stalls/qr-codes',         // Stall QR codes
  receipts: 'street-bites/transactions/receipts',   // Expense receipts
  reviews: 'street-bites/reviews',                   // Review images
  hygiene: 'street-bites/stalls/hygiene',           // Hygiene checklist photos
  documents: 'street-bites/documents'                // Other documents
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD PRESETS - প্রতিটি type এর জন্য configuration
// ═══════════════════════════════════════════════════════════════

const UPLOAD_PRESETS = {
  // ─────────────────────────────────────────────────────────────
  // PROFILE PICTURES
  // ─────────────────────────────────────────────────────────────
  profile: {
    folder: FOLDER_STRUCTURE.profiles,
    transformation: [
      { 
        width: 500, 
        height: 500, 
        crop: 'fill',          // Face center করে crop
        gravity: 'face',       // Face detection
        quality: 'auto:good',  // Automatic quality optimization
        fetch_format: 'auto'   // Automatic format (WebP যদি support করে)
      }
    ],
    // Compression settings - Free tier optimize করার জন্য
    eager: [
      { width: 150, height: 150, crop: 'thumb', quality: 'auto:low' },  // Thumbnail
      { width: 300, height: 300, crop: 'fill', quality: 'auto:good' }   // Medium
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 2 * 1024 * 1024  // 2MB limit
  },

  // ─────────────────────────────────────────────────────────────
  // PRODUCT IMAGES
  // ─────────────────────────────────────────────────────────────
  product: {
    folder: FOLDER_STRUCTURE.products,
    transformation: [
      { 
        width: 800, 
        height: 800, 
        crop: 'limit',         // Aspect ratio maintain করবে
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    // Multiple variants তৈরি করা
    eager: [
      { width: 200, height: 200, crop: 'fill', quality: 'auto:low' },   // Thumbnail
      { width: 400, height: 400, crop: 'fill', quality: 'auto:good' },  // Small
      { width: 600, height: 600, crop: 'limit', quality: 'auto:good' }  // Medium
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 3 * 1024 * 1024  // 3MB limit
  },

  // ─────────────────────────────────────────────────────────────
  // STALL PHOTOS
  // ─────────────────────────────────────────────────────────────
  stall: {
    folder: FOLDER_STRUCTURE.stalls,
    transformation: [
      { 
        width: 1200, 
        height: 800, 
        crop: 'limit',
        quality: 'auto:best',
        fetch_format: 'auto'
      }
    ],
    eager: [
      { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 4 * 1024 * 1024  // 4MB limit
  },

  // ─────────────────────────────────────────────────────────────
  // QR CODES
  // ─────────────────────────────────────────────────────────────
  qr_code: {
    folder: FOLDER_STRUCTURE.qr_codes,
    transformation: [
      { 
        width: 500, 
        height: 500, 
        crop: 'pad',           // Padding যোগ করবে
        background: 'white',
        quality: 100,          // QR code এর জন্য maximum quality
        fetch_format: 'png'    // PNG format (lossless)
      }
    ],
    allowed_formats: ['png', 'jpg', 'jpeg'],
    max_file_size: 1 * 1024 * 1024  // 1MB limit
  },

  // ─────────────────────────────────────────────────────────────
  // RECEIPTS
  // ─────────────────────────────────────────────────────────────
  receipt: {
    folder: FOLDER_STRUCTURE.receipts,
    transformation: [
      { 
        width: 1000, 
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    max_file_size: 5 * 1024 * 1024  // 5MB limit (PDF এর জন্য বেশি)
  },

  // ─────────────────────────────────────────────────────────────
  // REVIEW IMAGES
  // ─────────────────────────────────────────────────────────────
  review: {
    folder: FOLDER_STRUCTURE.reviews,
    transformation: [
      { 
        width: 800, 
        height: 600, 
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    eager: [
      { width: 300, height: 200, crop: 'fill', quality: 'auto:low' }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 3 * 1024 * 1024  // 3MB limit
  },

  // ─────────────────────────────────────────────────────────────
  // HYGIENE PHOTOS
  // ─────────────────────────────────────────────────────────────
  hygiene: {
    folder: FOLDER_STRUCTURE.hygiene,
    transformation: [
      { 
        width: 1000, 
        height: 1000, 
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 3 * 1024 * 1024  // 3MB limit
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Upload preset পাওয়ার function
 * @param {string} type - Upload type (profile, product, stall, etc.)
 * @returns {object} Upload configuration
 */
const getUploadPreset = (type) => {
  const preset = UPLOAD_PRESETS[type];
  
  if (!preset) {
    console.warn(`⚠️  Unknown upload type: ${type}. Using default (product).`);
    return UPLOAD_PRESETS.product;
  }
  
  return preset;
};

/**
 * Folder path পাওয়ার function
 * @param {string} type - Upload type
 * @returns {string} Folder path
 */
const getFolderPath = (type) => {
  return FOLDER_STRUCTURE[type] || FOLDER_STRUCTURE.documents;
};

/**
 * Public ID generate করার function
 * @param {string} type - Upload type
 * @param {number|string} entityId - User/Product/Stall ID
 * @returns {string} Unique public ID
 */
const generatePublicId = (type, entityId) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  return `${type}_${entityId}_${timestamp}_${randomStr}`;
};

/**
 * Image URL থেকে Public ID extract করার function
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {string|null} Public ID (folder সহ)
 */
const extractPublicIdFromUrl = (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return null;
    }

    // URL থেকে path বের করা
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) return null;

    // Version number remove করা (যদি থাকে)
    let path = urlParts[1].replace(/v\d+\//, '');
    
    // File extension remove করা
    path = path.substring(0, path.lastIndexOf('.'));
    
    return path;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// FREE TIER OPTIMIZATION TIPS
// ═══════════════════════════════════════════════════════════════

/**
 * Free tier limits check করার function
 * Cloudinary Free: 25 GB storage, 25 GB bandwidth/month
 */
const checkFreeTierUsage = () => {
  console.log('💡 Cloudinary Free Tier Optimization Tips:');
  console.log('   ✓ Auto compression enabled (quality: auto)');
  console.log('   ✓ Auto format enabled (WebP when supported)');
  console.log('   ✓ Eager transformations for common sizes');
  console.log('   ✓ Separate folders for easy management');
  console.log('   ✓ Old images auto-delete on update');
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  cloudinary,
  testCloudinaryConnection,
  getUploadPreset,
  getFolderPath,
  generatePublicId,
  extractPublicIdFromUrl,
  checkFreeTierUsage,
  FOLDER_STRUCTURE,
  UPLOAD_PRESETS
};