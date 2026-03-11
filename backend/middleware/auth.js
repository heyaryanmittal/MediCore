const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[AuthMiddleware] Path: ${req.path}, Token Present: ${!!token}`);

    if (!token) {
      console.warn(`[AuthMiddleware] Missing token for path: ${req.path}`);
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AuthMiddleware] Token verified for User ID: ${decoded.userId}`);
    
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user || !user.isActive) {
      console.warn(`[AuthMiddleware] User not found or inactive: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[AuthMiddleware] Error verifying token for ${req.path}:`, error.message);
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
