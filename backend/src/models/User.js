const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'faculty', 'admin'],
        message: 'Role must be student, faculty, or admin'
      },
      required: [true, 'Role is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profilePhoto: {
      type: String,
      default: ''
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

// Indexes (email unique:true index already created implicitly)
userSchema.index({ name: 1 });          // name search for resolveUserIds
userSchema.index({ role: 1 });          // role filter
userSchema.index({ isActive: 1 });      // active user filter

// pre-save hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
