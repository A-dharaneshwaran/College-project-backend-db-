const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const disciplineController = require('../controllers/discipline.controller');

const router = express.Router();

/**
 * @swagger
 * /api/discipline:
 *   post:
 *     summary: File student conduct report (Faculty only)
 *     tags: [Discipline]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 *   get:
 *     summary: Retrieve discipline reports (Admin/Faculty search)
 *     tags: [Discipline]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('faculty'), disciplineController.createReport)
  .get(protect, authorize('admin', 'faculty'), disciplineController.getReports);

/**
 * @swagger
 * /api/discipline/my:
 *   get:
 *     summary: Get currently logged-in student's discipline history
 *     tags: [Discipline]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my', protect, authorize('student'), disciplineController.getMyReports);

/**
 * @swagger
 * /api/discipline/student/{studentId}:
 *   get:
 *     summary: Get discipline history of a student (Faculty and Admin only)
 *     tags: [Discipline]
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
router.get('/student/:studentId', protect, authorize('faculty', 'admin'), disciplineController.getStudentReports);

/**
 * @swagger
 * /api/discipline/{id}/resolve:
 *   put:
 *     summary: Update/resolve discipline report (Admin only)
 *     tags: [Discipline]
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
router.put('/:id/resolve', protect, authorize('admin'), disciplineController.resolveReport);

module.exports = router;
