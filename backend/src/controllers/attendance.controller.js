const attendanceService = require('../services/attendance.service');
const studentService = require('../services/student.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const markBulkAttendance = catchAsync(async (req, res) => {
  // Pass req.user._id (Faculty's user ID)
  const result = await attendanceService.markBulkAttendance(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Attendance marked successfully', result));
});

const getMyAttendance = catchAsync(async (req, res) => {
  // For student viewing their own attendance
  const student = await studentService.getStudentByUserId(req.user._id);
  const result = await attendanceService.getStudentAttendanceReport(student._id);
  res.status(200).json(new ApiResponse(200, 'Attendance report retrieved successfully', result));
});

const getStudentAttendance = catchAsync(async (req, res) => {
  // For admin/faculty viewing a specific student's attendance
  const result = await attendanceService.getStudentAttendanceReport(req.params.studentId);
  res.status(200).json(new ApiResponse(200, 'Attendance report retrieved successfully', result));
});

const getSubjectAttendance = catchAsync(async (req, res) => {
  // Query attendance for a subject on a date
  const { subjectId } = req.params;
  const { date } = req.query;
  const result = await attendanceService.getSubjectAttendanceByDate(subjectId, date || new Date().toISOString());
  res.status(200).json(new ApiResponse(200, 'Subject attendance retrieved successfully', result));
});

module.exports = {
  markBulkAttendance,
  getMyAttendance,
  getStudentAttendance,
  getSubjectAttendance
};
