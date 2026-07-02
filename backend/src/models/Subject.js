const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester cannot exceed 8']
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      default: 3,
      min: [1, 'Credits must be at least 1']
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    type: {
      type: String,
      enum: ['Theory', 'Lab', 'Elective'],
      default: 'Theory'
    },
    year: {
      type: Number,
      min: 1,
      max: 4
    },
    isTestData: {
      type: Boolean,
      default: false
    },
    testBatchYear: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

// Indexes (code unique:true index already created implicitly)
subjectSchema.index({ department: 1, semester: 1 }); // compound filter
subjectSchema.index({ name: 1 });                    // name search
subjectSchema.index({ faculty: 1 });                 // faculty lookup

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
