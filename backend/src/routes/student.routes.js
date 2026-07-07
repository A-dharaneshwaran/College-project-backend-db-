const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { updateProfileValidator, updateStudentValidator } = require('../validators/student.validator');
const validate = require('../middleware/validate');
const studentController = require('../controllers/student.controller');

const router = express.Router();

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Retrieve list of students (Admin and Faculty only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .get(protect, authorize('admin', 'faculty'), studentController.getStudents);

/**
 * @swagger
 * /api/students/profile:
 *   get:
 *     summary: Get currently logged-in student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update currently logged-in student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/profile')
  .get(protect, authorize('student'), studentController.getStudentProfile)
  .put(protect, authorize('student'), updateProfileValidator, validate, studentController.updateStudentProfile);

/**
 * @swagger
 * /api/students/profile/dashboard:
 *   get:
 *     summary: Get currently logged-in student dashboard stats
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/profile/dashboard')
  .get(protect, authorize('student'), studentController.getStudentDashboard);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update student record (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *   delete:
 *     summary: Delete student (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:id')
  .get(protect, authorize('admin', 'faculty'), studentController.getStudent)
  .put(protect, authorize('admin'), updateStudentValidator, validate, studentController.updateStudent)
  .delete(protect, authorize('admin'), studentController.deleteStudent);

module.exports = router;
