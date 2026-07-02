const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware: Validate incoming request using express-validator rules.
 * If errors are found, formats them and forwards to the global error handler.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg
  }));

  return next(new ApiError(400, 'Validation failed', extractedErrors));
};

module.exports = validate;
