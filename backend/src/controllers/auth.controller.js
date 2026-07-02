const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../services/activityLog.service');

/**
 * Handle user login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  res.status(200).json(
    new ApiResponse(200, 'Login successful', {
      user: result.user,
      token: result.token
    })
  );
});

/**
 * Handle user registration (Admin only)
 */
const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  
  if (req.user && req.user.role === 'admin') {
    const action = user.role === 'student' ? 'Student Created' : user.role === 'faculty' ? 'Faculty Created' : 'User Registered';
    const module = user.role === 'student' ? 'Students' : user.role === 'faculty' ? 'Faculty' : 'Admins';
    const regOrEmp = user.details?.registerNumber || user.details?.employeeId || '';
    const description = `Registered ${user.role} profile: ${user.name} (${regOrEmp})`;
    
    await logActivity({
      adminUser: req.user._id,
      action,
      module,
      entityId: user.details?._id || user._id,
      entityType: user.role === 'student' ? 'Student' : user.role === 'faculty' ? 'Faculty' : 'User',
      description,
      metadata: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }

  res.status(201).json(
    new ApiResponse(201, 'User registered successfully', user)
  );
});

/**
 * Handle fetching current logged-in user profile
 */
const me = catchAsync(async (req, res) => {
  // req.user is populated by protect middleware
  const user = await authService.getCurrentUser(req.user._id);
  
  res.status(200).json(
    new ApiResponse(200, 'User profile retrieved successfully', user)
  );
});

module.exports = {
  login,
  register,
  me
};
