const Department = require('../models/Department');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Announcement = require('../models/Announcement');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');

/**
 * Create a new department
 * @param {Object} deptData
 * @returns {Promise<Object>}
 */
const createDepartment = async (deptData) => {
  const existingDept = await Department.findOne({ code: deptData.code.toUpperCase() });
  if (existingDept) {
    throw new ApiError(400, 'Department code already exists');
  }
  return Department.create(deptData);
};

/**
 * Query departments with pagination/search
 * @param {Object} query - req.query
 * @returns {Promise<Object>} Paginated result
 */
const queryDepartments = async (query) => {
  return paginateQuery(Department, query, {
    searchFields: ['name', 'code'],
    populate: [
      { path: 'hod', populate: { path: 'user', select: 'name' } },
      { path: 'students', select: '_id' },
      { path: 'faculty', select: '_id' }
    ]
  });
};

/**
 * Get department by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getDepartmentById = async (id) => {
  const dept = await Department.findById(id)
    .populate({ path: 'hod', populate: { path: 'user', select: 'name' } })
    .populate('students', '_id')
    .populate('faculty', '_id');
    
  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }
  return dept;
};

/**
 * Update department by ID
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateDepartment = async (id, updateBody) => {
  const dept = await Department.findById(id);
  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }
  
  if (updateBody.code && updateBody.code.toUpperCase() !== dept.code) {
    const existingCode = await Department.findOne({ code: updateBody.code.toUpperCase() });
    if (existingCode) {
      throw new ApiError(400, 'Department code already in use');
    }
  }

  Object.assign(dept, updateBody);
  await dept.save();
  return dept;
};

/**
 * Delete department by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const deleteDepartment = async (id) => {
  // 1. Enforce validation check: do not allow deleting departments containing active students or faculty members
  const [studentCount, facultyCount] = await Promise.all([
    Student.countDocuments({ department: id }),
    Faculty.countDocuments({ department: id })
  ]);

  if (studentCount > 0 || facultyCount > 0) {
    throw new ApiError(400, 'Cannot delete department containing active student or faculty profiles. Reassign profiles first.');
  }

  const dept = await Department.findById(id);
  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }

  // 2. Cascade delete department subjects and remove reference from targeted announcements
  await Promise.all([
    Subject.deleteMany({ department: id }),
    Announcement.updateMany({ departments: id }, { $pull: { departments: id } })
  ]);

  await dept.deleteOne();
  return dept;
};

module.exports = {
  createDepartment,
  queryDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
