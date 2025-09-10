const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const {
  authMiddleware,
  adminOnly,
  employeeOnly,
  ownerOrAdmin,
} = require('../middleware/auth');
const {
  validateExpenseCreate,
  validateExpenseUpdate,
  validateExpenseStatusUpdate,
  validateComment,
  validatePagination,
  validateDateRange,
  validateObjectId,
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/receipts');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private/Employee
router.post(
  '/',
  employeeOnly,
  upload.single('receipt'),
  validateExpenseCreate,
  async (req, res) => {
    try {
      const { title, description, amount, category, expenseDate } = req.body;

      const expenseData = {
        employeeId: req.user._id,
        title,
        description,
        amount: parseFloat(amount),
        category,
        expenseDate: new Date(expenseDate),
      };

      // Add receipt file info if uploaded
      if (req.file) {
        expenseData.receipt = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype,
        };
      }

      const expense = new Expense(expenseData);
      await expense.save();

      // Populate employee details
      await expense.populate('employeeId', 'name email employeeId department');

      // Create notification for admin (find all admins)
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin', isActive: true });

      for (const admin of admins) {
        await Notification.createExpenseNotification(
          'expense_submitted',
          admin._id,
          expense
        );
      }

      res.status(201).json({
        success: true,
        message: 'Expense submitted successfully',
        data: { expense },
      });
    } catch (error) {
      // Delete uploaded file if expense creation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Create expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating expense',
      });
    }
  }
);

// @route   GET /api/expenses
// @desc    Get expenses (admin sees all, employee sees own)
// @access  Private
router.get('/', validatePagination, validateDateRange, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const category = req.query.category;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const search = req.query.search || '';

    // Build query based on user role
    let query = {};

    if (req.user.role === 'employee') {
      query.employeeId = req.user._id;
    } else if (req.query.employeeId) {
      query.employeeId = req.query.employeeId;
    }

    // Add filters
    if (status) query.status = status;
    if (category) query.category = category;

    // Date range filter
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .populate('employeeId', 'name email employeeId department')
      .populate('approvedBy', 'name email')
      .populate('comments.author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private (owner or admin)
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employeeId', 'name email employeeId department')
      .populate('approvedBy', 'name email')
      .populate('comments.author', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check if user can access this expense
    if (
      req.user.role !== 'admin' &&
      expense.employeeId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense',
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense (only pending expenses)
// @access  Private (owner only)
router.put(
  '/:id',
  validateObjectId('id'),
  validateExpenseUpdate,
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      // Check ownership
      if (expense.employeeId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Can only update pending expenses
      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only update pending expenses',
        });
      }

      const { title, description, amount, category, expenseDate } = req.body;

      // Update fields
      if (title) expense.title = title;
      if (description) expense.description = description;
      if (amount) expense.amount = parseFloat(amount);
      if (category) expense.category = category;
      if (expenseDate) expense.expenseDate = new Date(expenseDate);

      await expense.save();
      await expense.populate('employeeId', 'name email employeeId department');

      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: { expense },
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating expense',
      });
    }
  }
);

// @route   PUT /api/expenses/:id/status
// @desc    Update expense status (approve/reject)
// @access  Private/Admin
router.put(
  '/:id/status',
  validateObjectId('id'),
  adminOnly,
  validateExpenseStatusUpdate,
  async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;

      const expense = await Expense.findById(req.params.id).populate(
        'employeeId',
        'name email employeeId department'
      );

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only update pending expenses',
        });
      }

      // Update expense status
      if (status === 'approved') {
        await expense.approve(req.user._id);
        await Notification.createExpenseNotification(
          'expense_approved',
          expense.employeeId._id,
          expense,
          req.user
        );
      } else if (status === 'rejected') {
        await expense.reject(req.user._id, rejectionReason);
        await Notification.createExpenseNotification(
          'expense_rejected',
          expense.employeeId._id,
          expense,
          req.user
        );
      }

      await expense.populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: `Expense ${status} successfully`,
        data: { expense },
      });
    } catch (error) {
      console.error('Update expense status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating expense status',
      });
    }
  }
);

// @route   POST /api/expenses/:id/comments
// @desc    Add comment to expense
// @access  Private
router.post(
  '/:id/comments',
  validateObjectId('id'),
  validateComment,
  async (req, res) => {
    try {
      const { message } = req.body;

      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      // Check if user can comment (owner or admin)
      if (
        req.user.role !== 'admin' &&
        expense.employeeId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      await expense.addComment(req.user._id, message);
      await expense.populate('comments.author', 'name email');

      res.json({
        success: true,
        message: 'Comment added successfully',
        data: {
          comment: expense.comments[expense.comments.length - 1],
        },
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding comment',
      });
    }
  }
);

// @route   DELETE /api/expenses/:id
// @desc    Delete expense (only pending)
// @access  Private (owner only)
router.delete('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check ownership
    if (expense.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Can only delete pending expenses
    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending expenses',
      });
    }

    // Delete associated receipt file
    if (
      expense.receipt &&
      expense.receipt.path &&
      fs.existsSync(expense.receipt.path)
    ) {
      fs.unlinkSync(expense.receipt.path);
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
    });
  }
});

// @route   GET /api/expenses/stats/overview
// @desc    Get expense statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    let matchCondition = {};

    // For employees, only show their own stats
    if (req.user.role === 'employee') {
      matchCondition.employeeId = req.user._id;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get overall stats
    const totalExpenses = await Expense.countDocuments(matchCondition);
    const pendingExpenses = await Expense.countDocuments({
      ...matchCondition,
      status: 'pending',
    });
    const approvedExpenses = await Expense.countDocuments({
      ...matchCondition,
      status: 'approved',
    });
    const rejectedExpenses = await Expense.countDocuments({
      ...matchCondition,
      status: 'rejected',
    });

    // Get total amounts
    const totalAmountResult = await Expense.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const approvedAmountResult = await Expense.aggregate([
      { $match: { ...matchCondition, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get monthly stats for current year
    const monthlyStats = await Expense.aggregate([
      {
        $match: {
          ...matchCondition,
          expenseDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$expenseDate' },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get category wise stats
    const categoryStats = await Expense.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalExpenses,
          pendingExpenses,
          approvedExpenses,
          rejectedExpenses,
          totalAmount: totalAmountResult[0]?.total || 0,
          approvedAmount: approvedAmountResult[0]?.total || 0,
        },
        monthlyStats,
        categoryStats,
      },
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense statistics',
    });
  }
});

// @route   GET /api/expenses/download/receipt/:id
// @desc    Download expense receipt
// @access  Private (owner or admin)
router.get(
  '/download/receipt/:id',
  validateObjectId('id'),
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      // Check access
      if (
        req.user.role !== 'admin' &&
        expense.employeeId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      if (!expense.receipt || !expense.receipt.path) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found',
        });
      }

      if (!fs.existsSync(expense.receipt.path)) {
        return res.status(404).json({
          success: false,
          message: 'Receipt file not found',
        });
      }

      res.download(expense.receipt.path, expense.receipt.originalName);
    } catch (error) {
      console.error('Download receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading receipt',
      });
    }
  }
);

module.exports = router;
