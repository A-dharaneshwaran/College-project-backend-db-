const Achievement = require('../models/Achievement');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');
const notificationService = require('./notification.service');

/**
 * Log a new student achievement
 * @param {string} studentUserId
 * @param {Object} achievementData
 * @returns {Promise<Object>}
 */
const createAchievement = async (studentUserId, achievementData) => {
  const student = await Student.findOne({ user: studentUserId });
  if (!student) {
    throw new ApiError(404, 'Student profile not found');
  }

  const achievement = await Achievement.create({
    ...achievementData,
    student: student._id
  });

  // Notification hook
  notificationService.sendNotification(studentUserId, {
    title: 'Achievement Logged',
    message: `Congratulations! Your achievement "${achievementData.title}" has been successfully logged.`,
    type: 'achievement',
    priority: 'low'
  });

  return achievement;
};

/**
 * Query achievements with search/pagination (Admin/Faculty search)
 * @param {Object} query
 * @returns {Promise<Object>}
 */
const queryAchievements = async (query) => {
  return paginateQuery(Achievement, query, {
    searchFields: ['title', 'description'],
    populate: { path: 'student', populate: { path: 'user', select: 'name' } }
  });
};

/**
 * Get achievements for logged-in student
 * @param {string} studentUserId
 * @returns {Promise<Array>}
 */
const getStudentAchievements = async (studentUserId) => {
  const student = await Student.findOne({ user: studentUserId });
  if (!student) {
    throw new ApiError(404, 'Student profile not found');
  }

  return Achievement.find({ student: student._id }).sort({ date: -1 });
};

/**
 * Delete achievement record
 * @param {string} id
 * @param {string} userId - Requesting user ID (must be the owner student or admin)
 * @param {string} role - Requesting user role
 * @returns {Promise<Object>} Deleted achievement
 */
const deleteAchievement = async (id, userId, role) => {
  const achievement = await Achievement.findById(id).populate('student');
  if (!achievement) {
    throw new ApiError(404, 'Achievement record not found');
  }

  // Authorize: Admin can delete any; student can only delete their own
  if (role !== 'admin' && achievement.student.user.toString() !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this record');
  }

  await achievement.deleteOne();
  return achievement;
};

module.exports = {
  createAchievement,
  queryAchievements,
  getStudentAchievements,
  deleteAchievement
};
