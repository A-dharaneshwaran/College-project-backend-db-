const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      default: 'Present',
      required: [true, 'Status is required']
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent marking duplicate attendance for same student/subject on same day.
// Note: In implementation, we store the start-of-day date to keep query filtering precise.
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ student: 1 });
attendanceSchema.index({ subject: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
