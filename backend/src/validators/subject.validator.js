const { body } = require('express-validator');

const subjectValidator = [
  body('name')
    .notEmpty()
    .withMessage('Subject name is required')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Subject code is required')
    .trim()
    .toUpperCase(),
  body('department')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('faculty')
    .optional()
    .isMongoId()
    .withMessage('Valid Faculty ID is required')
];

module.exports = {
  subjectValidator
};
