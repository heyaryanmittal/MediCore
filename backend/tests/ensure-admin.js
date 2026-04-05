const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const adminEmail = 'admin@medicore.in';
        const adminPassword = 'Welcomeadmin';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin already exists. Updating password and ensuring active status...');
            admin.password = adminPassword;
            admin.isActive = true;
            admin.role = 'superadmin';
            await admin.save();
            console.log('Admin updated successfully.');
        } else {
            console.log('Creating new Super Admin...');
            admin = new User({
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
            console.log('Super Admin created successfully.');
        }

        const verify = await User.findOne({ email: adminEmail }).select('+password');
        console.log('Final Verification:');
        console.log('Email:', verify.email);
        console.log('Role:', verify.role);
        console.log('Active:', verify.isActive);
        const match = await verify.comparePassword(adminPassword);
        console.log('Password test match:', match);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
