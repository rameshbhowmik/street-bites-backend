// backend/src/controllers/investorController.js

const Investor = require('../models/Investor');

/**
 * বিনিয়োগকারী Controller
 * সব CRUD operations এবং ROI management
 */

// @desc    নতুন বিনিয়োগকারী তৈরি করুন
// @route   POST /api/investors
// @access  Private (Owner, Manager)
exports.createInvestor = async (req, res) => {
  try {
    const investorData = {
      ...req.body,
      createdBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    };

    const investor = await Investor.create(investorData);

    res.status(201).json({
      success: true,
      message: 'বিনিয়োগকারী সফলভাবে তৈরি হয়েছে',
      data: investor
    });
  } catch (error) {
    console.error('Investor creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'বিনিয়োগকারী তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সব বিনিয়োগকারী দেখুন (Pagination সহ)
// @route   GET /api/investors
// @access  Private
exports.getAllInvestors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filters = { isActive: true };
    
    if (req.query.status) {
      filters['investmentDetails.investmentStatus'] = req.query.status;
    }
    
    if (req.query.search) {
      filters.$or = [
        { investorName: { $regex: req.query.search, $options: 'i' } },
        { investorId: { $regex: req.query.search, $options: 'i' } },
        { 'contactInfo.email': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const investors = await Investor.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Investor.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: investors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: investors
    });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({
      success: false,
      message: 'বিনিয়োগকারী তথ্য পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    নির্দিষ্ট বিনিয়োগকারীর তথ্য
// @route   GET /api/investors/:id
// @access  Private
exports.getInvestorById = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: investor
    });
  } catch (error) {
    console.error('Get investor error:', error);
    res.status(500).json({
      success: false,
      message: 'বিনিয়োগকারী তথ্য পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    বিনিয়োগকারী আপডেট করুন
// @route   PUT /api/investors/:id
// @access  Private (Owner, Manager)
exports.updateInvestor = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        investor[key] = req.body[key];
      }
    });

    await investor.save();

    res.status(200).json({
      success: true,
      message: 'বিনিয়োগকারী সফলভাবে আপডেট হয়েছে',
      data: investor
    });
  } catch (error) {
    console.error('Update investor error:', error);
    res.status(400).json({
      success: false,
      message: 'বিনিয়োগকারী আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    বিনিয়োগকারী মুছুন (Soft delete)
// @route   DELETE /api/investors/:id
// @access  Private (Owner only)
exports.deleteInvestor = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    investor.isActive = false;
    investor.investmentDetails.investmentStatus = 'cancelled';
    await investor.save();

    res.status(200).json({
      success: true,
      message: 'বিনিয়োগকারী সফলভাবে মুছে ফেলা হয়েছে'
    });
  } catch (error) {
    console.error('Delete investor error:', error);
    res.status(500).json({
      success: false,
      message: 'বিনিয়োগকারী মুছতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সক্রিয় বিনিয়োগকারী
// @route   GET /api/investors/active
// @access  Private
exports.getActiveInvestors = async (req, res) => {
  try {
    const investors = await Investor.findActiveInvestors();

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors
    });
  } catch (error) {
    console.error('Get active investors error:', error);
    res.status(500).json({
      success: false,
      message: 'সক্রিয় বিনিয়োগকারী পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    টপ বিনিয়োগকারী (Amount অনুযায়ী)
// @route   GET /api/investors/top/:limit?
// @access  Private
exports.getTopInvestors = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const investors = await Investor.findTopInvestors(limit);

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors
    });
  } catch (error) {
    console.error('Get top investors error:', error);
    res.status(500).json({
      success: false,
      message: 'টপ বিনিয়োগকারী পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেমেন্ট বকেয়া বিনিয়োগকারী
// @route   GET /api/investors/payments-due
// @access  Private (Owner, Manager)
exports.getPaymentsDue = async (req, res) => {
  try {
    const investors = await Investor.findPaymentsDue();

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors
    });
  } catch (error) {
    console.error('Get payments due error:', error);
    res.status(500).json({
      success: false,
      message: 'বকেয়া পেমেন্ট পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    পেআউট যোগ করুন
// @route   POST /api/investors/:id/payout
// @access  Private (Owner, Manager)
exports.addPayout = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    const payoutData = {
      ...req.body,
      paidBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    };

    await investor.addPayout(payoutData);

    res.status(200).json({
      success: true,
      message: 'পেআউট সফলভাবে যোগ হয়েছে',
      data: investor
    });
  } catch (error) {
    console.error('Add payout error:', error);
    res.status(400).json({
      success: false,
      message: 'পেআউট যোগ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    ROI হিসাব করুন
// @route   POST /api/investors/:id/calculate-roi
// @access  Private (Owner, Manager)
exports.calculateROI = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    const months = req.body.months || 1;
    const roiCalculation = investor.calculateROI(months);

    res.status(200).json({
      success: true,
      message: 'ROI সফলভাবে হিসাব করা হয়েছে',
      data: {
        investorName: investor.investorName,
        investmentAmount: investor.investmentDetails.investmentAmount,
        ...roiCalculation
      }
    });
  } catch (error) {
    console.error('Calculate ROI error:', error);
    res.status(500).json({
      success: false,
      message: 'ROI হিসাব করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    দস্তাবেজ যোগ করুন
// @route   POST /api/investors/:id/documents
// @access  Private (Owner, Manager)
exports.addDocument = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    const documentData = {
      ...req.body,
      uploadedBy: {
        userId: req.user._id,
        userName: req.user.name
      }
    };

    await investor.addDocument(documentData);

    res.status(200).json({
      success: true,
      message: 'দস্তাবেজ সফলভাবে যোগ হয়েছে',
      data: investor
    });
  } catch (error) {
    console.error('Add document error:', error);
    res.status(400).json({
      success: false,
      message: 'দস্তাবেজ যোগ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    নোট যোগ করুন
// @route   POST /api/investors/:id/notes
// @access  Private (Owner, Manager)
exports.addNote = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    const noteData = {
      ...req.body,
      addedBy: {
        userId: req.user._id,
        userName: req.user.name
      }
    };

    await investor.addNote(noteData);

    res.status(200).json({
      success: true,
      message: 'নোট সফলভাবে যোগ হয়েছে',
      data: investor
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(400).json({
      success: false,
      message: 'নোট যোগ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    বিনিয়োগকারীর পেআউট হিস্ট্রি
// @route   GET /api/investors/:id/payout-history
// @access  Private
exports.getPayoutHistory = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id)
      .select('investorName investorId payoutRecords');

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      investorName: investor.investorName,
      investorId: investor.investorId,
      totalPayouts: investor.payoutRecords.length,
      data: investor.payoutRecords.sort((a, b) => b.payoutDate - a.payoutDate)
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({
      success: false,
      message: 'পেআউট হিস্ট্রি পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    মোবাইল নম্বর দিয়ে খুঁজুন
// @route   GET /api/investors/search/mobile/:mobile
// @access  Private
exports.searchByMobile = async (req, res) => {
  try {
    const investor = await Investor.findByMobile(req.params.mobile);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'এই মোবাইল নম্বরে কোনো বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: investor
    });
  } catch (error) {
    console.error('Search by mobile error:', error);
    res.status(500).json({
      success: false,
      message: 'মোবাইল নম্বর দিয়ে খুঁজতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    ইমেইল দিয়ে খুঁজুন
// @route   GET /api/investors/search/email/:email
// @access  Private
exports.searchByEmail = async (req, res) => {
  try {
    const investor = await Investor.findByEmail(req.params.email);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'এই ইমেইলে কোনো বিনিয়োগকারী পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: investor
    });
  } catch (error) {
    console.error('Search by email error:', error);
    res.status(500).json({
      success: false,
      message: 'ইমেইল দিয়ে খুঁজতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};