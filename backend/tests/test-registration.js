const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Test database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore')
  .then(() => {
    console.log('✅ Database connected successfully');

    // Test creating a simple user
    const User = require('../models/User');

    const testUser = {
      email: 'test@example.com',
      password: 'test123456',
      role: 'patient',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    };

    console.log('Testing user creation...');

    User.findOne({ email: testUser.email })
      .then(existing => {
        if (existing) {
          console.log('✅ User already exists, database is working');
          return existing.deleteOne();
        } else {
          console.log('User does not exist, creating new one...');
        }

        const user = new User(testUser);
        return user.save();
      })
      .then(user => {
        console.log('✅ User creation successful:', user.email);
        return User.deleteOne({ email: testUser.email });
      })
      .then(() => {
        console.log('✅ Cleanup successful');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
