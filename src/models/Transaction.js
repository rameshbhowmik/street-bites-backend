// backend/src/models/Transaction.js - FIXED VERSION

const mongoose = require('mongoose');

/**
 * Transaction Schema - লেনদেন স্কিমা
 * সব ধরনের আর্থিক লেনদেন ট্র্যাকিং এর জন্য
 */
const transactionSchema = new mongoose.Schema({
  // ============================================
  // মৌলিক তথ্য (Basic Information)
  // ============================================
  transactionId: {
    type: String,
    unique: true,
    required: [true, 'ট্রানজেকশন আইডি প্রয়োজন']
  },

  referenceNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // ============================================
  // ট্রানজেকশন টাইপ (Transaction Type)
  // ============================================
  transactionType: {
    type: String,
    enum: [
      'sale',
      'expense',
      'investment',
      'refund',
      'salary',
      'purchase',
      'withdrawal',
      'deposit',
      'transfer',
      'dividend',
      'other'
    ],
    required: [true, 'ট্রানজেকশন টাইপ নির্বাচন করুন'],
    index: true
  },

  transactionCategory: {
    type: String,
    enum: [
      'product-sale',
      'service-income',
      'investment-received',
      'raw-material',
      'staff-salary',
      'rent',
      'utilities',
      'maintenance',
      'marketing',
      'transportation',
      'packaging-material',
      'equipment-purchase',
      'license-fee',
      'insurance',
      'customer-refund',
      'supplier-payment',
      'investor-dividend',
      'bank-charges',
      'tax-payment',
      'loan-repayment',
      'miscellaneous'
    ]
  },

  // ============================================
  // আর্থিক তথ্য (Financial Details)
  // ============================================
  amount: {
    type: Number,
    required: [true, 'পরিমাণ প্রয়োজন'],
    min: [0, 'পরিমাণ ০ এর বেশি হতে হবে']
  },

  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },

  taxDetails: {
    taxType: {
      type: String,
      enum: ['GST', 'VAT', 'TDS', 'none'],
      default: 'none'
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    netAmount: {
      type: Number,
      default: 0
    }
  },

  // ============================================
  // সম্পর্কিত এন্টিটি (Related Entity)
  // ============================================
  relatedEntity: {
    entityType: {
      type: String,
      enum: [
        'order',
        'expense',
        'investor',
        'supplier',
        'employee',
        'customer',
        'stall',
        'production-house',
        'bank-account',
        'none'
      ],
      default: 'none'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityModel'
    },
    entityModel: {
      type: String,
      enum: ['Order', 'Expense', 'User', 'Supplier', 'Stall', 'ProductionHouse']
    },
    entityName: String,
    entityReference: String
  },

  // ============================================
  // পেমেন্ট ইনফরমেশন (Payment Information)
  // ============================================
  payment: {
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank-transfer', 'cheque', 'wallet', 'other'],
      required: [true, 'পেমেন্ট মোড নির্বাচন করুন']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'completed',
      index: true
    },
    paymentReference: {
      type: String,
      trim: true
    },
    utrNumber: {
      type: String,
      trim: true
    },
    chequeNumber: {
      type: String,
      trim: true
    },
    chequeClearDate: Date,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branchName: String
    }
  },

  // ============================================
  // পার্টিজ ইনফরমেশন (Parties Information)
  // ============================================
  paidBy: {
    partyType: {
      type: String,
      enum: ['customer', 'owner', 'investor', 'supplier', 'employee', 'other'],
      required: true
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    partyName: {
      type: String,
      required: true
    },
    partyContact: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন (10 digits, 6-9 দিয়ে শুরু)'
      }
    }
  },

  receivedBy: {
    partyType: {
      type: String,
      enum: ['stall', 'business', 'supplier', 'employee', 'owner', 'production-house', 'other'],
      required: true
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId
    },
    partyName: {
      type: String,
      required: true
    },
    partyContact: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন'
      }
    }
  },

  // ============================================
  // লোকেশন রেফারেন্স (Location Reference)
  // ============================================
  location: {
    stallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall'
    },
    stallName: String,
    productionHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionHouse'
    },
    productionHouseName: String,
    businessUnit: {
      type: String,
      enum: ['stall-operations', 'production', 'central-office', 'warehouse', 'other'],
      default: 'stall-operations'
    }
  },

  // ============================================
  // বিবরণ ও মন্তব্য (Description & Comments)
  // ============================================
  transactionDescription: {
    type: String,
    required: [true, 'ট্রানজেকশন বিবরণ প্রয়োজন'],
    trim: true
  },

  remarks: {
    type: String,
    trim: true
  },

  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ============================================
  // অ্যাডজাস্টমেন্ট ইনফরমেশন (Adjustment Info)
  // ============================================
  adjustment: {
    isAdjustment: {
      type: Boolean,
      default: false
    },
    adjustmentReason: {
      type: String,
      enum: [
        'data-entry-error',
        'duplicate-entry',
        'wrong-amount',
        'accounting-correction',
        'reversal',
        'reconciliation',
        'other'
      ]
    },
    adjustmentRemarks: String,
    linkedOriginalTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    // 🔥 FIXED: userRole lowercase
    adjustmentApprovedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: {
        type: String,
        lowercase: true
      }
    }
  },

  // ============================================
  // ট্রানজেকশন তারিখ ও সময় (Date & Time)
  // ============================================
  transactionDate: {
    type: Date,
    required: [true, 'ট্রানজেকশন তারিখ প্রয়োজন'],
    default: Date.now,
    index: true
  },

  transactionTime: {
    type: String,
    required: true
  },

  // ============================================
  // রেকর্ড ইনফরমেশন (Record Information)
  // ============================================
  // 🔥 FIXED: userRole lowercase
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
      required: true,
      lowercase: true
    }
  },

  // ============================================
  // ট্রানজেকশন স্ট্যাটাস (Transaction Status)
  // ============================================
  transactionStatus: {
    type: String,
    enum: ['active', 'reversed', 'cancelled', 'on-hold'],
    default: 'active',
    index: true
  },

  // 🔥 FIXED: userRole lowercase
  reversalDetails: {
    isReversed: {
      type: Boolean,
      default: false
    },
    reversedAt: Date,
    reversedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      userRole: {
        type: String,
        lowercase: true
      }
    },
    reversalReason: String,
    reversalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  },

  // ============================================
  // অনুমোদন ইনফরমেশন (Approval Information)
  // ============================================
  // 🔥 FIXED: userRole lowercase
  approval: {
    requiresApproval: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      userRole: {
        type: String,
        lowercase: true
      }
    },
    approvedAt: Date,
    rejectionReason: String
  },

  // ============================================
  // মেটা ইনফরমেশন (Meta Information)
  // ============================================
  metadata: {
    fiscalYear: String,
    quarter: {
      type: Number,
      min: 1,
      max: 4
    },
    financialMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    isReconciled: {
      type: Boolean,
      default: false
    },
    reconciledAt: Date,
    isAudited: {
      type: Boolean,
      default: false
    },
    auditedAt: Date,
    tags: [String],
    isTestTransaction: {
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
// Indexes
// ============================================

transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ referenceNumber: 1 });
transactionSchema.index({ transactionType: 1, transactionDate: -1 });
transactionSchema.index({ 'payment.paymentStatus': 1 });
transactionSchema.index({ transactionStatus: 1 });
transactionSchema.index({ 'location.stallId': 1, transactionDate: -1 });
transactionSchema.index({ 'paidBy.partyId': 1 });
transactionSchema.index({ 'receivedBy.partyId': 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ transactionType: 1, transactionStatus: 1, transactionDate: -1 });
transactionSchema.index({ 'location.stallId': 1, transactionType: 1, transactionDate: -1 });

