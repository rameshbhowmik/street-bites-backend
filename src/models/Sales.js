// backend/src/models/Sales.js
const mongoose = require('mongoose');

/**
 * Sales Schema - দৈনিক বিক্রয় স্কিমা
 * প্রতিদিনের বিক্রয় ট্র্যাকিং এবং রিপোর্টিং এর জন্য
 */
const salesSchema = new mongoose.Schema({
  // ============================================
  // মৌলিক তথ্য (Basic Information)
  // ============================================
  
  salesDate: {
    type: Date,
    required: [true, 'বিক্রয় তারিখ প্রয়োজন'],
    index: true
  },

  salesRecordId: {
    type: String,
    unique: true,
    required: true
    // Format: SALES-YYYYMMDD-STALLCODE
  },

  // ============================================
  // স্টল ইনফরমেশন (Stall Information)
  // ============================================
  
  stall: {
    stallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall',
      required: true,
      index: true
    },
    stallName: {
      type: String,
      required: true
    },
    stallLocation: {
      type: String,
      required: true
    }
  },

  // ============================================
  // কর্মচারী ইনফরমেশন (Employee Information)
  // ============================================
  
  employee: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    employeeName: {
      type: String,
      required: true
    },
    
    shift: {
      shiftType: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'full-day', 'custom'],
        default: 'full-day'
      },
      startTime: Date,
      endTime: Date,
      totalHours: Number
    }
  },

  // ============================================
  // প্রোডাক্ট-ওয়াইজ বিক্রয় (Product-wise Sales)
  // ============================================
  
  productSales: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantitySold: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    unitSellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    unitCostPrice: {
      type: Number,
      required: true,
      min: 0
    },
    itemTotalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    itemProfit: {
      type: Number,
      default: 0
    }
  }],

  // ============================================
  // বিক্রয় সারসংক্ষেপ (Sales Summary)
  // ============================================
  
  summary: {
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    
    totalItemsSold: {
      type: Number,
      default: 0,
      min: 0
    },
    
    grossSalesAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    taxCollected: {
      type: Number,
      default: 0,
      min: 0
    },
    
    netSalesAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    
    totalCostPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    
    grossProfit: {
      type: Number,
      default: 0
    },
    
    profitMarginPercentage: {
      type: Number,
      default: 0
    }
  },

  // ============================================
  // পেমেন্ট ব্রেকডাউন (Payment Breakdown)
  // ============================================
  
  paymentBreakdown: {
    cash: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      transactionCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    upi: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      transactionCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    card: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      transactionCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    wallet: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      transactionCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    bankTransfer: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      transactionCount: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },

  // ============================================
  // অর্ডার রেফারেন্স (Order References)
  // ============================================
  
  orderReferences: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    orderNumber: String,
    orderAmount: Number,
    orderTime: Date
  }],

  // ============================================
  // রিফান্ড ও ক্যান্সেলেশন (Refunds & Cancellations)
  // ============================================
  
  adjustments: {
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    cancelledSalesAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    cancelledOrderCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    manualAdjustments: [{
      adjustmentType: {
        type: String,
        enum: ['add', 'subtract', 'correction'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      remarks: String,
      adjustedBy: {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        userRole: String
      },
      adjustedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // ============================================
  // স্টক ম্যানেজমেন্ট (Stock Management)
  // ============================================
  
  stockMovement: {
    openingStock: [{
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantity: Number
    }],
    
    closingStock: [{
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantity: Number
    }],
    
    stockDeductedQuantity: [{
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantityDeducted: Number
    }],
    
    wastage: [{
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantityWasted: Number,
      wastageReason: String,
      wastageValue: Number
    }]
  },

  // ============================================
  // Day Closing ইনফরমেশন (Day Closing)
  // ============================================
  
  dayClosing: {
    recordStatus: {
      type: String,
      enum: ['open', 'closed', 'verified', 'locked'],
      default: 'open'
    },
    
    closedAt: Date,
    
    closedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    },
    
    verifiedAt: Date,
    
    verifiedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    },
    
    cashHandedOver: {
      amount: Number,
      handedOverTo: String,
      handedOverAt: Date,
      receiptNumber: String
    },
    
    discrepancy: {
      hasDiscrepancy: {
        type: Boolean,
        default: false
      },
      expectedAmount: Number,
      actualAmount: Number,
      differenceAmount: Number,
      discrepancyReason: String,
      resolvedStatus: {
        type: String,
        enum: ['pending', 'resolved', 'written-off'],
        default: 'pending'
      }
    },
    
    dayNotes: String
  },

  // ============================================
  // মেটা ইনফরমেশন (Meta Information)
  // ============================================
  
  metadata: {
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    },
    
    lastModifiedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    },
    
    isTestRecord: {
      type: Boolean,
      default: false
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// Indexes - দ্রুত সার্চের জন্য
// ============================================

salesSchema.index({ salesRecordId: 1 });
salesSchema.index({ salesDate: -1 });
salesSchema.index({ 'stall.stallId': 1, salesDate: -1 });
salesSchema.index({ 'employee.employeeId': 1, salesDate: -1 });
salesSchema.index({ 'dayClosing.recordStatus': 1 });

// ============================================
// Virtual Fields - ক্যালকুলেটেড ফিল্ড
// ============================================

// মোট পেমেন্ট
salesSchema.virtual('totalPayments').get(function() {
  return (
    this.paymentBreakdown.cash.amount +
    this.paymentBreakdown.upi.amount +
    this.paymentBreakdown.card.amount +
    this.paymentBreakdown.wallet.amount +
    this.paymentBreakdown.bankTransfer.amount
  );
});

// মোট ট্রানজেকশন
salesSchema.virtual('totalTransactions').get(function() {
  return (
    this.paymentBreakdown.cash.transactionCount +
    this.paymentBreakdown.upi.transactionCount +
    this.paymentBreakdown.card.transactionCount +
    this.paymentBreakdown.wallet.transactionCount +
    this.paymentBreakdown.bankTransfer.transactionCount
  );
});

// Average order value
salesSchema.virtual('averageOrderValue').get(function() {
  if (this.summary.totalOrders === 0) return 0;
  return Math.round(this.summary.netSalesAmount / this.summary.totalOrders);
});

// তারিখ বাংলায়
salesSchema.virtual('salesDateInBangla').get(function() {
  const date = new Date(this.salesDate);
  return date.toLocaleDateString('bn-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// ============================================
// Pre-save Middleware
// ============================================

salesSchema.pre('save', async function(next) {
  // Generate sales record ID if not exists
  if (!this.salesRecordId) {
    const date = new Date(this.salesDate);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const stallCode = this.stall.stallName.substring(0, 4).toUpperCase();
    this.salesRecordId = `SALES-${dateStr}-${stallCode}`;
  }
  
  // Calculate totals
  let totalItemsSold = 0;
  let grossSalesAmount = 0;
  let totalCostPrice = 0;
  
  this.productSales.forEach(item => {
    totalItemsSold += item.quantitySold;
    grossSalesAmount += item.itemTotalAmount;
    totalCostPrice += (item.unitCostPrice * item.quantitySold);
    item.itemProfit = item.itemTotalAmount - (item.unitCostPrice * item.quantitySold);
  });
  
  this.summary.totalItemsSold = totalItemsSold;
  this.summary.grossSalesAmount = grossSalesAmount;
  this.summary.totalCostPrice = totalCostPrice;
  
  // Calculate net sales
  this.summary.netSalesAmount = 
    this.summary.grossSalesAmount - 
    this.summary.totalDiscount + 
    this.summary.taxCollected -
    this.adjustments.refundAmount -
    this.adjustments.cancelledSalesAmount;
  
  // Calculate profit
  this.summary.grossProfit = this.summary.netSalesAmount - this.summary.totalCostPrice;
  
  // Calculate profit margin
  if (this.summary.netSalesAmount > 0) {
    this.summary.profitMarginPercentage = 
      (this.summary.grossProfit / this.summary.netSalesAmount) * 100;
  }
  
  next();
});

// ============================================
// Static Methods - কমন queries
// ============================================

// আজকের বিক্রয়
salesSchema.statics.findTodaySales = function(stallId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const query = {
    salesDate: { $gte: today }
  };
  
  if (stallId) {
    query['stall.stallId'] = stallId;
  }
  
  return this.find(query);
};

// তারিখ অনুযায়ী
salesSchema.statics.findByDateRange = function(startDate, endDate, stallId = null) {
  const query = {
    salesDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (stallId) {
    query['stall.stallId'] = stallId;
  }
  
  return this.find(query).sort({ salesDate: -1 });
};

// মাসিক বিক্রয়
salesSchema.statics.findMonthlySales = function(year, month, stallId = null) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.findByDateRange(startDate, endDate, stallId);
};

// Open records
salesSchema.statics.findOpenRecords = function(stallId = null) {
  const query = {
    'dayClosing.recordStatus': 'open'
  };
  
  if (stallId) {
    query['stall.stallId'] = stallId;
  }
  
  return this.find(query);
};

// কর্মচারী অনুযায়ী
salesSchema.statics.findByEmployee = function(employeeId, startDate, endDate) {
  return this.find({
    'employee.employeeId': employeeId,
    salesDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ salesDate: -1 });
};

// ============================================
// Instance Methods - ডাটা ম্যানিপুলেশন
// ============================================

// অর্ডার যোগ করুন
salesSchema.methods.addOrder = async function(order) {
  // Add order reference
  this.orderReferences.push({
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderAmount: order.pricing.finalAmount,
    orderTime: order.createdAt
  });
  
  // Update order count
  this.summary.totalOrders += 1;
  
  // Update product sales
  order.items.forEach(item => {
    const existingProduct = this.productSales.find(
      p => p.productId.toString() === item.productId.toString()
    );
    
    if (existingProduct) {
      existingProduct.quantitySold += item.quantity;
      existingProduct.itemTotalAmount += item.itemSubtotal;
    } else {
      this.productSales.push({
        productId: item.productId,
        productName: item.productName,
        quantitySold: item.quantity,
        unitSellingPrice: item.unitPrice,
        unitCostPrice: item.costPrice || 0,
        itemTotalAmount: item.itemSubtotal
      });
    }
  });
  
  // Update payment breakdown
  const paymentMethod = order.payment.paymentMethod;
  if (this.paymentBreakdown[paymentMethod]) {
    this.paymentBreakdown[paymentMethod].amount += order.pricing.finalAmount;
    this.paymentBreakdown[paymentMethod].transactionCount += 1;
  }
  
  // Update discount
  this.summary.totalDiscount += order.pricing.discount.discountAmount;
  
  // Update tax
  this.summary.taxCollected += order.pricing.tax.taxAmount;
  
  return await this.save();
};

// Manual adjustment যোগ করুন
salesSchema.methods.addManualAdjustment = async function(type, amount, reason, remarks, userId, userName, userRole) {
  this.adjustments.manualAdjustments.push({
    adjustmentType: type,
    amount: amount,
    reason: reason,
    remarks: remarks,
    adjustedBy: { userId, userName, userRole },
    adjustedAt: new Date()
  });
  
  // Update net sales based on adjustment type
  if (type === 'add') {
    this.summary.netSalesAmount += amount;
  } else if (type === 'subtract') {
    this.summary.netSalesAmount -= amount;
  }
  
  return await this.save();
};

// Day close করুন
salesSchema.methods.closeDaySales = async function(userId, userName, userRole, cashAmount, notes = '') {
  this.dayClosing.recordStatus = 'closed';
  this.dayClosing.closedAt = new Date();
  this.dayClosing.closedBy = { userId, userName, userRole };
  this.dayClosing.dayNotes = notes;
  
  // Check for discrepancy
  const expectedCash = this.paymentBreakdown.cash.amount;
  if (cashAmount !== expectedCash) {
    this.dayClosing.discrepancy = {
      hasDiscrepancy: true,
      expectedAmount: expectedCash,
      actualAmount: cashAmount,
      differenceAmount: cashAmount - expectedCash,
      resolvedStatus: 'pending'
    };
  }
  
  return await this.save();
};

// Day verify করুন
salesSchema.methods.verifyDaySales = async function(userId, userName, userRole) {
  this.dayClosing.recordStatus = 'verified';
  this.dayClosing.verifiedAt = new Date();
  this.dayClosing.verifiedBy = { userId, userName, userRole };
  
  return await this.save();
};

// Cash handover রেকর্ড করুন
salesSchema.methods.recordCashHandover = async function(amount, handedOverTo, receiptNumber) {
  this.dayClosing.cashHandedOver = {
    amount: amount,
    handedOverTo: handedOverTo,
    handedOverAt: new Date(),
    receiptNumber: receiptNumber
  };
  
  return await this.save();
};

module.exports = mongoose.model('Sales', salesSchema);