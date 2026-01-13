// backend/src/models/StallPerformance.js
const mongoose = require('mongoose');

/**
 * Stall Performance Schema
 * স্টল পারফরম্যান্স স্কিমা
 * 
 * Purpose: প্রতিটি স্টলের দৈনিক/সাপ্তাহিক/মাসিক পারফরম্যান্স ট্র্যাক করা
 * Features:
 * - দৈনিক/সাপ্তাহিক/মাসিক বিক্রয় ট্র্যাকিং
 * - অর্ডার সংখ্যা এবং রেটিং
 * - ওয়েস্টেজ ম্যানেজমেন্ট
 * - আইটেম-ওয়াইজ বিক্রয় বিশ্লেষণ
 * - কর্মচারী-ওয়াইজ পারফরম্যান্স
 * - পারফরম্যান্স স্কোর এবং রিমার্কস
 */

const stallPerformanceSchema = new mongoose.Schema({
  // ============ রেফারেন্স তথ্য ============
  stallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: [true, 'স্টল আইডি প্রয়োজন'],
    index: true // দ্রুত খোঁজার জন্য
  },

  stallName: {
    type: String,
    required: [true, 'স্টলের নাম প্রয়োজন'],
    trim: true
  },

  // ============ তারিখ এবং পিরিয়ড ============
  performanceDate: {
    type: Date,
    required: [true, 'পারফরম্যান্স তারিখ প্রয়োজন'],
    index: true
  },

  performancePeriod: {
    type: String,
    enum: {
      values: ['daily', 'weekly', 'monthly', 'yearly'],
      message: 'পিরিয়ড হতে হবে: daily, weekly, monthly, বা yearly'
    },
    required: [true, 'পারফরম্যান্স পিরিয়ড প্রয়োজন'],
    default: 'daily'
  },

  // সপ্তাহ এবং মাসের রেফারেন্স
  weekNumber: {
    type: Number,
    min: [1, 'সপ্তাহ নম্বর ১ থেকে শুরু হয়'],
    max: [53, 'সপ্তাহ নম্বর সর্বোচ্চ ৫৩']
  },

  monthNumber: {
    type: Number,
    min: [1, 'মাস নম্বর ১ থেকে শুরু হয়'],
    max: [12, 'মাস নম্বর সর্বোচ্চ ১২']
  },

  yearNumber: {
    type: Number,
    min: [2020, 'বছর ২০২০ এর পরে হতে হবে']
  },

  // ============ বিক্রয় তথ্য ============
  salesData: {
    dailySales: {
      type: Number,
      default: 0,
      min: [0, 'দৈনিক বিক্রয় ঋণাত্মক হতে পারে না']
    },
    
    weeklySales: {
      type: Number,
      default: 0,
      min: [0, 'সাপ্তাহিক বিক্রয় ঋণাত্মক হতে পারে না']
    },
    
    monthlySales: {
      type: Number,
      default: 0,
      min: [0, 'মাসিক বিক্রয় ঋণাত্মক হতে পারে না']
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'অর্ডার সংখ্যা ঋণাত্মক হতে পারে না']
    },

    cancelledOrders: {
      type: Number,
      default: 0,
      min: [0, 'বাতিল অর্ডার সংখ্যা ঋণাত্মক হতে পারে না']
    },

    // পেমেন্ট মেথড অনুযায়ী বিভাজন
    paymentBreakdown: {
      cashSales: {
        type: Number,
        default: 0
      },
      onlineSales: {
        type: Number,
        default: 0
      },
      cardSales: {
        type: Number,
        default: 0
      },
      upiSales: {
        type: Number,
        default: 0
      }
    }
  },

  // ============ কাস্টমার ফিডব্যাক ============
  customerFeedback: {
    averageRating: {
      type: Number,
      min: [0, 'রেটিং সর্বনিম্ন ০'],
      max: [5, 'রেটিং সর্বোচ্চ ৫'],
      default: 0
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'রিভিউ সংখ্যা ঋণাত্মক হতে পারে না']
    },

    // রেটিং ডিস্ট্রিবিউশন
    ratingDistribution: {
      fiveStars: { type: Number, default: 0 },
      fourStars: { type: Number, default: 0 },
      threeStars: { type: Number, default: 0 },
      twoStars: { type: Number, default: 0 },
      oneStar: { type: Number, default: 0 }
    },

    // কমন কমপ্লেইন এবং ফিডব্যাক
    commonComplaints: [{
      complaint: String,
      count: {
        type: Number,
        default: 1
      }
    }],

    feedbackNotes: [{
      note: String,
      category: {
        type: String,
        enum: ['positive', 'negative', 'suggestion']
      },
      recordedDate: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // ============ ওয়েস্টেজ ম্যানেজমেন্ট ============
  wastage: {
    totalWastageQuantity: {
      type: Number,
      default: 0,
      min: [0, 'ওয়েস্টেজ পরিমাণ ঋণাত্মক হতে পারে না']
    },

    wastageValue: {
      type: Number,
      default: 0,
      min: [0, 'ওয়েস্টেজ মূল্য ঋণাত্মক হতে পারে না']
    },

    // ওয়েস্টেজের কারণ সমূহ
    wastageReasons: [{
      reason: {
        type: String,
        enum: {
          values: [
            'expired',           // মেয়াদ শেষ
            'overproduction',    // অতিরিক্ত উৎপাদন
            'spoilage',          // নষ্ট হয়ে যাওয়া
            'preparation-error', // প্রস্তুতিতে ভুল
            'customer-return',   // কাস্টমার ফেরত
            'quality-issue',     // মানের সমস্যা
            'other'              // অন্যান্য
          ],
          message: 'সঠিক ওয়েস্টেজ কারণ নির্বাচন করুন'
        }
      },
      quantity: Number,
      value: Number,
      notes: String
    }],

    // আইটেম-ওয়াইজ ওয়েস্টেজ
    itemWiseWastage: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      quantity: Number,
      value: Number
    }]
  },

  // ============ বেস্ট/লিস্ট সেলিং আইটেম ============
  salesAnalysis: {
    // বেস্ট সেলিং আইটেম (top 10)
    bestSellingItems: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      quantitySold: Number,
      totalRevenue: Number,
      contributionPercentage: Number,
      rank: Number
    }],

    // লিস্ট সেলিং আইটেম (bottom 10)
    leastSellingItems: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      quantitySold: Number,
      totalRevenue: Number,
      contributionPercentage: Number,
      rank: Number
    }],

    // আইটেম-ওয়াইজ বিক্রয় অবদান
    itemWiseSalesContribution: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      quantitySold: Number,
      revenue: Number,
      profitMargin: Number,
      contributionPercentage: Number
    }]
  },

  // ============ কর্মচারী পারফরম্যান্স ============
  employeePerformance: {
    // কর্মচারী-ওয়াইজ বিক্রয় অবদান
    employeeWiseSales: [{
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      totalOrders: Number,
      totalSales: Number,
      averageOrderValue: Number,
      contributionPercentage: Number
    }],

    // উপস্থিতি সারাংশ
    attendanceSummary: {
      totalWorkingDays: {
        type: Number,
        default: 0
      },
      presentDays: {
        type: Number,
        default: 0
      },
      absentDays: {
        type: Number,
        default: 0
      },
      lateDays: {
        type: Number,
        default: 0
      },
      attendancePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },

    // টপ পারফর্মার
    topPerformer: {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      totalSales: Number,
      performanceScore: Number
    }
  },

  // ============ পারফরম্যান্স মেট্রিক্স ============
  performanceMetrics: {
    // পারফরম্যান্স রেটিং
    overallRating: {
      type: Number,
      min: [0, 'রেটিং সর্বনিম্ন ০'],
      max: [10, 'রেটিং সর্বোচ্চ ১০'],
      default: 0
    },

    // পারফরম্যান্স স্কোর (0-100)
    performanceScore: {
      type: Number,
      min: [0, 'স্কোর সর্বনিম্ন ০'],
      max: [100, 'স্কোর সর্বোচ্চ ১০০'],
      default: 0
    },

    // টার্গেট অর্জন
    targetAchievement: {
      dailyTargetAchieved: {
        type: Boolean,
        default: false
      },
      weeklyTargetAchieved: {
        type: Boolean,
        default: false
      },
      monthlyTargetAchieved: {
        type: Boolean,
        default: false
      },
      achievementPercentage: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    // কর্মদক্ষতা সূচক
    efficiencyIndicators: {
      averageOrderValue: Number,        // গড় অর্ডার মূল্য
      orderFulfillmentRate: Number,     // অর্ডার পূরণের হার (%)
      customerSatisfactionScore: Number, // কাস্টমার সন্তুষ্টি স্কোর
      wastagePercentage: Number,        // ওয়েস্টেজ শতাংশ
      profitMargin: Number              // প্রফিট মার্জিন (%)
    }
  },

  // ============ রিমার্কস এবং নোটস ============
  performanceRemarks: {
    type: String,
    maxlength: [1000, 'রিমার্কস সর্বোচ্চ ১০০০ অক্ষর হতে পারে']
  },

  improvementNotes: [{
    note: String,
    category: {
      type: String,
      enum: ['sales', 'customer-service', 'hygiene', 'efficiency', 'other']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],

  actionItems: [{
    action: {
      type: String,
      required: [true, 'অ্যাকশন আইটেম প্রয়োজন']
    },
    assignedTo: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    completedDate: Date,
    notes: String
  }],

  // ============ স্ট্যাটাস এবং মেটাডাটা ============
  reportStatus: {
    type: String,
    enum: {
      values: ['draft', 'submitted', 'reviewed', 'approved', 'archived'],
      message: 'স্ট্যাটাস হতে হবে: draft, submitted, reviewed, approved, বা archived'
    },
    default: 'draft'
  },

  // রিপোর্ট তৈরি এবং রিভিউ
  reportedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    userRole: String
  },

  reviewedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userRole: String,
    reviewDate: Date,
    reviewComments: String
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // createdAt এবং updatedAt অটোমেটিক যুক্ত হবে
  versionKey: false
});

