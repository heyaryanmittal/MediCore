const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const chalk = require('chalk');
require('dotenv').config();

const app = express();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3004',
  'http://localhost:5173',
  'https://medicore-hmss.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean).map(origin => origin.replace(/\/$/, ''));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const originWithoutSlash = origin.replace(/\/$/, '');
    
    const isAllowed = allowedOrigins.indexOf(originWithoutSlash) !== -1 || 
                     allowedOrigins.includes('*') ||
                     (originWithoutSlash.endsWith('.vercel.app')); // Allow all vercel deployments
                     
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginPropertyPolicy: { policy: "cross-origin" }
}));

app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.path === '/api/health' || req.path.startsWith('/uploads')
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// ─── Database connection ──────────────────────────────────────────────────────
// Vercel serverless pattern: cache the connection promise so cold-starts
// reuse the same connection rather than opening a new one each invocation.
let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState >= 1) return Promise.resolve(); // already connected
  if (connectionPromise) return connectionPromise;                    // in-flight

  connectionPromise = mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore',
    {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    }
  ).then(() => {
    console.log(chalk.green.bold('✓ Connected to MongoDB'));
  }).catch((err) => {
    console.error(chalk.red.bold('✗ MongoDB Connection Failed:'), err.message);
    connectionPromise = null; // reset so next request can retry
    if (!process.env.VERCEL) process.exit(1);
    throw err;
  });

  return connectionPromise;
};

// DB middleware — MUST be registered before all routes so every
// request awaits the connection before hitting a route handler.
app.use(async (req, res, next) => {
  // Health check and root don't need DB
  if (req.path === '/api/health' || req.path === '/') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connect middleware error:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable, please retry in a moment.' });
  }
});

// ─── Static / health routes ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: NODE_ENV,
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediCore Backend API is successfully running!',
    version: '1.0.0'
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
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
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(err.status || 500).json({
    success: false,
    message: message,
    ...(NODE_ENV !== 'production' && { error: err })
  });
});

// Export for Vercel serverless
module.exports = app;

// Start server locally (not on Vercel)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(chalk.yellow.bold(`✓ Server is running on port: ${PORT}`));
    });
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT',  () => server.close(() => process.exit(0)));
  });
}
