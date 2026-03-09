const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const listUsers = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const users = await User.find({}).select('email role isActive');
        console.log('Users in database:');
        users.forEach(u => console.log(`- ${u.email} (${u.role}) Active: ${u.isActive}`));

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

listUsers();