// ============ INDEXES ============
// দ্রুত সার্চের জন্য compound index
stallPerformanceSchema.index({ stallId: 1, performanceDate: -1 });
stallPerformanceSchema.index({ stallId: 1, performancePeriod: 1, performanceDate: -1 });
stallPerformanceSchema.index({ performanceDate: -1 });
stallPerformanceSchema.index({ 'performanceMetrics.performanceScore': -1 });

// ============ VIRTUAL FIELDS ============
// ওয়েস্টেজ পার্সেন্টেজ
stallPerformanceSchema.virtual('wastagePercentage').get(function() {
  if (this.salesData.dailySales === 0) return 0;
  return ((this.wastage.wastageValue / this.salesData.dailySales) * 100).toFixed(2);
});

// প্রফিট মার্জিন পার্সেন্টেজ
stallPerformanceSchema.virtual('profitMarginPercentage').get(function() {
  if (this.salesData.dailySales === 0) return 0;
  const profit = this.salesData.dailySales - this.wastage.wastageValue;
  return ((profit / this.salesData.dailySales) * 100).toFixed(2);
});

// অর্ডার সাকসেস রেট
stallPerformanceSchema.virtual('orderSuccessRate').get(function() {
  const totalOrders = this.salesData.totalOrders;
  if (totalOrders === 0) return 0;
  const successfulOrders = totalOrders - this.salesData.cancelledOrders;
  return ((successfulOrders / totalOrders) * 100).toFixed(2);
});

