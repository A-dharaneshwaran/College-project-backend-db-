const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>" header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Not authorized, no token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(ApiError.unauthorized('User not found'));
    }

    if (!user.isActive) {
      return next(ApiError.unauthorized('Account has been deactivated'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Not authorized, token invalid'));
  }
};

/**
 * Middleware: Role-based authorization.
 * Must be used AFTER protect middleware.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'faculty')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Not authorized'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
