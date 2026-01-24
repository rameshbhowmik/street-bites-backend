// backend/src/models/Stall.js - FIXED VERSION

const mongoose = require('mongoose');

/**
 * Stall Schema - স্টল স্কিমা
 * স্টল ম্যানেজমেন্ট, লোকেশন ট্র্যাকিং এবং পারফরমেন্স মনিটরিং
 */

// Employee Assignment সাব-স্কিমা - কর্মচারী নিয়োগ সাব-স্কিমা
const employeeAssignmentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    // 🔥 FIXED: Lowercase enum values
    enum: ['manager', 'employee', 'helper'],
    required: true,
    lowercase: true  // 🔥 Automatically convert to lowercase
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Operating Hours সাব-স্কিমা - পরিচালনার সময় সাব-স্কিমা
const operatingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openingTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'সঠিক সময় ফরম্যাট ব্যবহার করুন (HH:MM)'
    }
  },
  closingTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'সঠিক সময় ফরম্যাট ব্যবহার করুন (HH:MM)'
    }
  }
}, { _id: false });

// Sales Summary সাব-স্কিমা - বিক্রয় সারাংশ সাব-স্কিমা
const salesSummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSales: {
    type: Number,
    default: 0,
    min: 0
  },
  cashSales: {
    type: Number,
    default: 0,
    min: 0
  },
  onlineSales: {
    type: Number,
    default: 0,
    min: 0
  },
  expenses: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Inspection Record সাব-স্কিমা - পরিদর্শন রেকর্ড সাব-স্কিমা
const inspectionRecordSchema = new mongoose.Schema({
  inspectionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  inspectedBy: {
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
  hygieneRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  serviceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500
  },
  issues: [{
    type: String,
    trim: true
  }],
  recommendations: [{
    type: String,
    trim: true
  }]
}, { _id: false });

// Main Stall Schema - মূল স্টল স্কিমা
const stallSchema = new mongoose.Schema({
  // মূল তথ্য - Basic Information
  stallName: {
    type: String,
    required: [true, 'স্টলের নাম প্রয়োজন'],
    trim: true,
    maxlength: [100, 'নাম সর্বোচ্চ 100 অক্ষরের হতে পারে'],
    index: true
  },
  stallCode: {
    type: String,
    required: [true, 'স্টল কোড প্রয়োজন'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^STL-\d{4}$/, 'স্টল কোড STL-XXXX ফরম্যাটে হতে হবে'],
    index: true
  },
  stallType: {
    type: String,
    required: true,
    enum: {
      values: ['permanent', 'temporary', 'mobile', 'kiosk'],
      message: '{VALUE} একটি বৈধ স্টল টাইপ নয়'
    },
    default: 'permanent'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'বর্ণনা সর্বোচ্চ 500 অক্ষরের হতে পারে']
  },

  // ঠিকানা - Address Information
  address: {
    fullAddress: {
      type: String,
      required: [true, 'সম্পূর্ণ ঠিকানা প্রয়োজন'],
      trim: true
    },
    area: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    locality: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true,
      default: 'Balurghat'
    },
    pinCode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'সঠিক পিনকোড দিন (6 digits)'
      }
    },
    geoLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },

  // মালিক ও ম্যানেজার - Owner & Manager
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'মালিক ID প্রয়োজন'],
    index: true
  },
  assignedManager: {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    managerName: String,
    managerContact: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন (10 digits, 6-9 দিয়ে শুরু)'
      }
    },
    assignedDate: Date
  },

  // কর্মচারী তালিকা - Employee List
  employees: [employeeAssignmentSchema],

  // Production House সংযোগ - Production House Link
  linkedProductionHouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionHouse',
    required: [true, 'Production House লিঙ্ক প্রয়োজন'],
    index: true
  },

  // পরিচালনার সময় - Operating Hours
  operatingHours: [operatingHoursSchema],
  defaultOpeningTime: {
    type: String,
    default: '09:00'
  },
  defaultClosingTime: {
    type: String,
    default: '21:00'
  },

  // স্ট্যাটাস - Status
  currentStatus: {
    type: String,
    enum: ['open', 'closed', 'maintenance', 'temporarily-closed'],
    default: 'closed',
    index: true
  },

  // স্টক তথ্য - Stock Information
  stockReference: {
    lastRefillDate: Date,
    nextRefillScheduled: Date,
    minStockAlertLevel: {
      type: Number,
      default: 20
    }
  },

  // বিক্রয় তথ্য - Sales Information
  salesSummary: {
    daily: salesSummarySchema,
    monthly: {
      totalOrders: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 }
    },
    yearly: {
      totalOrders: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 }
    }
  },

  // আর্থিক তথ্য - Financial Information
  financial: {
    cashHandlingLimit: {
      type: Number,
      default: 10000,
      min: 0
    },
    onlinePaymentEnabled: {
      type: Boolean,
      default: true
    },
    expenseTrackingEnabled: {
      type: Boolean,
      default: true
    }
  },

  // মান ও পরিদর্শন - Quality & Inspection
  qualityMetrics: {
    currentHygieneRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    lastInspectionDate: Date,
    inspectionHistory: [inspectionRecordSchema]
  },

  // অ্যালার্ট সেটিংস - Alert Settings
  alerts: {
    lowStockAlert: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    lowSalesAlert: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 1000
      }
    },
    employeeAbsenceAlert: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
  },

  // পারফরমেন্স মেট্রিক্স - Performance Metrics
  performance: {
    customerRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalCustomers: {
      type: Number,
      default: 0
    },
    repeatCustomerRate: {
      type: Number,
      default: 0
    }
  },

  // অ্যাক্টিভ স্ট্যাটাস - Active Status
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
stallSchema.index({ 'address.city': 1, 'address.area': 1 });
stallSchema.index({ currentStatus: 1, isActive: 1 });
stallSchema.index({ ownerId: 1, isActive: 1 });
stallSchema.index({ stallName: 'text', 'address.area': 'text' });