// পারফরম্যান্স গ্রেড
stallPerformanceSchema.virtual('performanceGrade').get(function() {
  const score = this.performanceMetrics.performanceScore;
  if (score >= 90) return 'A+ (অসাধারণ)';
  if (score >= 80) return 'A (চমৎকার)';
  if (score >= 70) return 'B (ভালো)';
  if (score >= 60) return 'C (গড়)';
  if (score >= 50) return 'D (উন্নতি প্রয়োজন)';
  return 'F (দুর্বল)';
});

// ============ STATIC METHODS ============
// স্টল-ওয়াইজ পারফরম্যান্স খুঁজুন
stallPerformanceSchema.statics.findByStall = function(stallId, period = 'daily', limit = 30) {
  return this.find({ 
    stallId, 
    performancePeriod: period,
    isActive: true 
  })
  .sort({ performanceDate: -1 })
  .limit(limit);
};

// তারিখ রেঞ্জ অনুযায়ী পারফরম্যান্স
stallPerformanceSchema.statics.findByDateRange = function(stallId, startDate, endDate) {
  return this.find({
    stallId,
    performanceDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    isActive: true
  }).sort({ performanceDate: -1 });
};

// টপ পারফর্মিং স্টল খুঁজুন
stallPerformanceSchema.statics.findTopPerformingStalls = function(period = 'monthly', limit = 10) {
  return this.find({ 
    performancePeriod: period,
    isActive: true 
  })
  .sort({ 'performanceMetrics.performanceScore': -1 })
  .limit(limit)
  .select('stallId stallName performanceMetrics salesData customerFeedback');
};

