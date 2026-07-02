const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const DisciplineReport = require('../models/DisciplineReport');
const IllegalActivity = require('../models/IllegalActivity');
const Query = require('../models/Query');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get core metrics across all modules for the Admin dashboard,
 * including a compact summary of recent administrative activities.
 * @returns {Promise<Object>} Aggregate statistics
 */
const getAdminDashboardStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    studentCount,
    facultyCount,
    departmentCount,
    activeDisciplineCount,
    activeIllegalCount,
    openQueryCount,
    todayStudentImports,
    todayFacultyImports,
    todayExports,
    lastImport,
    lastExport,
    recentActions
  ] = await Promise.all([
    Student.countDocuments({}),
    Faculty.countDocuments({}),
    Department.countDocuments({}),
    DisciplineReport.countDocuments({ status: { $ne: 'Resolved' } }),
    IllegalActivity.countDocuments({ status: { $ne: 'Resolved' } }),
    Query.countDocuments({ status: 'open' }),
    ActivityLog.countDocuments({ action: 'Bulk Student Import', createdAt: { $gte: startOfToday } }),
    ActivityLog.countDocuments({ action: 'Bulk Faculty Import', createdAt: { $gte: startOfToday } }),
    ActivityLog.countDocuments({ action: { $in: ['Student Export', 'Faculty Export'] }, createdAt: { $gte: startOfToday } }),
    ActivityLog.findOne({ action: { $in: ['Bulk Student Import', 'Bulk Faculty Import'] } }).sort({ createdAt: -1 }).select('createdAt'),
    ActivityLog.findOne({ action: { $in: ['Student Export', 'Faculty Export'] } }).sort({ createdAt: -1 }).select('createdAt'),
    ActivityLog.find().populate('adminUser', 'name email').sort({ createdAt: -1 }).limit(10).lean()
  ]);

  return {
    students: studentCount,
    faculty: facultyCount,
    departments: departmentCount,
    discipline: activeDisciplineCount,
    illegalActivities: activeIllegalCount,
    openQueries: openQueryCount,
    activitySummary: {
      todayStudentImports,
      todayFacultyImports,
      todayExports,
      lastImportTime: lastImport ? lastImport.createdAt : null,
      lastExportTime: lastExport ? lastExport.createdAt : null,
      recentActions
    }
  };
};

module.exports = {
  getAdminDashboardStats
};
