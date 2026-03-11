const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  results: [{
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    normalRange: { type: String },
    unit: { type: String },
    status: { type: String, enum: ['normal', 'high', 'low', 'critical'] }
  }],
  conclusion: {
    type: String
  },
  recommendations: {
    type: String
  },
  reportFile: {
    type: String, // file path
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indices for performance
labReportSchema.index({ patientId: 1 });
labReportSchema.index({ doctorId: 1 });
labReportSchema.index({ reportDate: -1 });

module.exports = mongoose.model('LabReport', labReportSchema);
