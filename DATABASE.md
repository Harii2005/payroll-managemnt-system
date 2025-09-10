# Database Documentation

## Database: `payroll_system`

### MongoDB Atlas Connection
- **Connection String**: `mongodb+srv://harikrishnankrkv_db_user:***@payroll-system.skmycd0.mongodb.net/`
- **Database Name**: `payroll_system`
- **Cluster**: `payroll-system`

## Collections

### 1. `users`
Stores user accounts for both admins and employees.

**Schema Fields:**
- `_id`: ObjectId (auto-generated)
- `name`: String (required) - Full name
- `email`: String (required, unique) - Login email
- `password`: String (required, hashed) - Login password
- `role`: String (enum: 'admin', 'employee') - User role
- `employeeId`: String (unique, auto-generated) - Employee ID (e.g., EMP0001)
- `department`: String - Department name
- `position`: String - Job position
- `joiningDate`: Date (default: now)
- `salary.basic`: Number - Basic salary amount
- `salary.allowances`: Number - Additional allowances
- `bankDetails.accountNumber`: String
- `bankDetails.bankName`: String
- `bankDetails.ifscCode`: String
- `isActive`: Boolean (default: true)
- `lastLogin`: Date
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes:**
- `email` (unique)
- `employeeId` (unique, sparse)
- `role`

### 2. `expenses`
Stores employee expense submissions.

**Schema Fields:**
- `_id`: ObjectId (auto-generated)
- `employeeId`: ObjectId (ref: 'User') - Reference to user
- `title`: String (required) - Expense title
- `description`: String (required) - Expense description
- `amount`: Number (required) - Expense amount
- `category`: String (enum) - Expense category
- `expenseDate`: Date (required) - Date of expense
- `status`: String (enum: 'pending', 'approved', 'rejected')
- `receipt.filename`: String - Uploaded receipt filename
- `receipt.originalName`: String - Original filename
- `receipt.path`: String - File path
- `receipt.size`: Number - File size
- `receipt.mimeType`: String - File MIME type
- `approvedBy`: ObjectId (ref: 'User') - Admin who approved/rejected
- `approvedAt`: Date - Approval/rejection date
- `rejectionReason`: String - Reason for rejection
- `comments`: Array of comment objects
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes:**
- `employeeId + status`
- `status + createdAt`
- `expenseDate`
- `category`

### 3. `salaryslips`
Stores salary slip records.

**Schema Fields:**
- `_id`: ObjectId (auto-generated)
- `employeeId`: ObjectId (ref: 'User') - Reference to employee
- `month`: Number (1-12) - Salary month
- `year`: Number - Salary year
- `basicSalary`: Number (required) - Basic salary amount
- `allowances.hra`: Number - House Rent Allowance
- `allowances.transport`: Number - Transport allowance
- `allowances.medical`: Number - Medical allowance
- `allowances.special`: Number - Special allowance
- `allowances.overtime`: Number - Overtime pay
- `allowances.bonus`: Number - Bonus amount
- `deductions.tax`: Number - Tax deductions
- `deductions.pf`: Number - Provident Fund
- `deductions.insurance`: Number - Insurance deductions
- `deductions.loan`: Number - Loan deductions
- `deductions.other`: Number - Other deductions
- `workingDays.total`: Number - Total working days
- `workingDays.worked`: Number - Days actually worked
- `netSalary`: Number (calculated) - Final salary amount
- `pdfUrl`: String - Path to generated PDF
- `generatedBy`: ObjectId (ref: 'User') - Admin who generated
- `status`: String (enum: 'draft', 'finalized', 'sent')
- `emailSent`: Boolean (default: false)
- `emailSentAt`: Date
- `notes`: String - Additional notes
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes:**
- `employeeId + month + year` (unique compound)
- `status + createdAt`
- `year + month`

### 4. `notifications`
Stores in-app notifications.

**Schema Fields:**
- `_id`: ObjectId (auto-generated)
- `userId`: ObjectId (ref: 'User') - Target user
- `title`: String (required) - Notification title
- `message`: String (required) - Notification message
- `type`: String (enum: 'info', 'success', 'warning', 'error', 'expense', 'salary', 'system')
- `category`: String (enum) - Notification category
- `read`: Boolean (default: false) - Read status
- `readAt`: Date - When read
- `priority`: String (enum: 'low', 'medium', 'high', 'urgent')
- `actionUrl`: String - URL for action button
- `actionText`: String - Action button text
- `relatedModel`: String (enum: 'Expense', 'SalarySlip', 'User')
- `relatedId`: ObjectId - Reference to related document
- `expiresAt`: Date - Auto-deletion date
- `metadata`: Mixed - Additional data
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes:**
- `userId + read + createdAt`
- `type + category`
- `priority + createdAt`
- `expiresAt` (TTL index for auto-deletion)

## Initial Data Setup

### Default Admin User
- **Email**: `admin@payrollsystem.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Name**: `System Administrator`

### Sample Employee Data
The system will auto-generate employee IDs starting from `EMP0001`.

## Database Operations

### Connection
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### Auto-Generated Fields
- Employee IDs: `EMP0001`, `EMP0002`, etc.
- Net salary calculation (automatic)
- Timestamps (createdAt, updatedAt)

### File Storage
- Expense receipts: `/uploads/receipts/`
- Salary slip PDFs: `/uploads/salary-slips/`

## Security
- Passwords are hashed using bcrypt (salt rounds: 12)
- JWT tokens for authentication
- File upload restrictions (5MB max, specific file types)
- Input validation on all endpoints

## Environment Variables Required
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll_system
DB_NAME=payroll_system
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@payrollsystem.com
ADMIN_PASSWORD=admin123
```
