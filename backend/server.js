const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Trust proxy (required for Railway, Render, Heroku etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://localhost',
    'capacitor://localhost',
    'https://smrutiranjandev0p.github.io',
    process.env.FRONTEND_URL || 'http://localhost:8080'
  ],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webchem')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const reactionRoutes = require('./routes/reactions');
const toolRoutes = require('./routes/tools');
const aiRoutes = require('./routes/ai');
const knowledgeRoutes = require('./routes/knowledge');

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Welcome route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to WebChem API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      lessons: '/api/lessons',
      progress: '/api/progress',
      reactions: '/api/reactions',
      tools: '/api/tools',
      knowledge: '/api/knowledge'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 WebChem server running on http://localhost:${PORT}`);
});

module.exports = app;