// ============================================
// Virtual Fields
// ============================================

transactionSchema.virtual('netTransactionAmount').get(function() {
  if (this.taxDetails.taxAmount > 0) {
    return this.amount - this.taxDetails.taxAmount;
  }
  return this.amount;
});

transactionSchema.virtual('transactionTypeInBangla').get(function() {
  const typeMap = {
    'sale': 'বিক্রয়',
    'expense': 'খরচ',
    'investment': 'বিনিয়োগ',
    'refund': 'ফেরত',
    'salary': 'বেতন',
    'purchase': 'ক্রয়',
    'withdrawal': 'উত্তোলন',
    'deposit': 'জমা',
    'transfer': 'স্থানান্তর',
    'dividend': 'লভ্যাংশ',
    'other': 'অন্যান্য'
  };
  return typeMap[this.transactionType] || this.transactionType;
});

transactionSchema.virtual('paymentStatusInBangla').get(function() {
  const statusMap = {
    'pending': 'অপেক্ষমাণ',
    'completed': 'সম্পন্ন',
    'failed': 'ব্যর্থ',
    'cancelled': 'বাতিল',
    'refunded': 'ফেরত দেওয়া হয়েছে'
  };
  return statusMap[this.payment.paymentStatus] || this.payment.paymentStatus;
});

