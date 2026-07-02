const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Send a notification to a single user
 * @param {string} userId
 * @param {Object} payload - { title, message, type, priority, sender, actionUrl, metadata, expiresAt }
 * @returns {Promise<Object>} Created notification
 */
const sendNotification = async (userId, payload) => {
  try {
    const { title, message, type = 'info', priority = 'medium', sender, actionUrl = '', metadata = {}, expiresAt } = payload;
    
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      sender,
      actionUrl,
      metadata,
      expiresAt
    });
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error.message);
    // Suppress error to avoid breaking main business logic flows
    return null;
  }
};

/**
 * Send a notification to multiple users (bulk insert)
 * @param {Array<string>} userIds 
 * @param {Object} payload 
 * @returns {Promise<Array>} Created notifications
 */
const sendToMany = async (userIds, payload) => {
  try {
    if (!userIds || userIds.length === 0) return [];
    
    const { title, message, type = 'info', priority = 'medium', sender, actionUrl = '', metadata = {}, expiresAt } = payload;
    
    const docs = userIds.map(userId => ({
      user: userId,
      title,
      message,
      type,
      priority,
      sender,
      actionUrl,
      metadata,
      expiresAt
    }));
    
    return await Notification.insertMany(docs, { ordered: false });
  } catch (error) {
    console.error(`Failed to send bulk notifications:`, error.message);
    return [];
  }
};

/**
 * Send a notification to all users of a specific role
 * @param {string} role - 'student', 'faculty', 'admin'
 * @param {Object} payload 
 * @returns {Promise<Array>}
 */
const sendToRole = async (role, payload) => {
  try {
    const users = await User.find({ role, isActive: true }).select('_id').lean();
    const userIds = users.map(u => u._id);
    
    // Add recipientRole to payload for tracking
    const enrichedPayload = { ...payload, recipientRole: role };
    return await sendToMany(userIds, enrichedPayload);
  } catch (error) {
    console.error(`Failed to send notification to role ${role}:`, error.message);
    return [];
  }
};

/**
 * Get paginated, filtered notifications for a user
 * @param {string} userId
 * @param {Object} queryOptions 
 * @returns {Promise<Object>} { data, pagination }
 */
const getNotifications = async (userId, queryOptions) => {
  const { page = 1, limit = 20, type, priority, read, search, sort = '-createdAt' } = queryOptions;
  
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;
  
  const filter = { user: userId };
  
  // Exclude expired
  filter.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ];
  
  // Apply filters
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  
  if (read !== undefined && read !== '') {
    filter.isRead = read === 'true' || read === true;
  }
  
  if (search) {
    // We use an explicit Mongoose search instead of paginateQuery because paginateQuery 
    // doesn't cleanly support mixing an array of $or for search with our explicit filter.$or for expiration
    // So we'll combine them using $and
    const searchRegex = { $regex: search, $options: 'i' };
    const searchConditions = {
      $or: [
        { title: searchRegex },
        { message: searchRegex },
        { 'metadata.filename': searchRegex } // Example specific search
      ]
    };
    
    // Keep existing $or for expiration by moving both to $and
    filter.$and = [
      { $or: filter.$or },
      searchConditions
    ];
    delete filter.$or;
  }
  
  const [data, total] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter)
  ]);
  
  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    }
  };
};

/**
 * Get unread notification count
 * @param {string} userId 
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  const filter = { 
    user: userId, 
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  return await Notification.countDocuments(filter);
};

/**
 * Mark a single notification as read
 * @param {string} notificationId 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
const markAsRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  
  if (!notif) {
    throw new ApiError(404, 'Notification not found or access denied');
  }
  return notif;
};

/**
 * Mark all user notifications as read
 * @param {string} userId 
 * @returns {Promise<Object>} { modifiedCount }
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return { count: result.modifiedCount };
};

/**
 * Delete a single notification
 * @param {string} notificationId 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
const deleteNotification = async (notificationId, userId) => {
  const notif = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  if (!notif) {
    throw new ApiError(404, 'Notification not found or access denied');
  }
  return notif;
};

/**
 * Clear all read notifications for a user
 * @param {string} userId 
 * @returns {Promise<Object>} { deletedCount }
 */
const clearReadNotifications = async (userId) => {
  const result = await Notification.deleteMany({ user: userId, isRead: true });
  return { count: result.deletedCount };
};

/**
 * Cleanup expired notifications across the system
 * @returns {Promise<Object>} { deletedCount }
 */
const cleanupExpiredNotifications = async () => {
  const result = await Notification.deleteMany({
    expiresAt: { $ne: null, $lte: new Date() }
  });
  return { count: result.deletedCount };
};

module.exports = {
  sendNotification,
  sendToMany,
  sendToRole,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  cleanupExpiredNotifications
};
