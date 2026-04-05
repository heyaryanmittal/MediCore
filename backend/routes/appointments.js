const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Bill = require('../models/Bill');
const razorpay = require('../utils/razorpay');

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

    const { doctorId, date, timeSlot, symptoms, consultationType, patientDocuments } = req.body;

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
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[appointmentDate.getUTCDay()];

    if (!doctor.availability?.days?.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayOfWeek}s. Available days: ${doctor.availability?.days?.join(', ') || 'None'}`
      });
    }

    // Check if doctor is on leave on this date
    let dateString;
    try {
      dateString = appointmentDate.toISOString().split('T')[0];
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Could not process date'
      });
    }

    if (doctor.leaves && doctor.leaves.includes(dateString)) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is on leave on this date'
      });
    }

    // Check if time slot is within doctor's available hours
    const isTimeSlotValid = doctor.availability?.timeSlots?.some(slot => {
      return timeSlot.start >= slot.start && timeSlot.end <= slot.end;
    }) || false;

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
      patientDocuments: patientDocuments || [],
      consultationType: consultationType || 'in-person'
    });

    await appointment.save();

    // Populate appointment details for response
    try {
      await appointment.populate([
        { path: 'doctorId', populate: { path: 'userId', select: 'profile' } },
        { path: 'patientId', populate: { path: 'userId', select: 'profile' } }
      ]);
    } catch (populateError) {
      console.error('Populate error:', populateError);
      // We still have the appointment ID, so we can return it at least
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment }
    });
  } catch (error) {
    require('fs').writeFileSync('d:/MediCore/backend/last_error.txt', (error.stack || error.message) + '\n');
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error booking appointment',
      error: error.message
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
        query.status = { $ne: 'pending' }; // Doctors should not see pending appointments
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

    // Add status filter if provided — but never let it override role-based guards.
    // Doctors already have query.status = { $ne: 'pending' }; we must not overwrite it
    // with a raw string that could expose pending appointments back to the doctor.
    if (req.query.status) {
      if (req.user.role === 'doctor') {
        // Doctors can only filter within the statuses they're allowed to see
        const allowedDoctorStatuses = ['confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled'];
        if (allowedDoctorStatuses.includes(req.query.status)) {
          query.status = req.query.status; // safe to override with a specific allowed status
        }
        // ignore any other status (e.g. 'pending') — leave the $ne guard intact
      } else {
        query.status = req.query.status;
      }
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
  body('status').isIn(['confirmed', 'pending', 'checked_in', 'checked_out', 'cancelled', 'completed'])
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

    // Strict workflow state-machine enforcement
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Can only update your own appointments'
        });
      }

      // Doctors can ONLY perform these transitions (in sequence):
      //   confirmed  → checked_in
      //   checked_in → checked_out
      // Prescription creation (which sets 'completed') is handled separately in /doctor/prescription
      const allowedDoctorTransitions = {
        confirmed: 'checked_in',
        checked_in: 'checked_out'
      };

      const expectedNext = allowedDoctorTransitions[appointment.status];
      if (!expectedNext || status !== expectedNext) {
        return res.status(403).json({
          success: false,
          message: `Cannot transition from '${appointment.status}' to '${status}'. Allowed: ${expectedNext ? `'${expectedNext}'` : 'none'}`
        });
      }
    }

    // Receptionist / superadmin state-machine:
    //   pending    → confirmed  (confirm the booking)
    //   pending    → cancelled  (reject it)
    //   confirmed  → cancelled  (cancel after confirmation)
    //   checked_in → cancelled  (emergency cancel)
    // Anything else is invalid — receptionists must NOT jump over statuses.
    if (req.user.role === 'receptionist' || req.user.role === 'superadmin') {
      const allowedReceptionistTransitions = {
        pending:    ['confirmed', 'cancelled'],
        confirmed:  ['cancelled'],
        checked_in: ['cancelled'],
        // checked_out & completed: visit is done — cancellation not permitted
      };
      const allowed = allowedReceptionistTransitions[appointment.status] || [];
      if (!allowed.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `Cannot transition appointment from '${appointment.status}' to '${status}'.`
        });
      }
    }

    // Update appointment
    appointment.status = status;

    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = req.user._id;

      // Actual Razorpay Refund logic
      if (appointment.paymentStatus === 'paid' && appointment.paymentDetails.paymentId) {
        try {
          // Check if it's not a mock order
          if (!appointment.paymentDetails.orderId?.startsWith('order_mock_') && razorpay) {
            await razorpay.payments.refund(appointment.paymentDetails.paymentId, {
              notes: {
                reason: 'Cancelled by receptionist/doctor/admin',
                appointmentId: appointment._id.toString()
              }
            });
          }
          appointment.paymentStatus = 'refunded';

          // Update associated bill if it exists
          try {
            await Bill.findOneAndUpdate(
              { appointmentId: appointment._id, status: 'paid' },
              { status: 'refunded' }
            );
          } catch (billUpdateError) {
            console.error('Failed to update associated bill status:', billUpdateError);
          }
        } catch (refundError) {
          console.error('Refund processing failed during status update:', refundError);
          // We still update the status but maybe note that the refund failed
          appointment.notes = (appointment.notes || '') + '\n[Refund Failed: Please process manually]';
        }
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

    // Actual Razorpay Refund logic
    if (appointment.paymentStatus === 'paid' && appointment.paymentDetails.paymentId) {
      try {
        // Check if it's not a mock order
        if (!appointment.paymentDetails.orderId?.startsWith('order_mock_') && razorpay) {
          await razorpay.payments.refund(appointment.paymentDetails.paymentId, {
            notes: {
              reason: reason || 'Cancelled by patient',
              appointmentId: appointmentId.toString()
            }
          });
        }
        appointment.paymentStatus = 'refunded';

        // Update associated bill if it exists
        try {
          await Bill.findOneAndUpdate(
            { appointmentId: appointmentId, status: 'paid' },
            { status: 'refunded' }
          );
        } catch (billUpdateError) {
          console.error('Failed to update associated bill status during cancellation:', billUpdateError);
        }
      } catch (refundError) {
        console.error('Refund processing failed during patient cancellation:', refundError);
        // We still cancel but note the refund problem
        appointment.notes = (appointment.notes || '') + '\n[Refund Failed: Please contact admin]';
      }
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
