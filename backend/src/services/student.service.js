const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const DisciplineReport = require('../models/DisciplineReport');
const Query = require('../models/Query');
const Achievement = require('../models/Achievement');
const IllegalActivity = require('../models/IllegalActivity');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');

/**
 * Query students with pagination/search
 * @param {Object} query - req.query
 * @returns {Promise<Object>} Paginated result
 */
const queryStudents = async (query) => {
  return paginateQuery(Student, query, {
    searchFields: ['registerNumber', 'phone'],
    populate: [
      { path: 'user', select: '-password' },
      { path: 'department' }
    ]
  });
};

/**
 * Get student by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .populate({ path: 'user', select: '-password' })
    .populate('department');
    
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }
  return student;
};

/**
 * Get student profile by associated User ID
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getStudentByUserId = async (userId) => {
  const student = await Student.findOne({ user: userId })
    .populate({ path: 'user', select: '-password' })
    .populate('department');
    
  if (!student) {
    throw new ApiError(404, 'Student profile not found');
  }
  return student;
};

/**
 * Update student profile (by user or admin)
 * @param {string} id - Student ID
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateStudent = async (id, updateBody) => {
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // If user fields need updating (like name or email)
  if (updateBody.name || updateBody.email) {
    const user = await User.findById(student.user);
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

  Object.assign(student, updateBody);
  await student.save();
  
  return getStudentById(id);
};

/**
 * Delete student and their associated User record
 * @param {string} id
 * @returns {Promise<Object>}
 */
const deleteStudent = async (id) => {
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const userId = student.user;

  // 1. Cascade delete attendance, marks, achievements, queries, illegal activity logs, and notifications
  await Promise.all([
    Attendance.deleteMany({ student: id }),
    Marks.deleteMany({ student: id }),
    Query.deleteMany({ student: id }),
    Achievement.deleteMany({ student: id }),
    IllegalActivity.deleteMany({ student: id }),
    Notification.deleteMany({ user: userId })
  ]);

  // 2. Cascade delete or clean up discipline reports
  const disciplineReports = await DisciplineReport.find({ students: id });
  for (const report of disciplineReports) {
    report.students = report.students.filter(studentId => studentId.toString() !== id.toString());
    if (report.students.length === 0) {
      await report.deleteOne();
    } else {
      await report.save();
    }
  }

  // 3. Delete Student and associated User accounts
  await student.deleteOne();
  await User.findByIdAndDelete(userId);

  return student;
};

/**
 * Compile dashboard statistics for a student
 * @param {string} studentId
 * @returns {Promise<Object>}
 */
const getStudentDashboardStats = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // 1. Calculate Attendance Percentage
  const totalClasses = await Attendance.countDocuments({ student: studentId });
  let attendancePercentage = 100;
  let presentCount = 0;
  let absentCount = 0;
  
  if (totalClasses > 0) {
    presentCount = await Attendance.countDocuments({ student: studentId, status: { $in: ['Present', 'Late'] } });
    absentCount = totalClasses - presentCount;
    attendancePercentage = Math.round((presentCount / totalClasses) * 100);
  }

  // 2. Fetch CGPA and Academic Performance
  // We calculate standard average marks percentage as academic score or fallback to 8.5
  const marksList = await Marks.find({ student: studentId });
  let cgpa = 8.5; // fallback default
  if (marksList.length > 0) {
    const totalPercentage = marksList.reduce((acc, m) => {
      const percentage = (m.obtainedMarks / m.maxMarks) * 10; // Convert to 10-point scale
      return acc + percentage;
    }, 0);
    cgpa = Math.round((totalPercentage / marksList.length) * 100) / 100;
  }

  // 3. Discipline Status
  const activeDisciplineIssues = await DisciplineReport.countDocuments({
    students: studentId,
    status: { $ne: 'Resolved' }
  });
  
  const standing = activeDisciplineIssues === 0 ? 'Good Standing' : 'Under Review';

  // 4. Helpdesk Tickets
  const openQueries = await Query.countDocuments({
    student: studentId,
    status: { $ne: 'resolved' }
  });

  const backlogsCount = marksList.filter(m => m.obtainedMarks < (m.maxMarks * 0.5)).length;

  return {
    attendance: {
      percentage: attendancePercentage,
      present: presentCount,
      absent: absentCount,
      total: totalClasses
    },
    academics: {
      cgpa,
      totalCredits: 124, // static graduation path
      backlogs: backlogsCount
    },
    discipline: {
      status: standing,
      activeIncidents: activeDisciplineIssues
    },
    queries: {
      openCount: openQueries
    }
  };
};

module.exports = {
  queryStudents,
  getStudentById,
  getStudentByUserId,
  updateStudent,
  deleteStudent,
  getStudentDashboardStats
};
