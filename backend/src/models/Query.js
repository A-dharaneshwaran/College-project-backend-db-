const mongoose = require('mongoose');

const querySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    category: {
      type: String,
      enum: ['Academic', 'Hostel', 'Transport', 'Accounts', 'Library', 'Other'],
      required: [true, 'Category is required']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'pending', 'resolved', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    response: {
      type: String,
      default: ''
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
querySchema.index({ student: 1 });
querySchema.index({ status: 1 });

const Query = mongoose.model('Query', querySchema);

module.exports = Query;
