const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

/**
 * All Analytics routes are protected and strictly limited to admins.
 * Faculty and Students must NEVER access these.
 */
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Enterprise Analytics and Reporting API
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard overview metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved
 */
router.get('/dashboard', analyticsController.getDashboardOverview);

/**
 * @swagger
 * /api/analytics/attendance:
 *   get:
 *     summary: Get attendance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance analytics retrieved
 */
router.get('/attendance', analyticsController.getAttendanceAnalytics);

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: Get performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance analytics retrieved
 */
router.get('/performance', analyticsController.getPerformanceAnalytics);

/**
 * @swagger
 * /api/analytics/departments:
 *   get:
 *     summary: Get department analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department analytics retrieved
 */
router.get('/departments', analyticsController.getDepartmentAnalytics);

/**
 * @swagger
 * /api/analytics/faculty:
 *   get:
 *     summary: Get faculty analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Faculty analytics retrieved
 */
router.get('/faculty', analyticsController.getFacultyAnalytics);

/**
 * @swagger
 * /api/analytics/demographics:
 *   get:
 *     summary: Get demographic analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demographics analytics retrieved
 */
router.get('/demographics', analyticsController.getDemographics);

/**
 * @swagger
 * /api/analytics/activity:
 *   get:
 *     summary: Get activity analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity analytics retrieved
 */
router.get('/activity', analyticsController.getActivityAnalytics);

/**
 * @swagger
 * /api/analytics/notifications:
 *   get:
 *     summary: Get notification analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification analytics retrieved
 */
router.get('/notifications', analyticsController.getNotificationAnalytics);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get comparative trend analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trend analytics retrieved
 */
router.get('/trends', analyticsController.getTrendAnalytics);

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     summary: Export analytics reports (CSV/XLSX/PDF)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Report generated
 */
router.get('/export', analyticsController.exportReport);

/**
 * @swagger
 * /api/analytics/clear-cache:
 *   post:
 *     summary: Clear analytics cache
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.post('/clear-cache', analyticsController.clearCache);

module.exports = router;
