// backend/src/models/Category.js

/**
 * Category Schema - ক্যাটাগরি স্কিমা
 * Product categories management এর জন্য
 * 
 * Features:
 * - Hierarchical categories (parent-child)
 * - Category image support
 * - Product count tracking
 * - SEO-friendly slug
 * - Bengali + English support
 */

const mongoose = require('mongoose');
const slugify = require('slugify'); // npm install slugify

// ============================================
// Category Schema
// ============================================

const categorySchema = new mongoose.Schema(
  {
    // ক্যাটাগরি নাম - Category Name
    name: {
      type: String,
      required: [true, 'ক্যাটাগরি নাম প্রয়োজন'],
      trim: true,
      maxlength: [50, 'নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে'],
      unique: true,
      index: true
    },

    // বাংলা নাম - Bengali Name
    nameBengali: {
      type: String,
      trim: true,
      maxlength: [50, 'বাংলা নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে']
    },

    // SEO-friendly URL slug
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },

    // বর্ণনা - Description
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'বর্ণনা সর্বোচ্চ ৫০০ অক্ষরের হতে পারে']
    },

    // ক্যাটাগরি আইকন/ছবি - Category Image
    image: {
      url: {
        type: String,
        default: 'https://via.placeholder.com/200x200.png?text=Category'
      },
      publicId: String // Cloudinary public ID
    },

    // Parent Category (for subcategories)
    // Example: "Drinks" এর under এ "Cold Drinks", "Hot Drinks"
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },

    // ক্রম - Display Order
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },

    // প্রোডাক্ট সংখ্যা ট্র্যাকিং - Product Count
    productCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // SEO তথ্য - SEO Information
    seo: {
      metaTitle: {
        type: String,
        trim: true,
        maxlength: 60
      },
      metaDescription: {
        type: String,
        trim: true,
        maxlength: 160
      },
      keywords: [String]
    },

    // স্ট্যাটাস - Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Featured (হোমপেজে দেখাবে কিনা)
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    // সৃষ্টিকর্তা তথ্য - Creator Information
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============================================
// INDEXES - দ্রুত খোঁজার জন্য
// ============================================

categorySchema.index({ name: 'text', description: 'text' }); // Text search
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ isFeatured: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

// Virtual populate - Get all products in this category
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
  justOne: false
});

// Virtual populate - Get all subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  justOne: false
});

// Virtual - Check if has subcategories
categorySchema.virtual('hasSubcategories').get(function() {
  return this.subcategories && this.subcategories.length > 0;
});

// Virtual - Full hierarchy path
categorySchema.virtual('hierarchyPath').get(function() {
  if (this.populated('parentCategory')) {
    return `${this.parentCategory.name} > ${this.name}`;
  }
  return this.name;
});

// ============================================
// MIDDLEWARE
// ============================================

// Pre-save - Auto-generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Pre-remove - Update product count in parent category
categorySchema.pre('remove', async function(next) {
  try {
    // যদি subcategories থাকে তাহলে delete করতে দেবে না
    const subcategoryCount = await this.constructor.countDocuments({
      parentCategory: this._id
    });

    if (subcategoryCount > 0) {
      throw new Error('এই ক্যাটাগরির subcategories আছে। প্রথমে সেগুলো delete করুন');
    }

    // যদি products থাকে তাহলে delete করতে দেবে না
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({
      categoryId: this._id
    });

    if (productCount > 0) {
      throw new Error('এই ক্যাটাগরিতে products আছে। প্রথমে সেগুলো delete/transfer করুন');
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get all active categories
 * @param {Boolean} includeSubcategories - Populate subcategories
 * @returns {Promise<Array>} - Active categories
 */
categorySchema.statics.findActive = function(includeSubcategories = false) {
  const query = this.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  
  if (includeSubcategories) {
    query.populate('subcategories');
  }
  
  return query;
};

/**
 * Get featured categories
 * @param {Number} limit - Number of categories to return
 * @returns {Promise<Array>} - Featured categories
 */
categorySchema.statics.findFeatured = function(limit = 6) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ displayOrder: 1 })
    .limit(limit);
};

/**
 * Get top-level categories (no parent)
 * @returns {Promise<Array>} - Parent categories
 */
categorySchema.statics.findParentCategories = function() {
  return this.find({ parentCategory: null, isActive: true })
    .populate('subcategories')
    .sort({ displayOrder: 1 });
};

/**
 * Get category by slug
 * @param {String} slug - Category slug
 * @returns {Promise<Object>} - Category
 */
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true })
    .populate('parentCategory')
    .populate('subcategories');
};

/**
 * Search categories
 * @param {String} searchTerm - Search query
 * @returns {Promise<Array>} - Matching categories
 */
categorySchema.statics.searchCategories = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true
  });
};

/**
 * Get category tree (hierarchical structure)
 * @returns {Promise<Array>} - Nested category structure
 */
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean();

  // Build tree structure
  const categoryMap = {};
  const tree = [];

  // First pass - create map
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat, children: [] };
  });

  // Second pass - build tree
  categories.forEach(cat => {
    if (cat.parentCategory) {
      if (categoryMap[cat.parentCategory]) {
        categoryMap[cat.parentCategory].children.push(categoryMap[cat._id]);
      }
    } else {
      tree.push(categoryMap[cat._id]);
    }
  });

  return tree;
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Update product count
 * @returns {Promise<Object>} - Updated category
 */
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({
    categoryId: this._id,
    isActive: true
  });
  
  this.productCount = count;
  return this.save();
};

/**
 * Add subcategory
 * @param {Object} subcategoryData - Subcategory data
 * @returns {Promise<Object>} - New subcategory
 */
categorySchema.methods.addSubcategory = async function(subcategoryData) {
  const Category = this.constructor;
  const subcategory = new Category({
    ...subcategoryData,
    parentCategory: this._id
  });
  
  return subcategory.save();
};

/**
 * Get all products in this category
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Products
 */
categorySchema.methods.getProducts = function(options = {}) {
  const Product = mongoose.model('Product');
  return Product.find({
    categoryId: this._id,
    isActive: true,
    ...options
  });
};

// ============================================
// MODEL
// ============================================

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;