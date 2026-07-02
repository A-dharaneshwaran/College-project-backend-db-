const IllegalActivity = require('../models/IllegalActivity');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');
const notificationService = require('./notification.service');

/**
 * File an illegal activity report (Admin only)
 * @param {Object} reportData
 * @returns {Promise<Object>} Created report
 */
const createReport = async (reportData) => {
  const { studentRegNumber, issue, severity, date, status, reportedBy, details, officialReportUrl } = reportData;

  const student = await Student.findOne({ registerNumber: studentRegNumber });
  if (!student) {
    throw new ApiError(404, `Student with register number ${studentRegNumber} not found`);
  }

  const report = await IllegalActivity.create({
    student: student._id,
    issue,
    severity: severity || 'High',
    date: date || new Date(),
    status: status || 'Active',
    reportedBy,
    details,
    officialReportUrl: officialReportUrl || ''
  });

  // Notification hook
  notificationService.sendToRole('admin', {
    title: 'Illegal Activity Reported',
    message: `A new illegal activity report has been filed against ${studentRegNumber} for ${issue}.`,
    type: 'system',
    priority: 'high',
    sender: reportedBy
  });

  return report;
};

/**
 * Query illegal activity reports with filters/pagination
 * @param {Object} query
 * @returns {Promise<Object>}
 */
const queryReports = async (query) => {
  return paginateQuery(IllegalActivity, query, {
    searchFields: ['issue', 'reportedBy', 'details', 'status'],
    populate: { path: 'student', populate: [{ path: 'user', select: 'name' }, { path: 'department', select: 'code' }] }
  });
};

/**
 * Update an illegal activity report
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateReport = async (id, updateBody) => {
  const report = await IllegalActivity.findById(id);
  if (!report) {
    throw new ApiError(404, 'Illegal activity report not found');
  }

  Object.assign(report, updateBody);
  await report.save();
  return report;
};

/**
 * Delete a report
 * @param {string} id
 * @returns {Promise<Object>}
 */
const deleteReport = async (id) => {
  const report = await IllegalActivity.findById(id);
  if (!report) {
    throw new ApiError(404, 'Illegal activity report not found');
  }
  await report.deleteOne();
  return report;
};

module.exports = {
  createReport,
  queryReports,
  updateReport,
  deleteReport
};
