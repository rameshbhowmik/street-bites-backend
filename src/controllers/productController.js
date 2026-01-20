// backend/src/controllers/productController.js (PART 1/2)

/**
 * Product Controller - প্রোডাক্ট কন্ট্রোলার
 * 
 * Features:
 * - Complete CRUD operations
 * - Multiple image upload/delete
 * - Search, filter, sort, pagination
 * - Stock management
 * - Review management
 * - Category integration
 * - Professional error handling
 * - Bengali comments
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const { helpers: cloudinaryHelpers } = require('../config/cloudinary');

// ============================================
// 1. GET ALL PRODUCTS (with pagination, search, filter, sort)
// ============================================

/**
 * Get all products with advanced filtering
 * @route GET /api/products
 * @access Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    // Query parameters
    const {
      page = 1,
      limit = 12,
      search,
      category,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      isAvailable,
      isTrending,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Search by name or description
    if (search) {
      filter.$text = { $search: search };
    }

    // Filter by category ID
    if (category) {
      filter.categoryId = category;
    }

    // Filter by category slug
    if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug });
      if (categoryDoc) {
        filter.categoryId = categoryDoc._id;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Availability filter
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    // Trending filter
    if (isTrending !== undefined) {
      filter.isTrending = isTrending === 'true';
    }

    // Featured filter
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug nameBengali image')
        .populate('stallId', 'stallName address')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('❌ Get Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 2. GET SINGLE PRODUCT (by ID or slug)
// ============================================

/**
 * Get single product by ID or slug
 * @route GET /api/products/:identifier
 * @access Public
 */
