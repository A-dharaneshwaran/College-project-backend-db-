/**
 * Wraps an async route handler to catch errors and forward them
 * to Express error middleware, eliminating try/catch boilerplate.
 *
 * @param {Function} fn - Async express handler (req, res, next)
 * @returns {Function} Express middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
