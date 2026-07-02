const { body } = require('express-validator');

const updateProfileValidator = [
  body('phone')
    .optional()
    .notEmpty()
    .withMessage('Phone cannot be empty'),
  body('designation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Designation cannot be empty'),
  body('specialization')
    .optional()
    .trim(),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array of subject IDs')
];

const updateFacultyValidator = [
  ...updateProfileValidator,
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Valid Department ID is required')
];

module.exports = {
  updateProfileValidator,
  updateFacultyValidator
};
