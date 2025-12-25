/**
 * ═══════════════════════════════════════════════════════════════
 * ENTERPRISE UPLOAD UTILITIES
 * ═══════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Automatic compression
 * ✅ Auto-delete old images
 * ✅ Multiple format support
 * ✅ Responsive variants
 * ✅ Error handling
 * 
 * Author: Street Bites Team
 * Version: 2.0.0
 */

const { 
  cloudinary, 
  getUploadPreset, 
  generatePublicId,
  extractPublicIdFromUrl 
} = require('../config/cloudinary');
const streamifier = require('streamifier');

// ═══════════════════════════════════════════════════════════════
// SINGLE IMAGE UPLOAD WITH COMPRESSION
// ═══════════════════════════════════════════════════════════════

/**
 * একটি image Cloudinary তে upload করা
 * ✅ Automatic compression
 * ✅ Format optimization (WebP support)
 * ✅ Responsive variants তৈরি
 * 
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} uploadType - Upload type (profile, product, stall, etc.)
 * @param {number|string} entityId - User/Product/Stall ID
 * @param {object} customOptions - Additional options
 * @returns {Promise<object>} Upload result with variants
 */
const uploadSingleImage = async (fileBuffer, uploadType, entityId, customOptions = {}) => {
  try {
    // Cloudinary configured কিনা check করা
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured. Add credentials to .env file');
    }

    // Upload preset নেওয়া
    const preset = getUploadPreset(uploadType);
    
    // Unique public ID তৈরি করা
    const publicId = generatePublicId(uploadType, entityId);
    
    // Upload options configure করা
    const uploadOptions = {
      folder: preset.folder,
      public_id: publicId,
      resource_type: 'auto',
      transformation: preset.transformation,
      allowed_formats: preset.allowed_formats,
      // Eager transformations - Responsive variants
      eager: preset.eager || [],
      eager_async: false, // Synchronously generate variants
      overwrite: false, // Duplicate না হওয়ার জন্য
      invalidate: true, // CDN cache clear করা
      ...customOptions
    };

    // Upload করা
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(new Error(`Image upload failed: ${error.message}`));
          } else {
            // Success response তৈরি করা
            const response = {
              success: true,
              public_id: result.public_id,
              url: result.secure_url,
              original: {
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
                resource_type: result.resource_type
              },
              // Responsive variants
              variants: formatEagerTransformations(result.eager),
              created_at: result.created_at
            };

            console.log(`✅ Image uploaded: ${uploadType} (${(result.bytes / 1024).toFixed(2)} KB)`);
            resolve(response);
          }
        }
      );

      // Buffer কে stream এ convert করে upload করা
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// MULTIPLE IMAGES UPLOAD
// ═══════════════════════════════════════════════════════════════

/**
 * Multiple images upload করা
 * 
 * @param {Array<Buffer>} fileBuffers - Array of file buffers
 * @param {string} uploadType - Upload type
 * @param {number|string} entityId - Entity ID
 * @param {object} customOptions - Additional options
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImages = async (fileBuffers, uploadType, entityId, customOptions = {}) => {
  try {
    // সব images parallel এ upload করা
    const uploadPromises = fileBuffers.map((buffer, index) => 
      uploadSingleImage(buffer, uploadType, `${entityId}_${index}`, customOptions)
    );

    const results = await Promise.all(uploadPromises);
    
    console.log(`✅ ${results.length} images uploaded successfully`);
    return results;

  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    throw new Error(`Multiple images upload failed: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE IMAGE (WITH AUTO-DELETE OLD IMAGE)
// ═══════════════════════════════════════════════════════════════

/**
 * Cloudinary থেকে image delete করা
 * ✅ Public ID থেকে delete
 * ✅ URL থেকেও delete করতে পারে
 * 
 * @param {string} identifier - Public ID or Image URL
 * @returns {Promise<object>} Delete result
 */
