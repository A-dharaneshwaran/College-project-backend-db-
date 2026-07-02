const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    specialization: {
      type: String,
      default: ''
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    qualification: {
      type: String,
      default: ''
    },
    experience: {
      type: Number,
      default: 0
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
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

// Indexes (employeeId unique:true index already created implicitly)
facultySchema.index({ department: 1 });                      // department filter
facultySchema.index({ department: 1, designation: 1 });     // compound filter
facultySchema.index({ designation: 1 });                     // designation filter
// Note: user field already indexed via schema definition (ref field)

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;
