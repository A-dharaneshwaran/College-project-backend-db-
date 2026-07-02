const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const catchAsync = require('../utils/catchAsync');

exports.getContacts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 20);
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const roleParam = req.query.role || '';
  const deptParam = req.query.department || '';
  const sortBy = req.query.sortBy || 'name';

  const currentUser = req.user;

  // 1. Exclude self and only fetch active users
  const baseFilter = {
    _id: { $ne: currentUser._id },
    isActive: true
  };

  // 2. Build search filter
  let matchedUserIdsByExtra = [];
  if (search.trim()) {
    const queryRegex = new RegExp(search.trim(), 'i');

    // Find department IDs
    const matchedDepts = await Department.find({
      $or: [
        { code: queryRegex },
        { name: queryRegex }
      ]
    }).select('_id').lean();
    const deptIds = matchedDepts.map(d => d._id);

    // Find students matching registerNumber or department
    const studentFilters = [ { registerNumber: queryRegex } ];
    if (deptIds.length > 0) {
      studentFilters.push({ department: { $in: deptIds } });
    }
    const students = await Student.find({ $or: studentFilters }).select('user').lean();

    // Find faculty matching employeeId or department
    const facultyFilters = [ { employeeId: queryRegex } ];
    if (deptIds.length > 0) {
      facultyFilters.push({ department: { $in: deptIds } });
    }
    const faculties = await Faculty.find({ $or: facultyFilters }).select('user').lean();

    matchedUserIdsByExtra = [
      ...students.map(s => s.user),
      ...faculties.map(f => f.user)
    ];
  }

  // Create text search conditions on User
  const textOrClauses = [];
  if (search.trim()) {
    const queryRegex = new RegExp(search.trim(), 'i');
    textOrClauses.push({ name: queryRegex });
    textOrClauses.push({ email: queryRegex });
    if (matchedUserIdsByExtra.length > 0) {
      textOrClauses.push({ _id: { $in: matchedUserIdsByExtra } });
    }
  }

  const queryConditions = { ...baseFilter };
  if (textOrClauses.length > 0) {
    queryConditions.$or = textOrClauses;
  }

  // 3. Build department filter
  if (deptParam) {
    const deptStudents = await Student.find({ department: deptParam }).select('user').lean();
    const deptFaculties = await Faculty.find({ department: deptParam }).select('user').lean();
    const deptUserIds = [...deptStudents.map(s => s.user), ...deptFaculties.map(f => f.user)];

    if (queryConditions._id) {
      queryConditions._id = { $and: [queryConditions._id, { $in: deptUserIds }] };
    } else {
      queryConditions._id = { $in: deptUserIds };
    }
  }

  // 4. Build role visibility restrictions
  let roleRestriction = {};
  if (currentUser.role === 'student') {
    const currentStudentDoc = await Student.findOne({ user: currentUser._id }).lean();
    let sameDeptStudentUserIds = [];
    if (currentStudentDoc && currentStudentDoc.department) {
      const studentsInDept = await Student.find({ department: currentStudentDoc.department }).select('user').lean();
      sameDeptStudentUserIds = studentsInDept.map(s => s.user.toString());
    }

    if (roleParam) {
      if (roleParam === 'student') {
        roleRestriction = { role: 'student', _id: { $in: sameDeptStudentUserIds } };
      } else if (roleParam === 'faculty' || roleParam === 'admin') {
        roleRestriction = { role: roleParam };
      } else {
        // Invalid role parameter for student view, return empty results
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 }
        });
      }
    } else {
      roleRestriction = {
        $or: [
          { role: 'faculty' },
          { role: 'admin' },
          { role: 'student', _id: { $in: sameDeptStudentUserIds } }
        ]
      };
    }
  } else {
    // Faculty and Admin can see all active users, filtered by role parameter if supplied
    if (roleParam) {
      roleRestriction = { role: roleParam };
    }
  }

  // Combine query conditions using $and to avoid collision with $or
  if (Object.keys(roleRestriction).length > 0) {
    if (queryConditions.$or) {
      queryConditions.$and = [
        { $or: queryConditions.$or },
        roleRestriction
      ];
      delete queryConditions.$or;
    } else {
      Object.assign(queryConditions, roleRestriction);
    }
  }

  // Determine database sort first (to support pagination skipping correctly)
  let dbSort = { name: 1 };
  if (sortBy === 'role') {
    dbSort = { role: 1, name: 1 };
  }

  // Count total matching documents
  const total = await User.countDocuments(queryConditions);

  // Retrieve matching users
  const matchedUsers = await User.find(queryConditions)
    .select('name email role profilePhoto')
    .sort(dbSort)
    .skip(skip)
    .limit(limit)
    .lean();

  // Populate Student/Faculty metadata
  let populatedResults = await Promise.all(matchedUsers.map(async (u) => {
    let detail = null;
    let deptCode = '';
    let deptName = '';
    let phoneVal = '';

    if (u.role === 'student') {
      detail = await Student.findOne({ user: u._id }).populate('department', 'name code').lean();
      deptCode = detail?.department?.code || '';
      deptName = detail?.department?.name || '';
      phoneVal = detail?.phone || '';
    } else if (u.role === 'faculty') {
      detail = await Faculty.findOne({ user: u._id }).populate('department', 'name code').lean();
      deptCode = detail?.department?.code || '';
      deptName = detail?.department?.name || '';
      phoneVal = detail?.phone || '';
    }

    return {
      userId: u._id,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: phoneVal,
      avatar: u.profilePhoto || '',
      department: deptCode ? `${deptName} (${deptCode})` : '',
      designation: u.role === 'faculty' ? (detail?.designation || '') : undefined,
      registerNumber: u.role === 'student' ? (detail?.registerNumber || '') : undefined,
      employeeId: u.role === 'faculty' ? (detail?.employeeId || '') : undefined
    };
  }));

  // Perform memory sort if sorting by department (since department fields are populated in memory)
  if (sortBy === 'department') {
    populatedResults.sort((a, b) => {
      const deptA = a.department || '';
      const deptB = b.department || '';
      return deptA.localeCompare(deptB) || a.name.localeCompare(b.name);
    });
  }

  res.status(200).json({
    success: true,
    data: populatedResults,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});
