/**
 * Review Image Upload Controller
 * Review এর সাথে image upload করার controller
 */

const {
  uploadMultipleImages,
  deleteImage,
  generateResponsiveUrls
} = require('../utils/uploadUtils');

/**
 * Review images upload করা
 * POST /api/reviews/upload-images
 * Body: { review_id: number }
 */
const uploadReviewImages = async (req, res) => {
  try {
    const { review_id } = req.body;
    
    // Files check করা
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'কোন image files পাওয়া যায়নি'
      });
    }
    
    // Review ID check করা
    if (!review_id) {
      return res.status(400).json({
        success: false,
        message: 'Review ID প্রয়োজন'
      });
    }
    
    // Maximum 3টি image allow করা
    if (req.files.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'সর্বোচ্চ 3টি image upload করা যাবে'
      });
    }
    
    // সব images upload করা
    const fileBuffers = req.files.map(file => file.buffer);
    const uploadResults = await uploadMultipleImages(
      fileBuffers,
      'review',
      {
        public_id_prefix: `review_${review_id}_`
      }
    );
    
    // Response data তৈরি করা
    const uploadedImages = uploadResults.map(result => ({
      url: result.url,
      public_id: result.public_id,
      responsive_urls: generateResponsiveUrls(result.public_id)
    }));
    
    res.status(200).json({
      success: true,
      message: `${uploadResults.length}টি review image সফলভাবে upload হয়েছে`,
      data: {
        images: uploadedImages,
        review_id: review_id
      }
    });
  } catch (error) {
    console.error('Upload review images error:', error);
    res.status(500).json({
      success: false,
      message: 'Review images upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

/**
 * Review image delete করা
 * DELETE /api/reviews/delete-image
 * Body: { public_id: string }
 */
const deleteReviewImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID প্রয়োজন'
      });
    }
    
    // Cloudinary থেকে delete করা
    await deleteImage(public_id);
    
    res.status(200).json({
      success: true,
      message: 'Review image সফলভাবে delete হয়েছে'
    });
  } catch (error) {
    console.error('Delete review image error:', error);
    res.status(500).json({
      success: false,
      message: 'Review image delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  uploadReviewImages,
  deleteReviewImage
};