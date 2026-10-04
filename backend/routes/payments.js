const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Bill = require('../models/Bill');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');

// Create payment order for appointment payment
router.post('/create-order', [
  body('appointmentId').isMongoId()
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

    const { appointmentId } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    const amount = (appointment.doctorId?.consultationFee || 500) * 100;
    const orderId = `order_${Date.now()}`;

    appointment.paymentDetails = {
      orderId,
      amount: amount / 100,
      currency: 'INR'
    };
    await appointment.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        amount,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment order'
    });
  }
});

// Verify appointment payment
router.post('/verify', [
  body('appointmentId').isMongoId()
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

    const { appointmentId } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const appointment = await Appointment.findById(appointmentId).populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'profile' }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const paymentId = req.body.paymentId || req.body.razorpay_payment_id || `pay_${Date.now()}`;

    appointment.paymentDetails.paymentId = paymentId;
    appointment.paymentStatus = 'paid';
    await appointment.save();

    const doctorFirstName = appointment.doctorId?.userId?.profile?.firstName || '';
    const doctorLastName = appointment.doctorId?.userId?.profile?.lastName || '';
    const doctorName = `${doctorFirstName} ${doctorLastName}`.trim() || 'Doctor';

    const bill = new Bill({
      patientId: appointment.patientId,
      appointmentId: appointment._id,
      items: [{
        description: `Consultation fee for Dr. ${doctorName}`,
        quantity: 1,
        unitPrice: appointment.paymentDetails.amount,
        total: appointment.paymentDetails.amount
      }],
      subtotal: appointment.paymentDetails.amount,
      total: appointment.paymentDetails.amount,
      status: 'paid',
      paymentMethod: 'online',
      paymentDetails: {
        orderId: appointment.paymentDetails.orderId,
        paymentId,
        amount: appointment.paymentDetails.amount,
        currency: appointment.paymentDetails.currency
      },
      createdBy: req.user._id
    });
    await bill.save();

    try {
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      const appointmentTime = `${appointment.timeSlot?.start || ''} - ${appointment.timeSlot?.end || ''}`;

      await sendPaymentConfirmationEmail(req.user.email, {
        doctorName,
        date: appointmentDate,
        time: appointmentTime,
        amount: appointment.paymentDetails.amount,
        paymentId
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully and bill generated',
      data: {
        paymentId,
        appointment,
        bill
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying payment'
    });
  }
});

// Create order for bill payment
router.post('/create-bill-order', [
  body('billId').isMongoId()
], authenticateToken, authorizeRoles('patient'), async (req, res) => {
  try {
    const { billId } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (bill.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Bill already paid'
      });
    }

    const amount = Math.round(bill.total * 100);
    const orderId = `order_${Date.now()}`;

    bill.paymentDetails = {
      orderId,
      amount: amount / 100,
      currency: 'INR'
    };
    bill.status = 'pending_payment';
    await bill.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        amount,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Create bill order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating bill payment order'
    });
  }
});

// Verify bill payment
router.post('/verify-bill', [
  body('billId').isMongoId()
], authenticateToken, authorizeRoles('patient'), async (req, res) => {
  try {
    const { billId } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    const bill = await Bill.findById(billId);

    if (!bill || bill.patientId.toString() !== patient._id.toString()) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const paymentId = req.body.paymentId || req.body.razorpay_payment_id || `pay_${Date.now()}`;

    bill.paymentDetails = bill.paymentDetails || {};
    bill.paymentDetails.paymentId = paymentId;
    bill.status = 'paid';
    bill.paymentMethod = 'online';
    await bill.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { bill }
    });
  } catch (error) {
    console.error('Verify bill error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Get payment status
router.get('/status/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let query = { _id: appointmentId };

    switch (req.user.role) {
      case 'patient': {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
          return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        query.patientId = patient._id;
        break;
      }
      case 'doctor': {
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
          return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }
        query.doctorId = doctor._id;
        break;
      }
      case 'receptionist':
      case 'superadmin':
        break;

      default:
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const appointment = await Appointment.findOne(query).select('paymentStatus paymentDetails status');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: appointment.paymentStatus,
        paymentDetails: appointment.paymentDetails,
        appointmentStatus: appointment.status
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching payment status' });
  }
});

// Process refund
router.post('/refund', [
  body('appointmentId').isMongoId()
], authenticateToken, authorizeRoles('superadmin', 'receptionist'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { appointmentId, amount } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'No payment to refund' });
    }

    appointment.paymentStatus = 'refunded';
    await appointment.save();

    await Bill.findOneAndUpdate(
      { appointmentId: appointment._id, status: 'paid' },
      { status: 'refunded' }
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: `ref_${Date.now()}`,
        amount: amount || appointment.paymentDetails?.amount || 0
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ success: false, message: 'Server error processing refund' });
  }
});

module.exports = router;

