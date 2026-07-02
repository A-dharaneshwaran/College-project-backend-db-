const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { departmentValidator } = require('../validators/department.validator');
const validate = require('../middleware/validate');
const departmentController = require('../controllers/department.controller');

const router = express.Router();

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department (Admin only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: Get all departments with pagination/search
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize('admin'), departmentValidator, validate, departmentController.createDepartment)
  .get(protect, departmentController.getDepartments);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: Get department details
 *     tags: [Departments]
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
 *     summary: Update department details (Admin only)
 *     tags: [Departments]
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
 *     summary: Delete department (Admin only)
 *     tags: [Departments]
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
  .get(protect, departmentController.getDepartment)
  .put(protect, authorize('admin'), departmentController.updateDepartment)
  .delete(protect, authorize('admin'), departmentController.deleteDepartment);

module.exports = router;
