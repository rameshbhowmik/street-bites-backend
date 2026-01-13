// backend/src/models/RawMaterial.js
const mongoose = require('mongoose');

/**
 * Raw Material Schema - কাঁচামাল স্কিমা
 * কাঁচামাল ম্যানেজমেন্ট, সাপ্লায়ার এবং কোয়ালিটি ট্র্যাকিং
 */

// Quality Check সাব-স্কিমা - মান পরীক্ষা সাব-স্কিমা
const qualityCheckSchema = new mongoose.Schema({
  qualityScore: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  qualityRemarks: {
    type: String,
    enum: ['excellent', 'good', 'average', 'below-average', 'poor'],
    required: true
  },
  checkedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    }
  },
  checkDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, { _id: false });

// Usage History সাব-স্কিমা - ব্যবহারের ইতিহাস
const usageHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantityUsed: {
    type: Number,
    required: true,
    min: 0
  },
  usedDate: {
    type: Date,
    default: Date.now
  },
  usedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String
  }
}, { _id: false });

// Purchase History সাব-স্কিমা - ক্রয়ের ইতিহাস
const purchaseHistorySchema = new mongoose.Schema({
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: String,
  invoiceNumber: {
    type: String,
    trim: true
  },
  receivedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String
  }
}, { _id: false });

// Main Raw Material Schema - মূল কাঁচামাল স্কিমা
const rawMaterialSchema = new mongoose.Schema({
  // মূল তথ্য - Basic Information
  materialName: {
    type: String,
    required: [true, 'কাঁচামালের নাম প্রয়োজন'],
    trim: true,
    maxlength: [100, 'নাম সর্বোচ্চ 100 অক্ষরের হতে পারে'],
    index: true
  },
  
  materialCategory: {
    type: String,
    required: [true, 'ক্যাটাগরি প্রয়োজন'],
    enum: {
      values: ['মশলা', 'সবজি', 'তেল', 'প্যাকেট', 'দুগ্ধজাত', 'অন্যান্য'],
      message: '{VALUE} একটি বৈধ ক্যাটাগরি নয়'
    },
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'বর্ণনা সর্বোচ্চ 300 অক্ষরের হতে পারে']
  },
  
  // সাপ্লায়ার তথ্য - Supplier Information
  supplier: {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true
    },
    supplierName: {
      type: String,
      required: [true, 'সাপ্লায়ারের নাম প্রয়োজন'],
      trim: true
    },
    contactNumber: {
      type: String,
      required: [true, 'যোগাযোগ নম্বর প্রয়োজন'],
      trim: true,
      validate: {
        validator: function(v) {
          // ইন্ডিয়ান মোবাইল নম্বর ভ্যালিডেশন (10 digits, 6-9 দিয়ে শুরু)
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন (10 digits, 6-9 দিয়ে শুরু)'
      }
    },
    address: {
      type: String,
      trim: true
    },
    supplierType: {
      type: String,
      enum: ['local', 'wholesale', 'manufacturer', 'distributor'],
      default: 'local'
    }
  },
  
  // স্টক তথ্য - Stock Information
  currentStock: {
    type: Number,
    required: [true, 'বর্তমান স্টক প্রয়োজন'],
    default: 0,
    min: [0, 'স্টক ০ বা তার বেশি হতে হবে']
  },
  
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gm', 'litre', 'ml', 'pcs', 'packet', 'bag'],
    default: 'kg'
  },
  
  minStockLevel: {
    type: Number,
    required: [true, 'মিনিমাম স্টক লেভেল প্রয়োজন'],
    default: 5,
    min: 0
  },
  
  reorderQuantity: {
    type: Number,
    default: 20,
    min: 0
  },
  
  // মান নিয়ন্ত্রণ - Quality Control
  qualityChecks: [qualityCheckSchema],
  
  currentQualityScore: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  lastQualityCheckDate: Date,
  
  // মূল্য তথ্য - Price Information
  costPerUnit: {
    type: Number,
    required: [true, 'প্রতি ইউনিট মূল্য প্রয়োজন'],
    min: 0
  },
  
  lastPurchasePrice: {
    type: Number,
    min: 0
  },
  
  averageCostPrice: {
    type: Number,
    min: 0
  },
  
  // তারিখ তথ্য - Date Information
  lastPurchaseDate: Date,
  
  receivedDate: {
    type: Date,
    default: Date.now
  },
  
  expiryDate: Date,
  
  bestBeforeDate: Date,
  
  // স্টোরেজ তথ্য - Storage Information
  storageCondition: {
    type: String,
    enum: ['dry', 'cold', 'frozen', 'room-temperature', 'refrigerated'],
    default: 'room-temperature'
  },
  
  storageLocation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // ব্যবহার ট্র্যাকিং - Usage Tracking
  usageHistory: [usageHistorySchema],
  
  totalUsedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ক্রয় ইতিহাস - Purchase History
  purchaseHistory: [purchaseHistorySchema],
  
  totalPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // নষ্ট হওয়া - Wastage
  wastageQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  wastageReason: {
    type: String,
    trim: true
  },
  
  // অ্যালার্ট - Alerts
  alerts: {
    lowStockAlert: {
      enabled: {
        type: Boolean,
        default: true
      },
      lastAlertDate: Date
    },
    expiryAlert: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBeforeExpiry: {
        type: Number,
        default: 15
      },
      lastAlertDate: Date
    },
    qualityAlert: {
      enabled: {
        type: Boolean,
        default: true
      },
      minimumScore: {
        type: Number,
        default: 2,
        min: 1,
        max: 5
      }
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

// Indexes - ইনডেক্স
rawMaterialSchema.index({ materialName: 'text', description: 'text' });
rawMaterialSchema.index({ currentStock: 1 });
rawMaterialSchema.index({ expiryDate: 1 });
rawMaterialSchema.index({ 'supplier.supplierName': 1 });

// Virtual Field - স্টক স্ট্যাটাস
rawMaterialSchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'Out of Stock';
  if (this.currentStock <= this.minStockLevel) return 'Low Stock';
  return 'In Stock';
});

