const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { subjectValidator } = require('../validators/subject.validator');
const validate = require('../middleware/validate');
const subjectController = require('../controllers/subject.controller');

const router = express.Router();

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: Get all subjects with pagination/search
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('admin'), subjectValidator, validate, subjectController.createSubject)
  .get(protect, subjectController.getSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject details
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *   put:
 *     summary: Update subject details (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *   delete:
 *     summary: Delete subject (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:id')
  .get(protect, subjectController.getSubject)
  .put(protect, authorize('admin'), subjectController.updateSubject)
  .delete(protect, authorize('admin'), subjectController.deleteSubject);

module.exports = router;
