// backend/src/controllers/profitLossController.js

const ProfitLoss = require('../models/ProfitLoss');

/**
 * লাভ/ক্ষতি রিপোর্ট Controller
 * সব CRUD operations এবং reporting
 */

// @desc    নতুন লাভ/ক্ষতি রিপোর্ট তৈরি করুন
// @route   POST /api/profit-loss
// @access  Private (Owner, Manager)
exports.createProfitLossReport = async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      generatedBy: {
        type: 'manual',
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    };

    const report = await ProfitLoss.create(reportData);
    await report.calculateAll();
    await report.save();

    res.status(201).json({
      success: true,
      message: 'লাভ/ক্ষতি রিপোর্ট সফলভাবে তৈরি হয়েছে',
      data: report
    });
  } catch (error) {
    console.error('Profit/Loss report creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'রিপোর্ট তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সব রিপোর্ট দেখুন (Pagination সহ)
// @route   GET /api/profit-loss
// @access  Private
exports.getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filters = { isActive: true };
    
    if (req.query.periodType) {
      filters.periodType = req.query.periodType;
    }
    
    if (req.query.status) {
      filters.reportStatus = req.query.status;
    }
    
    if (req.query.stallId) {
      filters['relatedTo.stallId'] = req.query.stallId;
    }

    const reports = await ProfitLoss.find(filters)
      .sort({ periodStartDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await ProfitLoss.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'রিপোর্ট তথ্য পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    নির্দিষ্ট রিপোর্ট দেখুন
// @route   GET /api/profit-loss/:id
// @access  Private
exports.getReportById = async (req, res) => {
  try {
    const report = await ProfitLoss.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'রিপোর্ট পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'রিপোর্ট পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    রিপোর্ট আপডেট করুন
// @route   PUT /api/profit-loss/:id
// @access  Private (Owner, Manager)
exports.updateReport = async (req, res) => {
  try {
    const report = await ProfitLoss.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'রিপোর্ট পাওয়া যায়নি'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        report[key] = req.body[key];
      }
    });

    await report.save();

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট সফলভাবে আপডেট হয়েছে',
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(400).json({
      success: false,
      message: 'রিপোর্ট আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    রিপোর্ট মুছুন (Soft delete)
// @route   DELETE /api/profit-loss/:id
// @access  Private (Owner only)
exports.deleteReport = async (req, res) => {
  try {
    const report = await ProfitLoss.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'রিপোর্ট পাওয়া যায়নি'
      });
    }

    report.isActive = false;
    await report.save();

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট সফলভাবে মুছে ফেলা হয়েছে'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'রিপোর্ট মুছতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সর্বশেষ রিপোর্ট
// @route   GET /api/profit-loss/latest/:limit?
// @access  Private
exports.getLatestReports = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const reports = await ProfitLoss.findLatestReports(limit);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get latest reports error:', error);
    res.status(500).json({
      success: false,
      message: 'সর্বশেষ রিপোর্ট পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সময়কাল অনুযায়ী রিপোর্ট
// @route   GET /api/profit-loss/period/:type
// @access  Private
exports.getReportsByPeriod = async (req, res) => {
  try {
    const reports = await ProfitLoss.findByPeriod(req.params.type);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get reports by period error:', error);
    res.status(500).json({
      success: false,
      message: 'সময়কাল অনুযায়ী রিপোর্ট পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    স্টল-ওয়াইজ রিপোর্ট
// @route   GET /api/profit-loss/stall/:stallId
// @access  Private
exports.getReportsByStall = async (req, res) => {
  try {
    const reports = await ProfitLoss.findByStall(req.params.stallId);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get reports by stall error:', error);
    res.status(500).json({
      success: false,
      message: 'স্টল-ওয়াইজ রিপোর্ট পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সবচেয়ে লাভজনক সময়কাল
// @route   GET /api/profit-loss/profitable/:limit?
// @access  Private
exports.getMostProfitable = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const reports = await ProfitLoss.findMostProfitable(limit);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get most profitable error:', error);
    res.status(500).json({
      success: false,
      message: 'লাভজনক সময়কাল পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    ক্ষতির সময়কাল
// @route   GET /api/profit-loss/loss-periods
// @access  Private (Owner, Manager)
exports.getLossPeriods = async (req, res) => {
  try {
    const reports = await ProfitLoss.findLossPeriods();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get loss periods error:', error);
    res.status(500).json({
      success: false,
      message: 'ক্ষতির সময়কাল পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    রিপোর্ট ফাইনালাইজ করুন
// @route   POST /api/profit-loss/:id/finalize
// @access  Private (Owner, Manager)
exports.finalizeReport = async (req, res) => {
  try {
    const report = await ProfitLoss.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'রিপোর্ট পাওয়া যায়নি'
      });
    }

    await report.finalize();

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট সফলভাবে ফাইনালাইজ হয়েছে',
      data: report
    });
  } catch (error) {
    console.error('Finalize report error:', error);
    res.status(400).json({
      success: false,
      message: 'রিপোর্ট ফাইনালাইজ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    রিপোর্ট অনুমোদন করুন
// @route   POST /api/profit-loss/:id/approve
// @access  Private (Owner only)
exports.approveReport = async (req, res) => {
  try {
    const report = await ProfitLoss.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'রিপোর্ট পাওয়া যায়নি'
      });
    }

    await report.approve({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      comments: req.body.comments
    });

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট সফলভাবে অনুমোদিত হয়েছে',
      data: report
    });
  } catch (error) {
    console.error('Approve report error:', error);
    res.status(400).json({
      success: false,
      message: 'রিপোর্ট অনুমোদন করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সামগ্রিক পরিসংখ্যান
// @route   POST /api/profit-loss/overall-stats
// @access  Private
exports.getOverallStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'শুরু এবং শেষ তারিখ প্রয়োজন'
      });
    }

    const stats = await ProfitLoss.getOverallStats(startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get overall stats error:', error);
    res.status(500).json({
      success: false,
      message: 'পরিসংখ্যান পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    বিনিয়োগকারী শেয়ার যোগ করুন
// @route   POST /api/profit-loss/:id/add-investor-share
// @access  Private (Owner, Manager)
exports.addInvestorShare = async (req, res) => {
  try {
    const report = await ProfitLoss.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'রিপোর্ট পাওয়া যায়নি'
      });
    }

    const investorData = req.body;
    report.addInvestorShare(investorData);
    await report.save();

    res.status(200).json({
      success: true,
      message: 'বিনিয়োগকারী শেয়ার সফলভাবে যোগ হয়েছে',
      data: report
    });
  } catch (error) {
    console.error('Add investor share error:', error);
    res.status(400).json({
      success: false,
      message: 'বিনিয়োগকারী শেয়ার যোগ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};