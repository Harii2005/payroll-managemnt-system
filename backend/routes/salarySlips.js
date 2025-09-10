const express = require('express');
const path = require('path');
const fs = require('fs');
const SalarySlip = require('../models/SalarySlip');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateSalarySlipPDF } = require('../utils/pdfGenerator');
const { sendSalarySlipEmail } = require('../utils/emailService');
const { 
  authMiddleware, 
  adminOnly, 
  employeeOnly,
  ownerOrAdmin 
} = require('../middleware/auth');
const {
  validateSalarySlipCreate,
  validatePagination,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   POST /api/salary-slips
// @desc    Create new salary slip
// @access  Private/Admin
router.post('/', adminOnly, validateSalarySlipCreate, async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      workingDays,
      notes
    } = req.body;

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if salary slip already exists for this period
    const existingSalarySlip = await SalarySlip.findOne({
      employeeId,
      month,
      year
    });

    if (existingSalarySlip) {
      return res.status(400).json({
        success: false,
        message: 'Salary slip already exists for this period'
      });
    }

    // Create salary slip
    const salarySlip = new SalarySlip({
      employeeId,
      month,
      year,
      basicSalary,
      allowances: allowances || {},
      deductions: deductions || {},
      workingDays,
      generatedBy: req.user._id,
      notes
    });

    await salarySlip.save();
    await salarySlip.populate([
      { path: 'employeeId', select: 'name email employeeId department position' },
      { path: 'generatedBy', select: 'name email' }
    ]);

    // Create notification for employee
    await Notification.createSalaryNotification('salary_generated', employeeId, salarySlip);

    res.status(201).json({
      success: true,
      message: 'Salary slip created successfully',
      data: { salarySlip }
    });
  } catch (error) {
    console.error('Create salary slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating salary slip'
    });
  }
});

// @route   GET /api/salary-slips
// @desc    Get salary slips (admin sees all, employee sees own)
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const month = req.query.month;
    const year = req.query.year;
    const status = req.query.status;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'employee') {
      query.employeeId = req.user._id;
    } else if (req.query.employeeId) {
      query.employeeId = req.query.employeeId;
    }

    // Add filters
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Get salary slips with pagination
    const salarySlips = await SalarySlip.find(query)
      .populate('employeeId', 'name email employeeId department position')
      .populate('generatedBy', 'name email')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await SalarySlip.countDocuments(query);

    res.json({
      success: true,
      data: {
        salarySlips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get salary slips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary slips'
    });
  }
});

// @route   GET /api/salary-slips/:id
// @desc    Get salary slip by ID
// @access  Private (owner or admin)
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id)
      .populate('employeeId', 'name email employeeId department position bankDetails')
      .populate('generatedBy', 'name email');

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    // Check if user can access this salary slip
    if (req.user.role !== 'admin' && salarySlip.employeeId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { salarySlip }
    });
  } catch (error) {
    console.error('Get salary slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary slip'
    });
  }
});

// @route   PUT /api/salary-slips/:id
// @desc    Update salary slip (only draft status)
// @access  Private/Admin
router.put('/:id', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id);
    
    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    // Can only update draft salary slips
    if (salarySlip.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only update draft salary slips'
      });
    }

    const {
      basicSalary,
      allowances,
      deductions,
      workingDays,
      notes
    } = req.body;

    // Update fields
    if (basicSalary !== undefined) salarySlip.basicSalary = basicSalary;
    if (allowances) salarySlip.allowances = { ...salarySlip.allowances, ...allowances };
    if (deductions) salarySlip.deductions = { ...salarySlip.deductions, ...deductions };
    if (workingDays) salarySlip.workingDays = { ...salarySlip.workingDays, ...workingDays };
    if (notes !== undefined) salarySlip.notes = notes;

    await salarySlip.save();
    await salarySlip.populate([
      { path: 'employeeId', select: 'name email employeeId department position' },
      { path: 'generatedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Salary slip updated successfully',
      data: { salarySlip }
    });
  } catch (error) {
    console.error('Update salary slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary slip'
    });
  }
});

// @route   PUT /api/salary-slips/:id/finalize
// @desc    Finalize salary slip
// @access  Private/Admin
router.put('/:id/finalize', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id)
      .populate('employeeId', 'name email employeeId department position bankDetails');

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    if (salarySlip.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Salary slip is already finalized'
      });
    }

    await salarySlip.finalize();
    await salarySlip.populate('generatedBy', 'name email');

    res.json({
      success: true,
      message: 'Salary slip finalized successfully',
      data: { salarySlip }
    });
  } catch (error) {
    console.error('Finalize salary slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finalizing salary slip'
    });
  }
});

