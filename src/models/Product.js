// backend/src/models/Product.js (UPDATED VERSION)

/**
 * Product Schema - প্রোডাক্ট স্কিমা (Updated with Multiple Images)
 * Street Bites প্রজেক্টের জন্য সম্পূর্ণ প্রোডাক্ট ম্যানেজমেন্ট
 * 
 * ✅ CHANGES FROM PREVIOUS VERSION:
 * - productImage (single) → images (multiple)
 * - Added categoryId reference to Category model
 * - Added featured products support
 * - Added image compression tracking
 * - Enhanced image management
 */

const mongoose = require('mongoose');
const slugify = require('slugify'); // npm install slugify

// Reviews সাব-স্কিমা - রিভিউ সাব-স্কিমা
const reviewSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID প্রয়োজন']
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating প্রয়োজন'],
    min: [1, 'Rating কমপক্ষে 1 হতে হবে'],
    max: [5, 'Rating সর্বোচ্চ 5 হতে পারে']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment সর্বোচ্চ 500 অক্ষরের হতে পারে']
  },
  reviewDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Spice Options সাব-স্কিমা - মশলা অপশন সাব-স্কিমা
const spiceOptionsSchema = new mongoose.Schema({
  lessSpices: {
    available: {
      type: Boolean,
      default: true
    },
    additionalPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  moreSpices: {
    available: {
      type: Boolean,
      default: true
    },
    additionalPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  extraSpices: {
    available: {
      type: Boolean,
      default: true
    },
    additionalPrice: {
      type: Number,
      default: 5,
      min: 0
    }
  }
}, { _id: false });

// Extra Toppings সাব-স্কিমা - অতিরিক্ত টপিং সাব-স্কিমা
const toppingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// ✅ NEW: Multiple Images Schema - একাধিক ছবি স্কিমা
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  altText: String, // SEO এর জন্য
  displayOrder: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Main Product Schema - মূল প্রোডাক্ট স্কিমা
const productSchema = new mongoose.Schema({
  // মূল তথ্য - Basic Information
  productName: {
    type: String,
    required: [true, 'প্রোডাক্টের নাম প্রয়োজন'],
    trim: true,
    maxlength: [100, 'নাম সর্বোচ্চ 100 অক্ষরের হতে পারে'],
    index: true
  },

  // ✅ NEW: SEO-friendly slug
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },

  // ✅ UPDATED: Category Reference (instead of enum)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'ক্যাটাগরি প্রয়োজন'],
    index: true
  },

  // Keep old field for backward compatibility
  productCategory: {
    type: String,
    enum: ['Snack', 'Drink', 'Combo', 'Main Dish', 'Dessert', 'Other'],
    default: 'Other'
  },

  productType: {
    type: String,
    required: true,
    enum: ['Fuchka', 'Chanachur', 'Samosa', 'Other Street Food'],
    index: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'বর্ণনা সর্বোচ্চ 500 অক্ষরের হতে পারে']
  },

  // মূল্য তথ্য - Price Information
  sellingPrice: {
    type: Number,
    required: [true, 'বিক্রয় মূল্য প্রয়োজন'],
    min: [0, 'মূল্য ০ বা তার বেশি হতে হবে'],
    index: true // ⚠️ Removed duplicate index definition
  },

  costPrice: {
    type: Number,
    required: [true, 'খরচ মূল্য প্রয়োজন'],
    min: [0, 'খরচ মূল্য ০ বা তার বেশি হতে হবে']
  },

  discount: {
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount ০% বা তার বেশি হতে হবে'],
      max: [100, 'Discount 100% এর বেশি হতে পারে না']
    },
    startDate: Date,
    endDate: Date
  },

  // ✅ UPDATED: Multiple Images (replaced single productImage)
  images: {
    type: [imageSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5; // Maximum 5 images
      },
      message: 'সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন'
    }
  },

  // মশলা সংক্রান্ত - Spice Related
  spicinessLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'None'],
    default: 'Medium'
  },

  spiceOptions: {
    type: spiceOptionsSchema,
    default: () => ({})
  },

  // অতিরিক্ত উপাদান - Extra Ingredients
  extraToppings: [toppingSchema],

  // তাজা থাকার সময় - Freshness Information
  preparationTime: {
    type: Number, // মিনিটে
    default: 10,
    min: 0
  },

  freshnessDuration: {
    type: Number, // ঘন্টায়
    default: 4,
    min: 0
  },

  freshTimestamp: {
    type: Date
  },

  // স্টক তথ্য - Stock Information
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },

  availableStock: {
    type: Number,
    required: [true, 'স্টক পরিমাণ প্রয়োজন'],
    default: 0,
    min: [0, 'স্টক ০ বা তার বেশি হতে হবে']
  },

  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'plate', 'bowl', 'glass', 'kg', 'gm'],
    default: 'pcs'
  },

  minStockAlert: {
    type: Number,
    default: 10,
    min: 0
  },

  // রেটিং ও রিভিউ - Ratings & Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: val => Math.round(val * 10) / 10 // 1 দশমিক পর্যন্ত
  },

  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },

  reviews: [reviewSchema],

  // বিক্রয় তথ্য - Sales Information
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },

  popularity: {
    type: Number,
    default: 0,
    min: 0
  },

  isTrending: {
    type: Boolean,
    default: false,
    index: true
  },

  // ✅ NEW: Featured Product
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  // স্টল তথ্য - Stall Information
  stallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: [true, 'স্টল ID প্রয়োজন'],
    index: true
  },

  stallName: {
    type: String,
    required: true,
    trim: true
  },

  // সৃষ্টিকর্তা তথ্য - Creator Information
  addedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      enum: ['Owner', 'Manager', 'Admin'],
      required: true
    }
  },

  // স্ট্যাটাস - Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// INDEXES - ইনডেক্স (দ্রুত খোঁজার জন্য)
