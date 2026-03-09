const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Simple app to test connection and create superadmin
const app = express();
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Setup server is working!' });
});

// Create superadmin route
app.post('/create-superadmin', async (req, res) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orvanta', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Define User schema inline for this test
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, required: true },
      profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true }
      },
      isActive: { type: Boolean, default: true }
    });

    // Add password hashing
    userSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    // Check if model exists to avoid OverwriteModelError
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const adminEmail = 'admin@orvantahealth.com';
    const adminPassword = 'Welcomeadmin';

    console.log('Checking for existing admin...');
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists');
      return res.json({
        success: true,
        message: 'Superadmin already exists',
        data: { email: adminEmail, role: existingAdmin.role }
      });
    }

    console.log('Creating new admin...');
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin'
      },
      isActive: true
    });

    await admin.save();
    console.log('Admin created successfully');

    res.json({
      success: true,
      message: 'Superadmin created successfully',
      data: {
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating superadmin',
      error: error.message
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Setup server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test`);
  console.log(`Create Superadmin: POST http://localhost:${PORT}/create-superadmin`);
  console.log('\nTo create superadmin, run:');
  console.log(`curl -X POST http://localhost:${PORT}/create-superadmin`);
});
