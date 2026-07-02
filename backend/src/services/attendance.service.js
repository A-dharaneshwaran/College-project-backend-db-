const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notification.service');

/**
 * Bulk insert or update attendance records for a subject on a date
 * @param {string} facultyUserId - User ID of faculty marking attendance
 * @param {Object} payload - { subject, date, records: [{ student, status }] }
 * @returns {Promise<Object>} Status message
 */
const markBulkAttendance = async (facultyUserId, payload) => {
  const faculty = await Faculty.findOne({ user: facultyUserId });
  if (!faculty) {
    throw new ApiError(403, 'Only faculty members can mark attendance');
  }

  const { subject, date, records } = payload;
  
  // Normalize date to start of the day for clean filtering
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Bulk operations
  const operations = records.map((rec) => ({
    updateOne: {
      filter: { student: rec.student, subject, date: startOfDay },
      update: {
        $set: {
          status: rec.status,
          markedBy: faculty._id
        }
      },
      upsert: true
    }
  }));

  await Attendance.bulkWrite(operations);

  // Notification hook - only notify absent/late students to reduce noise
  const alertRecords = records.filter(r => r.status === 'Absent' || r.status === 'Late');
  if (alertRecords.length > 0) {
    const studentIds = alertRecords.map(r => r.student);
    Student.find({ _id: { $in: studentIds } }).select('user').lean().then(students => {
      // Create a map to find the status for each student
      const studentMap = {};
      alertRecords.forEach(r => studentMap[r.student.toString()] = r.status);
      
      students.forEach(s => {
        const status = studentMap[s._id.toString()];
        notificationService.sendNotification(s.user, {
          title: `Attendance Alert: ${status}`,
          message: `You have been marked ${status} for today's class.`,
          type: 'academic',
          priority: status === 'Absent' ? 'high' : 'medium',
          sender: facultyUserId
        });
      });
    });
  }

  return { message: `Successfully updated ${records.length} attendance records` };
};

/**
 * Get attendance report for a specific student
 * @param {string} studentId
 * @returns {Promise<Object>} Detailed summary
 */
const getStudentAttendanceReport = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const records = await Attendance.find({ student: studentId })
    .populate('subject')
    .populate({ path: 'markedBy', populate: { path: 'user', select: 'name' } })
    .sort({ date: -1 });

  // Calculate percentages
  const total = records.length;
  const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

  // Calculate subject-wise percentages
  const subjectMap = {};
  records.forEach(r => {
    const subCode = r.subject.code;
    if (!subjectMap[subCode]) {
      subjectMap[subCode] = { name: r.subject.name, present: 0, total: 0 };
    }
    subjectMap[subCode].total += 1;
    if (r.status === 'Present' || r.status === 'Late') {
      subjectMap[subCode].present += 1;
    }
  });

  const subjectWise = Object.keys(subjectMap).map(code => ({
    code,
    name: subjectMap[code].name,
    percentage: Math.round((subjectMap[code].present / subjectMap[code].total) * 100),
    present: subjectMap[code].present,
    total: subjectMap[code].total
  }));

  return {
    overall: {
      percentage,
      present,
      total
    },
    subjectWise,
    records
  };
};

/**
 * Get attendance list for a subject on a specific date (for Faculty review)
 * @param {string} subjectId
 * @param {string} dateString
 * @returns {Promise<Array>}
 */
const getSubjectAttendanceByDate = async (subjectId, dateString) => {
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  return Attendance.find({ subject: subjectId, date: targetDate })
    .populate({ path: 'student', populate: { path: 'user', select: 'name' } });
};

module.exports = {
  markBulkAttendance,
  getStudentAttendanceReport,
  getSubjectAttendanceByDate
};
