const express = require('express');
const User = require('../models/User');
const {
  authMiddleware,
  adminOnly,
  ownerOrAdmin,
} = require('../middleware/auth');
const {
  validateUserUpdate,
  validatePagination,
  validateObjectId,
} = require('../middleware/validation');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', adminOnly, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const department = req.query.department || '';
    const isActive = req.query.isActive;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (department) query.department = { $regex: department, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    });
  }
});

// @route   GET /api/users/employees
// @desc    Get all employees (admin only)
// @access  Private/Admin
router.get('/employees', adminOnly, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee', isActive: true })
      .select('name email employeeId department position salary')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { employees },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (own profile or admin)
router.get('/:id', validateObjectId('id'), ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (own profile or admin)
router.put(
  '/:id',
  validateObjectId('id'),
  validateUserUpdate,
  ownerOrAdmin,
  async (req, res) => {
    try {
      const { name, email, department, position, salary, bankDetails } =
        req.body;

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if email is being changed and if it's unique
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists',
          });
        }
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (department) user.department = department;
      if (position) user.position = position;

      // Only admin can update salary
      if (salary && req.user.role === 'admin') {
        user.salary = {
          basic: salary.basic || user.salary.basic,
          allowances: salary.allowances || user.salary.allowances,
        };
      }

      // Update bank details
      if (bankDetails) {
        user.bankDetails = {
          accountNumber:
            bankDetails.accountNumber || user.bankDetails.accountNumber,
          bankName: bankDetails.bankName || user.bankDetails.bankName,
          ifscCode: bankDetails.ifscCode || user.bankDetails.ifscCode,
        };
      }

      await user.save();

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user',
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete by deactivating)
// @access  Private/Admin
router.delete('/:id', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate user
// @access  Private/Admin
router.put(
  '/:id/activate',
  validateObjectId('id'),
  adminOnly,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.isActive = true;
      await user.save();

      res.json({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error) {
      console.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error activating user',
      });
    }
  }
);

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (admin only)
// @access  Private/Admin
router.get('/stats/overview', adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Get department wise count
    const departmentStats = await User.aggregate([
      { $match: { role: 'employee', isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get recent joinings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJoinings = await User.countDocuments({
      joiningDate: { $gte: thirtyDaysAgo },
      role: 'employee',
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalEmployees,
          totalAdmins,
          recentJoinings,
        },
        departmentStats: departmentStats.map((dept) => ({
          department: dept._id || 'Not Specified',
          count: dept.count,
        })),
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/:id/role', validateObjectId('id'), adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or employee.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: { user },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
    });
  }
});

module.exports = router;
