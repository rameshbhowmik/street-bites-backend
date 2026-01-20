// backend/src/controllers/expenseController.js
const Expense = require('../models/Expense');

// @desc    নতুন খরচ তৈরি করুন
// @route   POST /api/expenses
// @access  Private (Manager, Owner)
exports.createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    };

    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      message: 'খরচ সফলভাবে তৈরি হয়েছে',
      data: expense
    });
  } catch (error) {
    console.error('Expense creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'খরচ তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    সব খরচ দেখুন (Pagination)
// @route   GET /api/expenses
// @access  Private
exports.getAllExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = { isActive: true };
    
    if (req.query.type) filters.expenseType = req.query.type;
    if (req.query.status) filters['approvalDetails.approvalStatus'] = req.query.status;
    if (req.query.stallId) filters['relatedTo.stallId'] = req.query.stallId;

    const expenses = await Expense.find(filters)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'খরচ তথ্য পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    নির্দিষ্ট খরচ
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'খরচ পাওয়া যায়নি' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    খরচ আপডেট
// @route   PUT /api/expenses/:id
// @access  Private (Manager, Owner)
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'খরচ পাওয়া যায়নি' });
    }

    expense.lastModifiedBy = {
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role
    };

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) expense[key] = req.body[key];
    });

    await expense.save();
    res.status(200).json({ success: true, message: 'খরচ আপডেট হয়েছে', data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    খরচ মুছুন
// @route   DELETE /api/expenses/:id
// @access  Private (Owner)
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'খরচ পাওয়া যায়নি' });
    }
    expense.isActive = false;
    await expense.save();
    res.status(200).json({ success: true, message: 'খরচ মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pending অনুমোদন
// @route   GET /api/expenses/pending
// @access  Private (Manager, Owner)
exports.getPendingApprovals = async (req, res) => {
  try {
    const expenses = await Expense.findPendingApprovals();
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    টাইপ অনুযায়ী খরচ
// @route   GET /api/expenses/type/:type
// @access  Private
exports.getExpensesByType = async (req, res) => {
  try {
    const expenses = await Expense.findByType(req.params.type);
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    স্টল-ওয়াইজ খরচ
// @route   GET /api/expenses/stall/:stallId
// @access  Private
exports.getExpensesByStall = async (req, res) => {
  try {
    const expenses = await Expense.findByStall(req.params.stallId);
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recurring dues
// @route   GET /api/expenses/recurring-dues
// @access  Private (Manager, Owner)
exports.getRecurringDues = async (req, res) => {
  try {
    const expenses = await Expense.findRecurringDues();
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    অনুমোদন করুন
// @route   POST /api/expenses/:id/approve
// @access  Private (Manager, Owner)
exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'খরচ পাওয়া যায়নি' });
    }

    await expense.approve({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      comments: req.body.comments
    });

    res.status(200).json({ success: true, message: 'খরচ অনুমোদিত হয়েছে', data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    প্রত্যাখ্যান করুন
// @route   POST /api/expenses/:id/reject
// @access  Private (Manager, Owner)
exports.rejectExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'খরচ পাওয়া যায়নি' });
    }

    await expense.reject(
      { userId: req.user._id, userName: req.user.name, userRole: req.user.role },
      req.body.reason
    );

    res.status(200).json({ success: true, message: 'খরচ প্রত্যাখ্যান হয়েছে', data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    পেড মার্ক করুন
// @route   POST /api/expenses/:id/mark-paid
// @access  Private (Manager, Owner)
exports.markAsPaid = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'খরচ পাওয়া যায়নি' });
    }
    await expense.markAsPaid();
    res.status(200).json({ success: true, message: 'পেমেন্ট সম্পন্ন', data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    মোট খরচ হিসাব
// @route   POST /api/expenses/calculate-total
// @access  Private
exports.calculateTotalExpense = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const result = await Expense.calculateTotalExpense(startDate, endDate);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    খরচ breakdown
// @route   POST /api/expenses/breakdown
// @access  Private
exports.getExpenseBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const breakdown = await Expense.getExpenseBreakdown(startDate, endDate);
    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    তারিখ রেঞ্জ অনুযায়ী খরচ
// @route   POST /api/expenses/date-range
// @access  Private
exports.getExpensesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'শুরু এবং শেষ তারিখ প্রয়োজন'
      });
    }

    const expenses = await Expense.findByDateRange(startDate, endDate);

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'তারিখ রেঞ্জ অনুযায়ী খরচ পেতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// @desc    নোট যোগ করুন
// @route   POST /api/expenses/:id/notes
// @access  Private (Manager, Owner)
exports.addNote = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'খরচ পাওয়া যায়নি'
      });
    }

    const noteData = {
      ...req.body,
      addedBy: {
        userId: req.user._id,
        userName: req.user.name
      }
    };

    await expense.addNote(noteData);

    res.status(200).json({
      success: true,
      message: 'নোট সফলভাবে যোগ হয়েছে',
      data: expense
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