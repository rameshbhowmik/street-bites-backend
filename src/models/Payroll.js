// backend/src/models/Payroll.js

const mongoose = require('mongoose');

/**
 * Payroll Schema - বেতন স্কিমা
 * কর্মচারীদের বেতন ব্যবস্থাপনা
 */
const payrollSchema = new mongoose.Schema({
  // ============ পেরোল আইডি ============
  payrollId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    // Format: PAY-YYYY-MM-XXXX (e.g., PAY-2026-01-0001)
    default: function() {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PAY-${year}-${month}-${random}`;
    }
  },

  // ============ কর্মচারী তথ্য ============
  employeeInfo: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'কর্মচারী আইডি আবশ্যক']
    },

    employeeName: {
      type: String,
      required: [true, 'কর্মচারীর নাম আবশ্যক'],
      trim: true
    },

    employeeCode: {
      type: String,
      uppercase: true,
      trim: true
    },

    designation: {
      type: String,
      required: [true, 'পদবী আবশ্যক'],
      trim: true
    },

    role: {
      type: String,
      enum: ['manager', 'employee', 'delivery-person', 'chef', 'helper'],
      required: true
    },

    department: {
      type: String,
      enum: ['production', 'sales', 'delivery', 'admin', 'kitchen'],
      default: 'sales'
    },

    joiningDate: Date,

    // স্টল/Production House লিংক
    assignedTo: {
      stallId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stall'
      },
      stallName: String,
      productionHouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionHouse'
      }
    }
  },

  // ============ বেতন সময়কাল ============
  salaryPeriod: {
    periodType: {
      type: String,
      enum: {
        values: ['monthly', 'weekly', 'daily', 'hourly'],
        message: '{VALUE} সঠিক সময়কাল টাইপ নয়'
      },
      required: true,
      default: 'monthly'
    },

    startDate: {
      type: Date,
      required: [true, 'শুরুর তারিখ আবশ্যক']
    },

    endDate: {
      type: Date,
      required: [true, 'শেষের তারিখ আবশ্যক']
    },

    monthYear: {
      type: String, // Format: "January 2026"
      required: true
    }
  },

  // ============ বেতন বিবরণ ============
  salaryDetails: {
    // মূল বেতন
    baseSalary: {
      type: Number,
      required: [true, 'মূল বেতন আবশ্যক'],
      min: [0, 'বেতন ০ বা তার বেশি হতে হবে']
    },

    // ভাতা (Allowances)
    allowances: {
      houseRent: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      foodAllowance: { type: Number, default: 0 },
      mobileAllowance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },

    // মোট ভাতা
    totalAllowances: {
      type: Number,
      default: 0
    },

    // Gross Salary (মূল বেতন + ভাতা)
    grossSalary: {
      type: Number,
      default: 0
    }
  },

  // ============ উপস্থিতি তথ্য ============
  attendance: {
    totalWorkingDays: {
      type: Number,
      required: [true, 'মোট কর্মদিবস আবশ্যক'],
      min: 0
    },

    presentDays: {
      type: Number,
      required: [true, 'উপস্থিতির দিন আবশ্যক'],
      min: 0
    },

    absentDays: {
      type: Number,
      default: 0,
      min: 0
    },

    leaveDays: {
      paidLeave: { type: Number, default: 0 },
      unpaidLeave: { type: Number, default: 0 },
      sickLeave: { type: Number, default: 0 },
      casualLeave: { type: Number, default: 0 }
    },

    totalLeaveDays: {
      type: Number,
      default: 0
    },

    holidays: {
      type: Number,
      default: 0
    },

    // Attendance শতাংশ
    attendancePercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },

  // ============ ওভারটাইম ============
  overtime: {
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0
    },

    overtimeRate: {
      type: Number,
      default: 0,
      min: 0
    },

    overtimeAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    weekendWorkDays: {
      type: Number,
      default: 0
    },

    weekendWorkAmount: {
      type: Number,
      default: 0
    }
  },

  // ============ কর্তন (Deductions) ============
  deductions: {
    // ছুটির জন্য কর্তন
    leaveDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    // জরিমানা
    fineAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    fineReasons: [{
      reason: String,
      amount: Number,
      date: Date
    }],

    // অগ্রিম বেতন
    advanceDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    advanceDetails: [{
      advanceAmount: Number,
      advanceDate: Date,
      deductionAmount: Number,
      remainingBalance: Number
    }],

    // ঋণ কর্তন
    loanDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    loanDetails: {
      loanId: String,
      totalLoanAmount: Number,
      monthlyInstallment: Number,
      remainingBalance: Number
    },

    // Professional Tax (যদি প্রযোজ্য হয়)
    professionalTax: {
      type: Number,
      default: 0,
      min: 0
    },

    // Provident Fund (PF)
    pfDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    // ESI (Employee State Insurance)
    esiDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    // TDS (Tax Deducted at Source)
    tdsDeduction: {
      type: Number,
      default: 0,
      min: 0
    },

    // অন্যান্য কর্তন
    otherDeductions: {
      type: Number,
      default: 0,
      min: 0
    },

    otherDeductionDetails: [{
      description: String,
      amount: Number
    }],

    // মোট কর্তন
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ============ বোনাস এবং ইনসেন্টিভ ============
  bonusIncentives: {
    // পারফরম্যান্স বোনাস
    performanceBonus: {
      type: Number,
      default: 0,
      min: 0
    },

    performanceScore: {
      type: Number,
      min: 0,
      max: 100
    },

    // বিক্রয় কমিশন
    salesCommission: {
      type: Number,
      default: 0,
      min: 0
    },

    salesTarget: Number,
    salesAchieved: Number,

    // উপস্থিতি বোনাস
    attendanceBonus: {
      type: Number,
      default: 0,
      min: 0
    },

    // উৎসব বোনাস
    festivalBonus: {
      type: Number,
      default: 0,
      min: 0
    },

    festivalName: String,

    // অন্যান্য বোনাস
    otherBonus: {
      type: Number,
      default: 0,
      min: 0
    },

    bonusDetails: [{
      bonusType: String,
      amount: Number,
      reason: String
    }],

    // মোট বোনাস
    totalBonus: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ============ চূড়ান্ত বেতন হিসাব ============
  finalSalary: {
    // Net Payable = Gross + Overtime + Bonus - Deductions
    netPayableSalary: {
      type: Number,
      default: 0,
      min: 0
    },

    // রাউন্ড অফ
    roundOffAmount: {
      type: Number,
      default: 0
    },

    // ফাইনাল পেমেন্ট
    finalPayment: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ============ পেমেন্ট তথ্য ============
  paymentDetails: {
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'bank-transfer', 'upi', 'cheque'],
        message: '{VALUE} সঠিক পেমেন্ট মেথড নয়'
      },
      required: true,
      default: 'cash'
    },

    paymentDate: {
      type: Date,
      default: Date.now
    },

    paidDate: Date,

    transactionId: String,

    upiId: String,

    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String
    },

    chequeDetails: {
      chequeNumber: String,
      chequeDate: Date,
      bankName: String
    },

    paymentReferenceNumber: String,

    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
        message: '{VALUE} সঠিক পেমেন্ট স্ট্যাটাস নয়'
      },
      default: 'pending'
    }
  },

  // ============ পেস্লিপ ============
  payslip: {
    payslipUrl: String, // Cloudinary PDF link
    generatedDate: Date,
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloaded: Date
  },

  // ============ রেকর্ড স্ট্যাটাস ============
  payrollStatus: {
    type: String,
    enum: {
      values: ['draft', 'pending-approval', 'approved', 'processed', 'paid', 'cancelled'],
      message: '{VALUE} সঠিক স্ট্যাটাস নয়'
    },
    default: 'draft'
  },

  // ============ অনুমোদন তথ্য ============
  approvalDetails: {
    approvedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      userRole: String
    },

    approvalDate: Date,

    approverComments: String,

    rejectionReason: String
  },

  // ============ নোটস ============
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'রিমার্কস সর্বোচ্চ ৫০০ অক্ষরের হতে পারে']
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

  // ============ ট্র্যাকিং ============
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String
  },

  processedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String
  },

  processedDate: Date,

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
payrollSchema.index({ payrollId: 1 });
payrollSchema.index({ 'employeeInfo.employeeId': 1, 'salaryPeriod.startDate': -1 });
payrollSchema.index({ 'salaryPeriod.monthYear': 1 });
payrollSchema.index({ payrollStatus: 1, isActive: 1 });
payrollSchema.index({ 'paymentDetails.paymentStatus': 1 });
payrollSchema.index({ 'salaryPeriod.startDate': -1 });

// ============ VIRTUAL FIELDS ============

// দিন-ভিত্তিক বেতন
payrollSchema.virtual('perDaySalary').get(function() {
  if (this.attendance.totalWorkingDays === 0) return 0;
  return (this.salaryDetails.baseSalary / this.attendance.totalWorkingDays).toFixed(2);
});

// প্রকৃত কাজের দিন
payrollSchema.virtual('actualWorkingDays').get(function() {
  return this.attendance.presentDays + this.attendance.leaveDays.paidLeave;
});

// মোট আয় (Earnings)
payrollSchema.virtual('totalEarnings').get(function() {
  return this.salaryDetails.grossSalary + 
         this.overtime.overtimeAmount + 
         this.overtime.weekendWorkAmount + 
         this.bonusIncentives.totalBonus;
});

// Take Home Salary শতাংশ
payrollSchema.virtual('takeHomePercentage').get(function() {
  if (this.salaryDetails.grossSalary === 0) return 0;
  return ((this.finalSalary.netPayableSalary / this.salaryDetails.grossSalary) * 100).toFixed(2);
});

// ============ STATIC METHODS ============

// মাস অনুযায়ী সব পেরোল
payrollSchema.statics.findByMonth = function(monthYear) {
  return this.find({
    'salaryPeriod.monthYear': monthYear,
    isActive: true
  }).sort({ 'employeeInfo.employeeName': 1 });
};

// কর্মচারী-ওয়াইজ পেরোল হিস্ট্রি
payrollSchema.statics.findByEmployee = function(employeeId) {
  return this.find({
    'employeeInfo.employeeId': employeeId,
    isActive: true
  }).sort({ 'salaryPeriod.startDate': -1 });
};

// Pending পেমেন্ট
payrollSchema.statics.findPendingPayments = function() {
  return this.find({
    'paymentDetails.paymentStatus': 'pending',
    payrollStatus: 'approved',
    isActive: true
  }).sort({ 'salaryPeriod.endDate': 1 });
};

// স্টল-ওয়াইজ পেরোল
payrollSchema.statics.findByStall = function(stallId, monthYear = null) {
  const query = {
    'employeeInfo.assignedTo.stallId': stallId,
    isActive: true
  };
  
  if (monthYear) {
    query['salaryPeriod.monthYear'] = monthYear;
  }
  
  return this.find(query).sort({ 'employeeInfo.employeeName': 1 });
};

// মোট বেতন হিসাব (মাস অনুযায়ী)
payrollSchema.statics.calculateMonthlyTotal = async function(monthYear) {
  const result = await this.aggregate([
    {
      $match: {
        'salaryPeriod.monthYear': monthYear,
        payrollStatus: { $in: ['approved', 'paid'] },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalGrossSalary: { $sum: '$salaryDetails.grossSalary' },
        totalDeductions: { $sum: '$deductions.totalDeductions' },
        totalBonus: { $sum: '$bonusIncentives.totalBonus' },
        totalNetPayable: { $sum: '$finalSalary.netPayableSalary' },
        employeeCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || {
    totalGrossSalary: 0,
    totalDeductions: 0,
    totalBonus: 0,
    totalNetPayable: 0,
    employeeCount: 0
  };
};

// টপ আর্নার
payrollSchema.statics.findTopEarners = function(monthYear, limit = 10) {
  return this.find({
    'salaryPeriod.monthYear': monthYear,
    payrollStatus: { $in: ['approved', 'paid'] },
    isActive: true
  })
  .sort({ 'finalSalary.netPayableSalary': -1 })
  .limit(limit)
  .select('employeeInfo finalSalary');
};

// ============ INSTANCE METHODS ============

// সব হিসাব করুন
payrollSchema.methods.calculateAll = function() {
  // মোট ভাতা
  const allowances = this.salaryDetails.allowances;
  this.salaryDetails.totalAllowances = 
    allowances.houseRent + 
    allowances.transportation + 
    allowances.foodAllowance + 
    allowances.mobileAllowance + 
    allowances.medical + 
    allowances.special + 
    allowances.other;

  // Gross Salary
  this.salaryDetails.grossSalary = 
    this.salaryDetails.baseSalary + this.salaryDetails.totalAllowances;

  // Attendance শতাংশ
  if (this.attendance.totalWorkingDays > 0) {
    this.attendance.attendancePercentage = 
      ((this.attendance.presentDays / this.attendance.totalWorkingDays) * 100).toFixed(2);
  }

  // Absent days
  this.attendance.absentDays = 
    this.attendance.totalWorkingDays - 
    this.attendance.presentDays - 
    this.attendance.totalLeaveDays - 
    this.attendance.holidays;

  // Leave deduction (unpaid leave এর জন্য)
  const perDaySalary = this.salaryDetails.baseSalary / this.attendance.totalWorkingDays;
  this.deductions.leaveDeduction = 
    (this.attendance.leaveDays.unpaidLeave + this.attendance.absentDays) * perDaySalary;

  // মোট বোনাস
  this.bonusIncentives.totalBonus = 
    this.bonusIncentives.performanceBonus + 
    this.bonusIncentives.salesCommission + 
    this.bonusIncentives.attendanceBonus + 
    this.bonusIncentives.festivalBonus + 
    this.bonusIncentives.otherBonus;

  // ওভারটাইম
  this.overtime.overtimeAmount = this.overtime.overtimeHours * this.overtime.overtimeRate;

  // মোট কর্তন
  this.deductions.totalDeductions = 
    this.deductions.leaveDeduction + 
    this.deductions.fineAmount + 
    this.deductions.advanceDeduction + 
    this.deductions.loanDeduction + 
    this.deductions.professionalTax + 
    this.deductions.pfDeduction + 
    this.deductions.esiDeduction + 
    this.deductions.tdsDeduction + 
    this.deductions.otherDeductions;

  // Net Payable Salary
  this.finalSalary.netPayableSalary = 
    this.salaryDetails.grossSalary + 
    this.overtime.overtimeAmount + 
    this.overtime.weekendWorkAmount + 
    this.bonusIncentives.totalBonus - 
    this.deductions.totalDeductions;

  // Round off (nearest 10)
  const roundedAmount = Math.round(this.finalSalary.netPayableSalary / 10) * 10;
  this.finalSalary.roundOffAmount = roundedAmount - this.finalSalary.netPayableSalary;
  this.finalSalary.finalPayment = roundedAmount;

  return this;
};

// অনুমোদন করুন
payrollSchema.methods.approve = async function(approverData) {
  this.payrollStatus = 'approved';
  this.approvalDetails.approvedBy = {
    userId: approverData.userId,
    userName: approverData.userName,
    userRole: approverData.userRole
  };
  this.approvalDetails.approvalDate = new Date();
  this.approvalDetails.approverComments = approverData.comments;
  
  return await this.save();
};

// পেমেন্ট প্রসেস করুন
payrollSchema.methods.processPayment = async function(processorData) {
  this.paymentDetails.paymentStatus = 'processing';
  this.payrollStatus = 'processed';
  this.processedBy = {
    userId: processorData.userId,
    userName: processorData.userName,
    userRole: processorData.userRole
  };
  this.processedDate = new Date();
  
  return await this.save();
};

// পেমেন্ট সম্পন্ন
payrollSchema.methods.markAsPaid = async function() {
  this.paymentDetails.paymentStatus = 'paid';
  this.paymentDetails.paidDate = new Date();
  this.payrollStatus = 'paid';
  
  return await this.save();
};

// নোট যোগ করুন
payrollSchema.methods.addNote = async function(noteData) {
  this.internalNotes.push(noteData);
  return await this.save();
};

// ============ PRE-SAVE MIDDLEWARE ============
payrollSchema.pre('save', function(next) {
  // Auto calculate
  if (this.isModified('salaryDetails') || this.isModified('attendance')) {
    this.calculateAll();
  }
  
  // Month/Year format
  if (!this.salaryPeriod.monthYear && this.salaryPeriod.startDate) {
    const date = new Date(this.salaryPeriod.startDate);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    this.salaryPeriod.monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  
  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;