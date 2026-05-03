const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Doctor = require('../models/Doctor');

const doctorData = [
  {
    firstName: "Mohit",
    lastName: "Bansal",
    email: "mohit@medicore.doc",
    password: "mohit123",
    role: "doctor",
    phone: "9876543210",
    specialization: "Interventional Cardiology",
    qualifications: "MBBS, MD, DM (Cardiology)",
    experience: 12,
    licenseNumber: "MC-DOC-2024-001",
    consultationFee: 800,
    department: "Cardiology",
    gender: "male"
  },
  {
    firstName: "Deepak",
    lastName: "Mishra",
    email: "deepak@medicore.doc",
    password: "deepak123",
    role: "doctor",
    phone: "9876543211",
    specialization: "Clinical Neurology",
    qualifications: "MBBS, MD, DM (Neurology)",
    experience: 10,
    licenseNumber: "MC-DOC-2024-002",
    consultationFee: 750,
    department: "Neurology",
    gender: "male"
  },
  {
    firstName: "Parekh",
    lastName: "Jain",
    email: "parekh@medicore.doc",
    password: "parekh123",
    role: "doctor",
    phone: "9876543212",
    specialization: "Joint Replacement & Trauma",
    qualifications: "MBBS, MS (Orthopedics)",
    experience: 8,
    licenseNumber: "MC-DOC-2024-003",
    consultationFee: 600,
    department: "Orthopedics",
    gender: "male"
  },
  {
    firstName: "Harsh",
    lastName: "Saxena",
    email: "harsh@medicore.doc",
    password: "harsh123",
    role: "doctor",
    phone: "9876543213",
    specialization: "General Pediatrics",
    qualifications: "MBBS, MD (Pediatrics)",
    experience: 6,
    licenseNumber: "MC-DOC-2024-004",
    consultationFee: 500,
    department: "Pediatrics",
    gender: "male"
  },
  {
    firstName: "Tejas",
    lastName: "Shetty",
    email: "tejas@medicore.doc",
    password: "tejas123",
    role: "doctor",
    phone: "9876543214",
    specialization: "Hepatology & Gastroscopy",
    qualifications: "MBBS, MD, DM (Gastroenterology)",
    experience: 9,
    licenseNumber: "MC-DOC-2024-005",
    consultationFee: 700,
    department: "Gastroenterology",
    gender: "male"
  },
  {
    firstName: "Ritu",
    lastName: "Aggarwal",
    email: "ritu@medicore.doc",
    password: "ritu123",
    role: "doctor",
    phone: "8765432100",
    specialization: "Obstetrics & Gynecology",
    qualifications: "MBBS, MS (Gynecology)",
    experience: 11,
    licenseNumber: "MC-DOC-2024-006",
    consultationFee: 800,
    department: "Gynecology & Obstetrics",
    gender: "female"
  },
  {
    firstName: "Divya",
    lastName: "Pillai",
    email: "divya@medicore.doc",
    password: "divya123",
    role: "doctor",
    phone: "8765432101",
    specialization: "Cosmetic Dermatology",
    qualifications: "MBBS, MD (Dermatology)",
    experience: 7,
    licenseNumber: "MC-DOC-2024-007",
    consultationFee: 650,
    department: "Dermatology",
    gender: "female"
  },
  {
    firstName: "Kavya",
    lastName: "Malhotra",
    email: "kavya@medicore.doc",
    password: "kavya123",
    role: "doctor",
    phone: "8765432102",
    specialization: "Surgical Oncology",
    qualifications: "MBBS, MS, MCh (Oncology)",
    experience: 13,
    licenseNumber: "MC-DOC-2024-008",
    consultationFee: 1000,
    department: "Oncology",
    gender: "female"
  },
  {
    firstName: "Vedika",
    lastName: "Batra",
    email: "vedika@medicore.doc",
    password: "vedika123",
    role: "doctor",
    phone: "8765432103",
    specialization: "Diagnostic Radiology",
    qualifications: "MBBS, MD (Radiology)",
    experience: 5,
    licenseNumber: "MC-DOC-2024-009",
    consultationFee: 550,
    department: "Radiology",
    gender: "female"
  },
  {
    firstName: "Charu",
    lastName: "Grover",
    email: "charu@medicore.doc",
    password: "charu123",
    role: "doctor",
    phone: "8765432104",
    specialization: "Internal Medicine",
    qualifications: "MBBS, MD (General Medicine)",
    experience: 15,
    licenseNumber: "MC-DOC-2024-010",
    consultationFee: 900,
    department: "General Medicine",
    gender: "female"
  }
];

const seedDoctors = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    for (const doc of doctorData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: doc.email });
      if (existingUser) {
        console.log(`! User ${doc.email} already exists, skipping...`);
        continue;
      }

      // 1. Create User
      const user = new User({
        email: doc.email,
        password: doc.password,
        role: 'doctor',
        profile: {
          firstName: doc.firstName,
          lastName: doc.lastName,
          phone: doc.phone,
          gender: doc.gender
        }
      });

      const savedUser = await user.save();

      // 2. Create Doctor
      const doctor = new Doctor({
        userId: savedUser._id,
        specialization: doc.specialization,
        qualifications: doc.qualifications,
        experience: doc.experience,
        licenseNumber: doc.licenseNumber,
        consultationFee: doc.consultationFee,
        department: doc.department,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeSlots: [
            { start: "09:00", end: "13:00" },
            { start: "14:00", end: "17:00" }
          ]
        }
      });

      await doctor.save();
      console.log(`✓ Created Doctor: Dr. ${doc.firstName} ${doc.lastName} (${doc.email})`);
    }

    console.log('✓ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
};

seedDoctors();
