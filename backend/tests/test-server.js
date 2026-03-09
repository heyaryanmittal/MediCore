const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Test registration route
app.post('/api/auth/register', (req, res) => {
  console.log('Test registration received:', req.body);
  res.json({
    success: true,
    message: 'Test registration successful',
    data: {
      user: { email: req.body.email, role: 'patient' },
      tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' }
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`Registration test: http://localhost:${PORT}/api/auth/register`);
});
