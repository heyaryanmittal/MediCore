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

// Security middleware - Moved CORS to the top to ensure preflight works correctly
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://medicore-hmss.vercel.app',
  'https://medicore-hmss-git-main-aryans-projects-42111422.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isWhitelisted = allowedOrigins.includes(origin);
    const isVercelDomain = origin.endsWith('.vercel.app');
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');

    if (isWhitelisted || isVercelDomain || isLocalhost) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests for all routes
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Enable trust proxy for rate limiting behind proxies
app.set('trust proxy', 1);

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min in prod, 1 hour in dev
  max: NODE_ENV === 'production' ? 1000 : 5000, // 1000 requests in prod, 5000 in dev
  message: 'Too many requests from this IP, please try again later.',
  skip: (req, res) => {
    // Skip rate limiting for health check and static files
    return req.path === '/health' || req.path.startsWith('/uploads');
  }
});
app.use(limiter);

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
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
    message: 'MediCore Backend API is successfully running!',
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

// 404 handler
app.use('*', (req, res) => {
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

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}
