// backend/src/controllers/categoryController.js

/**
 * Category Controller - ক্যাটাগরি কন্ট্রোলার
 * 
 * Features:
 * - Complete CRUD operations
 * - Category tree structure
 * - Parent-child relationship
 * - Image upload
 * - Product count tracking
 * - Bengali support
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const { helpers: cloudinaryHelpers } = require('../config/cloudinary');

// ============================================
// 1. GET ALL CATEGORIES
// ============================================

/**
 * Get all active categories
 * @route GET /api/categories
 * @access Public
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { includeSubcategories = 'false' } = req.query;

    const categories = await Category.findActive(includeSubcategories === 'true');

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories,
        count: categories.length
      }
    });

  } catch (error) {
    console.error('❌ Get Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 2. GET CATEGORY TREE
// ============================================

/**
 * Get hierarchical category tree
 * @route GET /api/categories/tree
 * @access Public
 */
exports.getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getCategoryTree();

    res.status(200).json({
      success: true,
      message: 'Category tree retrieved',
      data: tree
    });

  } catch (error) {
    console.error('❌ Get Category Tree Error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি ট্রি লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 3. GET PARENT CATEGORIES
// ============================================

/**
 * Get only parent categories (no subcategories)
 * @route GET /api/categories/parents
 * @access Public
 */
exports.getParentCategories = async (req, res) => {
  try {
    const categories = await Category.findParentCategories();

    res.status(200).json({
      success: true,
      message: 'Parent categories retrieved',
      data: {
        categories,
        count: categories.length
      }
    });

  } catch (error) {
    console.error('❌ Get Parent Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 4. GET FEATURED CATEGORIES
// ============================================

/**
 * Get featured categories
 * @route GET /api/categories/featured
 * @access Public
 */
exports.getFeaturedCategories = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const categories = await Category.findFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Featured categories retrieved',
      data: {
        categories,
        count: categories.length
      }
    });

  } catch (error) {
    console.error('❌ Get Featured Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 5. GET SINGLE CATEGORY
// ============================================

/**
 * Get category by ID or slug
 * @route GET /api/categories/:identifier
 * @access Public
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { identifier } = req.params;

    let category;

    // Check if MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(identifier)
        .populate('parentCategory')
        .populate('subcategories');
    } else {
      // Find by slug
      category = await Category.findBySlug(identifier);
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({
      categoryId: category._id,
      isActive: true
    });

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: {
        ...category.toObject(),
        productCount
      }
    });

  } catch (error) {
    console.error('❌ Get Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 6. CREATE CATEGORY
// ============================================

/**
 * Create new category
 * @route POST /api/categories
 * @access Manager, Owner
 */
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      nameBengali,
      description,
      parentCategory,
      displayOrder,
      isFeatured,
      seo
    } = req.body;

    // Check if parent category exists (if provided)
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent ক্যাটাগরি পাওয়া যায়নি'
        });
      }
    }

    // Handle image upload
    let image = {};
    if (req.file) {
      image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    // Create category
    const category = await Category.create({
      name,
      nameBengali,
      description,
      parentCategory: parentCategory || null,
      displayOrder: displayOrder || 0,
      isFeatured: isFeatured || false,
      image,
      seo: seo ? JSON.parse(seo) : {},
      createdBy: {
        userId: req.user._id,
        userName: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'ক্যাটাগরি সফলভাবে তৈরি হয়েছে',
      data: category
    });

  } catch (error) {
    console.error('❌ Create Category Error:', error);

    // Delete uploaded image if category creation fails
    if (req.file) {
      await cloudinaryHelpers.deleteImage(req.file.path);
    }

    // Check for duplicate name
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'এই নামের ক্যাটাগরি ইতিমধ্যে আছে'
      });
    }

    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 7. UPDATE CATEGORY
