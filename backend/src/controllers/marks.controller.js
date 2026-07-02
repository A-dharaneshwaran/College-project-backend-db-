const marksService = require('../services/marks.service');
const studentService = require('../services/student.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const uploadBulkMarks = catchAsync(async (req, res) => {
  const result = await marksService.uploadBulkMarks(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Marks uploaded successfully', result));
});

const getMyMarks = catchAsync(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);
  const result = await marksService.getStudentMarksReport(student._id);
  res.status(200).json(new ApiResponse(200, 'Marks list retrieved successfully', result));
});

const getStudentMarks = catchAsync(async (req, res) => {
  const result = await marksService.getStudentMarksReport(req.params.studentId);
  res.status(200).json(new ApiResponse(200, 'Marks list retrieved successfully', result));
});

const getSubjectMarks = catchAsync(async (req, res) => {
  const { subjectId } = req.params;
  const { examType } = req.query;
  const result = await marksService.getSubjectMarksReport(subjectId, examType);
  res.status(200).json(new ApiResponse(200, 'Subject marks retrieved successfully', result));
});

module.exports = {
  uploadBulkMarks,
  getMyMarks,
  getStudentMarks,
  getSubjectMarks
};
