const disciplineService = require('../services/discipline.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../services/activityLog.service');

const createReport = catchAsync(async (req, res) => {
  const report = await disciplineService.createReport(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Discipline report filed successfully', report));
});

const getReports = catchAsync(async (req, res) => {
  const result = await disciplineService.queryReports(req.query);
  res.status(200).json(new ApiResponse(200, 'Discipline reports retrieved successfully', result));
});

const getMyReports = catchAsync(async (req, res) => {
  const reports = await disciplineService.getStudentReports(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Your discipline history retrieved successfully', reports));
});

const getStudentReports = catchAsync(async (req, res) => {
  const reports = await disciplineService.getReportsByStudentId(req.params.studentId);
  res.status(200).json(new ApiResponse(200, 'Student discipline history retrieved successfully', reports));
});

const resolveReport = catchAsync(async (req, res) => {
  const report = await disciplineService.resolveReport(req.params.id, req.user._id, req.body);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Discipline Resolved',
      module: 'Discipline',
      entityId: report._id,
      entityType: 'DisciplineReport',
      description: `Resolved discipline report (ID: ${report._id})`,
      metadata: {
        reportId: report._id,
        actionTaken: req.body.actionTaken || report.actionTaken,
        status: report.status
      }
    });
  }

  res.status(200).json(new ApiResponse(200, 'Discipline report updated successfully', report));
});

module.exports = {
  createReport,
  getReports,
  getMyReports,
  getStudentReports,
  resolveReport
};
