const { body } = require('express-validator');

const departmentValidator = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .trim()
    .toUpperCase(),
  body('description')
    .optional()
    .trim()
];

module.exports = {
  departmentValidator
};
