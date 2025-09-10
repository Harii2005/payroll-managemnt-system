const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const {
  generateToken,
  authMiddleware,
  createRateLimit,
} = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordUpdate,
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for auth routes
const authRateLimit = createRateLimit(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts, please try again in 15 minutes'
);
const loginRateLimit = createRateLimit(
  15 * 60 * 1000,
  10,
  'Too many login attempts, please try again in 15 minutes'
);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (but typically admin creates employees)
router.post(
  '/register',
  authRateLimit,
  validateUserRegistration,
  async (req, res) => {
    try {
      const { name, email, password, role, department, position, salary } =
        req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Create new user
      const userData = {
        name,
        email,
        password,
        role: role || 'employee',
        department,
        position,
      };

      // Add salary information if provided
      if (salary) {
        userData.salary = {
          basic: salary.basic || 0,
          allowances: salary.allowances || 0,
        };
      }

      const user = new User(userData);
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            department: user.department,
            position: user.position,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginRateLimit, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          position: user.position,
          lastLogin: user.lastLogin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, (req, res) => {
  try {
    // Clear cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          position: user.position,
          joiningDate: user.joiningDate,
          salary: user.salary,
          bankDetails: user.bankDetails,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  authMiddleware,
  validatePasswordUpdate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      // Verify current password
      const isCurrentPasswordValid =
        await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
      });
    }
  }
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', authMiddleware, (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    // Set new cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
    });
  }
});

module.exports = router;
