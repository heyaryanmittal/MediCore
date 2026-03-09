const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  medicalHistory: [{
    condition: { type: String, required: true },
    diagnosis: { type: String },
    treatment: { type: String },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  allergies: [{
    type: String
  }],
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date },
    endDate: { type: Date }
  }],
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  insuranceInfo: {
    provider: { type: String },
    policyNumber: { type: String },
    validUntil: { type: Date }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
