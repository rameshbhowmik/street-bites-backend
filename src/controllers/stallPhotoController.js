/**
 * Stall Photo Upload Controller
 * Stall এর photo upload করার controller
 */

const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  generateResponsiveUrls
} = require('../utils/uploadUtils');
const Stall = require('../models/Stall');

/**
 * একটি stall photo upload করা
 * POST /api/stalls/:id/upload-photo
 */
const uploadStallPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // File check করা
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন image file পাওয়া যায়নি'
      });
    }
    
    // Stall খুঁজে বের করা
    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }
    
    // Image upload করা
    const uploadResult = await uploadSingleImage(
      req.file.buffer,
      'stall',
      {
        public_id: `stall_${id}_${Date.now()}`
      }
    );
    
    // Responsive URLs তৈরি করা
    const responsiveUrls = generateResponsiveUrls(uploadResult.public_id);
    
    res.status(200).json({
      success: true,
      message: 'Stall photo সফলভাবে upload হয়েছে',
      data: {
        photo: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          responsive_urls: responsiveUrls
        }
      }
    });
  } catch (error) {
    console.error('Upload stall photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Stall photo upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

/**
 * Hygiene checklist photos upload করা
 * POST /api/stalls/:id/upload-hygiene-photos
 */
const uploadHygienePhotos = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Files check করা
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'কোন image files পাওয়া যায়নি'
      });
    }
    
    // Stall খুঁজে বের করা
    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }
    
    // সব photos upload করা
    const fileBuffers = req.files.map(file => file.buffer);
    const uploadResults = await uploadMultipleImages(
      fileBuffers,
      'hygiene',
      {
        public_id_prefix: `stall_${id}_hygiene_`
      }
    );
    
    // Response data তৈরি করা
    const uploadedPhotos = uploadResults.map(result => ({
      url: result.url,
      public_id: result.public_id,
      responsive_urls: generateResponsiveUrls(result.public_id)
    }));
    
    res.status(200).json({
      success: true,
      message: `${uploadResults.length}টি hygiene photo সফলভাবে upload হয়েছে`,
      data: {
        photos: uploadedPhotos
      }
    });
  } catch (error) {
    console.error('Upload hygiene photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Hygiene photos upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  uploadStallPhoto,
  uploadHygienePhotos
};