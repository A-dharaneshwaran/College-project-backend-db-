const messageService = require('../services/message.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

exports.createConversation = catchAsync(async (req, res) => {
  const { participants, type, department, name } = req.body;
  const createdBy = req.user._id;

  // Add self if not included
  if (!participants.includes(createdBy.toString())) {
    participants.push(createdBy.toString());
  }

  const conversation = await messageService.createConversation(
    participants,
    type,
    department,
    name,
    createdBy
  );

  res.status(201).json({
    success: true,
    data: conversation
  });
});

exports.getConversations = catchAsync(async (req, res) => {
  const { cursor, limit, archived } = req.query;
  const result = await messageService.getConversations(
    req.user._id,
    cursor,
    limit ? parseInt(limit) : 20,
    archived
  );

  res.status(200).json({
    success: true,
    data: result.conversations,
    nextCursor: result.nextCursor
  });
});

exports.togglePinConversation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const conversation = await messageService.togglePinConversation(id, req.user._id);
  res.status(200).json({
    success: true,
    data: conversation
  });
});

exports.toggleArchiveConversation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const conversation = await messageService.toggleArchiveConversation(id, req.user._id);
  res.status(200).json({
    success: true,
    data: conversation
  });
});


exports.sendMessage = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const { content, type, attachments, replyTo, forwardedFrom } = req.body;
  const senderId = req.user._id;

  const message = await messageService.sendMessage(
    conversationId,
    senderId,
    content,
    type,
    attachments,
    replyTo,
    forwardedFrom
  );

  res.status(201).json({
    success: true,
    data: message
  });
});

exports.getMessageHistory = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const { cursor, limit } = req.query;

  const result = await messageService.getMessageHistory(
    conversationId,
    req.user._id,
    cursor,
    limit ? parseInt(limit) : 50
  );

  res.status(200).json({
    success: true,
    data: result.messages,
    nextCursor: result.nextCursor
  });
});

exports.markConversationRead = catchAsync(async (req, res) => {
  const { conversationId } = req.body;
  
  if (!conversationId) {
    throw new ApiError(400, 'Conversation ID is required');
  }

  await messageService.markConversationRead(conversationId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Conversation marked as read'
  });
});

exports.editMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  const message = await messageService.editMessage(id, req.user._id, content);

  res.status(200).json({
    success: true,
    data: message
  });
});

exports.deleteMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await messageService.deleteMessage(id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully'
  });
});

exports.searchMessages = catchAsync(async (req, res) => {
  const { q } = req.query;
  
  const messages = await messageService.searchMessages(req.user._id, q);

  res.status(200).json({
    success: true,
    data: messages
  });
});

exports.searchUsers = catchAsync(async (req, res) => {
  const { q } = req.query;
  const currentUser = req.user;

  if (!q || !q.trim()) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const queryRegex = new RegExp(escapedQ, 'i');

  const Student = require('../models/Student');
  const Faculty = require('../models/Faculty');
  const Department = require('../models/Department');

  // Find department ObjectIds matching by code or name
  const matchedDepts = await Department.find({
    $or: [
      { code: queryRegex },
      { name: queryRegex }
    ]
  }).select('_id').lean();
  const deptIds = matchedDepts.map(d => d._id);

  // Find student matching registerNumber or department
  const studentConditions = [ { registerNumber: queryRegex } ];
  if (deptIds.length > 0) {
    studentConditions.push({ department: { $in: deptIds } });
  }
  const matchedStudents = await Student.find({ $or: studentConditions }).select('user').lean();
  const studentUserIds = matchedStudents.map(s => s.user);

  // Find faculty matching employeeId or department
  const facultyConditions = [ { employeeId: queryRegex } ];
  if (deptIds.length > 0) {
    facultyConditions.push({ department: { $in: deptIds } });
  }
  const matchedFaculties = await Faculty.find({ $or: facultyConditions }).select('user').lean();
  const facultyUserIds = matchedFaculties.map(f => f.user);

  // Exclude logged in user
  const baseFilter = {
    _id: { $ne: currentUser._id },
    isActive: true
  };

  const orClauses = [
    { name: queryRegex },
    { email: queryRegex }
  ];
  if (studentUserIds.length > 0 || facultyUserIds.length > 0) {
    orClauses.push({ _id: { $in: [...studentUserIds, ...facultyUserIds] } });
  }

  const queryConditions = { ...baseFilter, $or: orClauses };

  // Apply role restrictions
  if (currentUser.role === 'student') {
    // Get current student's department
    const currentStudentDoc = await Student.findOne({ user: currentUser._id }).lean();
    let sameDeptStudentUserIds = [];
    if (currentStudentDoc && currentStudentDoc.department) {
      const studentsInDept = await Student.find({ department: currentStudentDoc.department }).select('user').lean();
      sameDeptStudentUserIds = studentsInDept.map(s => s.user.toString());
    }

    const roleRestriction = {
      $or: [
        { role: 'faculty' },
        { role: 'admin' },
        { role: 'student', _id: { $in: sameDeptStudentUserIds } }
      ]
    };

    // Combine using $and to avoid collision with $or
    queryConditions.$and = [
      { $or: queryConditions.$or },
      roleRestriction
    ];
    delete queryConditions.$or;
  }

  const matchedUsers = await User.find(queryConditions)
    .select('name email role profilePhoto')
    .limit(20)
    .lean();

  const populatedResults = await Promise.all(matchedUsers.map(async (u) => {
    let detail = null;
    let deptCode = '';
    let deptName = '';
    
    if (u.role === 'student') {
      detail = await Student.findOne({ user: u._id }).populate('department', 'name code').lean();
      deptCode = detail?.department?.code || '';
      deptName = detail?.department?.name || '';
    } else if (u.role === 'faculty') {
      detail = await Faculty.findOne({ user: u._id }).populate('department', 'name code').lean();
      deptCode = detail?.department?.code || '';
      deptName = detail?.department?.name || '';
    }

    return {
      userId: u._id,
      name: u.name,
      role: u.role,
      email: u.email,
      avatar: u.profilePhoto || '',
      department: deptCode ? `${deptName} (${deptCode})` : '',
      registerNumber: u.role === 'student' ? (detail?.registerNumber || '') : undefined,
      employeeId: u.role === 'faculty' ? (detail?.employeeId || '') : undefined,
      designation: u.role === 'faculty' ? (detail?.designation || '') : undefined
    };
  }));

  res.status(200).json({
    success: true,
    data: populatedResults
  });
});
