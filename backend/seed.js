const mongoose = require('mongoose');
const dns = require('dns');
const User = require('./models/User');
require('dotenv').config();

// DNS fix for MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SUPER_ADMIN_DATA = {
    email: 'superadmin@medicore.com',
    password: 'adminmedicore',
    role: 'superadmin',
    profile: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '9000000001',
        gender: 'other',
        address: 'MediCore HQ, New Delhi'
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const upsertSuperAdmin = async (userData) => {
    let user = await User.findOne({ email: userData.email }).select('+password');

    if (user) {
        console.log(`  ↻  Super Admin already exists — resetting password and profile...`);
        user.password = userData.password;
        user.profile = userData.profile;
        user.isActive = true;
        await user.save();
    } else {
        console.log(`  +  Creating Super Admin: ${userData.email}`);
        user = new User({ ...userData, isActive: true });
        await user.save();
    }
    return user;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
    try {
        console.log('\n══════════════════════════════════════════');
        console.log('  MediCore Super Admin Initializer');
        console.log('══════════════════════════════════════════');
        
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        console.log('✓ Connected\n');

        console.log('Seeding Super Admin...');
        await upsertSuperAdmin(SUPER_ADMIN_DATA);

        console.log('\n══════════════════════════════════════════');
        console.log('  ✓ Setup complete!');
        console.log('══════════════════════════════════════════');
        console.log(`  Email:    ${SUPER_ADMIN_DATA.email}`);
        console.log(`  Password: ${SUPER_ADMIN_DATA.password}`);
        console.log('══════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Setup failed:', error.message);
        if (error.reason) console.error('Reason:', error.reason);
        process.exit(1);
    }
};

seed();

