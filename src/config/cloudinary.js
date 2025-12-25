/**
 * Cloudinary Configuration
 * Cloudinary setup environment variables দিয়ে
 */

const cloudinary = require('cloudinary').v2;

// Cloudinary configure করা
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true // HTTPS ব্যবহার করবে
});

/**
 * Cloudinary connection test করার function
 */
const testCloudinaryConnection = () => {
  try {
    const isConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;
    
    if (isConfigured) {
      console.log('✅ Cloudinary configured successfully');
      return true;
    } else {
      console.log('⚠️  Cloudinary not configured - image upload will not work');
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error.message);
    return false;
  }
};

// Upload preset options - বিভিন্ন ধরনের uploads এর জন্য
const uploadPresets = {
  // Profile pictures
  profile: {
    folder: 'street-bites/profiles',
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
  
  // Product images
  product: {
    folder: 'street-bites/products',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
  
  // Stall photos
  stall: {
    folder: 'street-bites/stalls',
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
};

/**
 * Upload preset পাওয়ার helper function
 */
const getUploadPreset = (type) => {
  return uploadPresets[type] || uploadPresets.product;
};

module.exports = {
  cloudinary,
  testCloudinaryConnection,
  uploadPresets,
  getUploadPreset
};