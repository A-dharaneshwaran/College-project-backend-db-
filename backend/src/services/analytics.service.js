const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Achievement = require('../models/Achievement');
const DisciplineReport = require('../models/DisciplineReport');
const Query = require('../models/Query');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ApiError = require('../utils/ApiError');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

exports.clearAnalyticsCache = () => {
  cache.clear();
};

/**
 * Helper to execute an aggregation pipeline and cache it
 */
const aggregateWithCache = async (Model, pipeline, cacheKey) => {
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const result = await Model.aggregate(pipeline).exec();
  setCache(cacheKey, result);
  return result;
};

/**
 * Dashboard Overview
 */
exports.getDashboardOverview = async () => {
  const cacheKey = 'dashboard_overview';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents,
    totalFaculty,
    totalDepartments,
    totalSubjects,
    avgAttendanceRes,
    avgCgpaRes,
    passPercentageRes,
    backlogRes,
    todayRegistrations,
    monthlyRegistrations,
    announcementsPublished,
    notificationsSent,
    activityLogs,
    bulkImports,
    bulkExports,
    genderDist,
    deptDist,
    messagesToday,
    activeConversations,
    broadcastCount
  ] = await Promise.all([
    Student.countDocuments(),
    Faculty.countDocuments(),
    Department.countDocuments(),
    Subject.countDocuments(),
    
    // Avg Attendance
    Attendance.aggregate([
      { $group: { _id: null, totalClasses: { $sum: 1 }, presentClasses: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } } } },
      { $project: { _id: 0, avg: { $multiply: [{ $divide: ["$presentClasses", { $cond: [{ $eq: ["$totalClasses", 0] }, 1, "$totalClasses"] }] }, 100] } } }
    ]),

    // Avg CGPA: Group marks by student, calculate each student's CGPA, then average them
    Marks.aggregate([
      {
        $group: {
          _id: "$student",
          cgpa: { $avg: { $multiply: [{ $divide: ["$obtainedMarks", "$maxMarks"] }, 10] } }
        }
      },
      {
        $group: {
          _id: null,
          avgCgpa: { $avg: "$cgpa" }
        }
      }
    ]),

    // Pass Percentage (Based on Marks: Pass is obtainedMarks >= 50% of maxMarks)
    Marks.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $gte: ["$obtainedMarks", { $multiply: ["$maxMarks", 0.5] }] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          rate: { $multiply: [{ $divide: ["$passed", { $cond: [{ $eq: ["$total", 0] }, 1, "$total"] }] }, 100] }
        }
      }
    ]),

    // Backlogs (Count of students who have at least one mark below 50% of maxMarks)
    Marks.aggregate([
      {
        $project: {
          student: 1,
          isBacklog: { $cond: [{ $lt: ["$obtainedMarks", { $multiply: ["$maxMarks", 0.5] }] }, 1, 0] }
        }
      },
      {
        $group: {
          _id: "$student",
          backlogCount: { $sum: "$isBacklog" }
        }
      },
      {
        $match: { backlogCount: { $gt: 0 } }
      },
      {
        $count: "count"
      }
    ]),

    // Today's Registrations
    Student.countDocuments({ createdAt: { $gte: startOfDay } }),
    
    // Monthly Registrations
    Student.countDocuments({ createdAt: { $gte: startOfMonth } }),

    // Announcements
    Announcement.countDocuments(),

    // Notifications Sent
    Notification.countDocuments(),

    // Activity Logs
    ActivityLog.countDocuments(),

    // Bulk Imports
    ActivityLog.countDocuments({ action: 'BULK_IMPORT' }),
    
    // Bulk Exports
    ActivityLog.countDocuments({ action: 'BULK_EXPORT' }),

    // Gender Distribution
    Student.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]),

    // Department Distribution
    Student.aggregate([
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: "$dept" },
      { $group: { _id: "$dept.name", count: { $sum: 1 } } }
    ]),

    // Messages Today
    Message.countDocuments({ createdAt: { $gte: startOfDay } }),

    // Active Conversations
    Conversation.countDocuments({ isArchived: false, isDeleted: false }),

    // Broadcast Count
    Conversation.countDocuments({ type: { $in: ['department_broadcast', 'institution_broadcast'] } })
  ]);

  const result = {
    institution: {
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalSubjects
    },
    performance: {
      averageAttendance: avgAttendanceRes[0]?.avg || 0,
      averageCgpa: avgCgpaRes[0]?.avgCgpa || 0,
      passPercentage: passPercentageRes[0]?.rate || 0,
      studentsWithBacklogs: backlogRes[0]?.count || 0
    },
    activity: {
      todayRegistrations,
      monthlyRegistrations,
      announcementsPublished,
      notificationsSent,
      activityLogs,
      bulkImports,
      bulkExports,
      messagesToday,
      activeConversations,
      broadcastCount
    },
    distributions: {
      gender: genderDist.map(d => ({ label: d._id || 'Unknown', value: d.count })),
      department: deptDist.map(d => ({ label: d._id || 'Unknown', value: d.count }))
    }
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Attendance Analytics
 */
exports.getAttendanceAnalytics = async (filters = {}) => {
  const cacheKey = `attendance_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const matchStage = {};
  if (filters.dateFrom || filters.dateTo) {
    matchStage.date = {};
    if (filters.dateFrom) matchStage.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.date.$lte = new Date(filters.dateTo);
  }

  const [byDept, byMonth] = await Promise.all([
    // By Department
    Attendance.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
      { $unwind: "$studentDoc" },
      { $lookup: { from: 'departments', localField: 'studentDoc.department', foreignField: '_id', as: 'dept' } },
      { $unwind: "$dept" },
      { $group: { 
        _id: "$dept.name", 
        total: { $sum: 1 }, 
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } } 
      }},
      { $project: { _id: 1, rate: { $multiply: [{ $divide: ["$present", "$total"] }, 100] } } },
      { $sort: { rate: -1 } }
    ]),
    
    // By Month
    Attendance.aggregate([
      { $match: matchStage },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
      }},
      { $project: { _id: 1, rate: { $multiply: [{ $divide: ["$present", "$total"] }, 100] } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  const result = {
    byDepartment: {
      labels: byDept.map(d => d._id),
      datasets: [{ data: byDept.map(d => d.rate) }]
    },
    trend: {
      labels: byMonth.map(d => d._id),
      datasets: [{ data: byMonth.map(d => d.rate) }]
    }
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Demographics Analytics
 */
exports.getDemographics = async (filters = {}) => {
  const cacheKey = `demographics_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [gender, year, semester] = await Promise.all([
    Student.aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }]),
    Student.aggregate([{ $group: { _id: "$year", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Student.aggregate([{ $group: { _id: "$semester", count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
  ]);

  const result = {
    gender: {
      labels: gender.map(g => g._id || 'Unknown'),
      datasets: [{ data: gender.map(g => g.count) }]
    },
    year: {
      labels: year.map(y => `Year ${y._id}`),
      datasets: [{ data: year.map(y => y.count) }]
    },
    semester: {
      labels: semester.map(s => `Sem ${s._id}`),
      datasets: [{ data: semester.map(s => s.count) }]
    }
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Performance Analytics
 */
exports.getPerformanceAnalytics = async (filters = {}) => {
  const cacheKey = `performance_${JSON.stringify(filters)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [deptPerf, topStudents, weakStudents] = await Promise.all([
    // Performance by Department: Calculate student CGPAs first, then group by department
    Marks.aggregate([
      {
        $group: {
          _id: "$student",
          cgpa: { $avg: { $multiply: [{ $divide: ["$obtainedMarks", "$maxMarks"] }, 10] } }
        }
      },
      {
        $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'studentDoc' }
      },
      { $unwind: "$studentDoc" },
      {
        $lookup: { from: 'departments', localField: 'studentDoc.department', foreignField: '_id', as: 'dept' }
      },
      { $unwind: "$dept" },
      {
        $group: { _id: "$dept.name", avgCgpa: { $avg: "$cgpa" } }
      },
      { $sort: { avgCgpa: -1 } }
    ]),
    
    // Top Students: Get top 10 students based on calculated CGPA
    Marks.aggregate([
      {
        $group: {
          _id: "$student",
          cgpa: { $avg: { $multiply: [{ $divide: ["$obtainedMarks", "$maxMarks"] }, 10] } }
        }
      },
      { $sort: { cgpa: -1 } },
      { $limit: 10 },
      {
        $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'studentDoc' }
      },
      { $unwind: "$studentDoc" },
      {
        $lookup: { from: 'users', localField: 'studentDoc.user', foreignField: '_id', as: 'userDoc' }
      },
      { $unwind: "$userDoc" },
      {
        $lookup: { from: 'departments', localField: 'studentDoc.department', foreignField: '_id', as: 'dept' }
      },
      { $unwind: "$dept" },
      {
        $project: {
          name: "$userDoc.name",
          registerNumber: "$studentDoc.registerNumber",
          cgpa: { $round: ["$cgpa", 2] },
          department: "$dept.name"
        }
      }
    ]),

    // At Risk Students: Students with CGPA below 6.0
    Marks.aggregate([
      {
        $group: {
          _id: "$student",
          cgpa: { $avg: { $multiply: [{ $divide: ["$obtainedMarks", "$maxMarks"] }, 10] } },
          totalBacklogs: {
            $sum: {
              $cond: [{ $lt: ["$obtainedMarks", { $multiply: ["$maxMarks", 0.5] }] }, 1, 0]
            }
          }
        }
      },
      { $match: { cgpa: { $lt: 6.0 } } },
      { $sort: { cgpa: 1 } },
      { $limit: 10 },
      {
        $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'studentDoc' }
      },
      { $unwind: "$studentDoc" },
      {
        $lookup: { from: 'users', localField: 'studentDoc.user', foreignField: '_id', as: 'userDoc' }
      },
      { $unwind: "$userDoc" },
      {
        $lookup: { from: 'departments', localField: 'studentDoc.department', foreignField: '_id', as: 'dept' }
      },
      { $unwind: "$dept" },
      {
        $project: {
          name: "$userDoc.name",
          registerNumber: "$studentDoc.registerNumber",
          cgpa: { $round: ["$cgpa", 2] },
          historyOfArrears: "$totalBacklogs",
          department: "$dept.name"
        }
      }
    ])
  ]);

  const result = {
    byDepartment: {
      labels: deptPerf.map(d => d._id),
      datasets: [{ data: deptPerf.map(d => d.avgCgpa) }]
    },
    topStudents,
    weakStudents
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Faculty Analytics
 */
exports.getFacultyAnalytics = async () => {
  const cacheKey = 'faculty_analytics';
  return await aggregateWithCache(Faculty, [
    { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
    { $unwind: "$dept" },
    { $group: { _id: "$dept.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ], cacheKey);
};

/**
 * Department Analytics
 */
exports.getDepartmentAnalytics = async () => {
  const cacheKey = 'department_analytics';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [studentDist, facultyDist] = await Promise.all([
    Student.aggregate([
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: "$dept" },
      { $group: { _id: "$dept.name", students: { $sum: 1 } } }
    ]),
    Faculty.aggregate([
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: "$dept" },
      { $group: { _id: "$dept.name", faculty: { $sum: 1 } } }
    ])
  ]);
  
  // Merge the two arrays by department name
  const merged = {};
  studentDist.forEach(s => { merged[s._id] = { department: s._id, students: s.students, faculty: 0 }; });
  facultyDist.forEach(f => {
    if (!merged[f._id]) merged[f._id] = { department: f._id, students: 0, faculty: 0 };
    merged[f._id].faculty = f.faculty;
  });

  const resultList = Object.values(merged).map(item => ({
    ...item,
    ratio: item.faculty > 0 ? (item.students / item.faculty).toFixed(2) : 'N/A'
  })).sort((a, b) => b.students - a.students);

  const result = {
    distribution: {
      labels: resultList.map(r => r.department),
      datasets: [
        { data: resultList.map(r => r.students), name: "Students" },
        { data: resultList.map(r => r.faculty), name: "Faculty" }
      ]
    },
    table: resultList
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Activity Analytics
 */
exports.getActivityAnalytics = async () => {
  const cacheKey = 'activity_analytics';
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const [dailyTrend, byModule] = await Promise.all([
    ActivityLog.aggregate([
      { $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 30 } // Last 30 days
    ]),
    ActivityLog.aggregate([
      { $group: { _id: "$module", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const result = {
    trend: {
      labels: dailyTrend.map(d => d._id),
      datasets: [{ data: dailyTrend.map(d => d.count) }]
    },
    modules: {
      labels: byModule.map(m => m._id),
      datasets: [{ data: byModule.map(m => m.count) }]
    }
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Notification Analytics
 */
exports.getNotificationAnalytics = async () => {
  const cacheKey = 'notification_analytics';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [byType, status] = await Promise.all([
    Notification.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Notification.aggregate([
      { $group: { _id: "$isRead", count: { $sum: 1 } } }
    ])
  ]);
  
  const readCount = status.find(s => s._id === true)?.count || 0;
  const unreadCount = status.find(s => s._id === false)?.count || 0;
  const total = readCount + unreadCount;
  const readRate = total > 0 ? ((readCount / total) * 100).toFixed(1) : 0;

  const result = {
    byType: {
      labels: byType.map(t => t._id),
      datasets: [{ data: byType.map(t => t.count) }]
    },
    stats: {
      readRate,
      unreadCount,
      total
    }
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Trend Analytics (Comparative)
 */
exports.getTrendAnalytics = async () => {
  const cacheKey = 'trend_analytics';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const now = new Date();
  
  // Calculate date boundaries
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currStudents, prevStudents] = await Promise.all([
    Student.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    Student.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } })
  ]);

  const calcTrend = (curr, prev) => {
    if (prev === 0) return { current: curr, previous: prev, difference: curr, percentageChange: 100, trend: 'up' };
    const diff = curr - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return {
      current: curr,
      previous: prev,
      difference: diff,
      percentageChange: Math.abs(pct),
      trend: diff > 0 ? 'up' : (diff < 0 ? 'down' : 'stable')
    };
  };

  const result = {
    registrations: calcTrend(currStudents, prevStudents)
    // Add more comparative analytics here using same pattern if required
  };

  setCache(cacheKey, result);
  return result;
};

/**
 * Report Generation Stub
 * This reuses standard CSV bulk export if needed, or isolates PDF logic.
 */
exports.generateReport = async (reportType, format, filters) => {
  // We'll rely on existing JSON->CSV utilities in the controller or just return data here
  return { message: "Report generation backend implemented. Real data to be mapped in controller." };
};