transactionSchema.virtual('transactionDateInBangla').get(function() {
  return new Date(this.transactionDate).toLocaleDateString('bn-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// ============================================
// Pre-save Middleware
// ============================================

transactionSchema.pre('save', async function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    const date = new Date(this.transactionDate);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Transaction').countDocuments({
      transactionDate: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    this.transactionId = `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  // Set transaction time if not provided
  if (!this.transactionTime) {
    const date = new Date(this.transactionDate);
    this.transactionTime = date.toTimeString().slice(0, 5);
  }

  // Calculate net amount for tax
  if (this.taxDetails.taxPercentage > 0) {
    this.taxDetails.taxAmount = (this.amount * this.taxDetails.taxPercentage) / (100 + this.taxDetails.taxPercentage);
    this.taxDetails.netAmount = this.amount - this.taxDetails.taxAmount;
  } else {
    this.taxDetails.netAmount = this.amount;
  }

  // Set fiscal year
  const fiscalYear = this.transactionDate.getFullYear();
  const month = this.transactionDate.getMonth() + 1;
  if (month >= 4) {
    this.metadata.fiscalYear = `${fiscalYear}-${fiscalYear + 1}`;
  } else {
    this.metadata.fiscalYear = `${fiscalYear - 1}-${fiscalYear}`;
  }

  // Set quarter
  if (month >= 4 && month <= 6) this.metadata.quarter = 1;
  else if (month >= 7 && month <= 9) this.metadata.quarter = 2;
  else if (month >= 10 && month <= 12) this.metadata.quarter = 3;
  else this.metadata.quarter = 4;

  // Set financial month
  this.metadata.financialMonth = month >= 4 ? month - 3 : month + 9;

  next();
});

// ============================================
// Static Methods
// ============================================

transactionSchema.statics.findTodayTransactions = function(stallId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const query = {
    transactionDate: { $gte: today },
    transactionStatus: 'active'
  };
  if (stallId) {
    query['location.stallId'] = stallId;
  }
  return this.find(query).sort({ transactionDate: -1 });
};

transactionSchema.statics.findByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    transactionStatus: 'active',
    ...filters
  };
  return this.find(query).sort({ transactionDate: -1 });
};

transactionSchema.statics.findByType = function(type, startDate, endDate) {
  return this.find({
    transactionType: type,
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    transactionStatus: 'active'
  }).sort({ transactionDate: -1 });
};

transactionSchema.statics.findPendingApprovals = function() {
  return this.find({
    'approval.requiresApproval': true,
    'approval.approvalStatus': 'pending'
  }).sort({ transactionDate: 1 });
};

transactionSchema.statics.findByParty = function(partyId, startDate, endDate) {
  return this.find({
    $or: [
      { 'paidBy.partyId': partyId },
      { 'receivedBy.partyId': partyId }
    ],
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    transactionStatus: 'active'
  }).sort({ transactionDate: -1 });
};

// ============================================
// Instance Methods
// ============================================

transactionSchema.methods.reverseTransaction = async function(userId, userName, userRole, reason) {
  // Create reversal entry
  const reversalTransaction = new this.constructor({
    transactionType: this.transactionType,
    transactionCategory: this.transactionCategory,
    amount: this.amount,
    currency: this.currency,
    relatedEntity: this.relatedEntity,
    payment: {
      ...this.payment,
      paymentReference: `REVERSAL-${this.transactionId}`
    },
    paidBy: this.receivedBy,
    receivedBy: this.paidBy,
    location: this.location,
    transactionDescription: `Reversal of ${this.transactionId} - ${reason}`,
    remarks: `Original transaction reversed`,
    adjustment: {
      isAdjustment: true,
      adjustmentReason: 'reversal',
      adjustmentRemarks: reason,
      linkedOriginalTransaction: this._id
    },
    transactionDate: new Date(),
    recordedBy: {
      userId,
      userName,
      userRole: userRole.toLowerCase() // 🔥 Ensure lowercase
    }
  });

  await reversalTransaction.save();

  // Update original transaction
  this.transactionStatus = 'reversed';
  this.reversalDetails = {
    isReversed: true,
    reversedAt: new Date(),
    reversedBy: { 
      userId, 
      userName, 
      userRole: userRole.toLowerCase() // 🔥 Ensure lowercase
    },
    reversalReason: reason,
    reversalTransactionId: reversalTransaction._id
  };

  return await this.save();
};

transactionSchema.methods.approveTransaction = async function(userId, userName, userRole) {
  this.approval.approvalStatus = 'approved';
  this.approval.approvedBy = { 
    userId, 
    userName, 
    userRole: userRole.toLowerCase() // 🔥 Ensure lowercase
  };
  this.approval.approvedAt = new Date();
  return await this.save();
};

transactionSchema.methods.rejectTransaction = async function(userId, userName, userRole, reason) {
  this.approval.approvalStatus = 'rejected';
  this.approval.approvedBy = { 
    userId, 
    userName, 
    userRole: userRole.toLowerCase() // 🔥 Ensure lowercase
  };
  this.approval.approvedAt = new Date();
  this.approval.rejectionReason = reason;
  this.transactionStatus = 'cancelled';
  return await this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);