const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results and return standard 400 Bad Request error if invalid.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0]?.msg || 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = { validateRequest };
