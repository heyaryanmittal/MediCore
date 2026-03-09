const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'admin@orvantahealth.com';
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log(`User ${email} NOT FOUND`);
        } else {
            console.log(`User FOUND: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`isActive: ${user.isActive}`);

            const match = await user.comparePassword('Welcomeadmin');
            console.log(`Password "Welcomeadmin" matches? ${match}`);
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

check();
