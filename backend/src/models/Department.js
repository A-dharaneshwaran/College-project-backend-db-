const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes: name and code have unique:true so indexes are created automatically
// No additional indexes needed for Department at this time

// Virtual populate for students and faculty
departmentSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'department'
});

departmentSchema.virtual('faculty', {
  ref: 'Faculty',
  localField: '_id',
  foreignField: 'department'
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
