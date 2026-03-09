const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  qualifications: {
    type: String,
    required: true
  },
  experience: {
    type: Number, // years of experience
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  consultationFee: {
    type: Number,
    required: true
  },
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timeSlots: [{
      start: { type: String, required: true }, // e.g., "09:00"
      end: { type: String, required: true }    // e.g., "17:00"
    }]
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  department: {
    type: String,
    required: true
  },
  leaves: [{
    type: String // YYYY-MM-DD
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
