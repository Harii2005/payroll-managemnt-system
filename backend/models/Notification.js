const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'expense', 'salary', 'system'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['expense_submitted', 'expense_approved', 'expense_rejected', 'salary_generated', 'salary_sent', 'system_update', 'reminder', 'other'],
    default: 'other'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  relatedModel: {
    type: String,
    enum: ['Expense', 'SalarySlip', 'User'],
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  expiresAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.readAt = undefined;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create(data);
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { read = null, type = null, limit = 50, skip = 0 } = options;
  
  const query = { userId };
  if (read !== null) query.read = read;
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email');
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

// Static method to create expense notification
notificationSchema.statics.createExpenseNotification = function(type, userId, expenseData, adminData = null) {
  const notifications = {
    expense_submitted: {
      title: 'Expense Submitted',
      message: `Your expense "${expenseData.title}" has been submitted for approval.`,
      type: 'info',
      category: 'expense_submitted'
    },
    expense_approved: {
      title: 'Expense Approved',
      message: `Your expense "${expenseData.title}" has been approved by ${adminData?.name || 'Admin'}.`,
      type: 'success',
      category: 'expense_approved'
    },
    expense_rejected: {
      title: 'Expense Rejected',
      message: `Your expense "${expenseData.title}" has been rejected. Reason: ${expenseData.rejectionReason || 'Not specified'}`,
      type: 'error',
      category: 'expense_rejected'
    }
  };

  const notificationData = notifications[type];
  if (!notificationData) return null;

  return this.create({
    userId,
    ...notificationData,
    relatedModel: 'Expense',
    relatedId: expenseData._id,
    actionUrl: `/expenses/${expenseData._id}`,
    actionText: 'View Expense'
  });
};

// Static method to create salary notification
notificationSchema.statics.createSalaryNotification = function(type, userId, salaryData) {
  const notifications = {
    salary_generated: {
      title: 'Salary Slip Generated',
      message: `Your salary slip for ${salaryData.monthName} ${salaryData.year} has been generated.`,
      type: 'success',
      category: 'salary_generated'
    },
    salary_sent: {
      title: 'Salary Slip Sent',
      message: `Your salary slip for ${salaryData.monthName} ${salaryData.year} has been sent to your email.`,
      type: 'info',
      category: 'salary_sent'
    }
  };

  const notificationData = notifications[type];
  if (!notificationData) return null;

  return this.create({
    userId,
    ...notificationData,
    relatedModel: 'SalarySlip',
    relatedId: salaryData._id,
    actionUrl: `/salary-slips/${salaryData._id}`,
    actionText: 'View Salary Slip'
  });
};

// Transform JSON output
notificationSchema.methods.toJSON = function() {
  const notification = this.toObject({ virtuals: true });
  return notification;
};

module.exports = mongoose.model('Notification', notificationSchema);
