const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const deleteMedicoreUsers = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Find users with @medicore.com or @medicore.in
        const medicoreUsers = await User.find({ email: { $regex: /@medicore\.(com|in)$/, $options: 'i' } });
        const userIds = medicoreUsers.map(u => u._id);

        if (userIds.length === 0) {
            console.log('No users found with @medicore.com domain.');
            await mongoose.connection.close();
            process.exit(0);
        }

        console.log(`Found ${userIds.length} users with @medicore.com domain:`);
        medicoreUsers.forEach(u => console.log(`- ${u.email} (${u.role})`));

        // Delete from profiles
        const patientResult = await Patient.deleteMany({ userId: { $in: userIds } });
        const doctorResult = await Doctor.deleteMany({ userId: { $in: userIds } });

        // Delete from users
        const userResult = await User.deleteMany({ _id: { $in: userIds } });

        console.log('\nCleanup results:');
        console.log(`- Deleted ${userResult.deletedCount} users from User collection.`);
        console.log(`- Deleted ${patientResult.deletedCount} profiles from Patient collection.`);
        console.log(`- Deleted ${doctorResult.deletedCount} profiles from Doctor collection.`);

        await mongoose.connection.close();
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Error during deletion:', err);
        process.exit(1);
    }
};

deleteMedicoreUsers();
