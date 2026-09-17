const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"MediCore" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendPaymentConfirmationEmail = async (patientEmail, appointmentDetails) => {
  const { doctorName, date, time, amount, paymentId } = appointmentDetails;

  const subject = 'Appointment Confirmation and Payment Received';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-top: 6px solid #0d9488; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); color: #374151;">
      
      <h2 style="color: #111827; margin-top: 0; margin-bottom: 24px; font-size: 24px; font-weight: 700;">Appointment Confirmed!</h2>
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hi there,</p>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">Thank you for choosing MediCore. Your appointment is confirmed and we've successfully received your payment of <strong>₹${amount}</strong>.</p>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <div style="background-color: #f9fafb; padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Booking Details</h3>
        </div>
        <div style="padding: 20px; font-size: 15px; line-height: 1.8;">
          <div style="display: flex; margin-bottom: 8px;">
            <strong style="color: #111827; width: 120px; flex-shrink: 0;">Doctor:</strong> 
            <span>Dr. ${doctorName}</span>
          </div>
          <div style="display: flex; margin-bottom: 8px;">
            <strong style="color: #111827; width: 120px; flex-shrink: 0;">Date:</strong> 
            <span>${date}</span>
          </div>
          <div style="display: flex; margin-bottom: 8px;">
            <strong style="color: #111827; width: 120px; flex-shrink: 0;">Time:</strong> 
            <span>${time}</span>
          </div>
          <div style="display: flex; margin-bottom: 8px;">
            <strong style="color: #111827; width: 120px; flex-shrink: 0;">Amount Paid:</strong> 
            <span style="color: #059669; font-weight: 600;">₹${amount}</span>
          </div>
          <div style="display: flex;">
            <strong style="color: #111827; width: 120px; flex-shrink: 0;">Reference ID:</strong> 
            <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #6b7280; font-size: 14px;">${paymentId}</span>
          </div>
        </div>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 32px; color: #4b5563;">
        Please plan to arrive <strong>10 minutes early</strong>. If you need to reschedule or cancel, kindly let us know at least 24 hours in advance.
      </p>
      
      <div style="padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 4px; margin-top: 0;">MediCore Care Team</p>
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: patientEmail, subject, html });
};

const sendPasswordResetEmail = async (userEmail, resetUrl, resetToken) => {
  const subject = 'MediCore Password Reset Request';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-top: 6px solid #0d9488; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); color: #374151;">
      <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 700;">Password Reset Request</h2>
      <p style="font-size: 16px; line-height: 1.6;">You requested a password reset for your MediCore account.</p>
      <p style="font-size: 16px; line-height: 1.6;">Your 6-digit reset code is:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0d9488; background-color: #f0fdf4; padding: 12px 24px; border-radius: 8px; border: 1px border #0d9488;">${resetToken}</span>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">This code will expire in 1 hour. If you did not request this password reset, please ignore this email.</p>
      <div style="padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; margin-top: 32px;">
        <p style="font-size: 14px; color: #6b7280; font-weight: 600; margin: 0;">MediCore Security Team</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

module.exports = {
  sendEmail,
  sendPaymentConfirmationEmail,
  sendPasswordResetEmail
};
