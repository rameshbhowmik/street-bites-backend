/**
 * Product Image Upload Controller
 * Product এর image upload করার controller
 */

const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  generateResponsiveUrls
} = require('../utils/uploadUtils');
const Product = require('../models/Product');

/**
 * একটি product image upload করা
 * POST /api/products/:id/upload-image
 */
const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // File check করা
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন image file পাওয়া যায়নি'
      });
    }
    
    // Product খুঁজে বের করা
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }
    
    // পুরাতন image থাকলে delete করা
    if (product.image_url) {
      try {
        // URL থেকে public_id extract করা
        const publicId = product.image_url.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(`street-bites/products/${publicId}`);
      } catch (error) {
        console.error('Old image delete error:', error);
        // পুরাতন image delete এ error হলেও continue করা
      }
    }
    
    // নতুন image upload করা
    const uploadResult = await uploadSingleImage(
      req.file.buffer,
      'product',
      {
        public_id: `product_${id}_${Date.now()}` // Unique public ID
      }
    );
    
    // Database এ image URL update করা
    const updatedProduct = await Product.update(id, {
      image_url: uploadResult.url
    });
    
    // Responsive URLs তৈরি করা
    const responsiveUrls = generateResponsiveUrls(uploadResult.public_id);
    
    res.status(200).json({
      success: true,
      message: 'Product image সফলভাবে upload হয়েছে',
      data: {
        product: updatedProduct,
        image: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          responsive_urls: responsiveUrls
        }
      }
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Product image upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

/**
 * Multiple product images upload করা (gallery)
 * POST /api/products/:id/upload-images
 */
const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Files check করা
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'কোন image files পাওয়া যায়নি'
      });
    }
    
    // Product খুঁজে বের করা
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }
    
    // সব images upload করা
    const fileBuffers = req.files.map(file => file.buffer);
    const uploadResults = await uploadMultipleImages(
      fileBuffers,
      'product',
      {
        public_id_prefix: `product_${id}_gallery_` // Prefix for gallery images
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
      message: `${uploadResults.length}টি image সফলভাবে upload হয়েছে`,
      data: {
        images: uploadedImages
      }
    });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Product images upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

/**
 * Product image delete করা
 * DELETE /api/products/:id/delete-image
 */
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Product খুঁজে বের করা
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }
    
    // Image URL check করা
    if (!product.image_url) {
      return res.status(400).json({
        success: false,
        message: 'Product এ কোন image নেই'
      });
    }
    
    // URL থেকে public_id extract করা
    const urlParts = product.image_url.split('/');
    const publicId = urlParts.slice(-2).join('/').split('.')[0];
    
    // Cloudinary থেকে delete করা
    await deleteImage(`street-bites/products/${publicId}`);
    
    // Database থেকে URL remove করা
    await Product.update(id, {
      image_url: null
    });
    
    res.status(200).json({
      success: true,
      message: 'Product image সফলভাবে delete হয়েছে'
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Product image delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  uploadProductImage,
  uploadProductImages,
  deleteProductImage
};