exports.getProductById = async (req, res) => {
  try {
    const { identifier } = req.params;

    let product;

    // Check if identifier is MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier)
        .populate('categoryId')
        .populate('stallId')
        .populate('reviews.customerId', 'name profilePicture');
    } else {
      // Try to find by slug
      product = await Product.findOne({ slug: identifier, isActive: true })
        .populate('categoryId')
        .populate('stallId')
        .populate('reviews.customerId', 'name profilePicture');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });

  } catch (error) {
    console.error('❌ Get Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 3. CREATE NEW PRODUCT
// ============================================

/**
 * Create new product
 * @route POST /api/products
 * @access Manager, Owner
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      productName,
      categoryId,
      productType,
      description,
      sellingPrice,
      costPrice,
      spicinessLevel,
      preparationTime,
      freshnessDuration,
      availableStock,
      unit,
      minStockAlert,
      stallId,
      stallName,
      extraToppings,
      spiceOptions,
      discount
    } = req.body;

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    // Handle multiple images from req.files
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        isPrimary: index === 0, // First image is primary
        displayOrder: index
      }));
    }

    // Create product
    const product = await Product.create({
      productName,
      categoryId,
      productCategory: category.name, // Backward compatibility
      productType,
      description,
      sellingPrice,
      costPrice,
      spicinessLevel,
      preparationTime,
      freshnessDuration,
      availableStock,
      unit,
      minStockAlert,
      stallId,
      stallName,
      images,
      extraToppings: extraToppings ? JSON.parse(extraToppings) : [],
      spiceOptions: spiceOptions ? JSON.parse(spiceOptions) : {},
      discount: discount ? JSON.parse(discount) : {},
      addedBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role.name || req.user.role
      }
    });

    // Update category product count
    await category.updateProductCount();

    // Populate for response
    await product.populate('categoryId stallId');

    res.status(201).json({
      success: true,
      message: 'প্রোডাক্ট সফলভাবে তৈরি হয়েছে',
      data: product
    });

  } catch (error) {
    console.error('❌ Create Product Error:', error);

    // Delete uploaded images if product creation fails
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => file.path);
      await cloudinaryHelpers.deleteMultipleImages(imageUrls);
    }

    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 4. UPDATE PRODUCT
// ============================================

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Manager, Owner
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    // If category is being updated, validate it
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'ক্যাটাগরি পাওয়া যায়নি'
        });
      }
      req.body.productCategory = category.name; // Update backward compat field
    }

    // Parse JSON fields if they exist
    if (req.body.extraToppings && typeof req.body.extraToppings === 'string') {
      req.body.extraToppings = JSON.parse(req.body.extraToppings);
    }
    if (req.body.spiceOptions && typeof req.body.spiceOptions === 'string') {
      req.body.spiceOptions = JSON.parse(req.body.spiceOptions);
    }
    if (req.body.discount && typeof req.body.discount === 'string') {
      req.body.discount = JSON.parse(req.body.discount);
    }

    // Update product
    Object.assign(product, req.body);
    await product.save();

    // Update category product count if category changed
    if (req.body.categoryId) {
      await Category.findById(req.body.categoryId).then(cat => cat.updateProductCount());
    }

    await product.populate('categoryId stallId');

    res.status(200).json({
      success: true,
      message: 'প্রোডাক্ট আপডেট হয়েছে',
      data: product
    });

  } catch (error) {
    console.error('❌ Update Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 5. DELETE PRODUCT (Soft Delete)
// ============================================

/**
 * Delete product (soft delete)
 * @route DELETE /api/products/:id
 * @access Owner
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    // Update category product count
    if (product.categoryId) {
      const category = await Category.findById(product.categoryId);
      if (category) {
        await category.updateProductCount();
      }
    }

    res.status(200).json({
      success: true,
      message: 'প্রোডাক্ট ডিলিট হয়েছে',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Delete Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট ডিলিট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 6. PERMANENT DELETE PRODUCT
// ============================================

/**
 * Permanently delete product and all images
 * @route DELETE /api/products/:id/permanent
 * @access Owner
 */
exports.permanentDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      const imageUrls = product.images.map(img => img.url);
      await cloudinaryHelpers.deleteMultipleImages(imageUrls);
      console.log(`✅ Deleted ${imageUrls.length} images from Cloudinary`);
    }

    // Update category product count
    const categoryId = product.categoryId;

    // Delete product
    await Product.findByIdAndDelete(id);

    // Update category count
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (category) {
        await category.updateProductCount();
      }
    }

    res.status(200).json({
      success: true,
      message: 'প্রোডাক্ট স্থায়ীভাবে ডিলিট হয়েছে',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Permanent Delete Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট ডিলিট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 7. UPDATE STOCK
// ============================================

/**
 * Update product stock
 * @route PATCH /api/products/:id/stock
 * @access Manager, Owner, Employee
 */
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'add' } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'সঠিক পরিমাণ প্রদান করুন'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    await product.updateStock(parseInt(quantity), operation);

    res.status(200).json({
      success: true,
      message: 'স্টক আপডেট হয়েছে',
      data: {
        productId: product._id,
        productName: product.productName,
        previousStock: operation === 'add' 
          ? product.availableStock - quantity 
          : product.availableStock + quantity,
        currentStock: product.availableStock,
        stockStatus: product.stockStatus
      }
    });

  } catch (error) {
    console.error('❌ Update Stock Error:', error);
    res.status(500).json({
      success: false,
      message: 'স্টক আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// TO BE CONTINUED IN PART 2...
// Part 2 will include:
// - Upload images
// - Delete images
// - Set primary image
// - Get featured products
// - Get trending products
// - Search products
// - Add review
// - And more...

// backend/src/controllers/productController.js (PART 2/2)
// ⚠️ এটা Part 1 এর continuation - এগুলো Part 1 এর নিচে যোগ করুন

// ============================================
// 8. UPLOAD PRODUCT IMAGES
// ============================================

/**
 * Upload multiple images to existing product
 * @route POST /api/products/:id/images
 * @access Manager, Owner
 */
exports.uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      // Delete uploaded images if product not found
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => file.path);
        await cloudinaryHelpers.deleteMultipleImages(imageUrls);
      }

      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'কোনো ছবি আপলোড করা হয়নি'
      });
    }

    // Check total images limit
    const totalImages = product.images.length + req.files.length;
    if (totalImages > 5) {
      // Delete newly uploaded images
      const imageUrls = req.files.map(file => file.path);
      await cloudinaryHelpers.deleteMultipleImages(imageUrls);

      return res.status(400).json({
        success: false,
        message: `সর্বোচ্চ ৫টি ছবি থাকতে পারে। বর্তমানে ${product.images.length}টি ছবি আছে`
      });
    }

    // Add new images
    for (const file of req.files) {
      await product.addImage({
        url: file.path,
        publicId: file.filename
      });
    }

    res.status(200).json({
      success: true,
      message: `${req.files.length}টি ছবি সফলভাবে আপলোড হয়েছে`,
      data: {
        productId: product._id,
        images: product.images,
        totalImages: product.images.length
      }
    });

  } catch (error) {
    console.error('❌ Upload Images Error:', error);

    // Clean up uploaded images on error
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => file.path);
      await cloudinaryHelpers.deleteMultipleImages(imageUrls);
    }

    res.status(500).json({
      success: false,
      message: 'ছবি আপলোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 9. DELETE PRODUCT IMAGE
// ============================================

/**
 * Delete a single image from product
 * @route DELETE /api/products/:id/images/:publicId
 * @access Manager, Owner
 */
exports.deleteProductImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    // Find image
    const image = product.images.find(img => img.publicId === publicId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'ছবি পাওয়া যায়নি'
      });
    }

    // Delete from Cloudinary
    await cloudinaryHelpers.deleteImage(image.url);

    // Remove from product
    await product.removeImage(publicId);

    res.status(200).json({
      success: true,
      message: 'ছবি ডিলিট হয়েছে',
      data: {
        productId: product._id,
        remainingImages: product.images.length
      }
    });

  } catch (error) {
    console.error('❌ Delete Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'ছবি ডিলিট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 10. SET PRIMARY IMAGE
// ============================================

/**
 * Set primary image for product
 * @route PATCH /api/products/:id/images/:publicId/primary
 * @access Manager, Owner
 */
exports.setPrimaryImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    // Check if image exists
    const imageExists = product.images.some(img => img.publicId === publicId);
    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: 'ছবি পাওয়া যায়নি'
      });
    }

    await product.setPrimaryImage(publicId);

    res.status(200).json({
      success: true,
      message: 'প্রাইমারি ছবি সেট হয়েছে',
      data: {
        productId: product._id,
        primaryImage: product.primaryImage
      }
    });

  } catch (error) {
    console.error('❌ Set Primary Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রাইমারি ছবি সেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 11. GET FEATURED PRODUCTS
// ============================================

/**
 * Get featured products
 * @route GET /api/products/featured
 * @access Public
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.findFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Featured products retrieved',
      data: {
        products,
        count: products.length
      }
    });

  } catch (error) {
    console.error('❌ Get Featured Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Featured products লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 12. GET TRENDING PRODUCTS
// ============================================

/**
 * Get trending products
 * @route GET /api/products/trending
 * @access Public
 */
exports.getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.findTrending(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Trending products retrieved',
      data: {
        products,
        count: products.length
      }
    });

  } catch (error) {
    console.error('❌ Get Trending Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Trending products লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 13. SEARCH PRODUCTS
// ============================================

/**
 * Search products by name/description
 * @route GET /api/products/search
 * @access Public
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'অনুসন্ধান টেক্সট প্রদান করুন'
      });
    }

    const products = await Product.searchProducts(q, {})
      .populate('categoryId', 'name slug')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Search results',
      data: {
        query: q,
        products,
        count: products.length
      }
    });

  } catch (error) {
    console.error('❌ Search Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'অনুসন্ধান করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 14. GET PRODUCTS BY CATEGORY
// ============================================

/**
 * Get products by category
 * @route GET /api/products/category/:categorySlug
 * @access Public
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Find category
    const category = await Category.findOne({ slug: categorySlug, isActive: true });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ক্যাটাগরি পাওয়া যায়নি'
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products
    const [products, total] = await Promise.all([
      Product.findByCategory(category._id)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments({ categoryId: category._id, isActive: true, isAvailable: true })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Products retrieved',
      data: {
        category: {
          id: category._id,
          name: category.name,
          nameBengali: category.nameBengali,
          slug: category.slug
        },
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get Products by Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোডাক্ট লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 15. ADD PRODUCT REVIEW
// ============================================

/**
 * Add review to product
 * @route POST /api/products/:id/reviews
 * @access Authenticated Users
 */
exports.addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating ১ থেকে ৫ এর মধ্যে হতে হবে'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.some(
      r => r.customerId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'আপনি ইতিমধ্যে এই প্রোডাক্টে রিভিউ দিয়েছেন'
      });
    }

    await product.addReview({
      customerId: req.user._id,
      customerName: req.user.name,
      rating: parseInt(rating),
      comment: comment || ''
    });

    res.status(201).json({
      success: true,
      message: 'রিভিউ সফলভাবে যোগ হয়েছে',
      data: {
        productId: product._id,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews
      }
    });

  } catch (error) {
    console.error('❌ Add Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'রিভিউ যোগ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 16. TOGGLE FEATURED STATUS
// ============================================

/**
 * Toggle product featured status
 * @route PATCH /api/products/:id/featured
 * @access Manager, Owner
 */
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({
      success: true,
      message: product.isFeatured 
        ? 'প্রোডাক্ট Featured করা হয়েছে' 
        : 'প্রোডাক্ট Featured থেকে সরানো হয়েছে',
      data: {
        productId: product._id,
        isFeatured: product.isFeatured
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
// 17. TOGGLE TRENDING STATUS
// ============================================

/**
 * Toggle product trending status
 * @route PATCH /api/products/:id/trending
 * @access Manager, Owner
 */
exports.toggleTrending = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'প্রোডাক্ট পাওয়া যায়নি'
      });
    }

    product.isTrending = !product.isTrending;
    await product.save();

    res.status(200).json({
      success: true,
      message: product.isTrending 
        ? 'প্রোডাক্ট Trending করা হয়েছে' 
        : 'প্রোডাক্ট Trending থেকে সরানো হয়েছে',
      data: {
        productId: product._id,
        isTrending: product.isTrending
      }
    });

  } catch (error) {
    console.error('❌ Toggle Trending Error:', error);
    res.status(500).json({
      success: false,
      message: 'অপারেশন সম্পূর্ণ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 18. GET LOW STOCK PRODUCTS
// ============================================

/**
 * Get products with low stock
 * @route GET /api/products/low-stock
 * @access Manager, Owner
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$availableStock', '$minStockAlert'] }
    })
      .populate('categoryId stallId')
      .sort({ availableStock: 1 });

    res.status(200).json({
      success: true,
      message: 'Low stock products retrieved',
      data: {
        products,
        count: products.length
      }
    });

  } catch (error) {
    console.error('❌ Get Low Stock Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Low stock products লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// EXPORTS - সব functions একসাথে export
// ============================================

// These should be added to Part 1's module.exports
// Or you can combine Part 1 and Part 2 into a single file

/*
module.exports = {
  // Part 1
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  permanentDeleteProduct,
  updateStock,
  
  // Part 2
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  getFeaturedProducts,
  getTrendingProducts,
  searchProducts,
  getProductsByCategory,
  addProductReview,
  toggleFeatured,
  toggleTrending,
  getLowStockProducts
};
*/