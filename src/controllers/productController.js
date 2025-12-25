// Product Controller
// Product সংক্রান্ত সব operations

const { Product } = require('../models');

// ✅ এই লাইন ঠিক করা হয়েছে - uploadImage এর জায়গায় uploadSingleImage
const { uploadSingleImage } = require('../utils/uploadUtils');

// =============================================
// GET ALL PRODUCTS - সব products list
// =============================================
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      is_available,
      search,
      min_price,
      max_price,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      category,
      is_available: is_available === 'true',
      search,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const products = await Product.findAll(filters);

    return res.status(200).json({
      success: true,
      message: 'Products list fetch সফল',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasMore: products.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Products list fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET PRODUCT BY ID - একটি product details
// =============================================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product details fetch সফল',
      data: product
    });

  } catch (error) {
    console.error('❌ Get product by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Product details fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// CREATE PRODUCT - নতুন product তৈরি (Admin only)
// =============================================
const createProduct = async (req, res) => {
  try {
    const {
      product_name,
      product_name_bengali,
      category,
      base_price,
      description,
      is_available
    } = req.body;

    // Input validation
    if (!product_name || !category || !base_price) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category এবং price প্রদান করুন'
      });
    }

    // Price validation
    if (base_price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price ০ অথবা তার বেশি হতে হবে'
      });
    }

    // ✅ Image upload (যদি থাকে) - uploadSingleImage ব্যবহার করা হয়েছে
    let imageUrl = null;
    if (req.file) {
      // Cloudinary তে upload করা - নতুন uploadSingleImage function ব্যবহার করছি
      const uploadResult = await uploadSingleImage(req.file.buffer, 'product');
      imageUrl = uploadResult.url; // secure_url এর জায়গায় url
    }

    // Product তৈরি করা
    const newProduct = await Product.create({
      product_name,
      product_name_bengali,
      category,
      base_price: parseFloat(base_price),
      description,
      image_url: imageUrl,
      is_available: is_available !== undefined ? is_available : true
    });

    return res.status(201).json({
      success: true,
      message: 'Product সফলভাবে তৈরি হয়েছে',
      data: newProduct
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Product তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// UPDATE PRODUCT - Product update করা (Admin only)
// =============================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Product exist করে কিনা check করা
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }

    // ✅ Image upload (যদি নতুন ছবি থাকে) - uploadSingleImage ব্যবহার করা হয়েছে
    if (req.file) {
      const uploadResult = await uploadSingleImage(req.file.buffer, 'product');
      req.body.image_url = uploadResult.url; // secure_url এর জায়গায় url
    }

    // Product update করা
    const updatedProduct = await Product.update(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Product সফলভাবে update হয়েছে',
      data: updatedProduct
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Product update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// DELETE PRODUCT - Product মুছে ফেলা (Admin only)
// =============================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.delete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product সফলভাবে delete হয়েছে',
      data: deletedProduct
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Product delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET PRODUCTS BY CATEGORY - Category অনুযায়ী products
// =============================================
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const products = await Product.getByCategory(category);

    return res.status(200).json({
      success: true,
      message: `${category} category এর products`,
      data: products
    });

  } catch (error) {
    console.error('❌ Get products by category error:', error);
    return res.status(500).json({
      success: false,
      message: 'Products fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// SEARCH PRODUCTS - Product search করা
// =============================================
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'কমপক্ষে ২ অক্ষরের search term প্রদান করুন'
      });
    }

    const products = await Product.search(q.trim());

    return res.status(200).json({
      success: true,
      message: 'Search results',
      data: {
        query: q,
        count: products.length,
        products
      }
    });

  } catch (error) {
    console.error('❌ Search products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Product search করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// TOGGLE AVAILABILITY - Availability toggle করা (Admin only)
// =============================================
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    if (typeof is_available !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_available true অথবা false হতে হবে'
      });
    }

    const updatedProduct = await Product.updateAvailability(id, is_available);

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product ${is_available ? 'available' : 'unavailable'} করা হয়েছে`,
      data: updatedProduct
    });

  } catch (error) {
    console.error('❌ Toggle availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Availability update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET POPULAR PRODUCTS - জনপ্রিয় products
// =============================================
const getPopularProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.getPopularProducts(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Popular products fetch সফল',
      data: products
    });

  } catch (error) {
    console.error('❌ Get popular products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Popular products fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET PRODUCT STATISTICS - Product statistics (Admin only)
// =============================================
const getProductStatistics = async (req, res) => {
  try {
    const statistics = await Product.getStatistics();
    const categoryStats = await Product.countByCategory();

    return res.status(200).json({
      success: true,
      message: 'Product statistics fetch সফল',
      data: {
        overall: statistics,
        byCategory: categoryStats
      }
    });

  } catch (error) {
    console.error('❌ Get product statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Statistics fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  toggleAvailability,
  getPopularProducts,
  getProductStatistics
};