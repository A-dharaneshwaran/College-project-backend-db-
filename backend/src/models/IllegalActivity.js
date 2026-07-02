const mongoose = require('mongoose');

const illegalActivitySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    issue: {
      type: String,
      required: [true, 'Issue name is required'],
      trim: true
    },
    severity: {
      type: String,
      enum: ['High', 'Severe', 'Critical'],
      default: 'High'
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    status: {
      type: String,
      enum: ['Active', 'Under Investigation', 'Resolved'],
      default: 'Active'
    },
    reportedBy: {
      type: String,
      required: [true, 'Reporter identifier is required'],
      trim: true
    },
    details: {
      type: String,
      default: ''
    },
    officialReportUrl: {
      type: String, // PDF link or document proof
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
illegalActivitySchema.index({ student: 1 });
illegalActivitySchema.index({ status: 1 });

const IllegalActivity = mongoose.model('IllegalActivity', illegalActivitySchema);

module.exports = IllegalActivity;
