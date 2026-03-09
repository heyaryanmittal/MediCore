const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');
        const adminEmail = 'admin@orvantahealth.com';
        const user = await User.findOne({ email: adminEmail }).select('+password');
        if (!user) {
            console.log('User NOT found');
        } else {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            console.log('IsActive:', user.isActive);
            const isMatch = await user.comparePassword('Welcomeadmin');
            console.log('Password Match:', isMatch);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
verify();
