const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'faculty', 'department', 'admin', 'year', 'semester'],
      default: 'all'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    year: {
      type: Number,
      default: null
    },
    semester: {
      type: Number,
      default: null
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Poster reference is required']
    },
    category: {
      type: String,
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Published', 'Expired'],
      default: 'Published'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null
    },
    attachment: {
      type: String,
      default: ''
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

// Indexes
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
