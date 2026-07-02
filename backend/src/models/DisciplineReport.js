const mongoose = require('mongoose');

const disciplineReportSchema = new mongoose.Schema(
  {
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'At least one student reference is required']
      }
    ],
    issues: [
      {
        type: String,
        required: [true, 'At least one issue type is required'],
        enum: ['attendance', 'misconduct', 'ragging', 'illegal', 'dishonesty', 'behavior', 'dresscode', 'other']
      }
    ],
    severity: {
      type: String,
      enum: ['Low', 'Severe', 'Critical'],
      default: 'Low'
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty reference is required']
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Under Review', 'Resolved'],
      default: 'Pending'
    },
    actionTaken: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
disciplineReportSchema.index({ students: 1 });
disciplineReportSchema.index({ status: 1 });
disciplineReportSchema.index({ severity: 1 });

const DisciplineReport = mongoose.model('DisciplineReport', disciplineReportSchema);

module.exports = DisciplineReport;