// লো পারফর্মিং স্টল খুঁজুন
stallPerformanceSchema.statics.findLowPerformingStalls = function(period = 'monthly', limit = 10) {
  return this.find({ 
    performancePeriod: period,
    isActive: true,
    'performanceMetrics.performanceScore': { $lt: 60 }
  })
  .sort({ 'performanceMetrics.performanceScore': 1 })
  .limit(limit)
  .select('stallId stallName performanceMetrics salesData wastage');
};

// হাই ওয়েস্টেজ স্টল খুঁজুন
stallPerformanceSchema.statics.findHighWastageStalls = function(threshold = 10, limit = 10) {
  return this.aggregate([
    {
      $addFields: {
        wastagePercentage: {
          $cond: [
            { $eq: ['$salesData.dailySales', 0] },
            0,
            { $multiply: [
              { $divide: ['$wastage.wastageValue', '$salesData.dailySales'] },
              100
            ]}
          ]
        }
      }
    },
    {
      $match: {
        wastagePercentage: { $gte: threshold },
        isActive: true
      }
    },
    {
      $sort: { wastagePercentage: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// ============ INSTANCE METHODS ============
// পারফরম্যান্স স্কোর ক্যালকুলেট করুন
stallPerformanceSchema.methods.calculatePerformanceScore = function() {
  let score = 0;
  
  // বিক্রয় টার্গেট অর্জন (40%)
  if (this.performanceMetrics.targetAchievement.achievementPercentage) {
    score += (this.performanceMetrics.targetAchievement.achievementPercentage * 0.4);
  }
  
  // কাস্টমার রেটিং (30%)
  if (this.customerFeedback.averageRating) {
    score += ((this.customerFeedback.averageRating / 5) * 30);
  }
  
  // ওয়েস্টেজ কন্ট্রোল (20%) - কম ওয়েস্টেজ = বেশি স্কোর
  const wastagePercent = parseFloat(this.wastagePercentage) || 0;
  score += Math.max(0, 20 - wastagePercent);
  
  // অর্ডার সাকসেস রেট (10%)
  const successRate = parseFloat(this.orderSuccessRate) || 0;
  score += (successRate * 0.1);
  
  this.performanceMetrics.performanceScore = Math.min(100, Math.max(0, score));
  return this.performanceMetrics.performanceScore;
};

// বেস্ট সেলিং আইটেম যোগ করুন
stallPerformanceSchema.methods.updateBestSellingItems = function(items) {
  // items হল একটি array of {productId, productName, quantitySold, totalRevenue}
  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
  
  this.salesAnalysis.bestSellingItems = items
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      contributionPercentage: ((item.totalRevenue / totalRevenue) * 100).toFixed(2),
      rank: index + 1
    }));
};

// কমপ্লেইন যোগ করুন
stallPerformanceSchema.methods.addComplaint = function(complaint) {
  const existing = this.customerFeedback.commonComplaints.find(
    c => c.complaint.toLowerCase() === complaint.toLowerCase()
  );
  
  if (existing) {
    existing.count += 1;
  } else {
    this.customerFeedback.commonComplaints.push({
      complaint,
      count: 1
    });
  }
  
  return this.save();
};

// অ্যাকশন আইটেম যোগ করুন
stallPerformanceSchema.methods.addActionItem = function(actionData) {
  this.actionItems.push(actionData);
  return this.save();
};

// রিপোর্ট সাবমিট করুন
stallPerformanceSchema.methods.submitReport = function() {
  this.reportStatus = 'submitted';
  return this.save();
};

// ============ PRE-SAVE MIDDLEWARE ============
stallPerformanceSchema.pre('save', function(next) {
  // পারফরম্যান্স স্কোর অটো ক্যালকুলেট
  if (this.isModified('salesData') || this.isModified('customerFeedback') || this.isModified('wastage')) {
    this.calculatePerformanceScore();
  }
  
  // সপ্তাহ, মাস, বছর নম্বর সেট করুন
  if (this.performanceDate) {
    const date = new Date(this.performanceDate);
    this.yearNumber = date.getFullYear();
    this.monthNumber = date.getMonth() + 1;
    
    // সপ্তাহ নম্বর ক্যালকুলেট (ISO 8601)
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    this.weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  next();
});

// ============ MODEL EXPORT ============
const StallPerformance = mongoose.model('StallPerformance', stallPerformanceSchema);

module.exports = StallPerformance;