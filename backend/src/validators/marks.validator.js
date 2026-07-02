const { body } = require('express-validator');

const bulkMarksValidator = [
  body('subject')
    .isMongoId()
    .withMessage('Valid Subject ID is required'),
  body('examType')
    .isIn(['Internal 1', 'Internal 2', 'Model Exam', 'Semester', 'Assignment'])
    .withMessage('Exam type must be Internal 1, Internal 2, Model Exam, Semester, or Assignment'),
  body('maxMarks')
    .isInt({ min: 1, max: 100 })
    .withMessage('Maximum marks must be between 1 and 100'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .trim(),
  body('records')
    .isArray({ min: 1 })
    .withMessage('Records must be a non-empty array'),
  body('records.*.student')
    .isMongoId()
    .withMessage('Each record must contain a valid Student ID'),
  body('records.*.obtainedMarks')
    .isInt({ min: 0 })
    .withMessage('Obtained marks must be a non-negative integer')
    .custom((val, { req }) => {
      if (val > req.body.maxMarks) {
        throw new Error('Obtained marks cannot exceed max marks');
      }
      return true;
    })
];

module.exports = {
  bulkMarksValidator
};
