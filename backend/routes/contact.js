const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { authenticateToken, superAdminOnly } = require('../middleware/auth');

const { sendEmail } = require('../utils/emailService');

// @route   POST /api/contact
// @desc    Submit a contact sales message
// @access  Public
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
    console.error('Error in contact form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact sales messages
// @access  Private/SuperAdmin
router.get('/', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @route   PUT /api/contact/:id/status
// @desc    Update message status
// @access  Private/SuperAdmin
router.put('/:id/status', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @route   POST /api/contact/:id/reply
// @desc    Reply to a contact message and set status to replied
// @access  Private/SuperAdmin
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

    // Send email to standard user
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

    // Fire & Forget email or await it
    await sendEmail({
      to: message.email,
      subject: emailSubject,
      html: emailHtml
    });

    // Update message status directly to replied
    message.status = 'replied';
    await message.save();

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
