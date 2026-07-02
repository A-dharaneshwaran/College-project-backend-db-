const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const ApiError = require('./utils/ApiError');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images from backend locally
}));

// Setup logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: '*', // For expo development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for production
if (config.env === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
}

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API Documentation Config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kathir College of Engineering Management API',
      version: '1.0.0',
      description: 'Production API documentation for KCE College Management System',
    },
    servers: [
      {
        url: config.serverUrl,
        description: config.env === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, './routes/**/*.js').replace(/\\/g, '/')
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Favicon — return 204 No Content to prevent unnecessary 404 logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root route — API server identification
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    application: 'Kathir College of Engineering Management System API',
    version: '1.0.0',
    status: 'Running',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Health check endpoint
const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    status: dbState === 1 ? 'healthy' : 'unhealthy',
    database: DB_STATES[dbState] || 'unknown',
    environment: config.env,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    status: dbState === 1 ? 'healthy' : 'unhealthy',
    database: DB_STATES[dbState] || 'unknown',
    environment: config.env,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Import and mount routes
const routes = require('./routes');
app.use('/api', routes);

// Send back a 404 error for any unknown request
app.use((req, res, next) => {
  const message = config.env === 'development'
    ? `Route ${req.originalUrl} not found`
    : 'Route not found';
  next(new ApiError(404, message));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
