const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'travel',
        'food',
        'accommodation',
        'transport',
        'office_supplies',
        'training',
        'medical',
        'other',
      ],
      default: 'other',
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: 'Expense date cannot be in the future',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    receipt: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimeType: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [200, 'Rejection reason cannot exceed 200 characters'],
    },
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: [300, 'Comment cannot exceed 300 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
expenseSchema.index({ employeeId: 1, status: 1 });
expenseSchema.index({ status: 1, createdAt: -1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(this.amount);
});

// Update status and set approval details
expenseSchema.methods.approve = function (adminId) {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.rejectionReason = undefined;
  return this.save();
};

// Reject expense with reason
expenseSchema.methods.reject = function (adminId, reason) {
  this.status = 'rejected';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Add comment to expense
expenseSchema.methods.addComment = function (authorId, message) {
  this.comments.push({
    author: authorId,
    message: message,
  });
  return this.save();
};

// Static method to get expenses by status
expenseSchema.statics.getByStatus = function (status) {
  return this.find({ status })
    .populate('employeeId', 'name email employeeId department')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get employee expenses
expenseSchema.statics.getEmployeeExpenses = function (
  employeeId,
  status = null
) {
  const query = { employeeId };
  if (status) query.status = status;

  return this.find(query)
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Transform JSON output
expenseSchema.methods.toJSON = function () {
  const expense = this.toObject({ virtuals: true });
  return expense;
};

module.exports = mongoose.model('Expense', expenseSchema);
