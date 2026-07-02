const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['academic', 'sports', 'cultural', 'technical'],
      required: [true, 'Achievement type is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    certificate: {
      type: String, // URL of uploaded image/certificate
      default: ''
    },
    level: {
      type: String,
      enum: ['Department', 'College', 'State', 'National', 'International'],
      default: 'College'
    },
    points: {
      type: Number,
      default: 0
    },
    issuedBy: {
      type: String,
      default: ''
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Verified'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
achievementSchema.index({ student: 1 });
achievementSchema.index({ type: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
