const DisciplineReport = require('../models/DisciplineReport');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');
const notificationService = require('./notification.service');

/**
 * File a discipline report
 * @param {string} facultyUserId
 * @param {Object} reportData
 * @returns {Promise<Object>} Created report
 */
const createReport = async (facultyUserId, reportData) => {
  const faculty = await Faculty.findOne({ user: facultyUserId });
  if (!faculty) {
    throw new ApiError(403, 'Only faculty members can file discipline reports');
  }

  const { studentRegNumbers, issues, severity, description } = reportData;

  // Find Student IDs from Register Numbers
  const students = await Student.find({ registerNumber: { $in: studentRegNumbers } });
  if (students.length === 0) {
    throw new ApiError(400, 'No valid students found with specified register numbers');
  }

  const studentIds = students.map(s => s._id);

  return DisciplineReport.create({
    students: studentIds,
    issues,
    severity: severity || 'Low',
    description,
    reportedBy: faculty._id,
    status: 'Pending'
  });
  
  // Notification hook
  notificationService.sendToMany(
    students.map(s => s.user),
    {
      title: 'Discipline Report Filed',
      message: `A discipline report has been filed against you for: ${issues.join(', ')}. Severity: ${severity || 'Low'}`,
      type: 'discipline',
      priority: severity === 'High' ? 'high' : 'medium',
      sender: facultyUserId
    }
  );
  
  return report;
};

/**
 * Query discipline reports with search/pagination
 * @param {Object} query
 * @returns {Promise<Object>}
 */
const queryReports = async (query) => {
  return paginateQuery(DisciplineReport, query, {
    searchFields: ['description', 'status', 'severity'],
    populate: [
      { path: 'students', populate: [{ path: 'user', select: 'name' }, { path: 'department', select: 'code name' }] },
      { path: 'reportedBy', populate: { path: 'user', select: 'name' } },
      { path: 'resolvedBy', select: 'name' }
    ]
  });
};

/**
 * Get discipline reports for current student
 * @param {string} studentUserId
 * @returns {Promise<Array>}
 */
const getStudentReports = async (studentUserId) => {
  const student = await Student.findOne({ user: studentUserId });
  if (!student) {
    throw new ApiError(404, 'Student profile not found');
  }

  return DisciplineReport.find({ students: student._id })
    .populate({ path: 'reportedBy', populate: { path: 'user', select: 'name' } })
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Get discipline reports of a specific student by student ID (for Faculty/Admin)
 * @param {string} studentId
 * @returns {Promise<Array>}
 */
const getReportsByStudentId = async (studentId) => {
  return DisciplineReport.find({ students: studentId })
    .populate({ path: 'reportedBy', populate: { path: 'user', select: 'name' } })
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Resolve a discipline report
 * @param {string} reportId
 * @param {string} adminUserId - Admin resolving the issue
 * @param {Object} resolutionData - { status, actionTaken }
 * @returns {Promise<Object>} Updated report
 */
const resolveReport = async (reportId, adminUserId, resolutionData) => {
  const report = await DisciplineReport.findById(reportId);
  if (!report) {
    throw new ApiError(404, 'Discipline report not found');
  }

  report.status = resolutionData.status || 'Resolved';
  report.actionTaken = resolutionData.actionTaken || '';
  report.resolvedBy = adminUserId;
  report.resolvedAt = new Date();

  await report.save();
  
  // Notification hook
  const studentUserIds = report.students.map(s => s.user);
  if (studentUserIds.length > 0) {
    notificationService.sendToMany(studentUserIds, {
      title: 'Discipline Report Resolved',
      message: `Your discipline report has been marked as ${report.status}. Action taken: ${report.actionTaken || 'None'}`,
      type: 'success',
      priority: 'low',
      sender: adminUserId
    });
  }

  return report;
};

module.exports = {
  createReport,
  queryReports,
  getStudentReports,
  getReportsByStudentId,
  resolveReport
};
