const { body } = require('express-validator');

const bulkAttendanceValidator = [
  body('subject')
    .isMongoId()
    .withMessage('Valid Subject ID is required'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO8601 date'),
  body('records')
    .isArray({ min: 1 })
    .withMessage('Records must be a non-empty array'),
  body('records.*.student')
    .isMongoId()
    .withMessage('Each record must contain a valid Student ID'),
  body('records.*.status')
    .isIn(['Present', 'Absent', 'Late'])
    .withMessage('Status must be Present, Absent, or Late')
];

module.exports = {
  bulkAttendanceValidator
};
