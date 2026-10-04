const Bill = require('../models/Bill');

/**
 * Helper to process refund for paid appointments and update associated Bill status.
 */
const processAppointmentRefund = async (appointment, defaultReason = 'Cancelled') => {
  if (appointment.paymentStatus === 'paid') {
    try {
      appointment.paymentStatus = 'refunded';

      try {
        await Bill.findOneAndUpdate(
          { appointmentId: appointment._id, status: 'paid' },
          { status: 'refunded' }
        );
      } catch (billUpdateError) {
        console.error('Failed to update associated bill status during refund:', billUpdateError);
      }
    } catch (refundError) {
      console.error('Refund processing failed:', refundError);
      appointment.notes = (appointment.notes || '') + '\n[Refund Failed: Please process manually]';
    }
  }
};

module.exports = { processAppointmentRefund };

