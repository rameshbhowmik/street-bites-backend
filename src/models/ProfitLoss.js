// backend/src/models/ProfitLoss.js (Role Fixed)

const mongoose = require('mongoose');

/**
 * Profit/Loss Schema - লাভ/ক্ষতি হিসাব স্কিমা
 * দৈনিক/মাসিক/বার্ষিক লাভ-ক্ষতি ট্র্যাকিং
 * ✅ Fixed: userRole case-sensitivity issues
 */
const profitLossSchema = new mongoose.Schema({
  // ============ সময়কাল তথ্য ============
  periodType: {
    type: String,
    required: [true, 'সময়কাল টাইপ আবশ্যক'],
    enum: {
      values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      message: '{VALUE} সঠিক সময়কাল টাইপ নয়'
    }
  },

  periodStartDate: {
    type: Date,
    required: [true, 'শুরুর তারিখ আবশ্যক']
  },

  periodEndDate: {
    type: Date,
    required: [true, 'শেষের তারিখ আবশ্যক']
  },

  reportId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    // Format: PL-YYYY-MM-XXXX (e.g., PL-2026-01-0001)
    default: function() {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PL-${year}-${month}-${random}`;
    }
  },

  // ============ স্টল/লোকেশন তথ্য ============
  relatedTo: {
    type: {
      type: String,
      enum: ['all', 'stall', 'production-house'],
      default: 'all'
    },
    stallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall'
    },
    stallName: String,
    productionHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionHouse'
    }
  },

  // ============ আয় বিবরণ (Revenue) ============
  revenue: {
    // মোট বিক্রয়
    totalSales: {
      type: Number,
      default: 0,
      min: 0
    },

    // বিক্রয় breakdown
    salesBreakdown: {
      cashSales: { type: Number, default: 0 },
      onlineSales: { type: Number, default: 0 },
      cardSales: { type: Number, default: 0 },
      upiSales: { type: Number, default: 0 }
    },

    // প্রোডাক্ট ক্যাটাগরি অনুযায়ী
    categoryWiseSales: [{
      categoryName: String,
      amount: Number,
      percentage: Number
    }],

    // টপ সেলিং প্রোডাক্ট
    topSellingProducts: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      productName: String,
      quantitySold: Number,
      revenue: Number
    }],

    // অন্যান্য আয়
    otherIncome: {
      type: Number,
      default: 0
    },

    otherIncomeDetails: [{
      source: String,
      amount: Number,
      description: String
    }]
  },

  // ============ খরচ বিবরণ (Expenses) ============
  expenses: {
    // মোট খরচ
    totalExpenses: {
      type: Number,
      default: 0,
      min: 0
    },

    // খরচের breakdown
    expenseBreakdown: {
      rawMaterialCost: { type: Number, default: 0 },
      salaryExpense: { type: Number, default: 0 },
      rentExpense: { type: Number, default: 0 },
      utilitiesExpense: { type: Number, default: 0 },
      marketingExpense: { type: Number, default: 0 },
      maintenanceExpense: { type: Number, default: 0 },
      transportationExpense: { type: Number, default: 0 },
      packagingExpense: { type: Number, default: 0 },
      miscellaneousExpense: { type: Number, default: 0 }
    },

    // খরচের টাইপ অনুযায়ী শতাংশ
    expensePercentages: [{
      expenseType: String,
      amount: Number,
      percentage: Number
    }],

    // Fixed vs Variable খরচ
    fixedExpenses: { type: Number, default: 0 },
    variableExpenses: { type: Number, default: 0 }
  },

  // ============ ছাড় এবং রিফান্ড ============
  deductions: {
    totalDiscountGiven: {
      type: Number,
      default: 0,
      min: 0
    },

    discountBreakdown: [{
      discountType: String, // promotional, loyalty, bulk, etc.
      amount: Number,
      ordersCount: Number
    }],

    refundsGiven: {
      type: Number,
      default: 0,
      min: 0
    },

    refundDetails: [{
      reason: String,
      amount: Number,
      count: Number
    }]
  },

  // ============ ট্যাক্স তথ্য ============
  taxDetails: {
    totalTaxCollected: {
      type: Number,
      default: 0,
      min: 0
    },

    taxBreakdown: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      otherTax: { type: Number, default: 0 }
    },

    taxPayable: {
      type: Number,
      default: 0
    },

    taxPaidStatus: {
      type: String,
      enum: ['not-paid', 'partially-paid', 'fully-paid'],
      default: 'not-paid'
    },

    taxPaidAmount: {
      type: Number,
      default: 0
    },

    taxPaymentDate: Date,

    taxRemarks: String
  },

  // ============ লাভ-ক্ষতি হিসাব ============
  profitLoss: {
    // মোট আয় (Revenue - Discounts)
    grossRevenue: {
      type: Number,
      default: 0
    },

    // মোট খরচ
    totalCost: {
      type: Number,
      default: 0
    },

    // Gross Profit (Revenue - Cost)
    grossProfit: {
      type: Number,
      default: 0
    },

    // Operating Expenses
    operatingExpenses: {
      type: Number,
      default: 0
    },

    // Net Profit/Loss (Gross Profit - Operating Expenses - Tax)
    netProfitLoss: {
      type: Number,
      default: 0
    },

    // Profit Margin শতাংশ
    profitMarginPercentage: {
      type: Number,
      default: 0
    },

    // Status
    status: {
      type: String,
      enum: ['profit', 'loss', 'breakeven'],
      default: 'breakeven'
    }
  },

  // ============ মালিক এবং বিনিয়োগকারীর শেয়ার ============
  profitDistribution: {
    // মালিকের শেয়ার
    ownerShare: {
      percentage: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
      },
      amount: {
        type: Number,
        default: 0
      }
    },

    // বিনিয়োগকারীদের শেয়ার breakdown
    investorShares: [{
      investorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investor'
      },
      investorName: String,
      sharePercentage: Number,
      shareAmount: Number,
      investmentAmount: Number,
      roiPercentage: Number
    }],

    // মোট বিনিয়োগকারী শেয়ার
    totalInvestorShare: {
      type: Number,
      default: 0
    },

    // রিটেইন করা লাভ (ব্যবসায় পুনর্বিনিয়োগ)
    retainedEarnings: {
      type: Number,
      default: 0
    }
  },

  // ============ অতিরিক্ত মেট্রিক্স ============
  metrics: {
    // মোট অর্ডার
    totalOrders: {
      type: Number,
      default: 0
    },

    // Average Order Value
    avgOrderValue: {
      type: Number,
      default: 0
    },

    // Total Customers
    totalCustomers: {
      type: Number,
      default: 0
    },

    // New Customers
    newCustomers: {
      type: Number,
      default: 0
    },

    // Return Rate
    returnRate: {
      type: Number,
      default: 0
    },

    // Wastage Percentage
    wastagePercentage: {
      type: Number,
      default: 0
    },

    // Cost of Goods Sold (COGS)
    cogs: {
      type: Number,
      default: 0
    }
  },

  // ============ তুলনামূলক বিশ্লেষণ ============
  comparison: {
    previousPeriod: {
      revenue: Number,
      expenses: Number,
      profit: Number,
      growthPercentage: Number
    },

    samePeriodLastYear: {
      revenue: Number,
      expenses: Number,
      profit: Number,
      growthPercentage: Number
    }
  },

  // ============ রিপোর্ট স্ট্যাটাস ============
  reportStatus: {
    type: String,
    enum: {
      values: ['draft', 'finalized', 'approved', 'published'],
      message: '{VALUE} সঠিক স্ট্যাটাস নয়'
    },
    default: 'draft'
  },

  // ============ জেনারেশন তথ্য ============
  generatedBy: {
    type: {
      type: String,
      enum: ['system', 'manual'],
      default: 'system'
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    // ✅ FIXED: Added proper role validation with case-insensitive support
    userRole: {
      type: String,
      enum: ['owner', 'manager', 'Owner', 'Manager'],
      set: val => val ? val.toLowerCase() : val
    }
  },

  generatedDate: {
    type: Date,
    default: Date.now
  },

  // ============ অনুমোদন তথ্য ============
  approvalDetails: {
    isApproved: {
      type: Boolean,
      default: false
    },

    approvedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      // ✅ FIXED: Added proper role validation with case-insensitive support
      userRole: {
        type: String,
        enum: ['owner', 'manager', 'Owner', 'Manager'],
        set: val => val ? val.toLowerCase() : val
      }
    },

    approvalDate: Date,

    approverComments: String
  },

  // ============ নোটস ============
  notes: [{
    note: String,
    noteType: {
      type: String,
      enum: ['general', 'important', 'warning', 'observation']
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

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============
profitLossSchema.index({ reportId: 1 });
profitLossSchema.index({ periodType: 1, periodStartDate: -1 });
profitLossSchema.index({ 'relatedTo.stallId': 1, periodStartDate: -1 });
profitLossSchema.index({ periodStartDate: -1, periodEndDate: -1 });
profitLossSchema.index({ reportStatus: 1, isActive: 1 });

// ============ VIRTUAL FIELDS ============

// মোট আয় (Net Revenue)
profitLossSchema.virtual('netRevenue').get(function() {
  return this.revenue.totalSales - this.deductions.totalDiscountGiven - this.deductions.refundsGiven;
});

// Break-even Point
profitLossSchema.virtual('breakEvenPoint').get(function() {
  if (this.expenses.variableExpenses === 0) return 0;
  return this.expenses.fixedExpenses /
    (1 - (this.expenses.variableExpenses / this.revenue.totalSales));
});

// Return on Investment (ROI)
profitLossSchema.virtual('roi').get(function() {
  const totalInvestment = this.profitDistribution.investorShares.reduce(
    (sum, inv) => sum + (inv.investmentAmount || 0), 0
  );
  if (totalInvestment === 0) return 0;
  return ((this.profitLoss.netProfitLoss / totalInvestment) * 100).toFixed(2);
});

// সময়কাল লেবেল (বাংলায়)
profitLossSchema.virtual('periodLabel').get(function() {
  const labels = {
    daily: 'দৈনিক',
    weekly: 'সাপ্তাহিক',
    monthly: 'মাসিক',
    quarterly: 'ত্রৈমাসিক',
    yearly: 'বার্ষিক'
  };
  return labels[this.periodType] || this.periodType;
});

// ============ STATIC METHODS ============

// সর্বশেষ রিপোর্ট
profitLossSchema.statics.findLatestReports = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ periodStartDate: -1 })
    .limit(limit);
};

// সময়কাল অনুযায়ী
profitLossSchema.statics.findByPeriod = function(periodType) {
  return this.find({
    periodType,
    isActive: true
  }).sort({ periodStartDate: -1 });
};

// স্টল-ওয়াইজ
profitLossSchema.statics.findByStall = function(stallId) {
  return this.find({
    'relatedTo.stallId': stallId,
    isActive: true
  }).sort({ periodStartDate: -1 });
};

// তারিখ রেঞ্জ
profitLossSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    periodStartDate: { $gte: new Date(startDate) },
    periodEndDate: { $lte: new Date(endDate) },
    isActive: true
  }).sort({ periodStartDate: -1 });
};

// সবচেয়ে লাভজনক সময়কাল
profitLossSchema.statics.findMostProfitable = function(limit = 5) {
  return this.find({
    'profitLoss.status': 'profit',
    reportStatus: 'approved',
    isActive: true
  })
  .sort({ 'profitLoss.netProfitLoss': -1 })
  .limit(limit);
};

// ক্ষতির সময়কাল
profitLossSchema.statics.findLossPeriods = function() {
  return this.find({
    'profitLoss.status': 'loss',
    isActive: true
  }).sort({ periodStartDate: -1 });
};

// সামগ্রিক পরিসংখ্যান
profitLossSchema.statics.getOverallStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        periodStartDate: { $gte: new Date(startDate) },
        periodEndDate: { $lte: new Date(endDate) },
        reportStatus: 'approved',
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.totalSales' },
        totalExpenses: { $sum: '$expenses.totalExpenses' },
        totalProfit: { $sum: '$profitLoss.netProfitLoss' },
        avgProfitMargin: { $avg: '$profitLoss.profitMarginPercentage' },
        totalOrders: { $sum: '$metrics.totalOrders' },
        avgOrderValue: { $avg: '$metrics.avgOrderValue' },
        profitPeriods: {
          $sum: { $cond: [{ $eq: ['$profitLoss.status', 'profit'] }, 1, 0] }
        },
        lossPeriods: {
          $sum: { $cond: [{ $eq: ['$profitLoss.status', 'loss'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    avgProfitMargin: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    profitPeriods: 0,
    lossPeriods: 0
  };
};

// ============ INSTANCE METHODS ============

// সব হিসাব আপডেট করুন
profitLossSchema.methods.calculateAll = function() {
  // Gross Revenue
  this.profitLoss.grossRevenue = this.revenue.totalSales -
    this.deductions.totalDiscountGiven -
    this.deductions.refundsGiven;

  // Total Cost
  this.profitLoss.totalCost = this.expenses.totalExpenses;

  // Gross Profit
  this.profitLoss.grossProfit = this.profitLoss.grossRevenue - this.profitLoss.totalCost;

  // Net Profit/Loss
  this.profitLoss.netProfitLoss = this.profitLoss.grossProfit -
    this.taxDetails.taxPayable;

  // Profit Margin
  if (this.profitLoss.grossRevenue > 0) {
    this.profitLoss.profitMarginPercentage =
      ((this.profitLoss.netProfitLoss / this.profitLoss.grossRevenue) * 100).toFixed(2);
  }

  // Status
  if (this.profitLoss.netProfitLoss > 0) {
    this.profitLoss.status = 'profit';
  } else if (this.profitLoss.netProfitLoss < 0) {
    this.profitLoss.status = 'loss';
  } else {
    this.profitLoss.status = 'breakeven';
  }

  // Owner Share
  this.profitDistribution.ownerShare.amount =
    (this.profitLoss.netProfitLoss * this.profitDistribution.ownerShare.percentage) / 100;

  // Average Order Value
  if (this.metrics.totalOrders > 0) {
    this.metrics.avgOrderValue = this.revenue.totalSales / this.metrics.totalOrders;
  }

  return this;
};

// বিনিয়োগকারী শেয়ার যোগ করুন
profitLossSchema.methods.addInvestorShare = function(investorData) {
  const shareAmount = (this.profitLoss.netProfitLoss * investorData.sharePercentage) / 100;
  this.profitDistribution.investorShares.push({
    investorId: investorData.investorId,
    investorName: investorData.investorName,
    sharePercentage: investorData.sharePercentage,
    shareAmount: shareAmount,
    investmentAmount: investorData.investmentAmount,
    roiPercentage: investorData.investmentAmount > 0
      ? ((shareAmount / investorData.investmentAmount) * 100).toFixed(2)
      : 0
  });

  this.profitDistribution.totalInvestorShare += shareAmount;
  return this;
};

// রিপোর্ট ফাইনালাইজ করুন
profitLossSchema.methods.finalize = async function() {
  this.calculateAll();
  this.reportStatus = 'finalized';
  return await this.save();
};

// রিপোর্ট অনুমোদন করুন
profitLossSchema.methods.approve = async function(approverData) {
  this.approvalDetails.isApproved = true;
  this.approvalDetails.approvedBy = {
    userId: approverData.userId,
    userName: approverData.userName,
    userRole: approverData.userRole // Auto-normalized to lowercase by setter
  };
  this.approvalDetails.approvalDate = new Date();
  this.approvalDetails.approverComments = approverData.comments;
  this.reportStatus = 'approved';
  return await this.save();
};

// নোট যোগ করুন
profitLossSchema.methods.addNote = async function(noteData) {
  this.notes.push(noteData);
  return await this.save();
};

// ============ PRE-SAVE MIDDLEWARE ============
profitLossSchema.pre('save', function(next) {
  // Auto calculate যদি ম্যানুয়াল না হয়
  if (this.isModified('revenue') || this.isModified('expenses')) {
    this.calculateAll();
  }
  next();
});

const ProfitLoss = mongoose.model('ProfitLoss', profitLossSchema);

module.exports = ProfitLoss;