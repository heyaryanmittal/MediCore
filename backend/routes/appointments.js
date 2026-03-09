const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Book appointment (patient only)
router.post('/book', [
  body('doctorId').isMongoId(),
  body('date').isISO8601(),
  body('timeSlot.start').notEmpty(),
  body('timeSlot.end').notEmpty(),
  body('symptoms').optional().isString()
], authenticateToken, authorizeRoles('patient'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { doctorId, date, timeSlot, symptoms, consultationType } = req.body;

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    // Check if doctor is available on this day and time
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    if (!doctor.availability.days.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayOfWeek}s. Available days: ${doctor.availability.days.join(', ')}`
      });
    }

    // Check if doctor is on leave on this date
    const dateString = appointmentDate.toISOString().split('T')[0];
    if (doctor.leaves && doctor.leaves.includes(dateString)) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is on leave on this date'
      });
    }

    // Check if time slot is within doctor's available hours
    const isTimeSlotValid = doctor.availability.timeSlots.some(slot => {
      return timeSlot.start >= slot.start && timeSlot.end <= slot.end;
    });

    if (!isTimeSlotValid) {
      return res.status(400).json({
        success: false,
        message: 'Time slot not within doctor\'s available hours'
      });
    }

    // Check for double booking
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      'timeSlot.start': timeSlot.start,
      'timeSlot.end': timeSlot.end,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Get patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      date: appointmentDate,
      timeSlot,
      symptoms,
      consultationType: consultationType || 'in-person'
    });

    await appointment.save();

    // Populate appointment details for response
    await appointment.populate([
      { path: 'doctorId', populate: { path: 'userId', select: 'profile' } },
      { path: 'patientId', populate: { path: 'userId', select: 'profile' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error booking appointment'
    });
  }
});

// Get appointments (based on user role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let appointments;
    let query = {};

    switch (req.user.role) {
      case 'patient':
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
          });
        }
        query.patientId = patient._id;
        break;

      case 'doctor':
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
          });
        }
        query.doctorId = doctor._id;
        break;

      case 'receptionist':
      case 'superadmin':
        // Can see all appointments
        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
    }

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

    appointments = await Appointment.find(query)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profile' }
      })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'profile' }
      })
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

// Update appointment status (receptionist, doctor, superadmin)
router.patch('/:appointmentId/status', [
  body('status').isIn(['confirmed', 'cancelled', 'completed'])
], authenticateToken, authorizeRoles('receptionist', 'doctor', 'superadmin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { appointmentId } = req.params;
    const { status, cancellationReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Additional validation based on role
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Can only update your own appointments'
        });
      }

      // Doctors can only confirm or complete appointments
      if (!['confirmed', 'completed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Doctors can only confirm or complete appointments'
        });
      }
    }

    // Update appointment
    appointment.status = status;

    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = req.user._id;

      // Refund logic would go here
      if (appointment.paymentStatus === 'paid') {
        appointment.paymentStatus = 'refunded';
      }
    }

    await appointment.save();

    // Populate for response
    await appointment.populate([
      { path: 'doctorId', populate: { path: 'userId', select: 'profile' } },
      { path: 'patientId', populate: { path: 'userId', select: 'profile' } }
    ]);

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: { appointment }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating appointment'
    });
  }
});

// Cancel appointment (patient only)
router.patch('/:appointmentId/cancel', [
  body('reason').optional().isString()
], authenticateToken, authorizeRoles('patient'), async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to this patient
    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Can only cancel pending or confirmed appointments
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this appointment'
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = req.user._id;

    // Refund logic would go here
    if (appointment.paymentStatus === 'paid') {
      appointment.paymentStatus = 'refunded';
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling appointment'
    });
  }
});

// Get appointment details
router.get('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    let query = { _id: appointmentId };

    // Add role-based filtering
    switch (req.user.role) {
      case 'patient':
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
          });
        }
        query.patientId = patient._id;
        break;

      case 'doctor':
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
          });
        }
        query.doctorId = doctor._id;
        break;
    }

    const appointment = await Appointment.findOne(query)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profile' }
      })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'profile' }
      })
      .populate('prescription');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointment'
    });
  }
});

module.exports = router;
