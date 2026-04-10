require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

const membersRoutes  = require('./routes/members');
const trainersRoutes = require('./routes/trainers');
const classesRoutes  = require('./routes/classes');
const bookingsRoutes = require('./routes/bookings');
const reportsRoutes  = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'null', // file:// protocol (opening index.html directly)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend statically (optional)
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🏋️  FitHub CRM API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/members',  membersRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/classes',  classesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reports',  reportsRoutes);

// ── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// ── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏋️  FitHub CRM Backend running on http://localhost:${PORT}`);
  console.log(`📡  Supabase: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ No URL set'}`);
  console.log(`\nRoutes:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/members`);
  console.log(`  POST /api/members`);
  console.log(`  GET  /api/trainers`);
  console.log(`  POST /api/trainers`);
  console.log(`  GET  /api/classes`);
  console.log(`  POST /api/classes`);
  console.log(`  GET  /api/bookings`);
  console.log(`  POST /api/bookings`);
  console.log(`  GET  /api/reports/summary\n`);
});

module.exports = app;
