// backend/src/models/Inventory.js
const mongoose = require('mongoose');

/**
 * Inventory Schema - ইনভেন্টরি স্কিমা
 * স্টক ম্যানেজমেন্ট, ব্যাচ ট্র্যাকিং এবং ওয়েস্টেজ ম্যানেজমেন্ট
 */

// Stall Stock সাব-স্কিমা - প্রতিটি স্টলের স্টক
const stallStockSchema = new mongoose.Schema({
  stallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true
  },
  stallName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastRefillDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Wastage Record সাব-স্কিমা - নষ্ট হওয়া রেকর্ড
const wastageRecordSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: {
      values: ['expired', 'damaged', 'spillage', 'over-production', 'quality-issue', 'other'],
      message: '{VALUE} একটি বৈধ wastage reason নয়'
    }
  },
  reasonDetails: {
    type: String,
    trim: true,
    maxlength: 200
  },
  costImpact: {
    type: Number,
    default: 0,
    min: 0
  },
  recordedBy: {
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
      required: true
    }
  },
  recordedDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Stock Transaction সাব-স্কিমা - স্টক লেনদেন
const stockTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    required: true,
    enum: ['stock-in', 'stock-out', 'transfer', 'adjustment'],
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  fromLocation: {
    type: String,
    trim: true
  },
  toLocation: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String
  },
  transactionDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main Inventory Schema - মূল ইনভেন্টরি স্কিমা
const inventorySchema = new mongoose.Schema({
  // প্রোডাক্ট/রও ম্যাটেরিয়াল রেফারেন্স - Product/Raw Material Reference
  itemType: {
    type: String,
    required: true,
    enum: ['product', 'raw-material'],
    index: true
  },
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    sparse: true,
    index: true
  },
  
  rawMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    sparse: true,
    index: true
  },
  
  itemName: {
    type: String,
    required: [true, 'আইটেমের নাম প্রয়োজন'],
    trim: true,
    index: true
  },
  
  // স্টক পরিমাণ - Stock Quantities
  totalStockQuantity: {
    type: Number,
    required: [true, 'মোট স্টক পরিমাণ প্রয়োজন'],
    default: 0,
    min: [0, 'স্টক ০ বা তার বেশি হতে হবে']
  },
  
  productionHouseStock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  stallWiseStock: [stallStockSchema],
  
  // ইউনিট - Unit of Measurement
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gm', 'pcs', 'litre', 'ml', 'plate', 'bowl'],
    default: 'pcs'
  },
  
  // ব্যাচ তথ্য - Batch Information
  batchNumber: {
    type: String,
    required: [true, 'ব্যাচ নম্বর প্রয়োজন'],
    trim: true,
    unique: true,
    index: true
  },
  
  productionDate: {
    type: Date,
    required: [true, 'উৎপাদন তারিখ প্রয়োজন'],
    default: Date.now
  },
  
  expiryDate: {
    type: Date,
    required: [true, 'মেয়াদ শেষের তারিখ প্রয়োজন']
  },
  
  shelfLife: {
    type: Number, // দিনে
    default: 30
  },
  
  // ব্যাচ স্ট্যাটাস - Batch Status
  batchStatus: {
    type: String,
    enum: ['fresh', 'near-expiry', 'expired'],
    default: 'fresh',
    index: true
  },
  
  // নষ্ট হওয়া তথ্য - Wastage Information
  wastageQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  wastageRecords: [wastageRecordSchema],
  
  totalWastageCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // স্টক লেভেল এবং অ্যালার্ট - Stock Level & Alerts
  minStockLevel: {
    type: Number,
    required: [true, 'মিনিমাম স্টক লেভেল প্রয়োজন'],
    default: 10,
    min: 0
  },
  
  reorderQuantity: {
    type: Number,
    default: 50,
    min: 0
  },
  
  autoLowStockAlert: {
    enabled: {
      type: Boolean,
      default: true
    },
    lastAlertDate: Date
  },
  
  nearExpiryAlert: {
    enabled: {
      type: Boolean,
      default: true
    },
    daysBeforeExpiry: {
      type: Number,
      default: 7 // 7 দিন আগে অ্যালার্ট
    },
    lastAlertDate: Date
  },
  
  // স্টক লেনদেন ইতিহাস - Stock Transaction History
  stockTransactions: [stockTransactionSchema],
  
  // সাপ্লায়ার তথ্য - Supplier Information (যদি কিনে আনা হয়)
  supplier: {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierName: String,
    supplierContact: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          // ইন্ডিয়ান মোবাইল নম্বর ভ্যালিডেশন
          return !v || /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন (10 digits, 6-9 দিয়ে শুরু)'
      }
    }
  },
  
  // মূল্য তথ্য - Cost Information
  costPerUnit: {
    type: Number,
    required: [true, 'প্রতি ইউনিট মূল্য প্রয়োজন'],
    min: 0
  },
  
  totalBatchValue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // লোকেশন তথ্য - Location Information
  productionHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionHouse',
    required: [true, 'প্রোডাকশন হাউস ID প্রয়োজন'],
    index: true
  },
  
  // স্ট্যাটাস - Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  lastStockUpdateDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Index - একাধিক ফিল্ডের ইনডেক্স
