const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3004',
  'http://localhost:5173',
  'https://medicore-hmss.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean).map(origin => origin.replace(/\/$/, ''));


// CORS must be before Helmet to ensure headers are set correctly
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const originWithoutSlash = origin.replace(/\/$/, '');
    
    if (allowedOrigins.indexOf(originWithoutSlash) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('CORS rejected origin:', origin);
      // Return null, false to avoid triggering the global error handler
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 200
}));


// Security middleware - configured for cross-origin use
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginPropertyPolicy: { policy: "cross-origin" }
}));


// Enable trust proxy for rate limiting behind proxies
app.set('trust proxy', 1);

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min in prod, 1 hour in dev
  max: NODE_ENV === 'production' ? 100 : 1000, // 100 requests in prod, 1000 in dev
  message: 'Too many requests from this IP, please try again later.',
  skip: (req, res) => {
    // Skip rate limiting for health check and static files
    return req.path === '/health' || req.path.startsWith('/uploads');
  }
});
app.use(limiter);

// Logging
if (NODE_ENV === 'production') {
  // app.use(morgan('combined'));
} else {
  // app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint for simple health check when visiting the URL
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediCore Backend API is successfully running on Vercel!',
    version: '1.0.0'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore')
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/receptionist', require('./routes/receptionist'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/contact', require('./routes/contact'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't expose error details in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message: message,
    ...(NODE_ENV !== 'production' && { error: err })
  });
});

const PORT = process.env.PORT || 5000;

// Export the app for Vercel
module.exports = app;

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║ MediCore Backend Server Running        ║
  ╠════════════════════════════════════════╣
  ║ Environment: ${NODE_ENV.toUpperCase().padEnd(29)} ║
  ║ Port: ${PORT.toString().padEnd(34)} ║
  ║ URL: ${(process.env.FRONTEND_URL || 'http://localhost:3000').padEnd(25)} ║
  ╚════════════════════════════════════════╝
    `);
  });


  const gracefulShutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed');
        if (signal === 'SIGUSR2') {
          process.kill(process.pid, 'SIGUSR2');
        } else {
          process.exit(0);
        }
      });
    });

    // Force close server after 3 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 3000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
}