// Virtual Field - মেয়াদ উত্তীর্ণ হতে বাকি দিন
rawMaterialSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual Field - মোট স্টক ভ্যালু
rawMaterialSchema.virtual('totalStockValue').get(function() {
  return this.currentStock * this.costPerUnit;
});

// Pre-save Middleware - Average cost ক্যালকুলেশন
rawMaterialSchema.pre('save', function(next) {
  // Average cost price ক্যালকুলেশন
  if (this.purchaseHistory && this.purchaseHistory.length > 0) {
    const totalCost = this.purchaseHistory.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalQty = this.purchaseHistory.reduce((sum, purchase) => sum + purchase.quantity, 0);
    this.averageCostPrice = totalQty > 0 ? totalCost / totalQty : this.costPerUnit;
    this.totalPurchased = totalQty;
  }
  
  // Total used quantity ক্যালকুলেশন
  if (this.usageHistory && this.usageHistory.length > 0) {
    this.totalUsedQuantity = this.usageHistory.reduce((sum, usage) => sum + usage.quantityUsed, 0);
  }
  
  // Current quality score ক্যালকুলেশন
  if (this.qualityChecks && this.qualityChecks.length > 0) {
    const latestCheck = this.qualityChecks[this.qualityChecks.length - 1];
    this.currentQualityScore = latestCheck.qualityScore;
    this.lastQualityCheckDate = latestCheck.checkDate;
  }
  
  next();
});

// Static Method - Low Stock কাঁচামাল খুঁজুন
rawMaterialSchema.statics.findLowStock = function() {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minStockLevel'] }
  }).sort({ currentStock: 1 });
};

// Static Method - Expiring Soon কাঁচামাল
rawMaterialSchema.statics.findExpiringSoon = function(days = 15) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    expiryDate: { $exists: true, $lte: futureDate }
  }).sort({ expiryDate: 1 });
};

// Static Method - ক্যাটাগরি অনুযায়ী খুঁজুন
rawMaterialSchema.statics.findByCategory = function(category) {
  return this.find({ materialCategory: category, isActive: true });
};

// Static Method - সাপ্লায়ার অনুযায়ী খুঁজুন
rawMaterialSchema.statics.findBySupplier = function(supplierId) {
  return this.find({ 'supplier.supplierId': supplierId, isActive: true });
};

// Instance Method - স্টক যোগ করুন
rawMaterialSchema.methods.addStock = function(quantity, purchaseData = null) {
  this.currentStock += quantity;
  
  // যদি purchase data থাকে তাহলে history তে যোগ করুন
  if (purchaseData) {
    this.purchaseHistory.push({
      ...purchaseData,
      quantity: quantity,
      totalCost: quantity * purchaseData.unitPrice,
      purchaseDate: new Date()
    });
    
    this.lastPurchasePrice = purchaseData.unitPrice;
    this.lastPurchaseDate = new Date();
  }
  
  return this.save();
};

// Instance Method - স্টক ব্যবহার করুন
rawMaterialSchema.methods.useStock = function(quantity, usageData) {
  if (this.currentStock < quantity) {
    throw new Error('পর্যাপ্ত স্টক নেই');
  }
  
  this.currentStock -= quantity;
  
  // Usage history তে যোগ করুন
  this.usageHistory.push({
    ...usageData,
    quantityUsed: quantity,
    usedDate: new Date()
  });
  
  return this.save();
};

// Instance Method - Quality Check যোগ করুন
rawMaterialSchema.methods.addQualityCheck = function(checkData) {
  this.qualityChecks.push({
    ...checkData,
    checkDate: new Date()
  });
  
  return this.save();
};

// Instance Method - Wastage রেকর্ড করুন
rawMaterialSchema.methods.recordWastage = function(quantity, reason) {
  this.wastageQuantity += quantity;
  this.currentStock = Math.max(0, this.currentStock - quantity);
  this.wastageReason = reason;
  
  return this.save();
};

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);

module.exports = RawMaterial;