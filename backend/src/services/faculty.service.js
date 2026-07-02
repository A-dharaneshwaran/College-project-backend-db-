const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const DisciplineReport = require('../models/DisciplineReport');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');

/**
 * Query faculty list with search/pagination
 * @param {Object} query
 * @returns {Promise<Object>}
 */
const queryFaculty = async (query) => {
  return paginateQuery(Faculty, query, {
    searchFields: ['employeeId', 'phone', 'designation'],
    populate: [
      { path: 'user', select: '-password' },
      { path: 'department' },
      { path: 'subjects' }
    ]
  });
};

/**
 * Get faculty profile by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getFacultyById = async (id) => {
  const faculty = await Faculty.findById(id)
    .populate({ path: 'user', select: '-password' })
    .populate('department')
    .populate('subjects');
    
  if (!faculty) {
    throw new ApiError(404, 'Faculty member not found');
  }
  return faculty;
};

/**
 * Get faculty profile by User ID
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getFacultyByUserId = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId })
    .populate({ path: 'user', select: '-password' })
    .populate('department')
    .populate('subjects');
    
  if (!faculty) {
    throw new ApiError(404, 'Faculty profile not found');
  }
  return faculty;
};

/**
 * Get students in the same department taught by the faculty
 * @param {string} facultyId
 * @returns {Promise<Array>}
 */
const getAssignedStudents = async (facultyId) => {
  const faculty = await Faculty.findById(facultyId);
  if (!faculty) {
    throw new ApiError(404, 'Faculty not found');
  }
  
  // Find all students in the faculty's department
  return Student.find({ department: faculty.department })
    .populate('user', '-password')
    .populate('department');
};

/**
 * Update faculty details
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateFaculty = async (id, updateBody) => {
  const faculty = await Faculty.findById(id);
  if (!faculty) {
    throw new ApiError(404, 'Faculty member not found');
  }

  // Update user name/email if specified
  if (updateBody.name || updateBody.email) {
    const user = await User.findById(faculty.user);
    if (user) {
      if (updateBody.name) user.name = updateBody.name;
      if (updateBody.email) {
        const emailExists = await User.findOne({ email: updateBody.email, _id: { $ne: user._id } });
        if (emailExists) {
          throw new ApiError(400, 'Email already in use');
        }
        user.email = updateBody.email;
      }
      await user.save();
    }
  }

  Object.assign(faculty, updateBody);
  await faculty.save();
  
  return getFacultyById(id);
};

/**
 * Delete faculty member and associated User account
 * @param {string} id
 * @returns {Promise<Object>}
 */
const deleteFaculty = async (id) => {
  const faculty = await Faculty.findById(id);
  if (!faculty) {
    throw new ApiError(404, 'Faculty member not found');
  }

  const userId = faculty.user;

  // 1. Remove references in Department (if HOD) and Subject, and delete notifications
  await Promise.all([
    Department.updateMany({ hod: id }, { $set: { hod: null } }),
    Subject.updateMany({ faculty: id }, { $set: { faculty: null } }),
    Notification.deleteMany({ user: userId })
  ]);

  // 2. Cascade delete discipline reports filed by this faculty
  await DisciplineReport.deleteMany({ reportedBy: id });

  // 3. Delete Faculty profile and associated User account
  await faculty.deleteOne();
  await User.findByIdAndDelete(userId);

  return faculty;
};

module.exports = {
  queryFaculty,
  getFacultyById,
  getFacultyByUserId,
  getAssignedStudents,
  updateFaculty,
  deleteFaculty
};
