const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),

  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Role must be either admin or employee'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Department cannot exceed 30 characters'),

  body('position')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Position cannot exceed 50 characters'),

  handleValidationErrors,
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Department cannot exceed 30 characters'),

  body('position')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Position cannot exceed 50 characters'),

  body('salary.basic')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),

  body('salary.allowances')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Allowances must be a positive number'),

  handleValidationErrors,
];

// Expense validation rules
const validateExpenseCreate = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),

  body('category')
    .isIn([
      'travel',
      'food',
      'accommodation',
      'transport',
      'office_supplies',
      'training',
      'medical',
      'other',
    ])
    .withMessage('Invalid category'),

  body('expenseDate')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),

  handleValidationErrors,
];

const validateExpenseUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),

  body('category')
    .optional()
    .isIn([
      'travel',
      'food',
      'accommodation',
      'transport',
      'office_supplies',
      'training',
      'medical',
      'other',
    ])
    .withMessage('Invalid category'),

  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),

  handleValidationErrors,
];

const validateExpenseStatusUpdate = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),

  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage(
      'Rejection reason is required and must be between 5 and 200 characters'
    ),

  handleValidationErrors,
];

// Salary slip validation rules
const validateSalarySlipCreate = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),

  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  body('year')
    .isInt({ min: 2020, max: new Date().getFullYear() + 1 })
    .withMessage(
      `Year must be between 2020 and ${new Date().getFullYear() + 1}`
    ),

  body('basicSalary')
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),

  body('workingDays.total')
    .isInt({ min: 1, max: 31 })
    .withMessage('Total working days must be between 1 and 31'),

  body('workingDays.worked')
    .isInt({ min: 0 })
    .withMessage('Worked days must be a positive number')
    .custom((value, { req }) => {
      if (value > req.body.workingDays?.total) {
        throw new Error('Worked days cannot exceed total working days');
      }
      return true;
    }),

  body('allowances.hra')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('HRA must be a positive number'),

  body('allowances.transport')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport allowance must be a positive number'),

  body('deductions.tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a positive number'),

  body('deductions.pf')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('PF must be a positive number'),

  handleValidationErrors,
];

// Comment validation
const validateComment = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Comment must be between 1 and 300 characters'),

  handleValidationErrors,
];

// Query parameter validations
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors,
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (
        req.query.startDate &&
        new Date(value) < new Date(req.query.startDate)
      ) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),

  handleValidationErrors,
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),

  handleValidationErrors,
];

// Password validation for updates
const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'New password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),

  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  }),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateExpenseCreate,
  validateExpenseUpdate,
  validateExpenseStatusUpdate,
  validateSalarySlipCreate,
  validateComment,
  validatePagination,
  validateDateRange,
  validateObjectId,
  validatePasswordUpdate,
};
