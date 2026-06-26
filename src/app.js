require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const { connectDB }             = require('./config/database');
const profileRoutes             = require('./routes/profileRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting (API-wide)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze:   'POST   /api/profiles/analyze/:username',
      listAll:   'GET    /api/profiles',
      getOne:    'GET    /api/profiles/:username',
      delete:    'DELETE /api/profiles/:username',
      rateLimit: 'GET    /api/github/rate-limit',
      health:    'GET    /health',
    },
  });
});

app.get('/health', async (req, res) => {
  const { pool } = require('./config/database');
  let dbStatus = 'ok';
  try {
    await pool.execute('SELECT 1');
  } catch {
    dbStatus = 'error';
  }
  res.status(dbStatus === 'ok' ? 200 : 503).json({
    success: dbStatus === 'ok',
    status:  { server: 'ok', database: dbStatus },
    uptime:  process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', profileRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();

module.exports = app;
