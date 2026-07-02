const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const announcementController = require('../controllers/announcement.controller');

const router = express.Router();

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Post a new announcement (Admin/Faculty only)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 *   get:
 *     summary: Get all announcements (Admin/Faculty management search)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('admin', 'faculty'), announcementController.createAnnouncement)
  .get(protect, authorize('admin', 'faculty'), announcementController.getAnnouncements);

/**
 * @swagger
 * /api/announcements/active:
 *   get:
 *     summary: Get announcements targeted to the logged-in user (role/department filtered)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/active', protect, announcementController.getMyAnnouncements);

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Delete announcement (Admin/Faculty only)
 *     tags: [Announcements]
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
router.delete('/:id', protect, authorize('admin', 'faculty'), announcementController.deleteAnnouncement);

module.exports = router;
