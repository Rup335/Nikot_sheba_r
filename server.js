
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const session = require('express-session');
const pool = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/public'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/provider', require('./src/routes/provider'));
app.use('/api/admin', require('./src/routes/admin'));

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found.',
    method: req.method,
    url: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (res.headersSent) return next(err);

  res.status(500).json({
    error: 'Server error. Check the terminal for details.'
  });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected successfully.');

    app.listen(PORT, () => {
      console.log(`Server running: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MySQL connection FAILED:', err.message);
    console.error('Check src/db.js, .env, Aiven SSL settings, and network access.');
    process.exitCode = 1;
  }
}

startServer();
