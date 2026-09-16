const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { authenticateToken, superAdminOnly } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

router.post('/', async (req, res) => {
  try {
    const { name, email, facility, role, phone, message } = req.body;

    const newMessage = await ContactMessage.create({
      name,
      email,
      facility,
      role,
      phone,
      message
    });

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.get('/', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.put('/:id/status', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

router.post('/:id/reply', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const emailSubject = `Re: Your Inquiry with MediCore`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Hello ${message.name},</h2>
        <p>Thank you for reaching out to MediCore.</p>
        <p style="white-space: pre-line; line-height: 1.6;">${replyMessage}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 0.9em;">
          <strong>Your Original Message:</strong><br />
          ${message.message}
        </p>
      </div>
    `;

    await sendEmail({
      to: message.email,
      subject: emailSubject,
      html: emailHtml
    });

    message.status = 'replied';
    await message.save();

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;