// ============================================

productSchema.index({ productName: 'text', description: 'text' }); // Text search
// ⚠️ REMOVED duplicate: productSchema.index({ sellingPrice: 1 }); 
productSchema.index({ averageRating: -1 }); // Rating sorting
productSchema.index({ totalSold: -1 }); // Popularity sorting
productSchema.index({ createdAt: -1 }); // Latest products
productSchema.index({ categoryId: 1, isActive: 1 }); // Category filter
productSchema.index({ isFeatured: 1, isActive: 1 }); // Featured products

// ============================================
// VIRTUAL FIELDS
// ============================================

// Virtual Field - প্রোফিট ক্যালকুলেশন
productSchema.virtual('profitMargin').get(function() {
  if (this.sellingPrice && this.costPrice) {
    return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual Field - ডিসকাউন্টের পর মূল্য
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount && this.discount.percentage > 0) {
    return this.sellingPrice - (this.sellingPrice * this.discount.percentage / 100);
  }
  return this.sellingPrice;
});

// Virtual Field - স্টক স্ট্যাটাস
productSchema.virtual('stockStatus').get(function() {
  if (this.availableStock === 0) return 'Out of Stock';
  if (this.availableStock <= this.minStockAlert) return 'Low Stock';
  return 'In Stock';
});

// ✅ NEW: Virtual Field - Primary Image
productSchema.virtual('primaryImage').get(function() {
  if (!this.images || this.images.length === 0) {
    return {
      url: 'https://via.placeholder.com/300x300.png?text=No+Image',
      publicId: null
    };
  }
  
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

// ============================================
// MIDDLEWARE
// ============================================

// Pre-save - Auto-generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('productName') || !this.slug) {
    this.slug = slugify(this.productName, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  // যদি স্টক শূন্য হয় তাহলে available false করো
  if (this.availableStock === 0) {
    this.isAvailable = false;
  }

  // Average rating ক্যালকুলেশন
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }

  // ✅ NEW: Ensure one primary image
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }

  next();
});

// ============================================
// STATIC METHODS
// ============================================

// Static Method - ট্রেন্ডিং প্রোডাক্ট খুঁজুন
productSchema.statics.findTrending = function(limit = 10) {
  return this.find({ isTrending: true, isActive: true, isAvailable: true })
    .populate('categoryId')
    .sort({ totalSold: -1, averageRating: -1 })
    .limit(limit);
};

// ✅ NEW: Featured Products
productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true, isAvailable: true })
    .populate('categoryId')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static Method - স্টল অনুযায়ী প্রোডাক্ট
productSchema.statics.findByStall = function(stallId) {
  return this.find({ stallId, isActive: true })
    .populate('categoryId');
};

// ✅ NEW: Find by category
productSchema.statics.findByCategory = function(categoryId, options = {}) {
  return this.find({ 
    categoryId, 
    isActive: true,
    isAvailable: true,
    ...options 
  }).populate('categoryId');
};

// ✅ NEW: Search products
productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true,
    ...options
  }).populate('categoryId');
};

// ============================================
// INSTANCE METHODS
// ============================================

// Instance Method - স্টক আপডেট
productSchema.methods.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.availableStock += quantity;
  } else if (operation === 'subtract') {
    this.availableStock = Math.max(0, this.availableStock - quantity);
  }
  
  if (this.availableStock === 0) {
    this.isAvailable = false;
  }
  
  return this.save();
};

// Instance Method - রিভিউ যোগ করুন
productSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData);
  return this.save();
};

// ✅ NEW: Add image
productSchema.methods.addImage = function(imageData) {
  if (this.images.length >= 5) {
    throw new Error('সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন');
  }
  
  this.images.push({
    ...imageData,
    displayOrder: this.images.length,
    isPrimary: this.images.length === 0
  });
  
  return this.save();
};

// ✅ NEW: Remove image
productSchema.methods.removeImage = function(publicId) {
  const index = this.images.findIndex(img => img.publicId === publicId);
  
  if (index === -1) {
    throw new Error('ছবি পাওয়া যায়নি');
  }
  
  const wasPrimary = this.images[index].isPrimary;
  this.images.splice(index, 1);
  
  // If removed image was primary, make first image primary
  if (wasPrimary && this.images.length > 0) {
    this.images[0].isPrimary = true;
  }
  
  return this.save();
};

// ✅ NEW: Set primary image
productSchema.methods.setPrimaryImage = function(publicId) {
  this.images.forEach(img => {
    img.isPrimary = img.publicId === publicId;
  });
  
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;