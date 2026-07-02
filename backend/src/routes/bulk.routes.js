/**
 * Bulk Import/Export Routes
 * All routes are protected and require 'admin' role.
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const {
  downloadStudentTemplate,
  downloadFacultyTemplate,
  importStudents,
  importFaculty,
  exportStudentsHandler,
  exportFacultyHandler,
  downloadStudentCredentials,
  downloadFacultyCredentials,
} = require('../controllers/bulk.controller');

// ── Multer config: memory storage, 15MB limit, xlsx/csv only ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',  // .xls
      'text/csv',
      'application/csv',
      'text/plain', // some browsers send csv as text/plain
    ];
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ext === 'xlsx' || ext === 'csv' || ext === 'xls') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .csv files are allowed.'));
    }
  },
});

// ── Apply auth to all routes in this router ───────────────────────────────
router.use(protect, authorize('admin'));

// ── Templates ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/bulk/students/template:
 *   get:
 *     summary: Download bulk student import Excel template (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file template stream
 */
router.get('/students/template', downloadStudentTemplate);

/**
 * @swagger
 * /api/bulk/faculty/template:
 *   get:
 *     summary: Download bulk faculty import Excel template (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file template stream
 */
router.get('/faculty/template', downloadFacultyTemplate);

// ── Import ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/bulk/students/import:
 *   post:
 *     summary: Upload bulk student file (xlsx/csv) for validation or import (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: preview
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, validates rows and returns counts without writing to database
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [create_only, update_only, create_update]
 *           default: create_only
 *         description: Import strategy mode
 *       - in: query
 *         name: credentials
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true and importing, returns the credentials file stream directly
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/students/import', upload.single('file'), importStudents);

/**
 * @swagger
 * /api/bulk/faculty/import:
 *   post:
 *     summary: Upload bulk faculty file (xlsx/csv) for validation or import (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: preview
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, validates rows and returns counts without writing to database
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [create_only, update_only, create_update]
 *           default: create_only
 *         description: Import strategy mode
 *       - in: query
 *         name: credentials
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true and importing, returns the credentials file stream directly
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/faculty/import', upload.single('file'), importFaculty);

// ── Credentials Report ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/bulk/students/credentials:
 *   post:
 *     summary: Generate and download Excel credentials report for imported students (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               importedRecords:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Excel file stream containing temporary passwords
 */
router.post('/students/credentials', downloadStudentCredentials);

/**
 * @swagger
 * /api/bulk/faculty/credentials:
 *   post:
 *     summary: Generate and download Excel credentials report for imported faculty (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               importedRecords:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Excel file stream containing temporary passwords
 */
router.post('/faculty/credentials', downloadFacultyCredentials);

// ── Export ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/bulk/students/export:
 *   get:
 *     summary: Export students list with filters to Excel or CSV (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *           default: xlsx
 *       - in: query
 *         name: dept
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exported data file stream
 */
router.get('/students/export', exportStudentsHandler);

/**
 * @swagger
 * /api/bulk/faculty/export:
 *   get:
 *     summary: Export faculty list with filters to Excel or CSV (admin-only)
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *           default: xlsx
 *       - in: query
 *         name: dept
 *         schema:
 *           type: string
 *       - in: query
 *         name: designation
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exported data file stream
 */
router.get('/faculty/export', exportFacultyHandler);

module.exports = router;
