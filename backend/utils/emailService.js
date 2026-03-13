const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `MediCore <${process.env.FROM_EMAIL || 'noreply@medicore.com'}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Send email error:', error);
    // Don't throw error to avoid breaking the main flow, just log it
  }
};

const sendAppointmentConfirmation = async (patient, appointment, doctor) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #0d9488; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Appointment Confirmed</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear <strong>${patient.firstName} ${patient.lastName}</strong>,</p>
        <p>Your appointment has been successfully booked and the payment has been received.</p>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #eee;">
          <h3 style="margin-top: 0; color: #0d9488;">Appointment Details</h3>
          <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${appointment.consultationType.toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> CONFIRMED</p>
        </div>

        <div style="background-color: #f0fdfa; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #ccfbf1;">
          <h3 style="margin-top: 0; color: #0d9488;">Payment Details</h3>
          <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${appointment.paymentDetails.paymentId}</p>
          <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${appointment.paymentDetails.amount}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> PAID</p>
        </div>

        <p>You can view your bill and appointment history in the patient portal.</p>
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>The MediCore Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} MediCore Hospital Management System. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: patient.email,
    subject: `Appointment Confirmed - Dr. ${doctor.firstName} ${doctor.lastName}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendAppointmentConfirmation
};
