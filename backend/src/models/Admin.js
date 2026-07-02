const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
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
    accessLevel: {
      type: String,
      enum: ['SuperAdmin', 'Standard'],
      default: 'Standard'
    }
  },
  {
    timestamps: true
  }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