inventorySchema.index({ itemType: 1, batchNumber: 1 });
inventorySchema.index({ expiryDate: 1, batchStatus: 1 });
inventorySchema.index({ productionHouseId: 1, itemType: 1 });

// Virtual Field - মোট স্টল স্টক
inventorySchema.virtual('totalStallStock').get(function() {
  if (!this.stallWiseStock || this.stallWiseStock.length === 0) return 0;
  return this.stallWiseStock.reduce((total, stall) => total + stall.quantity, 0);
});

// Virtual Field - স্টক পার্সেন্টেজ
inventorySchema.virtual('stockPercentage').get(function() {
  if (!this.minStockLevel) return 100;
  return ((this.totalStockQuantity / this.minStockLevel) * 100).toFixed(2);
});

// Virtual Field - মেয়াদ উত্তীর্ণ হতে বাকি দিন
inventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save Middleware - ব্যাচ স্ট্যাটাস আপডেট
inventorySchema.pre('save', function(next) {
  const now = new Date();
  const expiryDate = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  // ব্যাচ স্ট্যাটাস সেট করুন
  if (daysUntilExpiry < 0) {
    this.batchStatus = 'expired';
    this.isActive = false; // মেয়াদ শেষ হলে inactive করুন
  } else if (daysUntilExpiry <= this.nearExpiryAlert.daysBeforeExpiry) {
    this.batchStatus = 'near-expiry';
  } else {
    this.batchStatus = 'fresh';
  }
  
  // মোট ব্যাচ ভ্যালু ক্যালকুলেশন
  this.totalBatchValue = this.totalStockQuantity * this.costPerUnit;
  
  // মোট wastage cost ক্যালকুলেশন
  if (this.wastageRecords && this.wastageRecords.length > 0) {
    this.totalWastageCost = this.wastageRecords.reduce((sum, record) => sum + record.costImpact, 0);
  }
  
  next();
});

// Static Method - Low Stock আইটেম খুঁজুন
inventorySchema.statics.findLowStock = function() {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$totalStockQuantity', '$minStockLevel'] }
  }).sort({ totalStockQuantity: 1 });
};

// Static Method - Near Expiry আইটেম
inventorySchema.statics.findNearExpiry = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    batchStatus: { $in: ['fresh', 'near-expiry'] },
    expiryDate: { $lte: futureDate }
  }).sort({ expiryDate: 1 });
};

// Static Method - Expired আইটেম
inventorySchema.statics.findExpired = function() {
  return this.find({
    batchStatus: 'expired',
    expiryDate: { $lt: new Date() }
  }).sort({ expiryDate: 1 });
};

// Instance Method - স্টক যোগ করুন
inventorySchema.methods.addStock = function(quantity, location = 'production-house') {
  this.totalStockQuantity += quantity;
  
  if (location === 'production-house') {
    this.productionHouseStock += quantity;
  }
  
  // Transaction record যোগ করুন
  this.stockTransactions.push({
    transactionType: 'stock-in',
    quantity: quantity,
    toLocation: location,
    transactionDate: new Date()
  });
  
  this.lastStockUpdateDate = new Date();
  return this.save();
};

// Instance Method - স্টক বাদ দিন
inventorySchema.methods.removeStock = function(quantity, reason = 'sale') {
  this.totalStockQuantity = Math.max(0, this.totalStockQuantity - quantity);
  
  // Transaction record যোগ করুন
  this.stockTransactions.push({
    transactionType: 'stock-out',
    quantity: quantity,
    reason: reason,
    transactionDate: new Date()
  });
  
  this.lastStockUpdateDate = new Date();
  return this.save();
};

// Instance Method - স্টক ট্রান্সফার (Production House -> Stall)
inventorySchema.methods.transferStock = function(stallId, stallName, quantity) {
  if (this.productionHouseStock < quantity) {
    throw new Error('Production House এ পর্যাপ্ত স্টক নেই');
  }
  
  // Production house থেকে বাদ দিন
  this.productionHouseStock -= quantity;
  
  // Stall এ যোগ করুন
  const stallStock = this.stallWiseStock.find(s => s.stallId.toString() === stallId.toString());
  if (stallStock) {
    stallStock.quantity += quantity;
    stallStock.lastRefillDate = new Date();
  } else {
    this.stallWiseStock.push({
      stallId,
      stallName,
      quantity,
      lastRefillDate: new Date()
    });
  }
  
  // Transaction record যোগ করুন
  this.stockTransactions.push({
    transactionType: 'transfer',
    quantity: quantity,
    fromLocation: 'Production House',
    toLocation: stallName,
    transactionDate: new Date()
  });
  
  this.lastStockUpdateDate = new Date();
  return this.save();
};

// Instance Method - Wastage রেকর্ড করুন
inventorySchema.methods.recordWastage = function(wastageData) {
  this.wastageQuantity += wastageData.quantity;
  this.totalStockQuantity = Math.max(0, this.totalStockQuantity - wastageData.quantity);
  
  this.wastageRecords.push({
    ...wastageData,
    recordedDate: new Date()
  });
  
  this.lastStockUpdateDate = new Date();
  return this.save();
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;