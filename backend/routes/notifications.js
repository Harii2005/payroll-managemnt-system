const express = require('express');
const Notification = require('../models/Notification');
const { 
  authMiddleware, 
  adminOnly 
} = require('../middleware/auth');
const {
  validatePagination,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const read = req.query.read;
    const type = req.query.type;
    const category = req.query.category;

    // Build query
    const query = { userId: req.user._id };
    
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;
    if (category) query.category = category;

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('userId', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark as read if not already read
    if (!notification.read) {
      await notification.markAsRead();
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', validateObjectId('id'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!notification.read) {
      await notification.markAsRead();
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

// @route   PUT /api/notifications/:id/unread
// @desc    Mark notification as unread
// @access  Private
router.put('/:id/unread', validateObjectId('id'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (notification.read) {
      await notification.markAsUnread();
    }

    res.json({
      success: true,
      message: 'Notification marked as unread',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as unread error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as unread'
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
});

// @route   DELETE /api/notifications/clear-read
// @desc    Clear all read notifications
// @access  Private
router.delete('/clear-read', async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      read: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} read notifications cleared`
    });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing read notifications'
    });
  }
});

// @route   POST /api/notifications/create
// @desc    Create notification (admin only)
// @access  Private/Admin
router.post('/create', adminOnly, async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      actionText,
      expiresAt
    } = req.body;

    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and message are required'
      });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'info',
      category: category || 'other',
      priority: priority || 'medium',
      actionUrl,
      actionText,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await notification.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification'
    });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Broadcast notification to all users (admin only)
// @access  Private/Admin
router.post('/broadcast', adminOnly, async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      actionText,
      expiresAt,
      targetRole
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Get target users
    const User = require('../models/User');
    let query = { isActive: true };
    if (targetRole && ['admin', 'employee'].includes(targetRole)) {
      query.role = targetRole;
    }

    const users = await User.find(query).select('_id');
    
    // Create notifications for all users
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type: type || 'info',
      category: category || 'system_update',
      priority: priority || 'medium',
      actionUrl,
      actionText,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Notification broadcasted to ${notifications.length} users`,
      data: {
        usersNotified: notifications.length,
        targetRole: targetRole || 'all'
      }
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error broadcasting notification'
    });
  }
});

// @route   GET /api/notifications/stats/overview
// @desc    Get notification statistics (admin only)
// @access  Private/Admin
router.get('/stats/overview', adminOnly, async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ read: false });
    const readNotifications = await Notification.countDocuments({ read: true });

    // Get notifications by type
    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get notifications by category
    const categoryStats = await Notification.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get notifications by priority
    const priorityStats = await Notification.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily notification count for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalNotifications,
          unreadNotifications,
          readNotifications,
          readPercentage: totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0
        },
        typeStats,
        categoryStats,
        priorityStats,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification statistics'
    });
  }
});

module.exports = router;