const deleteImage = async (identifier) => {
  try {
    if (!identifier) {
      return { success: true, message: 'No image to delete' };
    }

    // Cloudinary configured কিনা check করা
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠️  Cloudinary not configured, skipping delete');
      return { success: true, message: 'Skipped (not configured)' };
    }

    // URL থেকে public ID extract করা (যদি URL হয়)
    let publicId = identifier;
    if (identifier.includes('cloudinary.com')) {
      publicId = extractPublicIdFromUrl(identifier);
      if (!publicId) {
        throw new Error('Invalid Cloudinary URL');
      }
    }

    // Delete করা
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      console.log(`✅ Image deleted: ${publicId}`);
      return {
        success: true,
        message: 'Image deleted successfully',
        public_id: publicId
      };
    } else if (result.result === 'not found') {
      console.warn(`⚠️  Image not found: ${publicId}`);
      return {
        success: true,
        message: 'Image not found (already deleted)',
        public_id: publicId
      };
    } else {
      throw new Error(`Delete failed: ${result.result}`);
    }

  } catch (error) {
    console.error('❌ Delete error:', error);
    throw new Error(`Image delete failed: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE MULTIPLE IMAGES
// ═══════════════════════════════════════════════════════════════

/**
 * Multiple images delete করা
 * 
 * @param {Array<string>} identifiers - Array of public IDs or URLs
 * @returns {Promise<object>} Delete result
 */
const deleteMultipleImages = async (identifiers) => {
  try {
    if (!identifiers || identifiers.length === 0) {
      return { success: true, message: 'No images to delete', count: 0 };
    }

    // সব public IDs extract করা
    const publicIds = identifiers.map(id => {
      if (id.includes('cloudinary.com')) {
        return extractPublicIdFromUrl(id);
      }
      return id;
    }).filter(Boolean);

    if (publicIds.length === 0) {
      return { success: true, message: 'No valid images to delete', count: 0 };
    }

    // Bulk delete করা
    const result = await cloudinary.api.delete_resources(publicIds);

    console.log(`✅ ${Object.keys(result.deleted).length} images deleted`);

    return {
      success: true,
      message: `${Object.keys(result.deleted).length} images deleted`,
      deleted: result.deleted,
      count: Object.keys(result.deleted).length
    };

  } catch (error) {
    console.error('❌ Multiple delete error:', error);
    throw new Error(`Multiple images delete failed: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE IMAGE (DELETE OLD + UPLOAD NEW)
// ═══════════════════════════════════════════════════════════════

/**
 * Image update করা (পুরাতন delete + নতুন upload)
 * ✅ Automatic old image deletion
 * ✅ Transaction-like behavior
 * 
 * @param {string} oldImageUrl - পুরাতন image URL
 * @param {Buffer} newFileBuffer - নতুন file buffer
 * @param {string} uploadType - Upload type
 * @param {number|string} entityId - Entity ID
 * @returns {Promise<object>} Upload result
 */
const updateImage = async (oldImageUrl, newFileBuffer, uploadType, entityId) => {
  try {
    // নতুন image upload করা
    const uploadResult = await uploadSingleImage(newFileBuffer, uploadType, entityId);

    // যদি upload successful হয়, তাহলে পুরাতন image delete করা
    if (uploadResult.success && oldImageUrl) {
      try {
        await deleteImage(oldImageUrl);
        console.log('✅ Old image auto-deleted');
      } catch (deleteError) {
        // পুরাতন image delete এ error হলেও continue করা
        console.warn('⚠️  Failed to delete old image:', deleteError.message);
      }
    }

    return uploadResult;

  } catch (error) {
    console.error('❌ Update image error:', error);
    throw new Error(`Image update failed: ${error.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════
// GENERATE RESPONSIVE URLS
// ═══════════════════════════════════════════════════════════════

/**
 * Responsive image URLs তৈরি করা
 * বিভিন্ন screen size এর জন্য
 * 
 * @param {string} publicId - Image public ID
 * @returns {object} Responsive URLs
 */
const generateResponsiveUrls = (publicId) => {
  try {
    return {
      thumbnail: cloudinary.url(publicId, {
        width: 150,
        height: 150,
        crop: 'thumb',
        quality: 'auto:low',
        fetch_format: 'auto'
      }),
      small: cloudinary.url(publicId, {
        width: 400,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }),
      medium: cloudinary.url(publicId, {
        width: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }),
      large: cloudinary.url(publicId, {
        width: 1200,
        crop: 'limit',
        quality: 'auto:best',
        fetch_format: 'auto'
      }),
      original: cloudinary.url(publicId, {
        quality: 'auto:best',
        fetch_format: 'auto'
      })
    };
  } catch (error) {
    console.error('❌ Generate responsive URLs error:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Eager transformations format করা
 * @private
 */
const formatEagerTransformations = (eagerArray) => {
  if (!eagerArray || eagerArray.length === 0) return {};

  const variants = {};
  eagerArray.forEach((eager, index) => {
    variants[`variant_${index}`] = {
      url: eager.secure_url,
      width: eager.width,
      height: eager.height
    };
  });

  return variants;
};

/**
 * File size validate করা
 * @param {Buffer} fileBuffer - File buffer
 * @param {number} maxSizeBytes - Maximum size in bytes
 * @returns {boolean} Validation result
 */
const validateFileSize = (fileBuffer, maxSizeBytes) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    return { valid: false, message: 'Empty file buffer' };
  }

  if (fileBuffer.length > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(2);
    const actualSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    return { 
      valid: false, 
      message: `File too large: ${actualSizeMB}MB (max: ${maxSizeMB}MB)` 
    };
  }

  return { valid: true };
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Main functions
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  updateImage,
  
  // Helper functions
  generateResponsiveUrls,
  validateFileSize,
  extractPublicIdFromUrl
};