// @route   POST /api/salary-slips/:id/generate-pdf
// @desc    Generate PDF for salary slip
// @access  Private/Admin
router.post('/:id/generate-pdf', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id)
      .populate('employeeId', 'name email employeeId department position bankDetails')
      .populate('generatedBy', 'name email');

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    // Generate PDF
    const pdfPath = await generateSalarySlipPDF(salarySlip);
    
    // Update salary slip with PDF URL
    salarySlip.pdfUrl = `/uploads/salary-slips/${path.basename(pdfPath)}`;
    await salarySlip.save();

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: { 
        salarySlip,
        pdfUrl: salarySlip.pdfUrl
      }
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF'
    });
  }
});

// @route   POST /api/salary-slips/:id/send-email
// @desc    Send salary slip via email
// @access  Private/Admin
router.post('/:id/send-email', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id)
      .populate('employeeId', 'name email employeeId department position')
      .populate('generatedBy', 'name email');

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    if (!salarySlip.pdfUrl) {
      return res.status(400).json({
        success: false,
        message: 'PDF not generated. Please generate PDF first.'
      });
    }

    // Send email
    const pdfPath = path.join(__dirname, '../uploads/salary-slips', path.basename(salarySlip.pdfUrl));
    await sendSalarySlipEmail(salarySlip, pdfPath);

    // Mark as sent
    await salarySlip.markAsSent();

    // Create notification
    await Notification.createSalaryNotification('salary_sent', salarySlip.employeeId._id, salarySlip);

    res.json({
      success: true,
      message: 'Salary slip sent successfully',
      data: { salarySlip }
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending salary slip'
    });
  }
});

// @route   GET /api/salary-slips/:id/download
// @desc    Download salary slip PDF
// @access  Private (owner or admin)
router.get('/:id/download', validateObjectId('id'), async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id)
      .populate('employeeId', 'name email employeeId');

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin' && salarySlip.employeeId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!salarySlip.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'PDF not available'
      });
    }

    const pdfPath = path.join(__dirname, '../uploads/salary-slips', path.basename(salarySlip.pdfUrl));
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    const filename = `SalarySlip_${salarySlip.employeeId.employeeId}_${salarySlip.monthName}_${salarySlip.year}.pdf`;
    res.download(pdfPath, filename);
  } catch (error) {
    console.error('Download salary slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading salary slip'
    });
  }
});

// @route   DELETE /api/salary-slips/:id
// @desc    Delete salary slip (only draft)
// @access  Private/Admin
router.delete('/:id', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const salarySlip = await SalarySlip.findById(req.params.id);
    
    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found'
      });
    }

    // Can only delete draft salary slips
    if (salarySlip.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft salary slips'
      });
    }

    // Delete associated PDF file
    if (salarySlip.pdfUrl) {
      const pdfPath = path.join(__dirname, '../uploads/salary-slips', path.basename(salarySlip.pdfUrl));
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    await SalarySlip.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Salary slip deleted successfully'
    });
  } catch (error) {
    console.error('Delete salary slip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting salary slip'
    });
  }
});

// @route   GET /api/salary-slips/stats/overview
// @desc    Get salary slip statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    let matchCondition = {};
    
    // For employees, only show their own stats
    if (req.user.role === 'employee') {
      matchCondition.employeeId = req.user._id;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Get overall stats
    const totalSalarySlips = await SalarySlip.countDocuments(matchCondition);
    const draftSlips = await SalarySlip.countDocuments({ ...matchCondition, status: 'draft' });
    const finalizedSlips = await SalarySlip.countDocuments({ ...matchCondition, status: 'finalized' });
    const sentSlips = await SalarySlip.countDocuments({ ...matchCondition, status: 'sent' });

    // Get total salary amounts
    const totalSalaryResult = await SalarySlip.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);

    // Get current year salary
    const currentYearSalaryResult = await SalarySlip.aggregate([
      { $match: { ...matchCondition, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);

    // Get monthly salary for current year
    const monthlySalary = await SalarySlip.aggregate([
      { $match: { ...matchCondition, year: currentYear } },
      {
        $group: {
          _id: '$month',
          totalSalary: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get year-wise stats
    const yearlyStats = await SalarySlip.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$year',
          totalSalary: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSalarySlips,
          draftSlips,
          finalizedSlips,
          sentSlips,
          totalSalaryAmount: totalSalaryResult[0]?.total || 0,
          currentYearSalary: currentYearSalaryResult[0]?.total || 0
        },
        monthlySalary,
        yearlyStats
      }
    });
  } catch (error) {
    console.error('Get salary slip stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary slip statistics'
    });
  }
});

// @route   GET /api/salary-slips/employee/:employeeId
// @desc    Get salary slips for specific employee
// @access  Private/Admin
router.get('/employee/:employeeId', validateObjectId('employeeId'), adminOnly, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = req.query.year;

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let query = { employeeId };
    if (year) query.year = parseInt(year);

    const salarySlips = await SalarySlip.find(query)
      .populate('generatedBy', 'name email')
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: {
        employee: {
          name: employee.name,
          email: employee.email,
          employeeId: employee.employeeId,
          department: employee.department
        },
        salarySlips
      }
    });
  } catch (error) {
    console.error('Get employee salary slips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee salary slips'
    });
  }
});

module.exports = router;
