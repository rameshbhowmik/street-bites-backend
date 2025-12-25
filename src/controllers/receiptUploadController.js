/**
 * Receipt Upload Controller
 * Expense এর receipt image upload করার controller
 */

const {
  uploadSingleImage,
  deleteImage,
  generateResponsiveUrls
} = require('../utils/uploadUtils');

/**
 * Receipt image upload করা
 * POST /api/expenses/upload-receipt
 * Body: { expense_id: number }
 */
const uploadReceiptImage = async (req, res) => {
  try {
    const { expense_id } = req.body;
    
    // File check করা
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন receipt file পাওয়া যায়নি'
      });
    }
    
    // Expense ID check করা
    if (!expense_id) {
      return res.status(400).json({
        success: false,
        message: 'Expense ID প্রয়োজন'
      });
    }
    
    // Receipt upload করা
    const uploadResult = await uploadSingleImage(
      req.file.buffer,
      'receipt',
      {
        public_id: `receipt_${expense_id}_${Date.now()}`
      }
    );
    
    // Responsive URLs তৈরি করা
    const responsiveUrls = generateResponsiveUrls(uploadResult.public_id);
    
    res.status(200).json({
      success: true,
      message: 'Receipt image সফলভাবে upload হয়েছে',
      data: {
        receipt: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          responsive_urls: responsiveUrls,
          expense_id: expense_id
        }
      }
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Receipt upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

/**
 * Receipt image delete করা
 * DELETE /api/expenses/delete-receipt
 * Body: { public_id: string }
 */
const deleteReceiptImage = async (req, res) => {
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
      message: 'Receipt image সফলভাবে delete হয়েছে'
    });
  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Receipt delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  uploadReceiptImage,
  deleteReceiptImage
};