const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove this in production)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@payrollsystem.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);

    // Create sample employees
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
          allowances: 10000
        },
        bankDetails: {
          accountNumber: '1234567890',
          bankName: 'State Bank of India',
          ifscCode: 'SBIN0001234'
        }
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
          allowances: 8000
        },
        bankDetails: {
          accountNumber: '0987654321',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234'
        }
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        password: 'password123',
        role: 'employee',
        department: 'HR',
        position: 'HR Specialist',
        salary: {
          basic: 40000,
          allowances: 7000
        },
        bankDetails: {
          accountNumber: '1122334455',
          bankName: 'ICICI Bank',
          ifscCode: 'ICIC0001234'
        }
      }
    ];

    for (const employeeData of employees) {
      const employee = new User(employeeData);
      await employee.save();
      console.log('✅ Employee created:', employee.name, '- ID:', employee.employeeId);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin:', process.env.ADMIN_EMAIL || 'admin@payrollsystem.com', '/ Password:', process.env.ADMIN_PASSWORD || 'admin123');
    console.log('Employee: john.doe@company.com / Password: password123');
    console.log('Employee: jane.smith@company.com / Password: password123');
    console.log('Employee: mike.johnson@company.com / Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
