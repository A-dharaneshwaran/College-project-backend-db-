const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String
    },
    action: {
      type: String,
      required: true
    },
    module: {
      type: String,
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    entityType: {
      type: String,
      default: null
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    device: {
      type: String
    },
    browser: {
      type: String
    },
    platform: {
      type: String
    },
    status: {
      type: String,
      default: 'success'
    },
    isTestData: {
      type: Boolean,
      default: false
    },
    testBatchYear: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high performance querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ module: 1 });
activityLogSchema.index({ adminUser: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
