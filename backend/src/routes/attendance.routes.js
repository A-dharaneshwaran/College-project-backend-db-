const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { bulkAttendanceValidator } = require('../validators/attendance.validator');
const validate = require('../middleware/validate');
const attendanceController = require('../controllers/attendance.controller');

const router = express.Router();

/**
 * @swagger
 * /api/attendance/bulk:
 *   post:
 *     summary: Bulk mark attendance for a subject (Faculty only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/bulk', protect, authorize('faculty'), bulkAttendanceValidator, validate, attendanceController.markBulkAttendance);

/**
 * @swagger
 * /api/attendance/my:
 *   get:
 *     summary: Get currently logged-in student's attendance report
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my', protect, authorize('student'), attendanceController.getMyAttendance);

/**
 * @swagger
 * /api/attendance/student/{studentId}:
 *   get:
 *     summary: Get detailed attendance report of a student (Faculty and Admin only)
 *     tags: [Attendance]
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
router.get('/student/:studentId', protect, authorize('faculty', 'admin'), attendanceController.getStudentAttendance);

/**
 * @swagger
 * /api/attendance/subject/{subjectId}:
 *   get:
 *     summary: Get student attendance list for a subject on a date (Faculty and Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/subject/:subjectId', protect, authorize('faculty', 'admin'), attendanceController.getSubjectAttendance);

module.exports = router;
