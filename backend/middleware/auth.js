const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
};

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

const superAdminOnly = authorizeRoles('superadmin');
const doctorOnly = authorizeRoles('doctor');
const receptionistOnly = authorizeRoles('receptionist');
const patientOnly = authorizeRoles('patient');
const staffOnly = authorizeRoles('doctor', 'receptionist');
const allStaff = authorizeRoles('superadmin', 'doctor', 'receptionist');
const superAdminOrReceptionist = authorizeRoles('superadmin', 'receptionist');
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

