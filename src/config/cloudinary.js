// backend/src/config/cloudinary.js

/**
 * Cloudinary Configuration
 * 
 * এই ফাইলে Cloudinary setup করা হয়েছে image upload এর জন্য
 * Features:
 * - Automatic image compression
 * - Format optimization (WebP, AVIF)
 * - Multiple folder management
 * - Secure URL generation
 * - Transformation support
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cloudinary Storage Configuration for Multer
 * প্রতিটি image type এর জন্য আলাদা folder এবং optimization
 */

// User Profile Pictures Storage
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'street-bites/profile-pictures', // আলাদা folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // অনুমোদিত formats
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'fill', // Square crop
        gravity: 'face', // Face detection
        quality: 'auto:good', // Automatic quality optimization
        fetch_format: 'auto' // Automatic format (WebP if browser supports)
      }
    ],
    public_id: (req, file) => {
      // Unique filename: userId-timestamp
      return `user-${req.user._id}-${Date.now()}`;
    }
  }
});

// Product Images Storage
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'street-bites/product-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: 'limit', // Maintain aspect ratio
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    public_id: (req, file) => {
      return `product-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
  }
});

// Stall Images Storage
const stallImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'street-bites/stall-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    public_id: (req, file) => {
      return `stall-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
  }
});

// Document/Invoice Storage (PDF, Images)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'street-bites/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto', // Allows PDFs
    public_id: (req, file) => {
      return `doc-${Date.now()}-${file.originalname.split('.')[0]}`;
    }
  }
});

/**
 * Helper Functions
 */

/**
 * পুরানো image delete করার function
 * @param {String} imageUrl - Cloudinary image URL
 * @returns {Promise} - Deletion result
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return null;

    // Extract public_id from URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234/folder/image.jpg
    // public_id: folder/image
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }

    // Get everything after 'upload' and version number
    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
    // Remove file extension
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log(`✅ Image deleted successfully: ${publicId}`);
      return { success: true, publicId };
    } else {
      console.log(`⚠️ Image not found or already deleted: ${publicId}`);
      return { success: false, message: 'Image not found' };
    }
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
    throw new Error('Image deletion failed');
  }
};

/**
 * Multiple images delete করার function
 * @param {Array} imageUrls - Array of Cloudinary image URLs
 * @returns {Promise} - Deletion results
 */
const deleteMultipleImages = async (imageUrls) => {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return { success: true, message: 'No images to delete' };
    }

    const deletePromises = imageUrls.map(url => deleteImage(url));
    const results = await Promise.allSettled(deletePromises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Images deleted: ${successful}, Failed: ${failed}`);
    
    return {
      success: true,
      successful,
      failed,
      total: imageUrls.length
    };
  } catch (error) {
    console.error('❌ Error deleting multiple images:', error);
    throw error;
  }
};

/**
 * Folder থেকে সব images delete করার function
 * @param {String} folderPath - Cloudinary folder path
 * @returns {Promise} - Deletion result
 */
const deleteFolder = async (folderPath) => {
  try {
    // Delete all resources in folder
    const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
    
    // Delete the folder itself
    await cloudinary.api.delete_folder(folderPath);

    console.log(`✅ Folder deleted: ${folderPath}`);
    return { success: true, deleted: result.deleted };
  } catch (error) {
    console.error('❌ Error deleting folder:', error);
    throw error;
  }
};

/**
 * Image URL থেকে optimized version generate করার function
 * @param {String} imageUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {String} - Optimized image URL
 */
const getOptimizedUrl = (imageUrl, options = {}) => {
  try {
    if (!imageUrl) return null;

    const {
      width = 'auto',
      height = 'auto',
      crop = 'limit',
      quality = 'auto:good',
      format = 'auto'
    } = options;

    // Extract public_id
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    // Generate new URL with transformations
    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format
    });
  } catch (error) {
    console.error('❌ Error generating optimized URL:', error);
    return imageUrl; // Return original if optimization fails
  }
};

/**
 * Image সম্পর্কে information পাওয়ার function
 * @param {String} imageUrl - Cloudinary image URL
 * @returns {Promise} - Image information
 */
const getImageInfo = async (imageUrl) => {
  try {
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    const result = await cloudinary.api.resource(publicId);
    
    return {
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      url: result.secure_url,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('❌ Error getting image info:', error);
    throw error;
  }
};

/**
 * Upload করার আগে image validation
 * @param {Object} file - Multer file object
 * @returns {Boolean} - Valid or not
 */
const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('শুধুমাত্র JPG, PNG এবং WebP images অনুমোদিত');
  }

  if (file.size > maxSize) {
    throw new Error('Image সাইজ 5MB এর বেশি হতে পারবে না');
  }

  return true;
};

// Export everything
module.exports = {
  cloudinary,
  storage: {
    profilePicture: profilePictureStorage,
    product: productImageStorage,
    stall: stallImageStorage,
    document: documentStorage
  },
  helpers: {
    deleteImage,
    deleteMultipleImages,
    deleteFolder,
    getOptimizedUrl,
    getImageInfo,
    validateImage
  }
};