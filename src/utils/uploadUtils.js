/**
 * Upload Utility Functions
 * Cloudinary তে image upload করার functions
 */

const { cloudinary, getUploadPreset } = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * একটি image Cloudinary তে upload করা
 */
const uploadSingleImage = async (fileBuffer, uploadType = 'product', options = {}) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured. Please add credentials to .env file');
    }

    const preset = getUploadPreset(uploadType);
    
    const uploadOptions = {
      folder: preset.folder,
      transformation: preset.transformation,
      allowed_formats: preset.allowed_formats,
      resource_type: 'auto',
      ...options
    };
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error('Image upload ব্যর্থ হয়েছে'));
          } else {
            resolve({
              public_id: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              resource_type: result.resource_type,
              created_at: result.created_at
            });
          }
        }
      );
      
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Image upload করতে সমস্যা হয়েছে');
  }
};

/**
 * Multiple images Cloudinary তে upload করা
 */
const uploadMultipleImages = async (fileBuffers, uploadType = 'product', options = {}) => {
  try {
    const uploadPromises = fileBuffers.map(buffer => 
      uploadSingleImage(buffer, uploadType, options)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Images upload করতে সমস্যা হয়েছে');
  }
};

/**
 * Cloudinary থেকে image delete করা
 */
const deleteImage = async (publicId) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('Cloudinary not configured, skipping delete');
      return { success: true, message: 'Skipped' };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok' || result.result === 'not found') {
      return {
        success: true,
        message: 'Image সফলভাবে delete হয়েছে'
      };
    } else {
      throw new Error('Image delete করতে পারিনি');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Image delete করতে সমস্যা হয়েছে');
  }
};

/**
 * Multiple images delete করা
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    
    return {
      success: true,
      deleted: result.deleted,
      message: `${Object.keys(result.deleted).length}টি image delete হয়েছে`
    };
  } catch (error) {
    console.error('Multiple delete error:', error);
    throw new Error('Images delete করতে সমস্যা হয়েছে');
  }
};

/**
 * Thumbnail তৈরি করা
 */
const generateThumbnail = (publicId, width = 200, height = 200) => {
  try {
    const thumbnailUrl = cloudinary.url(publicId, {
      width: width,
      height: height,
      crop: 'fill',
      quality: 'auto:low',
      fetch_format: 'auto'
    });
    
    return thumbnailUrl;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Thumbnail তৈরি করতে সমস্যা হয়েছে');
  }
};

/**
 * Responsive images URLs তৈরি করা
 */
const generateResponsiveUrls = (publicId) => {
  try {
    return {
      thumbnail: cloudinary.url(publicId, { width: 200, height: 200, crop: 'fill' }),
      small: cloudinary.url(publicId, { width: 400, crop: 'limit' }),
      medium: cloudinary.url(publicId, { width: 800, crop: 'limit' }),
      large: cloudinary.url(publicId, { width: 1200, crop: 'limit' }),
      original: cloudinary.url(publicId, { quality: 'auto:best' })
    };
  } catch (error) {
    console.error('Responsive URLs generation error:', error);
    throw new Error('Responsive URLs তৈরি করতে সমস্যা হয়েছে');
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  generateThumbnail,
  generateResponsiveUrls
};