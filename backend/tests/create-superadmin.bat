@echo off
echo Creating SuperAdmin Account...
echo.
cd /d "d:\IntelliMed\backend"

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Creating superadmin account...
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore');
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    
    const adminEmail = 'Admin@MediCore.in';
    const adminPassword = 'Welcomeadmin';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Superadmin already exists');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('Role:', existingAdmin.role);
    } else {
      const admin = new User({
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        profile: {
          firstName: 'Super',
          lastName: 'Admin',
          phone: '1234567890',
          gender: 'other',
          address: 'Hospital HQ'
        },
        isActive: true
      });
      
      await admin.save();
      console.log('Superadmin created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
"

echo.
echo SuperAdmin setup completed!
echo Login Credentials:
echo Email: Admin@MediCore.in
echo Password: Welcomeadmin
echo.
pause
