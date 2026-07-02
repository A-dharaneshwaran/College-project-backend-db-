const subjectService = require('../services/subject.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const createSubject = catchAsync(async (req, res) => {
  const sub = await subjectService.createSubject(req.body);
  res.status(201).json(new ApiResponse(201, 'Subject created successfully', sub));
});

const getSubjects = catchAsync(async (req, res) => {
  const result = await subjectService.querySubjects(req.query);
  res.status(200).json(new ApiResponse(200, 'Subjects retrieved successfully', result));
});

const getSubject = catchAsync(async (req, res) => {
  const sub = await subjectService.getSubjectById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Subject retrieved successfully', sub));
});

const updateSubject = catchAsync(async (req, res) => {
  const sub = await subjectService.updateSubject(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Subject updated successfully', sub));
});

const deleteSubject = catchAsync(async (req, res) => {
  await subjectService.deleteSubject(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Subject deleted successfully', null));
});

module.exports = {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject
};
