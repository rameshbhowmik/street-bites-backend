// backend/src/controllers/stallPerformanceController.js
const StallPerformance = require('../models/StallPerformance');
const Stall = require('../models/Stall');

/**
 * Stall Performance Controller
 * স্টল পারফরম্যান্স কন্ট্রোলার
 * 
 * এই controller এ আছে:
 * - পারফরম্যান্স রিপোর্ট তৈরি
 * - পারফরম্যান্স ডেটা দেখা
 * - পারফরম্যান্স আপডেট
 * - বিশ্লেষণ এবং রিপোর্ট
 */

// @desc    নতুন পারফরম্যান্স রিপোর্ট তৈরি করুন
// @route   POST /api/stall-performance
// @access  Private (Manager, Owner)
exports.createPerformanceReport = async (req, res) => {
  try {
    const {
      stallId,
      performanceDate,
      performancePeriod,
      salesData,
      customerFeedback,
      wastage,
      salesAnalysis,
      employeePerformance
    } = req.body;

    // স্টল exist করে কিনা চেক করুন
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'স্টল খুঁজে পাওয়া যায়নি'
      });
    }

    // একই তারিখে রিপোর্ট আগে থেকে আছে কিনা চেক করুন
    const existingReport = await StallPerformance.findOne({
      stallId,
      performanceDate: new Date(performanceDate),
      performancePeriod
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'এই তারিখের জন্য রিপোর্ট ইতিমধ্যে তৈরি হয়েছে'
      });
    }

    // নতুন রিপোর্ট তৈরি করুন
    const performance = await StallPerformance.create({
      stallId,
      stallName: stall.stallName,
      performanceDate: new Date(performanceDate),
      performancePeriod,
      salesData,
      customerFeedback,
      wastage,
      salesAnalysis,
      employeePerformance,
      reportedBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    });

    res.status(201).json({
      success: true,
      message: 'পারফরম্যান্স রিপোর্ট সফলভাবে তৈরি হয়েছে',
      data: performance
    });

  } catch (error) {
    console.error('পারফরম্যান্স রিপোর্ট তৈরি করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'পারফরম্যান্স রিপোর্ট তৈরি করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    সব পারফরম্যান্স রিপোর্ট দেখুন
// @route   GET /api/stall-performance
// @access  Private
exports.getAllPerformanceReports = async (req, res) => {
  try {
    const { 
      stallId, 
      period, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;

    // Query বিল্ড করুন
    const query = { isActive: true };

    if (stallId) query.stallId = stallId;
    if (period) query.performancePeriod = period;
    
    if (startDate && endDate) {
      query.performanceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      StallPerformance.find(query)
        .populate('stallId', 'stallName stallCode address')
        .sort({ performanceDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StallPerformance.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: reports
    });

  } catch (error) {
    console.error('পারফরম্যান্স রিপোর্ট পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'পারফরম্যান্স রিপোর্ট পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    নির্দিষ্ট পারফরম্যান্স রিপোর্ট দেখুন
// @route   GET /api/stall-performance/:id
// @access  Private
exports.getPerformanceReportById = async (req, res) => {
  try {
    const performance = await StallPerformance.findById(req.params.id)
      .populate('stallId', 'stallName stallCode address')
      .populate('reportedBy.userId', 'name email')
      .populate('reviewedBy.userId', 'name email')
      .populate('salesAnalysis.bestSellingItems.productId', 'productName')
      .populate('employeePerformance.employeeWiseSales.employeeId', 'name');

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('পারফরম্যান্স রিপোর্ট পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'পারফরম্যান্স রিপোর্ট পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    পারফরম্যান্স রিপোর্ট আপডেট করুন
// @route   PUT /api/stall-performance/:id
// @access  Private (Manager, Owner)
exports.updatePerformanceReport = async (req, res) => {
  try {
    let performance = await StallPerformance.findById(req.params.id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    // আপডেট করুন
    performance = await StallPerformance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'পারফরম্যান্স রিপোর্ট সফলভাবে আপডেট হয়েছে',
      data: performance
    });

  } catch (error) {
    console.error('পারফরম্যান্স রিপোর্ট আপডেট করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'পারফরম্যান্স রিপোর্ট আপডেট করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    স্টল-ওয়াইজ পারফরম্যান্স দেখুন
// @route   GET /api/stall-performance/stall/:stallId
// @access  Private
exports.getStallPerformance = async (req, res) => {
  try {
    const { period = 'daily', limit = 30 } = req.query;

    const reports = await StallPerformance.findByStall(
      req.params.stallId,
      period,
      parseInt(limit)
    );

    if (!reports || reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'এই স্টলের জন্য কোনো রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    // Summary statistics ক্যালকুলেট করুন
    const summary = {
      totalReports: reports.length,
      averageScore: (reports.reduce((sum, r) => sum + r.performanceMetrics.performanceScore, 0) / reports.length).toFixed(2),
      totalSales: reports.reduce((sum, r) => sum + (r.salesData.dailySales || 0), 0),
      totalOrders: reports.reduce((sum, r) => sum + (r.salesData.totalOrders || 0), 0),
      averageRating: (reports.reduce((sum, r) => sum + (r.customerFeedback.averageRating || 0), 0) / reports.length).toFixed(2),
      totalWastage: reports.reduce((sum, r) => sum + (r.wastage.wastageValue || 0), 0)
    };

    res.status(200).json({
      success: true,
      count: reports.length,
      summary,
      data: reports
    });

  } catch (error) {
    console.error('স্টল পারফরম্যান্স পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'স্টল পারফরম্যান্স পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    টপ পারফর্মিং স্টল দেখুন
// @route   GET /api/stall-performance/top-performing
// @access  Private
exports.getTopPerformingStalls = async (req, res) => {
  try {
    const { period = 'monthly', limit = 10 } = req.query;

    const topStalls = await StallPerformance.findTopPerformingStalls(
      period,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: topStalls.length,
      data: topStalls
    });

  } catch (error) {
    console.error('টপ পারফর্মিং স্টল পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'টপ পারফর্মিং স্টল পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    লো পারফর্মিং স্টল দেখুন
// @route   GET /api/stall-performance/low-performing
// @access  Private (Manager, Owner)
exports.getLowPerformingStalls = async (req, res) => {
  try {
    const { period = 'monthly', limit = 10 } = req.query;

    const lowStalls = await StallPerformance.findLowPerformingStalls(
      period,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: lowStalls.length,
      data: lowStalls
    });

  } catch (error) {
    console.error('লো পারফর্মিং স্টল পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'লো পারফর্মিং স্টল পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    হাই ওয়েস্টেজ স্টল দেখুন
// @route   GET /api/stall-performance/high-wastage
// @access  Private (Manager, Owner)
exports.getHighWastageStalls = async (req, res) => {
  try {
    const { threshold = 10, limit = 10 } = req.query;

    const highWastageStalls = await StallPerformance.findHighWastageStalls(
      parseFloat(threshold),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: highWastageStalls.length,
      data: highWastageStalls
    });

  } catch (error) {
    console.error('হাই ওয়েস্টেজ স্টল পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'হাই ওয়েস্টেজ স্টল পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    কমপ্লেইন যোগ করুন
// @route   POST /api/stall-performance/:id/complaint
// @access  Private
exports.addComplaint = async (req, res) => {
  try {
    const { complaint } = req.body;

    const performance = await StallPerformance.findById(req.params.id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    await performance.addComplaint(complaint);

    res.status(200).json({
      success: true,
      message: 'কমপ্লেইন সফলভাবে যোগ হয়েছে',
      data: performance
    });

  } catch (error) {
    console.error('কমপ্লেইন যোগ করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'কমপ্লেইন যোগ করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    অ্যাকশন আইটেম যোগ করুন
// @route   POST /api/stall-performance/:id/action-item
// @access  Private (Manager, Owner)
exports.addActionItem = async (req, res) => {
  try {
    const actionData = {
      ...req.body,
      assignedTo: {
        userId: req.body.assignedToUserId,
        userName: req.body.assignedToUserName,
        userRole: req.body.assignedToUserRole
      }
    };

    const performance = await StallPerformance.findById(req.params.id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    await performance.addActionItem(actionData);

    res.status(200).json({
      success: true,
      message: 'অ্যাকশন আইটেম সফলভাবে যোগ হয়েছে',
      data: performance
    });

  } catch (error) {
    console.error('অ্যাকশন আইটেম যোগ করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'অ্যাকশন আইটেম যোগ করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    রিপোর্ট সাবমিট করুন
// @route   PUT /api/stall-performance/:id/submit
// @access  Private (Manager)
exports.submitReport = async (req, res) => {
  try {
    const performance = await StallPerformance.findById(req.params.id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    await performance.submitReport();

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট সফলভাবে সাবমিট হয়েছে',
      data: performance
    });

  } catch (error) {
    console.error('রিপোর্ট সাবমিট করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'রিপোর্ট সাবমিট করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    রিপোর্ট রিভিউ করুন
// @route   PUT /api/stall-performance/:id/review
// @access  Private (Owner)
exports.reviewReport = async (req, res) => {
  try {
    const { status, reviewComments } = req.body;

    const performance = await StallPerformance.findByIdAndUpdate(
      req.params.id,
      {
        reportStatus: status,
        'reviewedBy.userId': req.user._id,
        'reviewedBy.userName': req.user.name,
        'reviewedBy.userRole': req.user.role,
        'reviewedBy.reviewDate': new Date(),
        'reviewedBy.reviewComments': reviewComments
      },
      { new: true, runValidators: true }
    );

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট সফলভাবে রিভিউ হয়েছে',
      data: performance
    });

  } catch (error) {
    console.error('রিপোর্ট রিভিউ করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'রিপোর্ট রিভিউ করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    পারফরম্যান্স রিপোর্ট মুছুন
// @route   DELETE /api/stall-performance/:id
// @access  Private (Owner)
exports.deletePerformanceReport = async (req, res) => {
  try {
    const performance = await StallPerformance.findById(req.params.id);

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'পারফরম্যান্স রিপোর্ট খুঁজে পাওয়া যায়নি'
      });
    }

    // Soft delete
    performance.isActive = false;
    await performance.save();

    res.status(200).json({
      success: true,
      message: 'পারফরম্যান্স রিপোর্ট সফলভাবে মুছে ফেলা হয়েছে'
    });

  } catch (error) {
    console.error('পারফরম্যান্স রিপোর্ট মুছতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'পারফরম্যান্স রিপোর্ট মুছতে ব্যর্থ',
      error: error.message
    });
  }
};