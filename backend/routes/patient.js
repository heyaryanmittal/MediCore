const express = require('express');
const router = express.Router();
const { authenticateToken, patientOnly } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');

// Public endpoint - Get available doctors (no authentication required)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isAvailable: true })
      .populate('userId', 'profile')
      .sort({ 'rating.average': -1 });

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching doctors'
    });
  }
});

// All patient routes below require patient authentication
router.use(authenticateToken);
router.use(patientOnly);

// Middleware to attach patient record to request
// This is necessary because some models store patientId (from Patient collection) 
// instead of userId (from User collection)
const attachPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile record not found'
      });
    }
    req.patient = patient;
    next();
  } catch (error) {
    console.error('Attach patient error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving patient profile' });
  }
};

router.use(attachPatient);

// Get patient profile
router.get('/profile', async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate('userId', 'email profile')
      .populate('medicalHistory.doctor', 'profile');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update patient profile
router.patch('/profile', async (req, res) => {
  try {
    const { bloodGroup, emergencyContact, insuranceInfo, allergies } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      {
        bloodGroup,
        emergencyContact,
        insuranceInfo,
        allergies
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { patient }
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// Get doctor availability
router.get('/doctor/:doctorId/availability', async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId)
      .populate('userId', 'profile');

    if (!doctor || !doctor.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    // Get booked slots for the next 7 days
    const today = new Date();
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: today, $lte: weekLater },
      status: { $in: ['confirmed', 'pending'] }
    }).select('date timeSlot');

    res.json({
      success: true,
      data: {
        doctor,
        availability: doctor.availability,
        bookedSlots: bookedAppointments,
        leaves: doctor.leaves || []
      }
    });
  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching availability'
    });
  }
});

// Get patient appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.patient._id })
      .populate('doctorId')
      .populate('doctorId.userId', 'profile')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointments'
    });
  }
});

// Get patient bills
router.get('/bills', async (req, res) => {
  try {
    const bills = await Bill.find({ patientId: req.patient._id })
      .populate('createdBy', 'profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { bills }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bills'
    });
  }
});

// Get patient prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.patient._id })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'profile'
        }
      })
      .sort({ createdAt: -1 });

    // Map fields to match frontend expectations
    const mappedPrescriptions = prescriptions.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        medications: obj.medicines, // map medicines to medications
        instructions: obj.advice   // map advice to instructions
      };
    });

    res.json({
      success: true,
      data: { prescriptions: mappedPrescriptions }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching prescriptions'
    });
  }
});

// Get patient lab reports
router.get('/lab-reports', async (req, res) => {
  try {
    const labReports = await LabReport.find({ patientId: req.patient._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profile' }
      })
      .populate('uploadedBy', 'profile')
      .sort({ reportDate: -1 });

    res.json({
      success: true,
      data: { labReports }
    });
  } catch (error) {
    console.error('Get lab reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching lab reports'
    });
  }
});

// End of patient routes
module.exports = router;
