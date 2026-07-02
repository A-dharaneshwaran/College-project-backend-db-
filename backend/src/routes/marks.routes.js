const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { bulkMarksValidator } = require('../validators/marks.validator');
const validate = require('../middleware/validate');
const marksController = require('../controllers/marks.controller');

const router = express.Router();

/**
 * @swagger
 * /api/marks/bulk:
 *   post:
 *     summary: Bulk upload marks for an exam (Faculty only)
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/bulk', protect, authorize('faculty'), bulkMarksValidator, validate, marksController.uploadBulkMarks);

/**
 * @swagger
 * /api/marks/my:
 *   get:
 *     summary: Get currently logged-in student's marks report
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my', protect, authorize('student'), marksController.getMyMarks);

/**
 * @swagger
 * /api/marks/student/{studentId}:
 *   get:
 *     summary: Get academic marks list of a student (Faculty and Admin only)
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/student/:studentId', protect, authorize('faculty', 'admin'), marksController.getStudentMarks);

/**
 * @swagger
 * /api/marks/subject/{subjectId}:
 *   get:
 *     summary: Get student marks for a subject (Faculty and Admin only)
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: examType
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/subject/:subjectId', protect, authorize('faculty', 'admin'), marksController.getSubjectMarks);

module.exports = router;
