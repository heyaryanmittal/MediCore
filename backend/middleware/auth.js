const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // All JWT verification errors (expired, malformed, bad signature) should
    // return 401 so the frontend's Axios interceptor can attempt a token refresh.
    // 403 is intentionally reserved for valid tokens that lack the required role.
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
};

// Role-based access control
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// Super Admin only middleware
const superAdminOnly = authorizeRoles('superadmin');

// Doctor only middleware
const doctorOnly = authorizeRoles('doctor');

// Receptionist only middleware
const receptionistOnly = authorizeRoles('receptionist');

// Patient only middleware
const patientOnly = authorizeRoles('patient');

// Staff roles (doctor, receptionist)
const staffOnly = authorizeRoles('doctor', 'receptionist');

// Professional staff (admin, doctor, receptionist)
const allStaff = authorizeRoles('superadmin', 'doctor', 'receptionist');

// Admin and Receptionist only
const superAdminOrReceptionist = authorizeRoles('superadmin', 'receptionist');

// Any authenticated professional (admin or staff)
const adminAndStaff = authorizeRoles('superadmin', 'doctor', 'receptionist');

module.exports = {
  authenticateToken,
  authorizeRoles,
  superAdminOnly,
  doctorOnly,
  receptionistOnly,
  staffOnly,
  patientOnly,
  allStaff,
  adminAndStaff,
  superAdminOrReceptionist
};
