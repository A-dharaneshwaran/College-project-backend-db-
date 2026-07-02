const { body } = require('express-validator');

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const registerValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be student, faculty, or admin'),
  
  // Conditionally validate student fields if role is student
  body('registerNumber')
    .if((value, { req }) => req.body.role === 'student')
    .notEmpty()
    .withMessage('Register number is required for students'),
  body('department')
    .if((value, { req }) => req.body.role === 'student' || req.body.role === 'faculty')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('year')
    .if((value, { req }) => req.body.role === 'student')
    .isInt({ min: 1, max: 4 })
    .withMessage('Year must be between 1 and 4'),
  body('semester')
    .if((value, { req }) => req.body.role === 'student')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  
  // Conditionally validate faculty fields if role is faculty
  body('employeeId')
    .if((value, { req }) => req.body.role === 'faculty' || req.body.role === 'admin')
    .notEmpty()
    .withMessage('Employee ID is required for faculty and admins'),
  body('designation')
    .if((value, { req }) => req.body.role === 'faculty')
    .notEmpty()
    .withMessage('Designation is required for faculty')
];

module.exports = {
  loginValidator,
  registerValidator
};