// Virtual Field - মোট কর্মচারী
stallSchema.virtual('totalEmployees').get(function() {
  if (!this.employees) return 0;
  return this.employees.filter(emp => emp.isActive).length;
});

// Virtual Field - আজকের বিক্রয়
stallSchema.virtual('todaySales').get(function() {
  if (!this.salesSummary || !this.salesSummary.daily) return 0;
  const today = new Date().toDateString();
  const dailyDate = this.salesSummary.daily.date ? new Date(this.salesSummary.daily.date).toDateString() : null;
  return dailyDate === today ? this.salesSummary.daily.totalSales : 0;
});

// Virtual Field - স্টল স্ট্যাটাস টেক্সট (বাংলা)
stallSchema.virtual('statusText').get(function() {
  const statusMap = {
    'open': 'খোলা',
    'closed': 'বন্ধ',
    'maintenance': 'রক্ষণাবেক্ষণ',
    'temporarily-closed': 'সাময়িক বন্ধ'
  };
  return statusMap[this.currentStatus] || 'অজানা';
});

// Pre-save Middleware - Default Operating Hours তৈরি করুন
stallSchema.pre('save', function(next) {
  // যদি operating hours না থাকে তাহলে default তৈরি করুন
  if (!this.operatingHours || this.operatingHours.length === 0) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.operatingHours = days.map(day => ({
      day,
      isOpen: true,
      openingTime: this.defaultOpeningTime,
      closingTime: this.defaultClosingTime
    }));
  }

  // Monthly average order value ক্যালকুলেশন
  if (this.salesSummary && this.salesSummary.monthly) {
    const monthlyOrders = this.salesSummary.monthly.totalOrders;
    const monthlySales = this.salesSummary.monthly.totalSales;
    this.salesSummary.monthly.averageOrderValue = monthlyOrders > 0
      ? Math.round(monthlySales / monthlyOrders)
      : 0;
  }

  next();
});

// Static Method - এরিয়া অনুযায়ী স্টল খুঁজুন
stallSchema.statics.findByArea = function(area) {
  return this.find({
    'address.area': area,
    isActive: true
  });
};

// Static Method - ওপেন স্টল খুঁজুন
stallSchema.statics.findOpenStalls = function() {
  return this.find({
    currentStatus: 'open',
    isActive: true
  });
};

// Static Method - নিকটবর্তী স্টল খুঁজুন (Geo-location)
stallSchema.statics.findNearby = function(latitude, longitude, maxDistance = 10) {
  return this.find({
    isActive: true,
    'address.geoLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // km to meters
      }
    }
  });
};

// Instance Method - স্টল খুলুন
stallSchema.methods.openStall = function() {
  this.currentStatus = 'open';
  return this.save();
};

// Instance Method - স্টল বন্ধ করুন
stallSchema.methods.closeStall = function() {
  this.currentStatus = 'closed';
  return this.save();
};

// Instance Method - কর্মচারী যোগ করুন
stallSchema.methods.addEmployee = function(employeeData) {
  this.employees.push({
    ...employeeData,
    assignedDate: new Date(),
    isActive: true
  });
  return this.save();
};

// Instance Method - কর্মচারী অপসারণ করুন
stallSchema.methods.removeEmployee = function(employeeId) {
  const employee = this.employees.find(emp =>
    emp.employeeId.toString() === employeeId.toString()
  );
  if (employee) {
    employee.isActive = false;
  }
  return this.save();
};

// Instance Method - দৈনিক বিক্রয় আপডেট করুন
stallSchema.methods.updateDailySales = function(salesData) {
  this.salesSummary.daily = {
    ...salesData,
    date: new Date()
  };

  // Monthly এবং Yearly তে যোগ করুন
  if (!this.salesSummary.monthly) {
    this.salesSummary.monthly = { totalOrders: 0, totalSales: 0 };
  }
  if (!this.salesSummary.yearly) {
    this.salesSummary.yearly = { totalOrders: 0, totalSales: 0 };
  }

  this.salesSummary.monthly.totalOrders += salesData.totalOrders || 0;
  this.salesSummary.monthly.totalSales += salesData.totalSales || 0;
  this.salesSummary.yearly.totalOrders += salesData.totalOrders || 0;
  this.salesSummary.yearly.totalSales += salesData.totalSales || 0;

  return this.save();
};

// Instance Method - পরিদর্শন রেকর্ড যোগ করুন
stallSchema.methods.addInspection = function(inspectionData) {
  this.qualityMetrics.inspectionHistory.push({
    ...inspectionData,
    inspectionDate: new Date()
  });
  this.qualityMetrics.currentHygieneRating = inspectionData.hygieneRating;
  this.qualityMetrics.lastInspectionDate = new Date();
  return this.save();
};

const Stall = mongoose.model('Stall', stallSchema);

module.exports = Stall;