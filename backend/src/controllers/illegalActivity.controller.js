const illegalActivityService = require('../services/illegalActivity.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../services/activityLog.service');

const createReport = catchAsync(async (req, res) => {
  const report = await illegalActivityService.createReport(req.body);
  
  if (req.user && req.user.role === 'admin') {
    await logActivity({
      adminUser: req.user._id,
      action: 'Illegal Activity Added',
      module: 'Illegal Activities',
      entityId: report._id,
      entityType: 'IllegalActivity',
      description: `Added illegal activity report for student: ${report.studentName || 'Unknown'}`,
      metadata: {
        reportId: report._id,
        incidentDate: report.incidentDate,
        location: report.location
      }
    });
  }

  res.status(201).json(new ApiResponse(201, 'Illegal activity report filed successfully', report));
});

const getReports = catchAsync(async (req, res) => {
  const result = await illegalActivityService.queryReports(req.query);
  res.status(200).json(new ApiResponse(200, 'Illegal activity reports retrieved successfully', result));
});

const updateReport = catchAsync(async (req, res) => {
  const report = await illegalActivityService.updateReport(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Illegal activity report updated successfully', report));
});

const deleteReport = catchAsync(async (req, res) => {
  await illegalActivityService.deleteReport(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Illegal activity report deleted successfully', null));
});

module.exports = {
  createReport,
  getReports,
  updateReport,
  deleteReport
};
