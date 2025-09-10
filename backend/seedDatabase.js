const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');
const Expense = require('./models/Expense');
const SalarySlip = require('./models/SalarySlip');
const Notification = require('./models/Notification');

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Expense.deleteMany({});
    await SalarySlip.deleteMany({});
    await Notification.deleteMany({});

    // Create Admin User
    console.log('Creating admin user...');
    const admin = new User({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@payrollsystem.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      isActive: true,
    });
    await admin.save();
    console.log('✓ Admin user created');

    // Create Sample Employees
    console.log('Creating sample employees...');
    const employees = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Developer',
        salary: {
          basic: 50000,
          allowances: 10000,
        },
        bankDetails: {
          accountNumber: '1234567890',
          bankName: 'State Bank of India',
          ifscCode: 'SBIN0001234',
        },
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Marketing',
        position: 'Marketing Manager',
        salary: {
          basic: 45000,
          allowances: 8000,
        },
        bankDetails: {
          accountNumber: '0987654321',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234',
        },
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Sales',
        position: 'Sales Executive',
        salary: {
          basic: 40000,
          allowances: 7000,
        },
        bankDetails: {
          accountNumber: '1122334455',
          bankName: 'ICICI Bank',
          ifscCode: 'ICIC0001234',
        },
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        password: 'password123',
        role: 'employee',
        department: 'HR',
        position: 'HR Specialist',
        salary: {
          basic: 42000,
          allowances: 6000,
        },
        bankDetails: {
          accountNumber: '5566778899',
          bankName: 'Axis Bank',
          ifscCode: 'UTIB0001234',
        },
      },
    ];

    const createdEmployees = [];
    for (const empData of employees) {
      const employee = new User(empData);
      await employee.save();
      createdEmployees.push(employee);
      console.log(
        `✓ Employee created: ${employee.name} (${employee.employeeId})`
      );
    }

    // Create Sample Expenses
    console.log('Creating sample expenses...');
    const sampleExpenses = [
      {
        employeeId: createdEmployees[0]._id,
        title: 'Business Travel to Mumbai',
        description:
          'Flight tickets and hotel accommodation for client meeting',
        amount: 15000,
        category: 'travel',
        expenseDate: new Date(2024, 8, 15), // September 15, 2024
        status: 'approved',
        approvedBy: admin._id,
        approvedAt: new Date(),
      },
      {
        employeeId: createdEmployees[1]._id,
        title: 'Marketing Conference',
        description: 'Registration fee for digital marketing conference',
        amount: 5000,
        category: 'training',
        expenseDate: new Date(2024, 8, 20),
        status: 'pending',
      },
      {
        employeeId: createdEmployees[0]._id,
        title: 'Team Lunch',
        description: 'Team building lunch with clients',
        amount: 2500,
        category: 'food',
        expenseDate: new Date(2024, 8, 22),
        status: 'rejected',
        approvedBy: admin._id,
        approvedAt: new Date(),
        rejectionReason: 'Exceeds meal allowance limit',
      },
      {
        employeeId: createdEmployees[2]._id,
        title: 'Office Supplies',
        description: 'Stationery and printer cartridges',
        amount: 1200,
        category: 'office_supplies',
        expenseDate: new Date(2024, 8, 25),
        status: 'approved',
        approvedBy: admin._id,
        approvedAt: new Date(),
      },
    ];

    for (const expenseData of sampleExpenses) {
      const expense = new Expense(expenseData);
      await expense.save();
      console.log(`✓ Expense created: ${expense.title}`);
    }

    // Create Sample Salary Slips
    console.log('Creating sample salary slips...');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    for (const employee of createdEmployees) {
      // Create salary slip for current month
      const salarySlip = new SalarySlip({
        employeeId: employee._id,
        month: currentMonth,
        year: currentYear,
        basicSalary: employee.salary.basic,
        allowances: {
          hra: Math.round(employee.salary.basic * 0.4), // 40% of basic
          transport: 2000,
          medical: 1500,
          special: employee.salary.allowances,
        },
        deductions: {
          tax: Math.round(employee.salary.basic * 0.1), // 10% tax
          pf: Math.round(employee.salary.basic * 0.12), // 12% PF
          insurance: 1000,
        },
        workingDays: {
          total: 22,
          worked: 22,
        },
        generatedBy: admin._id,
        status: 'finalized',
      });

      await salarySlip.save();
      console.log(`✓ Salary slip created for: ${employee.name}`);
    }

    // Create Sample Notifications
    console.log('Creating sample notifications...');
    for (const employee of createdEmployees) {
      // Welcome notification
      await Notification.create({
        userId: employee._id,
        title: 'Welcome to Payroll System',
        message:
          'Welcome to the company payroll management system. You can now submit expenses and view your salary slips.',
        type: 'info',
        category: 'system_update',
        priority: 'medium',
      });

      // Salary slip notification
      await Notification.create({
        userId: employee._id,
        title: 'Salary Slip Generated',
        message: `Your salary slip for ${getMonthName(currentMonth)} ${currentYear} has been generated and is ready for download.`,
        type: 'success',
        category: 'salary_generated',
        priority: 'high',
        actionUrl: '/salary-slips',
        actionText: 'View Salary Slip',
      });
    }

    console.log('✓ Sample notifications created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(
      `- Admin user: ${admin.email} (password: ${process.env.ADMIN_PASSWORD || 'admin123'})`
    );
    console.log(`- Employees created: ${createdEmployees.length}`);
    console.log(`- Sample expenses: ${sampleExpenses.length}`);
    console.log(`- Salary slips: ${createdEmployees.length}`);
    console.log(`- Notifications: ${createdEmployees.length * 2}`);

    console.log('\n👤 Employee Login Credentials:');
    createdEmployees.forEach((emp) => {
      console.log(`- ${emp.email} (password: password123) - ${emp.employeeId}`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month - 1] || '';
};

// Run seed script
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
