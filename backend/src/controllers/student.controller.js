const studentService = require('../services/student.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../services/activityLog.service');

const getStudents = catchAsync(async (req, res) => {
  const result = await studentService.queryStudents(req.query);
  res.status(200).json(new ApiResponse(200, 'Students retrieved successfully', result));
});

const getStudentProfile = catchAsync(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Student profile retrieved successfully', student));
});

const updateStudentProfile = catchAsync(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);
  const updatedStudent = await studentService.updateStudent(student._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Profile updated successfully', updatedStudent));
});

const getStudent = catchAsync(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Student retrieved successfully', student));
});

const updateStudent = catchAsync(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  
  if (req.user && req.user.role === 'admin') {
    const studentName = student.user?.name || student.name || '';
    await logActivity({
      adminUser: req.user._id,
      action: 'Student Updated',
      module: 'Students',
      entityId: student._id,
      entityType: 'Student',
      description: `Updated student profile: ${studentName} (${student.registerNumber})`,
      metadata: {
        registerNumber: student.registerNumber,
        fieldsUpdated: Object.keys(req.body)
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Student updated successfully', student));
});

const deleteStudent = catchAsync(async (req, res) => {
  let studentName = '';
  let regNo = '';
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (student) {
      studentName = student.user?.name || student.name || '';
      regNo = student.registerNumber || '';
    }
  } catch (err) {
    console.error('Failed to get student details for delete log:', err.message);
  }

  await studentService.deleteStudent(req.params.id);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Student Deleted',
      module: 'Students',
      entityId: req.params.id,
      entityType: 'Student',
      description: `Deleted student profile: ${studentName || 'Unknown'} (${regNo || 'Unknown'})`,
      metadata: {
        studentId: req.params.id,
        registerNumber: regNo,
        name: studentName
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Student deleted successfully', null));
});

const getStudentDashboard = catchAsync(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);
  const stats = await studentService.getStudentDashboardStats(student._id);
  res.status(200).json(new ApiResponse(200, 'Dashboard statistics retrieved successfully', stats));
});

module.exports = {
  getStudents,
  getStudentProfile,
  updateStudentProfile,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentDashboard
};
