const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

// --------------- Security Middleware ---------------
// Helmet: sets various HTTP headers to help protect the app
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json());

// Request logging (disabled in test env)
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// --------------- Rate Limiting ---------------
// General limiter: 100 requests per 15 minutes
app.use('/api/', generalLimiter);
// Auth limiter: stricter 20 requests per 15 minutes for register/login
app.use('/api/auth/', authLimiter);

// --------------- API Documentation ---------------
// Swagger UI served at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Error Handling ---------------
// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error-handling middleware
// Catches all errors (including unhandled async rejections forwarded via next())
app.use(errorHandler);

// --------------- Server Start ---------------
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`API Docs: http://localhost:${config.port}/api-docs`);
  });
}

module.exports = app;
