const ApiError = require('../utils/ApiError');
const config = require('../config');

/**
 * Global error handling middleware.
 * Converts known error types into standardized ApiError responses.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Always log the full error server-side
  if (config.env === 'development') {
    console.error('❌ Error:', err);
  } else {
    // Production: log full details to server console only
    console.error('❌ Error:', err.message, err.stack);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongoose duplicate key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = ApiError.conflict(`Duplicate value for field: ${field}`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // In production, hide internal server error details from clients
  const clientMessage = (config.env !== 'development' && statusCode === 500)
    ? 'Internal Server Error'
    : message;

  const response = {
    success: false,
    message: clientMessage,
  };

  // Only include detailed errors array in development
  if (config.env === 'development') {
    response.errors = error.errors || [];
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};


/**
 * 404 handler for undefined routes.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
