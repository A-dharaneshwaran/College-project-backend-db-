const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
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
    examType: {
      type: String,
      enum: ['Internal 1', 'Internal 2', 'Model Exam', 'Semester', 'Assignment'],
      required: [true, 'Exam type is required']
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [0, 'Maximum marks cannot be negative']
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks is required'],
      min: [0, 'Obtained marks cannot be negative'],
      validate: {
        validator: function (value) {
          return value <= this.maxMarks;
        },
        message: 'Obtained marks cannot exceed maximum marks'
      }
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'] // e.g. "2025-2026"
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty is required']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
marksSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true });
marksSchema.index({ student: 1 });
marksSchema.index({ semester: 1 });

const Marks = mongoose.model('Marks', marksSchema);

module.exports = Marks;
