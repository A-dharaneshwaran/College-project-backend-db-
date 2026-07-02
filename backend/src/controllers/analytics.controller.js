const analyticsService = require('../services/analytics.service');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parse } = require('json2csv'); // using standard logic

/**
 * Common wrapper to handle caching, fetching, and formatting
 */
const handleAnalyticsRequest = (serviceMethod) => catchAsync(async (req, res) => {
  const filters = req.query || {};
  const data = await analyticsService[serviceMethod](filters);
  
  res.status(200).json({
    success: true,
    data
  });
});

exports.getDashboardOverview = handleAnalyticsRequest('getDashboardOverview');
exports.getAttendanceAnalytics = handleAnalyticsRequest('getAttendanceAnalytics');
exports.getPerformanceAnalytics = handleAnalyticsRequest('getPerformanceAnalytics');
exports.getDepartmentAnalytics = handleAnalyticsRequest('getDepartmentAnalytics');
exports.getFacultyAnalytics = handleAnalyticsRequest('getFacultyAnalytics');
exports.getDemographics = handleAnalyticsRequest('getDemographics');
exports.getActivityAnalytics = handleAnalyticsRequest('getActivityAnalytics');
exports.getNotificationAnalytics = handleAnalyticsRequest('getNotificationAnalytics');
exports.getTrendAnalytics = handleAnalyticsRequest('getTrendAnalytics');

/**
 * Clear Cache endpoint (Admin manual override)
 */
exports.clearCache = catchAsync(async (req, res) => {
  analyticsService.clearAnalyticsCache();
  res.status(200).json({ success: true, message: 'Analytics cache cleared successfully' });
});

/**
 * Export Analytics Reports
 */
exports.exportReport = catchAsync(async (req, res) => {
  const { type, format } = req.query;
  
  if (!['CSV', 'XLSX', 'PDF'].includes(format?.toUpperCase())) {
    throw new ApiError(400, 'Invalid export format requested');
  }

  // Determine what data to export based on type
  let dataToExport = [];
  switch(type) {
    case 'students': {
      const Student = require('../models/Student');
      const students = await Student.find().populate('user', 'name email').populate('department', 'code name').lean();
      dataToExport = students.map(s => ({
        'Register Number': s.registerNumber || '',
        'Full Name': s.user?.name || '',
        'Email': s.user?.email || '',
        'Department Code': s.department?.code || '',
        'Department Name': s.department?.name || '',
        'Year': s.year || '',
        'Semester': s.semester || '',
        'Phone Number': s.phone || '',
        'Gender': s.gender || '',
        'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
        'Father Name': s.parentDetails?.fatherName || '',
        'Father Phone': s.parentDetails?.fatherPhone || '',
        'Mother Name': s.parentDetails?.motherName || '',
        'Mother Phone': s.parentDetails?.motherPhone || ''
      }));
      break;
    }
    case 'faculty': {
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.find().populate('user', 'name email').populate('department', 'code name').populate('subjects', 'name code').lean();
      dataToExport = faculty.map(f => ({
        'Employee ID': f.employeeId || '',
        'Full Name': f.user?.name || '',
        'Email': f.user?.email || '',
        'Department Code': f.department?.code || '',
        'Department Name': f.department?.name || '',
        'Designation': f.designation || '',
        'Specialization': f.specialization || '',
        'Phone Number': f.phone || '',
        'Subjects': (f.subjects || []).map(sub => sub.name || sub.code || '').join(', '),
        'Joining Date': f.joiningDate ? new Date(f.joiningDate).toISOString().split('T')[0] : ''
      }));
      break;
    }
    case 'attendance': {
      const Attendance = require('../models/Attendance');
      const attendance = await Attendance.find()
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .populate('subject', 'name code')
        .populate({ path: 'markedBy', populate: { path: 'user', select: 'name' } })
        .lean();
      dataToExport = attendance.map(a => ({
        'Student Name': a.student?.user?.name || '',
        'Register Number': a.student?.registerNumber || '',
        'Subject Code': a.subject?.code || '',
        'Subject Name': a.subject?.name || '',
        'Date': a.date ? new Date(a.date).toISOString().split('T')[0] : '',
        'Status': a.status || '',
        'Marked By': a.markedBy?.user?.name || ''
      }));
      break;
    }
    case 'performance': {
      const Marks = require('../models/Marks');
      const marks = await Marks.find()
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .populate('subject', 'name code')
        .lean();
      dataToExport = marks.map(m => ({
        'Student Name': m.student?.user?.name || '',
        'Register Number': m.student?.registerNumber || '',
        'Subject Code': m.subject?.code || '',
        'Subject Name': m.subject?.name || '',
        'Exam Type': m.examType || '',
        'Semester': m.semester || '',
        'Academic Year': m.academicYear || '',
        'Obtained Marks': m.obtainedMarks || 0,
        'Max Marks': m.maxMarks || 0,
        'Percentage': m.maxMarks ? Math.round((m.obtainedMarks / m.maxMarks) * 100) : 0
      }));
      break;
    }
    case 'discipline': {
      const DisciplineReport = require('../models/DisciplineReport');
      const discipline = await DisciplineReport.find()
        .populate({ path: 'students', populate: { path: 'user', select: 'name' } })
        .populate({ path: 'reportedBy', populate: { path: 'user', select: 'name' } })
        .lean();
      dataToExport = discipline.map(d => ({
        'Students': d.students.map(s => s.user?.name || '').join('; '),
        'Register Numbers': d.students.map(s => s.registerNumber || '').join('; '),
        'Issues': (d.issues || []).join(', '),
        'Severity': d.severity || '',
        'Description': d.description || '',
        'Reported By': d.reportedBy?.user?.name || '',
        'Status': d.status || '',
        'Action Taken': d.actionTaken || ''
      }));
      break;
    }
    case 'activity': {
      const ActivityLog = require('../models/ActivityLog');
      const activity = await ActivityLog.find().populate('adminUser', 'name email').sort({ createdAt: -1 }).lean();
      dataToExport = activity.map(act => ({
        'Admin Name': act.adminUser?.name || '',
        'Admin Email': act.adminUser?.email || '',
        'Action': act.action || '',
        'Module': act.module || '',
        'Entity ID': act.entityId || '',
        'Entity Type': act.entityType || '',
        'Description': act.description || '',
        'IP Address': act.ipAddress || '',
        'Status': act.status || '',
        'Timestamp': act.createdAt ? new Date(act.createdAt).toISOString() : ''
      }));
      break;
    }
    default:
      dataToExport = [{ message: "Export logic placeholder" }];
  }

  // Handle formats
  if (format.toUpperCase() === 'CSV' || format.toUpperCase() === 'XLSX') {
    // Both handled via simple CSV output for now as existing bulk export does
    try {
      const csv = parse(dataToExport);
      res.header('Content-Type', 'text/csv');
      res.attachment(`report_${type}_${Date.now()}.csv`);
      return res.send(csv);
    } catch (err) {
      throw new ApiError(500, 'Error generating CSV/XLSX export');
    }
  } else if (format.toUpperCase() === 'PDF') {
    // Isolate PDF Generation (Stubbed for future infrastructure)
    throw new ApiError(501, 'PDF generation infrastructure is not yet enabled on the server.');
  }
});
