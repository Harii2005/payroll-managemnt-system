const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

// Check if user is employee
const employeeOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employee privileges required.',
    });
  }

  next();
};

// Check if user can access their own resources or is admin
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  const resourceUserId =
    req.params.userId || req.params.employeeId || req.body.employeeId;

  if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.',
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting helper
const createRateLimit = (windowMs, max, message) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, times] of requests.entries()) {
      requests.set(
        ip,
        times.filter((time) => time > windowStart)
      );
      if (requests.get(ip).length === 0) {
        requests.delete(ip);
      }
    }

    // Check current IP
    const ipRequests = requests.get(key) || [];

    if (ipRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later.',
      });
    }

    // Add current request
    ipRequests.push(now);
    requests.set(key, ipRequests);

    next();
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Verify and decode token without middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authMiddleware,
  adminOnly,
  employeeOnly,
  ownerOrAdmin,
  optionalAuth,
  createRateLimit,
  generateToken,
  verifyToken,
};
