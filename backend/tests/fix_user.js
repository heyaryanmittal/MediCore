const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fixUser = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'admin@orvantahealth.com';
        const password = 'Welcomeadmin';

        let user = await User.findOne({ email });

        if (user) {
            console.log('User exists, resetting password...');
            user.password = password;
            user.isActive = true;
            user.role = 'superadmin';
            await user.save();
            console.log('User updated.');
        } else {
            console.log('User not found, creating...');
            user = new User({
                email,
                password,
                role: 'superadmin',
                profile: {
                    firstName: 'Super',
                    lastName: 'Admin',
                    phone: '1234567890'
                },
                isActive: true
            });
            await user.save();
            console.log('User created.');
        }

        const verified = await User.findOne({ email }).select('+password');
        const match = await verified.comparePassword(password);
        console.log(`Final Verification - Password Match: ${match}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixUser();
