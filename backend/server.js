const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const chalk = require('chalk');
require('dotenv').config();

// ── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://medicore-hmss.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean).map(o => o.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    const allowed = allowedOrigins.includes(clean) || clean.endsWith('.vercel.app');
    callback(null, allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 200,
}));

// ── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// ── Rate Limiting ────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 500 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.path === '/api/health' || req.path.startsWith('/uploads'),
}));

// ── Database Connection ──────────────────────────────────────────────────────
let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState >= 1) return Promise.resolve();
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicore', {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    })
    .then(() => console.log(chalk.green.bold('✓ MongoDB connected')))
    .catch((err) => {
      console.error(chalk.red.bold('✗ MongoDB connection failed:'), err.message);
      connectionPromise = null;
      if (!process.env.VERCEL) process.exit(1);
      throw err;
    });

  return connectionPromise;
};

// Ensure DB is ready before handling requests (except health/root)
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/') return next();
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({ success: false, message: 'Database unavailable, please retry.' });
  }
});

// ── Base Routes ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({ success: true, message: 'MediCore Backend API is running', version: '1.0.0' })
);

app.get('/api/health', async (_req, res) => {
  try { await connectDB(); } catch (_) {}
  res.json({
    success: true,
    environment: NODE_ENV,
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/doctor',       require('./routes/doctor'));
app.use('/api/receptionist', require('./routes/receptionist'));
app.use('/api/patient',      require('./routes/patient'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/chatbot',      require('./routes/chatbot'));
app.use('/api/documents',    require('./routes/documents'));
app.use('/api/contact',      require('./routes/contact'));

// ── Error Handlers ───────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

app.use((err, _req, res, _next) => {
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(NODE_ENV !== 'production' && { error: err }),
  });
});

// ── Start Server (non-Vercel) ────────────────────────────────────────────────
module.exports = app;

if (!process.env.VERCEL) {
  connectDB().then(() => {
    const server = app.listen(PORT, () =>
      console.log(chalk.yellow.bold(`✓ Server running on port ${PORT}`))
    );
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT',  () => server.close(() => process.exit(0)));
  });
}
