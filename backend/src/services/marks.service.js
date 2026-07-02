const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notification.service');

/**
 * Bulk upload student marks
 * @param {string} facultyUserId
 * @param {Object} payload
 * @returns {Promise<Object>} Status message
 */
const uploadBulkMarks = async (facultyUserId, payload) => {
  const faculty = await Faculty.findOne({ user: facultyUserId });
  if (!faculty) {
    throw new ApiError(403, 'Only faculty members can upload marks');
  }

  const { subject, examType, maxMarks, semester, academicYear, records } = payload;

  const operations = records.map((rec) => ({
    updateOne: {
      filter: { student: rec.student, subject, examType },
      update: {
        $set: {
          maxMarks,
          obtainedMarks: rec.obtainedMarks,
          semester,
          academicYear,
          uploadedBy: faculty._id
        }
      },
      upsert: true
    }
  }));

  await Marks.bulkWrite(operations);

  // Notification hook
  const studentIds = records.map(r => r.student);
  if (studentIds.length > 0) {
    Student.find({ _id: { $in: studentIds } }).select('user').lean().then(students => {
      notificationService.sendToMany(students.map(s => s.user), {
        title: 'Marks Published',
        message: `Your marks for ${examType} have been published.`,
        type: 'academic',
        priority: 'medium',
        sender: facultyUserId
      });
    });
  }

  return { message: `Successfully uploaded marks for ${records.length} students` };
};

const getStudentMarksReport = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const marks = await Marks.find({ student: studentId })
    .populate('subject')
    .populate({ path: 'uploadedBy', populate: { path: 'user', select: 'name' } })
    .sort({ semester: 1, examType: 1 });

  // Group marks by semester
  const semGroups = {};
  marks.forEach(m => {
    const sem = m.semester || 1;
    if (!semGroups[sem]) semGroups[sem] = [];
    semGroups[sem].push(m);
  });

  const semesterResults = [];
  let totalCreditsSum = 0;
  let weightedGpaSum = 0;
  let totalBacklogs = 0;

  Object.keys(semGroups).sort((a, b) => Number(a) - Number(b)).forEach(semKey => {
    const sem = Number(semKey);
    const semMarks = semGroups[semKey];
    
    // Group by subject within the semester
    const subGroups = {};
    semMarks.forEach(m => {
      if (m.subject) {
        const subId = m.subject._id.toString();
        if (!subGroups[subId]) subGroups[subId] = [];
        subGroups[subId].push(m);
      }
    });

    let semWeightedGpa = 0;
    let semCreditsSum = 0;
    let hasFail = false;

    Object.keys(subGroups).forEach(subId => {
      const subMarks = subGroups[subId];
      const subject = subMarks[0].subject;
      const credits = subject ? (subject.credits || 3) : 3;

      let scoreSum = 0;
      subMarks.forEach(m => {
        scoreSum += m.obtainedMarks / m.maxMarks;
      });
      const avgScore = scoreSum / subMarks.length;
      const subjectGpa = avgScore * 10;

      if (avgScore < 0.5) {
        hasFail = true;
        totalBacklogs++;
      }

      semWeightedGpa += subjectGpa * credits;
      semCreditsSum += credits;
    });

    const semGpa = semCreditsSum > 0 ? Math.round((semWeightedGpa / semCreditsSum) * 100) / 100 : 8.5;
    const status = hasFail ? 'Fail' : (semGpa >= 8.5 ? 'Distinction' : 'Pass');

    semesterResults.push({
      sem,
      gpa: semGpa,
      credits: semCreditsSum,
      status
    });

    weightedGpaSum += semGpa * semCreditsSum;
    totalCreditsSum += semCreditsSum;
  });

  const overallCgpa = totalCreditsSum > 0 ? Math.round((weightedGpaSum / totalCreditsSum) * 100) / 100 : 8.5;

  return {
    summary: {
      semesterResults,
      overallCgpa,
      totalCredits: totalCreditsSum || 124,
      backlogs: totalBacklogs
    },
    marks
  };
};

/**
 * Get subject marks list for an exam type (for faculty analytics)
 * @param {string} subjectId
 * @param {string} examType
 * @returns {Promise<Array>}
 */
const getSubjectMarksReport = async (subjectId, examType) => {
  const query = { subject: subjectId };
  if (examType) {
    query.examType = examType;
  }

  return Marks.find(query)
    .populate({ path: 'student', populate: { path: 'user', select: 'name' } });
};

module.exports = {
  uploadBulkMarks,
  getStudentMarksReport,
  getSubjectMarksReport
};
