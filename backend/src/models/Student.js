const mongoose = require('mongoose');

const parentDetailsSchema = new mongoose.Schema({
  fatherName: { type: String, required: true, trim: true },
  motherName: { type: String, required: true, trim: true },
  fatherPhone: { type: String, required: true },
  motherPhone: { type: String, required: true }
}, { _id: false });

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    year: {
      type: Number,
      required: [true, 'Year of study is required'],
      enum: [1, 2, 3, 4]
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    bloodGroup: {
      type: String,
      default: ''
    },
    parentDetails: {
      type: parentDetailsSchema,
      required: [true, 'Parent details are required']
    },
    admissionDate: {
      type: Date,
      default: Date.now
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

// Indexes (registerNumber unique:true index already created implicitly)
studentSchema.index({ department: 1, year: 1, semester: 1 }); // compound filter
studentSchema.index({ year: 1, semester: 1 });               // standalone filter
studentSchema.index({ gender: 1 });                          // gender filter
// Note: user field already indexed via schema definition (ref field)

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
