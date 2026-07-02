const Announcement = require('../models/Announcement');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');
const notificationService = require('./notification.service');

/**
 * Publish a new announcement
 * @param {string} userId - User posting the announcement
 * @param {Object} announcementData
 * @returns {Promise<Object>} Created announcement
 */
const createAnnouncement = async (userId, announcementData) => {
  const { title, content, targetAudience, department, expiresAt } = announcementData;

  return Announcement.create({
    title,
    content,
    targetAudience: targetAudience || 'all',
    department: department || null,
    postedBy: userId,
    expiresAt: expiresAt || null
  });

  // Notification hook
  const payload = {
    title: `New Announcement: ${title}`,
    message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
    type: 'announcement',
    priority: 'medium',
    sender: userId,
    expiresAt: expiresAt || null
  };

  if (targetAudience === 'all') {
    notificationService.sendToRole('student', payload);
    notificationService.sendToRole('faculty', payload);
  } else if (targetAudience === 'students') {
    notificationService.sendToRole('student', payload);
  } else if (targetAudience === 'faculty') {
    notificationService.sendToRole('faculty', payload);
  } else if (targetAudience === 'department' && department) {
    // Notify department students & faculty
    Student.find({ department }).select('user').lean().then(students => {
      notificationService.sendToMany(students.map(s => s.user), payload);
    });
    Faculty.find({ department }).select('user').lean().then(faculties => {
      notificationService.sendToMany(faculties.map(f => f.user), payload);
    });
  }

  return announcement;
};

/**
 * Query all announcements with filters/pagination
 * @param {Object} query
 * @returns {Promise<Object>}
 */
const queryAnnouncements = async (query) => {
  return paginateQuery(Announcement, query, {
    searchFields: ['title', 'content', 'targetAudience'],
    populate: [
      { path: 'postedBy', select: 'name role' },
      { path: 'department' }
    ]
  });
};

/**
 * Get active announcements relevant to the logged-in user (role & department specific)
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<Array>} List of announcements
 */
const getAnnouncementsForUser = async (userId, role) => {
  const orConditions = [
    { targetAudience: 'all' }
  ];

  // Map role to plural audience enums
  if (role === 'student') {
    orConditions.push({ targetAudience: 'students' });
    
    // Check if student has a department
    const student = await Student.findOne({ user: userId });
    if (student && student.department) {
      orConditions.push({
        targetAudience: 'department',
        department: student.department
      });
    }
  } else if (role === 'faculty') {
    orConditions.push({ targetAudience: 'faculty' });
    
    // Check department
    const faculty = await Faculty.findOne({ user: userId });
    if (faculty && faculty.department) {
      orConditions.push({
        targetAudience: 'department',
        department: faculty.department
      });
    }
  } else if (role === 'admin') {
    orConditions.push({ targetAudience: 'faculty' });
    orConditions.push({ targetAudience: 'students' });
  }

  const query = { $or: orConditions };

  // Exclude expired ones if expiresAt is set and in the past
  query.$and = [
    {
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }
  ];

  return Announcement.find(query)
    .populate('postedBy', 'name role')
    .populate('department')
    .sort({ createdAt: -1 });
};

/**
 * Delete an announcement
 * @param {string} id
 * @returns {Promise<Object>}
 */
const deleteAnnouncement = async (id) => {
  const ann = await Announcement.findById(id);
  if (!ann) {
    throw new ApiError(404, 'Announcement not found');
  }
  await ann.deleteOne();
  return ann;
};

module.exports = {
  createAnnouncement,
  queryAnnouncements,
  getAnnouncementsForUser,
  deleteAnnouncement
};
