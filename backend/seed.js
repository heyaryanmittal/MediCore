const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
require('dotenv').config();

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USERS = [
    {
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
    },
    {
        email: 'receptionist@medicore.com',
        password: 'Recep@1234',
        role: 'receptionist',
        profile: {
            firstName: 'Priya',
            lastName: 'Sharma',
            phone: '9000000002',
            gender: 'female',
            address: 'MediCore Reception, New Delhi'
        }
    },
    {
        email: 'doctor@medicore.com',
        password: 'Doctor@1234',
        role: 'doctor',
        profile: {
            firstName: 'Rajesh',
            lastName: 'Verma',
            phone: '9000000003',
            gender: 'male',
            address: 'MediCore Hospital, New Delhi'
        },
        // Extra doctor-profile data
        doctorProfile: {
            specialization: 'General Medicine',
            qualifications: 'MBBS, MD',
            experience: 10,
            licenseNumber: 'MCI-2024-001',
            department: 'Internal Medicine',
            consultationFee: 500,
            availability: {
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                timeSlots: [
                    { start: '09:00', end: '09:30' },
                    { start: '09:30', end: '10:00' },
                    { start: '10:00', end: '10:30' },
                    { start: '10:30', end: '11:00' },
                    { start: '11:00', end: '11:30' },
                    { start: '11:30', end: '12:00' },
                    { start: '14:00', end: '14:30' },
                    { start: '14:30', end: '15:00' },
                    { start: '15:00', end: '15:30' },
                    { start: '15:30', end: '16:00' },
                ]
            }
        }

    },
    {
        email: 'patient@medicore.com',
        password: 'Patient@1234',
        role: 'patient',
        profile: {
            firstName: 'Aryan',
            lastName: 'Mittal',
            phone: '9000000004',
            gender: 'male',
            dateOfBirth: new Date('2000-01-15'),
            address: 'Sector 21, Gurugram, Haryana'
        }
    }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const upsertUser = async (data) => {
    const { doctorProfile, ...userData } = data;

    let user = await User.findOne({ email: userData.email }).select('+password');

    if (user) {
        console.log(`  ↻  ${userData.role} already exists — resetting password...`);
        user.password = userData.password; // triggers pre-save hash
        user.isActive = true;
        await user.save();
    } else {
        console.log(`  +  Creating ${userData.role}: ${userData.email}`);
        user = new User({ ...userData, isActive: true });
        await user.save();
    }

    // Create linked Doctor / Patient profile if needed
    if (userData.role === 'doctor') {
        const existing = await Doctor.findOne({ userId: user._id });
        if (!existing) {
            await new Doctor({ userId: user._id, ...doctorProfile }).save();
            console.log(`     → Doctor profile created`);
        } else if (doctorProfile) {
            await Doctor.findOneAndUpdate({ userId: user._id }, doctorProfile);
            console.log(`     → Doctor profile updated`);
        }
    }

    if (userData.role === 'patient') {
        const existing = await Patient.findOne({ userId: user._id });
        if (!existing) {
            await new Patient({ userId: user._id }).save();
            console.log(`     → Patient profile created`);
        }
    }

    return user;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
    try {
        console.log('\n══════════════════════════════════════════');
        console.log('  MediCore Database Seeder');
        console.log('══════════════════════════════════════════');
        console.log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore', {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        console.log('✓ Connected\n');

        console.log('Seeding users...');
        for (const userData of SEED_USERS) {
            await upsertUser(userData);
        }

        console.log('\n══════════════════════════════════════════');
        console.log('  ✓ Seed complete! Login credentials:');
        console.log('══════════════════════════════════════════');
        console.log('  SUPERADMIN   superadmin@medicore.com   / adminmedicore');
        console.log('  RECEPTIONIST receptionist@medicore.com / Recep@1234');
        console.log('  DOCTOR       doctor@medicore.com       / Doctor@1234');
        console.log('  PATIENT      patient@medicore.com      / Patient@1234');
        console.log('══════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Seed failed:', error.message);
        process.exit(1);
    }
};

seed();