// ============================================

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Manager, Owner
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    // If parent category is being updated, validate it
    if (req.body.parentCategory) {
      // Cannot set self as parent
      if (req.body.parentCategory === id) {
        return res.status(400).json({
          success: false,
          message: 'ক্যাটাগরি নিজেকে parent হিসেবে সেট করতে পারবে না'
        });
      }

      const parent = await Category.findById(req.body.parentCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent ক্যাটাগরি পাওয়া যায়নি'
        });
      }
    }

    // Parse SEO if it's a string
    if (req.body.seo && typeof req.body.seo === 'string') {
      req.body.seo = JSON.parse(req.body.seo);
    }

    // Update category
    Object.assign(category, req.body);
    await category.save();

    res.status(200).json({
      success: true,
      message: 'ক্যাটাগরি আপডেট হয়েছে',
      data: category
    });

  } catch (error) {
    console.error('❌ Update Category Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'এই নামের ক্যাটাগরি ইতিমধ্যে আছে'
      });
    }

    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 8. DELETE CATEGORY
// ============================================

/**
 * Delete category (soft delete)
 * @route DELETE /api/categories/:id
 * @access Owner
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    // Check if has subcategories
    const subcategoryCount = await Category.countDocuments({
      parentCategory: id,
      isActive: true
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'এই ক্যাটাগরির subcategories আছে। প্রথমে সেগুলো delete করুন'
      });
    }

    // Check if has products
    const productCount = await Product.countDocuments({
      categoryId: id,
      isActive: true
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `এই ক্যাটাগরিতে ${productCount}টি products আছে। প্রথমে সেগুলো delete/transfer করুন`
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'ক্যাটাগরি ডিলিট হয়েছে',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Delete Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 9. UPLOAD CATEGORY IMAGE
// ============================================

/**
 * Upload/Update category image
 * @route POST /api/categories/:id/image
 * @access Manager, Owner
 */
exports.uploadCategoryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      // Delete uploaded image
      if (req.file) {
        await cloudinaryHelpers.deleteImage(req.file.path);
      }

      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোনো ছবি আপলোড করা হয়নি'
      });
    }

    // Delete old image if exists
    if (category.image && category.image.publicId) {
      await cloudinaryHelpers.deleteImage(category.image.url);
    }

    // Update image
    category.image = {
      url: req.file.path,
      publicId: req.file.filename
    };

    await category.save();

    res.status(200).json({
      success: true,
      message: 'ছবি আপলোড হয়েছে',
      data: {
        categoryId: category._id,
        image: category.image
      }
    });

  } catch (error) {
    console.error('❌ Upload Category Image Error:', error);

    // Delete uploaded image on error
    if (req.file) {
      await cloudinaryHelpers.deleteImage(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'ছবি আপলোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 10. UPDATE PRODUCT COUNT
// ============================================

/**
 * Manually update product count for a category
 * @route PATCH /api/categories/:id/update-count
 * @access Manager, Owner
 */
exports.updateProductCount = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    await category.updateProductCount();

    res.status(200).json({
      success: true,
      message: 'Product count আপডেট হয়েছে',
      data: {
        categoryId: category._id,
        productCount: category.productCount
      }
    });

  } catch (error) {
    console.error('❌ Update Product Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Product count আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 11. TOGGLE FEATURED
// ============================================

/**
 * Toggle category featured status
 * @route PATCH /api/categories/:id/featured
 * @access Manager, Owner
 */
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    category.isFeatured = !category.isFeatured;
    await category.save();

    res.status(200).json({
      success: true,
      message: category.isFeatured
        ? 'ক্যাটাগরি Featured করা হয়েছে'
        : 'ক্যাটাগরি Featured থেকে সরানো হয়েছে',
      data: {
        categoryId: category._id,
        isFeatured: category.isFeatured
      }
    });

  } catch (error) {
    console.error('❌ Toggle Featured Error:', error);
    res.status(500).json({
      success: false,
      message: 'অপারেশন সম্পূর্ণ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// EXPORTS
// ============================================

/*
module.exports = {
  getAllCategories,
  getCategoryTree,
  getParentCategories,
  getFeaturedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  updateProductCount,
  toggleFeatured
};
*/