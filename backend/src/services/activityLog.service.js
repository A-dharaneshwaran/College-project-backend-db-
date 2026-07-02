const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

/**
 * Log an administrator activity (Best-effort wrapper)
 * Encapsulated in try-catch so failures do not interrupt business operations.
 * 
 * @param {Object} logData
 * @returns {Promise<Object|null>} Saved log document or null
 */
const logActivity = async ({ adminUser, action, module, entityId = null, entityType = null, description, metadata = {} }) => {
  try {
    // Basic verification of required fields
    if (!adminUser || !action || !module || !description) {
      console.warn('Skipping activity log: missing required parameters', { adminUser, action, module, description });
      return null;
    }

    const log = await ActivityLog.create({
      adminUser,
      action,
      module,
      entityId: mongoose.Types.ObjectId.isValid(entityId) ? entityId : null,
      entityType,
      description,
      metadata
    });
    return log;
  } catch (error) {
    // Logging is best-effort: log failure to console but do not throw or reject
    console.error('Failed to write activity log:', error.message);
    return null;
  }
};

/**
 * Get activity logs with filters, search, and pagination
 * 
 * @param {Object} queryParams
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
const getActivityLogs = async (queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  // Search filter (matches description or action)
  if (queryParams.search) {
    const searchRegex = new RegExp(queryParams.search.trim(), 'i');
    filter.$or = [
      { description: searchRegex },
      { action: searchRegex }
    ];
  }

  // Date filter (match entries on a specific day)
  if (queryParams.date) {
    const targetDate = new Date(queryParams.date);
    if (!isNaN(targetDate.getTime())) {
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
  }

  // Administrator filter (match specific admin user ID)
  if (queryParams.administrator) {
    if (mongoose.Types.ObjectId.isValid(queryParams.administrator)) {
      filter.adminUser = queryParams.administrator;
    }
  }

  // Action Type filter
  if (queryParams.action) {
    filter.action = queryParams.action;
  }

  // Module filter
  if (queryParams.module) {
    filter.module = queryParams.module;
  }

  const total = await ActivityLog.countDocuments(filter);
  const data = await ActivityLog.find(filter)
    .populate('adminUser', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Fetch distinct filter values (modules, action types, and administrators names/emails)
 * 
 * @returns {Promise<{modules: Array, actions: Array, admins: Array}>}
 */
const getFiltersMetadata = async () => {
  const [modules, actions, adminIds] = await Promise.all([
    ActivityLog.distinct('module'),
    ActivityLog.distinct('action'),
    ActivityLog.distinct('adminUser')
  ]);

  const User = require('../models/User');
  const admins = await User.find({ _id: { $in: adminIds } }, 'name email').lean();

  return {
    modules: modules.filter(Boolean),
    actions: actions.filter(Boolean),
    admins
  };
};

module.exports = {
  logActivity,
  getActivityLogs,
  getFiltersMetadata
};
