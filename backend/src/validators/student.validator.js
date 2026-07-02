const { body } = require('express-validator');

const updateProfileValidator = [
  body('phone')
    .optional()
    .notEmpty()
    .withMessage('Phone cannot be empty'),
  body('address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('pincode')
    .optional()
    .trim(),
  body('bloodGroup')
    .optional()
    .trim()
];

const updateStudentValidator = [
  ...updateProfileValidator,
  body('year')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Year must be between 1 and 4'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Valid department ID is required')
];

module.exports = {
  updateProfileValidator,
  updateStudentValidator
};
