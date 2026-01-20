// backend/src/models/Expense.js

const mongoose = require('mongoose');

/**
 * Expense Schema - খরচ স্কিমা
 * সব ধরনের খরচ ট্র্যাক এবং ম্যানেজমেন্ট
 */
const expenseSchema = new mongoose.Schema({
  // ============ খরচের মূল তথ্য ============
  expenseId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    // Format: EXP-YYYY-XXXX (e.g., EXP-2026-0001)
    default: function() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `EXP-${year}-${random}`;
    }
  },

  expenseType: {
    type: String,
    required: [true, 'খরচের ধরন আবশ্যক'],
    enum: {
      values: [
        'raw-material',      // কাঁচামাল
        'salary',            // বেতন
        'rent',              // ভাড়া
        'utilities',         // বিদ্যুৎ, পানি, গ্যাস
        'marketing',         // মার্কেটিং
        'maintenance',       // রক্ষণাবেক্ষণ
        'transportation',    // পরিবহন
        'packaging',         // প্যাকেজিং
        'license-fee',       // লাইসেন্স ফি
        'insurance',         // বীমা
        'tax',               // ট্যাক্স
        'loan-payment',      // ঋণ পরিশোধ
        'equipment',         // যন্ত্রপাতি
        'repair',            // মেরামত
        'miscellaneous'      // অন্যান্য
      ],
      message: '{VALUE} সঠিক খরচের ধরন নয়'
    }
  },

  expenseCategory: {
    type: String,
    required: [true, 'খরচের ক্যাটাগরি আবশ্যক'],
    enum: {
      values: ['fixed', 'variable'],
      message: '{VALUE} সঠিক ক্যাটাগরি নয়'
    },
    default: 'variable'
  },

  // ============ খরচের পরিমাণ ============
  expenseAmount: {
    type: Number,
    required: [true, 'খরচের পরিমাণ আবশ্যক'],
    min: [0, 'খরচ ০ বা তার বেশি হতে হবে']
  },

  expenseDate: {
    type: Date,
    required: [true, 'খরচের তারিখ আবশ্যক'],
    default: Date.now
  },

  // ============ ট্যাক্স তথ্য ============
  taxDetails: {
    taxIncluded: {
      type: Boolean,
      default: false
    },
    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          // GST format: 22AAAAA0000A1Z5
          return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(v);
        },
        message: 'সঠিক GST নম্বর দিন'
      }
    }
  },

  // ============ বিল/রসিদ ============
  billDetails: {
    billNumber: String,
    billDate: Date,
    billImageUrl: String, // Cloudinary URL
    uploadDate: Date
  },

  // ============ অনুমোদন তথ্য ============
  approvalDetails: {
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled'],
        message: '{VALUE} সঠিক স্ট্যাটাস নয়'
      },
      default: 'pending'
    },

    approvedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      userRole: String
    },

    approvalDate: Date,

    rejectionReason: String,

    approverComments: String
  },

  // ============ Recurring খরচ ============
  recurringDetails: {
    isRecurring: {
      type: Boolean,
      default: false
    },

    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },

    nextDueDate: Date,

    endDate: Date, // যদি recurring খরচের শেষ তারিখ থাকে

    autoApprove: {
      type: Boolean,
      default: false
    },

    totalOccurrences: {
      type: Number,
      default: 0
    },

    completedOccurrences: {
      type: Number,
      default: 0
    }
  },

  // ============ স্টল/বিভাগ লিংক ============
  relatedTo: {
    stallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall'
    },
    stallName: String,

    productionHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionHouse'
    },

    department: {
      type: String,
      enum: ['production', 'sales', 'delivery', 'admin', 'marketing', 'others']
    }
  },

  // ============ পরিশোধ তথ্য ============
  paymentDetails: {
    paidTo: {
      type: String,
      required: [true, 'কাকে পরিশোধ করা হয়েছে তা আবশ্যক'],
      trim: true
    },

    paidToContact: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক মোবাইল নম্বর দিন'
      }
    },

    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'card'],
      required: true,
      default: 'cash'
    },

    transactionId: String,

    chequeNumber: String,

    paymentDate: {
      type: Date,
      default: Date.now
    },

    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    }
  },

  // ============ বর্ণনা এবং নোটস ============
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'বর্ণনা সর্বোচ্চ ৫০০ অক্ষরের হতে পারে']
  },

  internalNotes: [{
    note: String,
    addedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],

  // ============ স্ট্যাটাস ============
  expenseStatus: {
    type: String,
    enum: {
      values: ['draft', 'submitted', 'approved', 'paid', 'cancelled'],
      message: '{VALUE} সঠিক স্ট্যাটাস নয়'
    },
    default: 'draft'
  },

  // ============ সাপ্লায়ার/ভেন্ডর তথ্য ============
  supplierDetails: {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierName: String,
    supplierContact: String,
    supplierGST: String
  },

  // ============ Additional Info ============
  tags: [String], // খরচ সহজে খুঁজে পেতে tags

  attachments: [{
    fileName: String,
    fileUrl: String, // Cloudinary URL
    fileType: String, // pdf, jpg, png, etc.
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // ============ ট্র্যাকিং ============
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String
  },

  lastModifiedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============
expenseSchema.index({ expenseId: 1 });
expenseSchema.index({ expenseType: 1, expenseDate: -1 });
expenseSchema.index({ 'approvalDetails.approvalStatus': 1 });
expenseSchema.index({ expenseStatus: 1, isActive: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ 'relatedTo.stallId': 1, expenseDate: -1 });
expenseSchema.index({ 'recurringDetails.isRecurring': 1, 'recurringDetails.nextDueDate': 1 });
expenseSchema.index({ tags: 1 });

// ============ VIRTUAL FIELDS ============

// খরচের মোট পরিমাণ (Tax সহ)
expenseSchema.virtual('totalAmountWithTax').get(function() {
  if (this.taxDetails.taxIncluded) {
    return this.expenseAmount;
  }
  return this.expenseAmount + (this.taxDetails.taxAmount || 0);
});

// মূল পরিমাণ (Tax ছাড়া)
expenseSchema.virtual('baseAmount').get(function() {
  if (this.taxDetails.taxIncluded && this.taxDetails.taxAmount > 0) {
    return this.expenseAmount - this.taxDetails.taxAmount;
  }
  return this.expenseAmount;
});

// খরচের বয়স (দিনে)
expenseSchema.virtual('expenseAge').get(function() {
  const now = new Date();
  const expDate = new Date(this.expenseDate);
  const diffTime = Math.abs(now - expDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// অনুমোদন প্রতীক্ষার সময় (দিনে)
expenseSchema.virtual('pendingDays').get(function() {
  if (this.approvalDetails.approvalStatus !== 'pending') return 0;
  const now = new Date();
  const createdDate = new Date(this.createdAt);
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// ============ STATIC METHODS ============

// Pending approval খরচগুলো
expenseSchema.statics.findPendingApprovals = function() {
  return this.find({
    'approvalDetails.approvalStatus': 'pending',
    isActive: true
  }).sort({ createdAt: 1 });
};

// তারিখ রেঞ্জ অনুযায়ী খরচ
expenseSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    isActive: true
  }).sort({ expenseDate: -1 });
};

// স্টল-ওয়াইজ খরচ
expenseSchema.statics.findByStall = function(stallId) {
  return this.find({
    'relatedTo.stallId': stallId,
    isActive: true
  }).sort({ expenseDate: -1 });
};

// টাইপ অনুযায়ী খরচ
expenseSchema.statics.findByType = function(expenseType) {
  return this.find({
    expenseType,
    isActive: true
  }).sort({ expenseDate: -1 });
};

// Recurring dues
expenseSchema.statics.findRecurringDues = function() {
  const now = new Date();
  return this.find({
    'recurringDetails.isRecurring': true,
    'recurringDetails.nextDueDate': { $lte: now },
    expenseStatus: { $ne: 'cancelled' },
    isActive: true
  });
};

// মোট খরচ ক্যালকুলেট করুন (date range)
expenseSchema.statics.calculateTotalExpense = async function(startDate, endDate, filters = {}) {
  const query = {
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    'approvalDetails.approvalStatus': 'approved',
    expenseStatus: 'paid',
    isActive: true,
    ...filters
  };

  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalExpense: { $sum: '$expenseAmount' },
        totalTax: { $sum: '$taxDetails.taxAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalExpense: 0, totalTax: 0, count: 0 };
};

// টাইপ-ওয়াইজ খরচ breakdown
expenseSchema.statics.getExpenseBreakdown = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        'approvalDetails.approvalStatus': 'approved',
        isActive: true
      }
    },
    {
      $group: {
        _id: '$expenseType',
        totalAmount: { $sum: '$expenseAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$expenseAmount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// ============ INSTANCE METHODS ============

// অনুমোদন করুন
expenseSchema.methods.approve = async function(approverData) {
  this.approvalDetails.approvalStatus = 'approved';
  this.approvalDetails.approvedBy = {
    userId: approverData.userId,
    userName: approverData.userName,
    userRole: approverData.userRole
  };
  this.approvalDetails.approvalDate = new Date();
  this.approvalDetails.approverComments = approverData.comments;
  this.expenseStatus = 'approved';
  
  return await this.save();
};

// প্রত্যাখ্যান করুন
expenseSchema.methods.reject = async function(approverData, reason) {
  this.approvalDetails.approvalStatus = 'rejected';
  this.approvalDetails.approvedBy = {
    userId: approverData.userId,
    userName: approverData.userName,
    userRole: approverData.userRole
  };
  this.approvalDetails.approvalDate = new Date();
  this.approvalDetails.rejectionReason = reason;
  this.expenseStatus = 'cancelled';
  
  return await this.save();
};

// পেমেন্ট সম্পন্ন চিহ্নিত করুন
expenseSchema.methods.markAsPaid = async function() {
  this.expenseStatus = 'paid';
  this.paymentDetails.paymentDate = new Date();
  
  // যদি recurring হয় তাহলে পরবর্তী due date set করুন
  if (this.recurringDetails.isRecurring) {
    const frequency = this.recurringDetails.recurringFrequency;
    const nextDate = new Date(this.recurringDetails.nextDueDate);
    
    if (frequency === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (frequency === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    this.recurringDetails.nextDueDate = nextDate;
    this.recurringDetails.completedOccurrences += 1;
  }
  
  return await this.save();
};

// নোট যোগ করুন
expenseSchema.methods.addNote = async function(noteData) {
  this.internalNotes.push(noteData);
  return await this.save();
};

// ট্যাক্স হিসাব করুন
expenseSchema.methods.calculateTax = function() {
  if (this.taxDetails.taxPercentage > 0) {
    this.taxDetails.taxAmount = (this.expenseAmount * this.taxDetails.taxPercentage) / 100;
  }
  return this.taxDetails.taxAmount;
};

// ============ PRE-SAVE MIDDLEWARE ============
expenseSchema.pre('save', function(next) {
  // ট্যাক্স অটোমেটিক হিসাব
  if (this.taxDetails.taxPercentage > 0 && !this.taxDetails.taxAmount) {
    this.taxDetails.taxAmount = (this.expenseAmount * this.taxDetails.taxPercentage) / 100;
  }
  
  // প্রথম recurring due date set
  if (this.isNew && this.recurringDetails.isRecurring && !this.recurringDetails.nextDueDate) {
    const frequency = this.recurringDetails.recurringFrequency;
    const startDate = new Date(this.expenseDate);
    
    if (frequency === 'daily') {
      startDate.setDate(startDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      startDate.setDate(startDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      startDate.setMonth(startDate.getMonth() + 1);
    } else if (frequency === 'quarterly') {
      startDate.setMonth(startDate.getMonth() + 3);
    } else if (frequency === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() + 1);
    }
    
    this.recurringDetails.nextDueDate = startDate;
  }
  
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;