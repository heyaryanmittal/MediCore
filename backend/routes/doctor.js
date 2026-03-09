const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { authenticateToken, doctorOnly, authorizeRoles } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

const { prescriptionStorage } = require('../config/cloudinary');

// Configure multer for prescription uploads using Cloudinary
const upload = multer({
  storage: prescriptionStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication middleware for all doctor routes
router.use(authenticateToken);

// Update doctor availability (doctors update their own, receptionist/superadmin can update any doctor)
// This route is placed BEFORE doctorOnly middleware to allow other authorized roles
router.patch('/availability', [
  body('days').isArray(),
  body('timeSlots').isArray(),
  body('doctorId').optional().isMongoId() // For receptionist/superadmin to update specific doctor
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { days, timeSlots, doctorId } = req.body;
    let doctor;

    // Check authorization
    if (req.user.role === 'doctor') {
      // Doctors can only update their own availability
      doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }
    } else if (req.user.role === 'receptionist' || req.user.role === 'superadmin') {
      // Receptionists and superadmins can update any doctor's availability
      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: 'doctorId is required for receptionist/superadmin'
        });
      }
      doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only doctors, receptionists, and superadmins can update availability'
      });
    }

    doctor.availability = { days, timeSlots };
    await doctor.save();

    // Populate before sending back to UI
    await doctor.populate('userId', 'email profile isActive lastLogin');

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { doctor }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating availability'
    });
  }
});

// All routes below this line require doctor-specific authentication
router.use(doctorOnly);

// Get doctor dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Today's Patients
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayPatients = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    // Total Network (Unique Patients)
    const uniquePatients = await Appointment.distinct('patientId', {
      doctorId: doctor._id
    });
    const totalNetwork = uniquePatients.length;

    // Active Scripts (Total Prescriptions Issued)
    const activeScripts = await Prescription.countDocuments({
      doctorId: doctor._id
    });

    // Recent Interactions
    const recentInteractions = await Appointment.find({
      doctorId: doctor._id,
      status: 'completed'
    })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'profile'
        }
      })
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          todayPatients,
          totalNetwork,
          activeScripts
        },
        recentInteractions: recentInteractions.map(interaction => ({
          id: interaction._id,
          patientName: `${interaction.patientId?.userId?.profile?.firstName || 'Unknown'} ${interaction.patientId?.userId?.profile?.lastName || 'Patient'}`,
          procedure: interaction.reason || 'Consultation',
          time: interaction.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get doctor dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats'
    });
  }
});

// Get doctor profile
router.get('/profile', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'email profile');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Get assigned appointments
router.get('/appointments', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    let query = { doctorId: doctor._id };

    // Add date filter if provided
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId')
      .populate('patientId.userId', 'profile')
      .populate('prescription')
      .sort({ date: -1, 'timeSlot.start': -1 });

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

// Get patient medical history
router.get('/patient/:patientId/history', async (req, res) => {
  try {
    const { patientId } = req.params;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const patient = await Patient.findById(patientId)
      .populate('userId', 'profile')
      .populate('medicalHistory.doctor', 'profile');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching patient history'
    });
  }
});

// Create prescription
router.post('/prescription', [
  body('appointmentId').isMongoId(),
  body('diagnosis').notEmpty().trim(),
  body('medicines').isArray(),
  body('medicines.*.name').notEmpty().trim(),
  body('medicines.*.dosage').notEmpty().trim(),
  body('medicines.*.frequency').notEmpty().trim(),
  body('medicines.*.duration').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { appointmentId, diagnosis, medicines, tests, advice, followUpDate } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create prescription
    const prescription = new Prescription({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: doctor._id,
      diagnosis,
      medicines,
      tests: tests || [],
      advice,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined
    });

    await prescription.save();

    // Link prescription to appointment
    appointment.prescription = prescription._id;
    appointment.status = 'completed';
    await appointment.save();

    // Populate for response
    await prescription.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'profile' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'profile' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { prescription }
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating prescription'
    });
  }
});

// Get prescription by appointment ID
router.get('/prescription/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const prescription = await Prescription.findOne({ appointmentId })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'profile' } });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      data: { prescription }
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching prescription'
    });
  }
});

// Update prescription
router.patch('/prescription/:prescriptionId', [
  body('diagnosis').optional().trim(),
  body('medicines').optional().isArray(),
  body('medicines.*.name').optional().notEmpty().trim(),
  body('medicines.*.dosage').optional().notEmpty().trim(),
  body('medicines.*.frequency').optional().notEmpty().trim(),
  body('medicines.*.duration').optional().notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { prescriptionId } = req.params;
    const { diagnosis, medicines, tests, advice, followUpDate } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if prescription belongs to this doctor
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (medicines) prescription.medicines = medicines;
    if (tests) prescription.tests = tests;
    if (advice) prescription.advice = advice;
    if (followUpDate) prescription.followUpDate = new Date(followUpDate);

    await prescription.save();

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: { prescription }
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating prescription'
    });
  }
});

// Upload prescription receipt
router.post('/prescription/:prescriptionId/receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { prescriptionId } = req.params;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if prescription belongs to this doctor
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update prescription with file path
    prescription.receipt = req.file.path;
    await prescription.save();

    res.json({
      success: true,
      message: 'Prescription receipt uploaded successfully',
      data: {
        filename: req.file.path,
        prescription
      }
    });
  } catch (error) {
    console.error('Upload prescription receipt error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error uploading receipt'
    });
  }
});

// Get doctor's prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const prescriptions = await Prescription.find({ doctorId: doctor._id })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'profile'
        }
      })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'profile'
        }
      })
      .populate('appointmentId', 'date timeSlot')
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

// Mark appointment as completed
router.patch('/appointment/:appointmentId/complete', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    appointment.status = 'completed';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      data: { appointment }
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing appointment'
    });
  }
});

module.exports = router;
