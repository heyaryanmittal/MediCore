const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 30000
        });
        console.log('Connected to MongoDB successfully');

        const adminEmail = 'admin@orvantahealth.com';
        const adminPassword = 'Welcomeadmin';

        console.log('Checking for existing admin:', adminEmail);

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        console.log('Existing admin found:', !!existingAdmin);

        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log('Admin details:', {
                email: existingAdmin.email,
                role: existingAdmin.role,
                isActive: existingAdmin.isActive
            });

            // Update password just in case it's wrong/different
            existingAdmin.password = adminPassword;
            await existingAdmin.save();
            console.log('Admin password updated to default');
        } else {
            console.log('Creating new admin user...');
            // Create new admin
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
            console.log('Super Admin created successfully');
        }

        // Verify
        const verifyUser = await User.findOne({ email: adminEmail }).select('+password');
        console.log('Verified User:', {
            email: verifyUser.email,
            role: verifyUser.role,
            isActive: verifyUser.isActive,
            hasPassword: !!verifyUser.password
        });

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
};

seedAdmin();
