// backend/src/models/Investor.js

const mongoose = require('mongoose');

/**
 * Investor Schema - বিনিয়োগকারী স্কিমা
 * বিনিয়োগকারীদের তথ্য এবং ROI ম্যানেজমেন্ট
 */
const investorSchema = new mongoose.Schema({
  // ============ বিনিয়োগকারীর মূল তথ্য ============
  investorName: {
    type: String,
    required: [true, 'বিনিয়োগকারীর নাম আবশ্যক'],
    trim: true,
    minlength: [2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'],
    maxlength: [100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে']
  },

  investorId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    // Format: INV-YYYY-XXXX (e.g., INV-2026-0001)
    default: function() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `INV-${year}-${random}`;
    }
  },

  // ============ যোগাযোগ তথ্য ============
  contactInfo: {
    mobileNumber: {
      type: String,
      required: [true, 'মোবাইল নম্বর আবশ্যক'],
      unique: true,
      validate: {
        validator: function(v) {
          // ইন্ডিয়ান মোবাইল নম্বর: 10 digits, 6-9 দিয়ে শুরু
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন (10 digits, 6-9 দিয়ে শুরু)'
      }
    },

    email: {
      type: String,
      required: [true, 'ইমেইল আবশ্যক'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'সঠিক ইমেইল ঠিকানা দিন']
    },

    alternatePhone: {
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

  // ============ ঠিকানা ============
  address: {
    fullAddress: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: 'West Bengal' },
    pinCode: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{6}$/.test(v);
        },
        message: 'সঠিক 6 ডিজিটের পিনকোড দিন'
      }
    }
  },

  // ============ KYC তথ্য ============
  kycDetails: {
    idType: {
      type: String,
      enum: ['aadhar', 'pan', 'voter-id', 'driving-license', 'passport'],
      default: 'aadhar'
    },
    idNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    isVerified: { type: Boolean, default: false },
    verifiedDate: Date,
    verifiedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String
    }
  },

  // ============ বিনিয়োগের বিস্তারিত ============
  investmentDetails: {
    investmentAmount: {
      type: Number,
      required: [true, 'বিনিয়োগের পরিমাণ আবশ্যক'],
      min: [1000, 'ন্যূনতম বিনিয়োগ ১০০০ টাকা']
    },

    investmentDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    investmentType: {
      type: String,
      enum: {
        values: ['one-time', 'recurring'],
        message: '{VALUE} সঠিক বিনিয়োগ টাইপ নয়'
      },
      default: 'one-time'
    },

    // Recurring investment এর জন্য
    recurringDetails: {
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly'
      },
      recurringAmount: Number,
      nextDueDate: Date,
      totalRecurringCount: { type: Number, default: 0 },
      completedCount: { type: Number, default: 0 }
    },

    profitSharePercentage: {
      type: Number,
      required: [true, 'লাভের শেয়ার শতাংশ আবশ্যক'],
      min: [0.1, 'ন্যূনতম ০.১% হতে হবে'],
      max: [100, 'সর্বোচ্চ ১০০% হতে পারে'],
      default: 10
    },

    investmentStatus: {
      type: String,
      enum: {
        values: ['active', 'completed', 'cancelled', 'on-hold'],
        message: '{VALUE} সঠিক স্ট্যাটাস নয়'
      },
      default: 'active'
    },

    maturityDate: Date, // যদি fixed period investment হয়
    minimumLockPeriod: {
      type: Number, // months
      default: 12
    }
  },

  // ============ ROI তথ্য ============
  roiDetails: {
    expectedROI: {
      type: Number,
      default: 15, // percentage per year
      min: 0,
      max: 100
    },

    actualROIEarned: {
      type: Number,
      default: 0
    },

    roiCalculationBasis: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },

    profitDistributionFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },

    totalProfitPaid: {
      type: Number,
      default: 0
    },

    lastCalculationDate: Date,
    nextCalculationDate: Date
  },

  // ============ পেমেন্ট রেকর্ড ============
  payoutRecords: [{
    payoutDate: {
      type: Date,
      required: true
    },
    payoutAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMode: {
      type: String,
      enum: ['upi', 'bank-transfer', 'cash', 'cheque'],
      required: true
    },
    transactionId: String,
    upiId: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    },
    periodCovered: {
      startDate: Date,
      endDate: Date
    },
    calculationDetails: {
      baseProfitAmount: Number,
      sharePercentage: Number,
      taxDeducted: Number,
      netAmount: Number
    },
    remarks: String,
    paidBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      userRole: String
    },
    receiptUrl: String, // Cloudinary link
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    }
  }],

  // ============ দস্তাবেজ ============
  documents: [{
    documentType: {
      type: String,
      enum: ['agreement', 'kyc', 'bank-proof', 'others'],
      required: true
    },
    documentName: String,
    documentUrl: {
      type: String, // Cloudinary URL
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String
    },
    remarks: String
  }],

  // ============ Bank Details ============
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: {
      type: String,
      uppercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'সঠিক IFSC কোড দিন'
      }
    },
    bankName: String,
    branchName: String
  },

  // ============ UPI Details ============
  upiDetails: {
    upiId: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[\w.-]+@[\w.-]+$/.test(v);
        },
        message: 'সঠিক UPI ID দিন'
      }
    },
    upiProvider: {
      type: String,
      enum: ['phonepe', 'googlepay', 'paytm', 'bhim', 'others']
    }
  },

  // ============ অ্যাডমিন নোটস ============
  internalNotes: [{
    note: { type: String, required: true },
    noteType: {
      type: String,
      enum: ['general', 'warning', 'important'],
      default: 'general'
    },
    addedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],

  // ============ স্ট্যাটাস ট্র্যাকিং ============
  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String
  },

  lastPayoutDate: Date

}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============
investorSchema.index({ investorId: 1 });
investorSchema.index({ 'contactInfo.mobileNumber': 1 });
investorSchema.index({ 'contactInfo.email': 1 });
investorSchema.index({ 'investmentDetails.investmentStatus': 1, isActive: 1 });
investorSchema.index({ 'investmentDetails.investmentDate': -1 });
investorSchema.index({ 'roiDetails.nextCalculationDate': 1 });

