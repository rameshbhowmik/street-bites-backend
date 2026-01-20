// backend/src/controllers/payrollController.js

const Payroll = require('../models/Payroll');

/**
 * পেরোল Controller
 * সব CRUD operations এবং বেতন ম্যানেজমেন্ট
 */

// @desc    নতুন পেরোল তৈরি করুন
// @route   POST /api/payroll
// @access  Private (Manager, Owner)
exports.createPayroll = async (req, res) => {
  try {
    const payrollData = {
      ...req.body,
      createdBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    };

    const payroll = await Payroll.create(payrollData);

    res.status(201).json({
      success: true,
      message: 'পেরোল সফলভাবে তৈরি হয়েছে',
      data: payroll
    });
  } catch (error) {
    console.error('Payroll creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'পেরোল তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সব পেরোল দেখুন (Pagination সহ)
// @route   GET /api/payroll
// @access  Private
exports.getAllPayroll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filters = { isActive: true };
    
    if (req.query.status) {
      filters.payrollStatus = req.query.status;
    }
    
    if (req.query.monthYear) {
      filters['salaryPeriod.monthYear'] = req.query.monthYear;
    }
    
    if (req.query.employeeId) {
      filters['employeeInfo.employeeId'] = req.query.employeeId;
    }

    const payrolls = await Payroll.find(filters)
      .sort({ 'salaryPeriod.startDate': -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Payroll.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payrolls
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'পেরোল তথ্য পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    নির্দিষ্ট পেরোল দেখুন
// @route   GET /api/payroll/:id
// @access  Private
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'পেরোল পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'পেরোল পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেরোল আপডেট করুন
// @route   PUT /api/payroll/:id
// @access  Private (Manager, Owner)
exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'পেরোল পাওয়া যায়নি'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        payroll[key] = req.body[key];
      }
    });

    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'পেরোল সফলভাবে আপডেট হয়েছে',
      data: payroll
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(400).json({
      success: false,
      message: 'পেরোল আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেরোল মুছুন (Soft delete)
// @route   DELETE /api/payroll/:id
// @access  Private (Owner only)
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'পেরোল পাওয়া যায়নি'
      });
    }

    payroll.isActive = false;
    payroll.payrollStatus = 'cancelled';
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'পেরোল সফলভাবে মুছে ফেলা হয়েছে'
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'পেরোল মুছতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    মাস অনুযায়ী পেরোল
// @route   GET /api/payroll/month/:monthYear
// @access  Private
exports.getPayrollByMonth = async (req, res) => {
  try {
    const payrolls = await Payroll.findByMonth(req.params.monthYear);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    console.error('Get payroll by month error:', error);
    res.status(500).json({
      success: false,
      message: 'মাসিক পেরোল পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    কর্মচারী-ওয়াইজ পেরোল হিস্ট্রি
// @route   GET /api/payroll/employee/:employeeId
// @access  Private
exports.getPayrollByEmployee = async (req, res) => {
  try {
    const payrolls = await Payroll.findByEmployee(req.params.employeeId);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    console.error('Get payroll by employee error:', error);
    res.status(500).json({
      success: false,
      message: 'কর্মচারীর পেরোল হিস্ট্রি পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    Pending পেমেন্ট
// @route   GET /api/payroll/pending-payments
// @access  Private (Manager, Owner)
exports.getPendingPayments = async (req, res) => {
  try {
    const payrolls = await Payroll.findPendingPayments();

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'বকেয়া পেমেন্ট পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    স্টল-ওয়াইজ পেরোল
// @route   GET /api/payroll/stall/:stallId
// @access  Private
exports.getPayrollByStall = async (req, res) => {
  try {
    const monthYear = req.query.monthYear || null;
    const payrolls = await Payroll.findByStall(req.params.stallId, monthYear);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    console.error('Get payroll by stall error:', error);
    res.status(500).json({
      success: false,
      message: 'স্টল-ওয়াইজ পেরোল পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেরোল অনুমোদন করুন
// @route   POST /api/payroll/:id/approve
// @access  Private (Manager, Owner)
exports.approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'পেরোল পাওয়া যায়নি'
      });
    }

    await payroll.approve({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      comments: req.body.comments
    });

    res.status(200).json({
      success: true,
      message: 'পেরোল সফলভাবে অনুমোদিত হয়েছে',
      data: payroll
    });
  } catch (error) {
    console.error('Approve payroll error:', error);
    res.status(400).json({
      success: false,
      message: 'পেরোল অনুমোদন করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেমেন্ট প্রসেস করুন
// @route   POST /api/payroll/:id/process
// @access  Private (Manager, Owner)
exports.processPayment = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'পেরোল পাওয়া যায়নি'
      });
    }

    await payroll.processPayment({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role
    });

    res.status(200).json({
      success: true,
      message: 'পেমেন্ট প্রসেসিং শুরু হয়েছে',
      data: payroll
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(400).json({
      success: false,
      message: 'পেমেন্ট প্রসেস করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেমেন্ট সম্পন্ন মার্ক করুন
// @route   POST /api/payroll/:id/mark-paid
// @access  Private (Manager, Owner)
exports.markAsPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'পেরোল পাওয়া যায়নি'
      });
    }

    await payroll.markAsPaid();

    res.status(200).json({
      success: true,
      message: 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে',
      data: payroll
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(400).json({
      success: false,
      message: 'পেমেন্ট সম্পন্ন মার্ক করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    মাসিক মোট হিসাব
// @route   POST /api/payroll/calculate-monthly
// @access  Private
exports.calculateMonthlyTotal = async (req, res) => {
  try {
    const { monthYear } = req.body;

    if (!monthYear) {
      return res.status(400).json({
        success: false,
        message: 'মাস এবং বছর প্রয়োজন (যেমন: January 2026)'
      });
    }

    const result = await Payroll.calculateMonthlyTotal(monthYear);

    res.status(200).json({
      success: true,
      message: 'মাসিক মোট হিসাব সফল',
      data: result
    });
  } catch (error) {
    console.error('Calculate monthly total error:', error);
    res.status(500).json({
      success: false,
      message: 'মাসিক হিসাব করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    টপ আর্নার
// @route   GET /api/payroll/top-earners/:monthYear/:limit?
// @access  Private
exports.getTopEarners = async (req, res) => {
  try {
    const { monthYear } = req.params;
    const limit = parseInt(req.params.limit) || 10;

    const topEarners = await Payroll.findTopEarners(monthYear, limit);

    res.status(200).json({
      success: true,
      count: topEarners.length,
      data: topEarners
    });
  } catch (error) {
    console.error('Get top earners error:', error);
    res.status(500).json({
      success: false,
      message: 'টপ আর্নার পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};