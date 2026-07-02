const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const achievementController = require('../controllers/achievement.controller');

const router = express.Router();

/**
 * @swagger
 * /api/achievements:
 *   post:
 *     summary: Log a student achievement (Student only)
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Success
 *   get:
 *     summary: Get all achievements (Admin and Faculty search)
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('student'), achievementController.createAchievement)
  .get(protect, achievementController.getAchievements);

/**
 * @swagger
 * /api/achievements/my:
 *   get:
 *     summary: Get currently logged-in student's achievements
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my', protect, authorize('student'), achievementController.getMyAchievements);

/**
 * @swagger
 * /api/achievements/{id}:
 *   delete:
 *     summary: Delete achievement record (Owner or Admin only)
 *     tags: [Achievements]
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
router.delete('/:id', protect, achievementController.deleteAchievement);

module.exports = router;