// ============ VIRTUAL FIELDS ============

// মোট বকেয়া লাভ (Total Profit Due)
investorSchema.virtual('totalProfitDue').get(function() {
  const totalExpected = (this.investmentDetails.investmentAmount * this.roiDetails.expectedROI) / 100;
  const totalPaid = this.roiDetails.totalProfitPaid || 0;
  return Math.max(0, totalExpected - totalPaid);
});

// বিনিয়োগের মেয়াদ (Investment Duration in months)
investorSchema.virtual('investmentDuration').get(function() {
  const startDate = this.investmentDetails.investmentDate;
  const now = new Date();
  const months = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                 (now.getMonth() - startDate.getMonth());
  return Math.max(0, months);
});

// বর্তমান মূল্য (Current Investment Value)
investorSchema.virtual('currentValue').get(function() {
  return this.investmentDetails.investmentAmount + this.roiDetails.totalProfitPaid;
});

// ROI শতাংশ (Actual ROI Percentage)
investorSchema.virtual('actualROIPercentage').get(function() {
  if (this.investmentDetails.investmentAmount === 0) return 0;
  return ((this.roiDetails.totalProfitPaid / this.investmentDetails.investmentAmount) * 100).toFixed(2);
});

// ============ STATIC METHODS ============

// সক্রিয় বিনিয়োগকারীরা
investorSchema.statics.findActiveInvestors = function() {
  return this.find({
    'investmentDetails.investmentStatus': 'active',
    isActive: true
  }).sort({ 'investmentDetails.investmentDate': -1 });
};

// পেমেন্ট বকেয়া
investorSchema.statics.findPaymentsDue = function() {
  const now = new Date();
  return this.find({
    'investmentDetails.investmentStatus': 'active',
    'roiDetails.nextCalculationDate': { $lte: now },
    isActive: true
  });
};

// মোবাইল নম্বর দিয়ে খুঁজুন
investorSchema.statics.findByMobile = function(mobileNumber) {
  return this.findOne({ 'contactInfo.mobileNumber': mobileNumber });
};

// ইমেইল দিয়ে খুঁজুন
investorSchema.statics.findByEmail = function(email) {
  return this.findOne({ 'contactInfo.email': email.toLowerCase() });
};

// টপ বিনিয়োগকারী (Amount অনুযায়ী)
investorSchema.statics.findTopInvestors = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'investmentDetails.investmentAmount': -1 })
    .limit(limit);
};

// ============ INSTANCE METHODS ============

// পেআউট যোগ করুন
investorSchema.methods.addPayout = async function(payoutData) {
  this.payoutRecords.push(payoutData);
  this.roiDetails.totalProfitPaid += payoutData.payoutAmount;
  this.lastPayoutDate = payoutData.payoutDate;
  
  // পরবর্তী calculation date update
  const frequency = this.roiDetails.profitDistributionFrequency;
  const nextDate = new Date(payoutData.payoutDate);
  
  if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequency === 'quarterly') {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (frequency === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  
  this.roiDetails.nextCalculationDate = nextDate;
  
  return await this.save();
};

// দস্তাবেজ যোগ করুন
investorSchema.methods.addDocument = async function(documentData) {
  this.documents.push(documentData);
  return await this.save();
};

// নোট যোগ করুন
investorSchema.methods.addNote = async function(noteData) {
  this.internalNotes.push(noteData);
  return await this.save();
};

// ROI হিসাব করুন (Monthly basis)
investorSchema.methods.calculateROI = function(months = 1) {
  const annualROI = this.roiDetails.expectedROI;
  const monthlyROI = annualROI / 12;
  const profitAmount = (this.investmentDetails.investmentAmount * monthlyROI * months) / 100;
  const shareAmount = (profitAmount * this.investmentDetails.profitSharePercentage) / 100;
  
  return {
    totalProfit: profitAmount,
    investorShare: shareAmount,
    monthsCovered: months
  };
};

// ============ PRE-SAVE MIDDLEWARE ============
investorSchema.pre('save', function(next) {
  // প্রথম calculation date set করুন
  if (this.isNew && !this.roiDetails.nextCalculationDate) {
    const frequency = this.roiDetails.profitDistributionFrequency;
    const startDate = new Date(this.investmentDetails.investmentDate);
    
    if (frequency === 'monthly') {
      startDate.setMonth(startDate.getMonth() + 1);
    } else if (frequency === 'quarterly') {
      startDate.setMonth(startDate.getMonth() + 3);
    } else if (frequency === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() + 1);
    }
    
    this.roiDetails.nextCalculationDate = startDate;
    this.roiDetails.lastCalculationDate = this.investmentDetails.investmentDate;
  }
  
  next();
});

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;