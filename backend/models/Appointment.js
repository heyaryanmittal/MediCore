const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    orderId: { type: String },
    paymentId: { type: String },
    amount: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  consultationType: {
    type: String,
    enum: ['in-person', 'video'],
    default: 'in-person'
  },
  symptoms: {
    type: String
  },
  notes: {
    type: String
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  cancellationReason: {
    type: String
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for preventing double bookings
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
