const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

/**
 * @swagger
 * /api/admins/dashboard:
 *   get:
 *     summary: Retrieve dashboard statistics for admins
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/dashboard', protect, authorize('admin'), adminController.getDashboardStats);

/**
 * @swagger
 * /api/admins/activity:
 *   get:
 *     summary: Retrieve paginated activity logs with search and filters (admin-only)
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: administrator
 *         schema:
 *           type: string
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/activity', protect, authorize('admin'), adminController.getActivityHistory);

/**
 * @swagger
 * /api/admins/activity/filters:
 *   get:
 *     summary: Retrieve unique action, module, and administrator dropdown options for filtering (admin-only)
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/activity/filters', protect, authorize('admin'), adminController.getActivityFilters);

module.exports = router;
