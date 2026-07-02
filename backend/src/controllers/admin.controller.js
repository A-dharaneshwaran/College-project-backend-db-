const adminService = require('../services/admin.service');
const activityLogService = require('../services/activityLog.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await adminService.getAdminDashboardStats();
  res.status(200).json(new ApiResponse(200, 'Admin dashboard statistics retrieved successfully', stats));
});

const getActivityHistory = catchAsync(async (req, res) => {
  const result = await activityLogService.getActivityLogs(req.query);
  res.status(200).json(new ApiResponse(200, 'Activity history retrieved successfully', result));
});

const getActivityFilters = catchAsync(async (req, res) => {
  const result = await activityLogService.getFiltersMetadata();
  res.status(200).json(new ApiResponse(200, 'Activity filters retrieved successfully', result));
});

module.exports = {
  getDashboardStats,
  getActivityHistory,
  getActivityFilters
};
