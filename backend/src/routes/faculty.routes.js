const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { updateProfileValidator, updateFacultyValidator } = require('../validators/faculty.validator');
const validate = require('../middleware/validate');
const facultyController = require('../controllers/faculty.controller');

const router = express.Router();

/**
 * @swagger
 * /api/faculty:
 *   get:
 *     summary: Retrieve list of faculty members (Admin only)
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .get(protect, authorize('admin'), facultyController.getFacultyList);

/**
 * @swagger
 * /api/faculty/profile:
 *   get:
 *     summary: Get currently logged-in faculty profile
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update currently logged-in faculty profile
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/profile')
  .get(protect, authorize('faculty'), facultyController.getFacultyProfile)
  .put(protect, authorize('faculty'), updateProfileValidator, validate, facultyController.updateFacultyProfile);

/**
 * @swagger
 * /api/faculty/students:
 *   get:
 *     summary: Get department students assigned to this faculty member
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/students')
  .get(protect, authorize('faculty'), facultyController.getFacultyStudents);

/**
 * @swagger
 * /api/faculty/{id}:
 *   get:
 *     summary: Get faculty details
 *     tags: [Faculty]
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
 *     summary: Update faculty details (Admin only)
 *     tags: [Faculty]
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
 *     summary: Delete faculty member (Admin only)
 *     tags: [Faculty]
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
  .get(protect, facultyController.getFaculty)
  .put(protect, authorize('admin'), updateFacultyValidator, validate, facultyController.updateFaculty)
  .delete(protect, authorize('admin'), facultyController.deleteFaculty);

module.exports = router;
