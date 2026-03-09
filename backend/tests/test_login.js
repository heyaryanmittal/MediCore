const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const testLogin = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'admin@orvantahealth.com';
        const password = 'Welcomeadmin';

        console.log(`Searching for user: ${email}`);
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('USER NOT FOUND');
        } else {
            console.log('USER FOUND');
            console.log(`Stored Hash: ${user.password}`);
            console.log(`isActive: ${user.isActive}`);

            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`Bcrypt compare for "${password}": ${isMatch}`);

            const isMatchMethod = await user.comparePassword(password);
            console.log(`Model method compare: ${isMatchMethod}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

testLogin();
