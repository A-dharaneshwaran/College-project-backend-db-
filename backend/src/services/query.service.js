const Query = require('../models/Query');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const paginateQuery = require('../utils/paginateQuery');
const notificationService = require('./notification.service');

/**
 * Raise a new student helpdesk ticket
 * @param {string} studentUserId
 * @param {Object} queryData
 * @returns {Promise<Object>} Created ticket
 */
const createQuery = async (studentUserId, queryData) => {
  const student = await Student.findOne({ user: studentUserId });
  if (!student) {
    throw new ApiError(404, 'Student profile not found');
  }

  const { category, subject, description } = queryData;

  return Query.create({
    student: student._id,
    category,
    subject,
    description,
    status: 'open'
  });
};

/**
 * Query all tickets with filters/pagination (Admin/Faculty search)
 * @param {Object} query
 * @returns {Promise<Object>}
 */
const queryTickets = async (query) => {
  return paginateQuery(Query, query, {
    searchFields: ['subject', 'description', 'category', 'status'],
    populate: [
      { path: 'student', populate: { path: 'user', select: 'name' } },
      { path: 'respondedBy', select: 'name' }
    ]
  });
};

/**
 * Get helpdesk tickets raised by current student
 * @param {string} studentUserId
 * @returns {Promise<Array>} List of student tickets
 */
const getStudentTickets = async (studentUserId) => {
  const student = await Student.findOne({ user: studentUserId });
  if (!student) {
    throw new ApiError(404, 'Student profile not found');
  }

  return Query.find({ student: student._id })
    .populate('respondedBy', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Respond to and resolve a student ticket
 * @param {string} id
 * @param {string} staffUserId - Admin/Faculty user replying
 * @param {Object} responseData - { response, status }
 * @returns {Promise<Object>} Updated ticket
 */
const respondToTicket = async (id, staffUserId, responseData) => {
  const ticket = await Query.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Helpdesk ticket not found');
  }

  ticket.response = responseData.response || '';
  ticket.status = responseData.status || 'resolved';
  ticket.respondedBy = staffUserId;

  await ticket.save();
  
  // Notification hook
  if (ticket.student) {
    // Need to get user ID for the student
    Student.findById(ticket.student).select('user').lean().then(student => {
      if (student) {
        notificationService.sendNotification(student.user, {
          title: 'Helpdesk Ticket Updated',
          message: `Your ticket regarding "${ticket.subject}" has been updated to ${ticket.status}.`,
          type: 'query',
          priority: 'medium',
          sender: staffUserId
        });
      }
    });
  }

  return ticket;
};

module.exports = {
  createQuery,
  queryTickets,
  getStudentTickets,
  respondToTicket
};
