const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const notificationService = require('./notification.service');

/**
 * Generate JWT token for user
 * @param {string} userId
 * @returns {string} token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Get role-specific details for a user
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<Object>} sub-profile details
 */
const getRoleDetails = async (userId, role) => {
  if (role === 'student') {
    return Student.findOne({ user: userId }).populate('department');
  }
  if (role === 'faculty') {
    return Faculty.findOne({ user: userId }).populate('department').populate('subjects');
  }
  if (role === 'admin') {
    return Admin.findOne({ user: userId });
  }
  return null;
};

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object, token: string}>}
 */
const login = async (email, password) => {
  // Find user and explicitly select password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated');
  }

  // Load role-specific profile details
  const details = await getRoleDetails(user._id, user.role);

  // Generate JWT token
  const token = generateToken(user._id);

  // Remove password from output
  const userObject = user.toObject();
  delete userObject.password;
  userObject.details = details;

  return {
    user: userObject,
    token
  };
};

/**
 * Register a new user and create their sub-profile
 * @param {Object} userData
 * @returns {Promise<Object>} Created user with details
 */
const register = async (userData) => {
  const { name, email, password, role } = userData;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email is already registered');
  }

  let createdUser;
  try {
    // Create base user
    createdUser = await User.create({
      name,
      email,
      password,
      role
    });

    let details = null;

    // Create sub-profile depending on the role
    if (role === 'student') {
      const {
        registerNumber,
        phone,
        dateOfBirth,
        gender,
        department,
        year,
        semester,
        address,
        city,
        state,
        pincode,
        bloodGroup,
        parentDetails
      } = userData;

      // Check registerNumber unique constraint
      const existingStudent = await Student.findOne({ registerNumber });
      if (existingStudent) {
        throw new ApiError(400, 'Register number is already in use');
      }

      details = await Student.create({
        user: createdUser._id,
        registerNumber,
        phone,
        dateOfBirth,
        gender,
        department,
        year,
        semester,
        address,
        city,
        state,
        pincode,
        bloodGroup,
        parentDetails
      });
    } else if (role === 'faculty') {
      const {
        employeeId,
        phone,
        department,
        designation,
        specialization,
        subjects
      } = userData;

      const existingFaculty = await Faculty.findOne({ employeeId });
      if (existingFaculty) {
        throw new ApiError(400, 'Employee ID is already in use');
      }

      details = await Faculty.create({
        user: createdUser._id,
        employeeId,
        phone,
        department,
        designation,
        specialization,
        subjects: subjects || []
      });
    } else if (role === 'admin') {
      const { employeeId, accessLevel } = userData;

      const existingAdmin = await Admin.findOne({ employeeId });
      if (existingAdmin) {
        throw new ApiError(400, 'Employee ID is already in use');
      }

      details = await Admin.create({
        user: createdUser._id,
        employeeId,
        accessLevel: accessLevel || 'Standard'
      });
    }

    const userObject = createdUser.toObject();
    delete userObject.password;
    userObject.details = details;

    // Notification hook (notify admins of new registration)
    if (role === 'student' || role === 'faculty') {
      notificationService.sendToRole('admin', {
        title: `New ${role.charAt(0).toUpperCase() + role.slice(1)} Registered`,
        message: `${name} (${email}) has been registered as a new ${role}.`,
        type: 'system',
        priority: 'low'
      });
    }

    return userObject;
  } catch (error) {
    // Clean up created user if sub-profile creation fails
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id);
    }
    throw error;
  }
};

/**
 * Get current user profile details
 * @param {string} userId
 * @returns {Promise<Object>} User with details
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const details = await getRoleDetails(user._id, user.role);
  
  const userObject = user.toObject();
  userObject.details = details;
  return userObject;
};

module.exports = {
  login,
  register,
  getCurrentUser
};
