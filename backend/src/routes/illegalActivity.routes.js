const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const illegalActivityController = require('../controllers/illegalActivity.controller');

const router = express.Router();

/**
 * @swagger
 * /api/illegal-activities:
 *   post:
 *     summary: Log a high-severity regulatory breach (Admin only)
 *     tags: [Illegal Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 *   get:
 *     summary: Get all logged regulatory breaches (Admin only)
 *     tags: [Illegal Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('admin'), illegalActivityController.createReport)
  .get(protect, authorize('admin'), illegalActivityController.getReports);

/**
 * @swagger
 * /api/illegal-activities/{id}:
 *   put:
 *     summary: Update incident report details/status (Admin only)
 *     tags: [Illegal Activities]
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
 *     summary: Delete incident record (Admin only)
 *     tags: [Illegal Activities]
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
  .put(protect, authorize('admin'), illegalActivityController.updateReport)
  .delete(protect, authorize('admin'), illegalActivityController.deleteReport);

module.exports = router;
