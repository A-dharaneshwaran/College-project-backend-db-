const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// All search routes require a valid session with admin role
const adminOnly = [protect, authorize('admin')];

/**
 * @swagger
 * /api/search/global:
 *   get:
 *     summary: Cross-entity global search (admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Max results per entity (max 10)
 *     responses:
 *       200:
 *         description: Grouped results object with students, faculty, departments, subjects, activities
 */
router.get('/global', ...adminOnly, searchController.globalSearch);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Autocomplete suggestions for the search bar (admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Array of suggestion objects
 */
router.get('/suggestions', ...adminOnly, searchController.getSearchSuggestions);

/**
 * @swagger
 * /api/search/students:
 *   get:
 *     summary: Advanced student search with filters and pagination (admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: semester
 *         schema: { type: integer }
 *       - in: query
 *         name: gender
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt' }
 *     responses:
 *       200:
 *         description: Paginated student results
 */
router.get('/students', ...adminOnly, searchController.searchStudents);

/**
 * @swagger
 * /api/search/faculty:
 *   get:
 *     summary: Advanced faculty search with filters and pagination (admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: designation
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt' }
 *     responses:
 *       200:
 *         description: Paginated faculty results
 */
router.get('/faculty', ...adminOnly, searchController.searchFaculty);

/**
 * @swagger
 * /api/search/meta/students:
 *   get:
 *     summary: Get distinct filter values for student search (admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Object with years, semesters, genders arrays
 */
router.get('/meta/students', ...adminOnly, searchController.getStudentFilterMeta);

/**
 * @swagger
 * /api/search/meta/faculty:
 *   get:
 *     summary: Get distinct filter values for faculty search (admin only)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Object with designations array
 */
router.get('/meta/faculty', ...adminOnly, searchController.getFacultyFilterMeta);

module.exports = router;
