const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Bill = require('../models/Bill');
const LabReport = require('../models/LabReport');
const ContactMessage = require('../models/ContactMessage');

async function showAllRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const collections = [
      { name: 'Users', model: User },
      { name: 'Doctors', model: Doctor },
      { name: 'Patients', model: Patient },
      { name: 'Appointments', model: Appointment },
      { name: 'Prescriptions', model: Prescription },
      { name: 'Bills', model: Bill },
      { name: 'Lab Reports', model: LabReport },
      { name: 'Contact Messages', model: ContactMessage }
    ];

    console.log('--- DATABASE CURRENT STATE ---\n');

    for (const col of collections) {
      const records = await col.model.find({}).lean();
      console.log(`[${col.name}] (${records.length} records)`);
      if (records.length > 0) {
        records.forEach(r => {
          // Clean up for display
          const display = { ...r };
          delete display.password;
          delete display.refreshToken;
          delete display.__v;
          console.log(JSON.stringify(display, null, 2));
        });
      }
      console.log('------------------------------');
    }

    process.exit(0);
  } catch (error) {
    console.error('Fetch failed:', error);
    process.exit(1);
  }
}

showAllRecords();
