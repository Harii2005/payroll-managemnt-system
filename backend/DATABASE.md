# Database Schema Documentation

## Database: `payroll_system`

### Collections Overview

#### 1. `users` Collection

Stores all user accounts (admins and employees)

**Schema:**

```javascript
{
  _id: ObjectId,
  name: String,                    // Full name
  email: String,                   // Unique email address
  password: String,                // Hashed password
  role: String,                    // 'admin' or 'employee'
  employeeId: String,              // Auto-generated (EMP0001, EMP0002, etc.)
  department: String,              // Department name
  position: String,                // Job position
  joiningDate: Date,               // Date of joining
  salary: {
    basic: Number,                 // Basic salary amount
    allowances: Number             // Total allowances
  },
  bankDetails: {
    accountNumber: String,         // Bank account number
    bankName: String,              // Bank name
    ifscCode: String               // IFSC code
  },
  isActive: Boolean,               // Account status
  lastLogin: Date,                 // Last login timestamp
  createdAt: Date,                 // Account creation date
  updatedAt: Date                  // Last update date
}
```

**Indexes:**

- `email: 1` (unique)
- `employeeId: 1` (unique, sparse)
- `role: 1`

---

#### 2. `expenses` Collection

Stores expense submissions and their status

**Schema:**

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,            // Reference to User
  title: String,                   // Expense title
  description: String,             // Detailed description
  amount: Number,                  // Expense amount
  category: String,                // 'travel', 'food', 'accommodation', etc.
  expenseDate: Date,               // Date of expense
  status: String,                  // 'pending', 'approved', 'rejected'
  receipt: {
    filename: String,              // Uploaded file name
    originalName: String,          // Original file name
    path: String,                  // File path
    size: Number,                  // File size in bytes
    mimeType: String               // File MIME type
  },
  approvedBy: ObjectId,            // Reference to admin User
  approvedAt: Date,                // Approval/rejection date
  rejectionReason: String,         // Reason for rejection
  comments: [{
    author: ObjectId,              // Reference to User
    message: String,               // Comment text
    createdAt: Date                // Comment date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `employeeId: 1, status: 1`
- `status: 1, createdAt: -1`
- `expenseDate: -1`
- `category: 1`

---

#### 3. `salaryslips` Collection

Stores salary slip records

**Schema:**

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,            // Reference to User
  month: Number,                   // Month (1-12)
  year: Number,                    // Year
  basicSalary: Number,             // Basic salary for the month
  allowances: {
    hra: Number,                   // House Rent Allowance
    transport: Number,             // Transport allowance
    medical: Number,               // Medical allowance
    special: Number,               // Special allowance
    overtime: Number,              // Overtime pay
    bonus: Number                  // Bonus amount
  },
  deductions: {
    tax: Number,                   // Tax deduction
    pf: Number,                    // Provident fund
    insurance: Number,             // Insurance deduction
    loan: Number,                  // Loan deduction
    other: Number                  // Other deductions
  },
  workingDays: {
    total: Number,                 // Total working days in month
    worked: Number                 // Days actually worked
  },
  netSalary: Number,               // Calculated net salary
  pdfUrl: String,                  // Path to generated PDF
  generatedBy: ObjectId,           // Reference to admin User
  status: String,                  // 'draft', 'finalized', 'sent'
  emailSent: Boolean,              // Email status
  emailSentAt: Date,               // Email sent timestamp
  notes: String,                   // Additional notes
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `employeeId: 1, month: 1, year: 1` (unique compound)
- `status: 1, createdAt: -1`
- `year: -1, month: -1`

---

#### 4. `notifications` Collection

Stores in-app notifications

**Schema:**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // Reference to User
  title: String,                   // Notification title
  message: String,                 // Notification message
  type: String,                    // 'info', 'success', 'warning', 'error', etc.
  category: String,                // 'expense_submitted', 'salary_generated', etc.
  read: Boolean,                   // Read status
  readAt: Date,                    // Read timestamp
  priority: String,                // 'low', 'medium', 'high', 'urgent'
  actionUrl: String,               // URL for action button
  actionText: String,              // Text for action button
  relatedModel: String,            // Related model name
  relatedId: ObjectId,             // Related document ID
  expiresAt: Date,                 // Auto-deletion date
  metadata: Object,                // Additional data
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `userId: 1, read: 1, createdAt: -1`
- `type: 1, category: 1`
- `priority: 1, createdAt: -1`
- `expiresAt: 1` (TTL index for auto-deletion)

---

## Setup Instructions

### 1. Install MongoDB

**Option A: Local Installation (macOS)**

```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# MongoDB will be available at: mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud)**

1. Visit [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Get connection string
4. Update `.env` file with the connection string

### 2. Environment Configuration

Update your `.env` file:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/payroll_system

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll_system

DB_NAME=payroll_system
```

### 3. Seed Database

Run the seed script to create initial data:

```bash
npm run seed
```

This will create:

- 1 Admin user
- 3 Sample employees
- All necessary indexes

### 4. Default Login Credentials

After seeding:

**Admin:**

- Email: `admin@payrollsystem.com`
- Password: `admin123`

**Employees:**

- Email: `john.doe@company.com` / Password: `password123`
- Email: `jane.smith@company.com` / Password: `password123`
- Email: `mike.johnson@company.com` / Password: `password123`

---

## Database Best Practices

1. **Indexes**: All frequently queried fields have indexes
2. **Validation**: Schema-level validation for data integrity
3. **Security**: Passwords are hashed with bcrypt
4. **Relationships**: Uses ObjectId references for relationships
5. **Soft Deletes**: Users are deactivated rather than deleted
6. **Timestamps**: All documents have createdAt/updatedAt timestamps
7. **File Storage**: File paths stored in database, actual files on filesystem

---

## Sample Queries

### Get all employees in a department

```javascript
db.users.find({ role: 'employee', department: 'Engineering' });
```

### Get pending expenses

```javascript
db.expenses.find({ status: 'pending' });
```

### Get salary slips for a specific year

```javascript
db.salaryslips.find({ year: 2024 });
```

### Get unread notifications for a user

```javascript
db.notifications.find({ userId: ObjectId('...'), read: false });
```
