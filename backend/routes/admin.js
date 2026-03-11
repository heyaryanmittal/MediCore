const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const { authenticateToken, superAdminOnly, superAdminOrReceptionist, authorizeRoles } = require('../middleware/auth');
const {
  getSystemOverview,
  getUserAnalytics,
  getDepartmentStats,
  exportData
} = require('../controllers/superadminController');

// Create or Update Super Admin account
router.post('/seed-superadmin', async (req, res) => {
  try {
    const adminEmail = 'superadmin@medicore.com';
    const adminPassword = 'adminmedicore';

    let superAdmin = await User.findOne({ role: 'superadmin' });

    if (superAdmin) {
      superAdmin.email = adminEmail;
      superAdmin.password = adminPassword;
      superAdmin.isActive = true;
      await superAdmin.save();

      return res.json({
        success: true,
        message: 'Super Admin credentials updated successfully',
        data: { email: adminEmail, password: adminPassword }
      });
    }

    // Create new super admin
    superAdmin = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin'
      }
    });

    await superAdmin.save();

    res.json({
      success: true,
      message: 'Super Admin account created successfully',
      data: {
        email: adminEmail,
        password: adminPassword
      }
    });
  } catch (error) {
    console.error('Super admin seeding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Routes accessible by both Super Admin and Receptionist
router.use(authenticateToken);

// Get all doctors (Accessible by Admin, Doctor, Receptionist)
router.get('/doctors', authorizeRoles('superadmin', 'receptionist', 'doctor'), async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('userId', 'email profile isActive lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all patients (Accessible by Admin, Doctor, Receptionist)
router.get('/patients', authorizeRoles('superadmin', 'receptionist', 'doctor'), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('userId', 'email profile isActive lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// All other routes below require super admin authentication
router.use(superAdminOnly);

// Create staff account (doctor, receptionist, staff)
router.post('/create-staff', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['doctor', 'receptionist']),
  body('phone').optional({ checkFalsy: true })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Staff creation validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, phone, specialization, qualifications, experience, licenseNumber, consultationFee, department } = req.body;

    // Validate email domain
    if (!email.endsWith('@medicore.com')) {
      return res.status(400).json({
        success: false,
        message: 'Staff email must end with @medicore.com'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A system account already exists with the email: ${email}. Please use a different address.`
      });
    }

    // Additional validation for doctors before creating user
    if (role === 'doctor') {
      const missingFields = [];
      if (!specialization) missingFields.push('specialization');
      if (!qualifications) missingFields.push('qualifications');
      if (experience === undefined || experience === '') missingFields.push('experience');
      if (!licenseNumber) missingFields.push('licenseNumber');
      if (consultationFee === undefined || consultationFee === '') missingFields.push('consultationFee');
      if (!department) missingFields.push('department');

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing clinical validation fields: ${missingFields.join(', ')}`
        });
      }

      // Check for unique license number
      const existingLicense = await Doctor.findOne({ licenseNumber });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: `Medical license number ${licenseNumber} is already registered in our system.`
        });
      }
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      profile: {
        firstName,
        lastName,
        phone: phone || undefined
      }
    });

    await user.save();

    // Create role-specific profile
    if (role === 'doctor') {
      const doctor = new Doctor({
        userId: user._id,
        specialization,
        qualifications,
        experience: Number(experience),
        licenseNumber,
        consultationFee: Number(consultationFee),
        department,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeSlots: [{ start: '09:00', end: '17:00' }]
        }
      });

      await doctor.save();
    }

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during staff creation'
    });
  }
});

// Sensitive routes moved up or handled by middleware above

// Get all staff (excluding patients)
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['doctor', 'receptionist'] }
    })
      .select('email profile role isActive createdAt lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { staff }
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get specific doctor by ID
router.get('/doctor/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'email profile');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get specific staff by ID (general user)
router.get('/staff/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update staff account
router.patch('/update-staff/:id', [
  body('email').isEmail().normalizeEmail(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['doctor', 'receptionist']),
  body('phone').optional({ checkFalsy: true })
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

    const { id } = req.params;
    const { email, firstName, lastName, role, phone, specialization, qualifications, experience, licenseNumber, consultationFee, department, password } = req.body;

    // We assume ID is the model ID (Doctor ID for doctors)
    let user;
    let doctor;

    if (role === 'doctor') {
      doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      user = await User.findById(doctor.userId);
    } else {
      user = await User.findById(id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user info
    user.email = email;
    user.profile.firstName = firstName;
    user.profile.lastName = lastName;
    user.profile.phone = phone;

    if (password) {
      user.password = password;
    }

    await user.save();

    // Update role specific data
    if (role === 'doctor') {
      doctor.specialization = specialization;
      doctor.qualifications = qualifications;
      doctor.experience = Number(experience);
      doctor.licenseNumber = licenseNumber;
      doctor.consultationFee = Number(consultationFee);
      doctor.department = department;
      await doctor.save();
    }

    res.json({
      success: true,
      message: 'Staff account updated successfully',
      data: { user, doctor }
    });
  } catch (error) {
    console.error('Staff update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during staff update'
    });
  }
});

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    // We fetch active doctors and patients by joining with User model to ensure validity
    const [
      activeDoctorsCount,
      activePatientsCount,
      totalStaff,
      totalReceptionists,
      todayAppointments,
      totalRevenue,
      appointmentStats,
      topDoctor
    ] = await Promise.all([
      Doctor.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $match: { 'user.isActive': true } },
        { $count: 'count' }
      ]),
      Patient.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $match: { 'user.isActive': true } },
        { $count: 'count' }
      ]),
      User.countDocuments({ role: { $in: ['doctor', 'receptionist'] }, isActive: true }),
      User.countDocuments({ role: 'receptionist', isActive: true }),
      Appointment.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Bill.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Appointment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$doctorId',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        {
          $unwind: '$doctor'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.userId',
            foreignField: '_id',
            as: 'doctor.userId'
          }
        },
        {
          $unwind: {
            path: '$doctor.userId',
            preserveNullAndEmptyArrays: true
          }
        }
      ])
    ]);

    const totalDoctors = activeDoctorsCount[0]?.count || 0;
    const totalPatients = activePatientsCount[0]?.count || 0;
    const revenue = totalRevenue[0]?.total || 0;
    const mostConsultedDoctor = topDoctor[0]?.doctor[0] || null;

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalStaff,
        totalReceptionists,
        todayAppointments,
        totalRevenue: revenue,
        appointmentStats,
        mostConsultedDoctor
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/user/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Prevent deactivating super admin
    const user = await User.findById(userId);
    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate Super Admin account'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('email profile role isActive');

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

// Get system overview
router.get('/system-overview', getSystemOverview);

// Get user analytics
router.get('/user-analytics', getUserAnalytics);

// Get department statistics
router.get('/department-stats', getDepartmentStats);

// Export data
router.get('/export', exportData);

module.exports = router;
