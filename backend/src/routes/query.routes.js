const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const queryController = require('../controllers/query.controller');

const router = express.Router();

/**
 * @swagger
 * /api/queries:
 *   post:
 *     summary: Raise a helpdesk ticket (Student only)
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 *   get:
 *     summary: Retrieve support tickets (Admin/Faculty search)
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('student'), queryController.createQuery)
  .get(protect, authorize('admin', 'faculty'), queryController.getQueries);

/**
 * @swagger
 * /api/queries/my:
 *   get:
 *     summary: Get currently logged-in student's tickets
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my', protect, authorize('student'), queryController.getMyQueries);

/**
 * @swagger
 * /api/queries/{id}/respond:
 *   put:
 *     summary: Respond and resolve a student ticket (Admin/Faculty only)
 *     tags: [Queries]
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
router.put('/:id/respond', protect, authorize('admin', 'faculty'), queryController.respondQuery);

module.exports = router;
