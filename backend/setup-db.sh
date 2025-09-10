#!/bin/bash

# Payroll System Database Setup Script

echo "🚀 Setting up Payroll System Database..."
echo

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB first:"
    echo
    echo "For macOS:"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community"
    echo "  brew services start mongodb-community"
    echo
    echo "For other systems, visit: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    
    # Try to start MongoDB on macOS
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
        sleep 3
    else
        echo "Please start MongoDB manually and run this script again."
        exit 1
    fi
fi

echo "✅ MongoDB is running"
echo

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please update .env file with your configuration"
    echo
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo
fi

# Run database seed
echo "🌱 Seeding database with initial data..."
npm run seed

if [ $? -eq 0 ]; then
    echo
    echo "🎉 Database setup completed successfully!"
    echo
    echo "📋 Default Login Credentials:"
    echo "Admin: admin@payrollsystem.com / Password: admin123"
    echo "Employee: john.doe@company.com / Password: password123"
    echo
    echo "🚀 You can now start the server with:"
    echo "  npm run dev"
    echo
else
    echo "❌ Database seeding failed. Please check the error above."
    exit 1
fi
