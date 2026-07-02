const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = require('../src/models/User');
  const Student = require('../src/models/Student');
  const Faculty = require('../src/models/Faculty');
  const Department = require('../src/models/Department');

  // Let's find one Admin, one Faculty, and two Students from different departments
  const admin = await User.findOne({ role: 'admin' });
  const faculty = await User.findOne({ role: 'faculty' });
  
  // Find two students from different departments
  const students = await Student.find({}).limit(10).populate('user');
  let studentA = null;
  let studentB = null;
  
  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      if (students[i].department && students[j].department && students[i].department.toString() !== students[j].department.toString()) {
        studentA = students[i];
        studentB = students[j];
        break;
      }
    }
    if (studentA) break;
  }

  if (!studentA || !studentB) {
    console.error('Could not find two students in different departments to test');
    process.exit(1);
  }

  console.log(`Admin user: ${admin.name} (${admin.email})`);
  console.log(`Faculty user: ${faculty.name} (${faculty.email})`);
  console.log(`Student A (Dept ${studentA.department}): ${studentA.user.name} (${studentA.user.email})`);
  console.log(`Student B (Dept ${studentB.department}): ${studentB.user.name} (${studentB.user.email})`);

  // Helper logic mimicking exports.getContacts controller
  const mockContactsQuery = async (reqUser, queryParams) => {
    const page = parseInt(queryParams.page) || 1;
    const limit = Math.min(parseInt(queryParams.limit) || 20, 20);
    const skip = (page - 1) * limit;

    const search = queryParams.search || '';
    const roleParam = queryParams.role || '';
    const deptParam = queryParams.department || '';
    const sortBy = queryParams.sortBy || 'name';

    const currentUser = reqUser;

    const baseFilter = {
      _id: { $ne: currentUser._id },
      isActive: true
    };

    let matchedUserIdsByExtra = [];
    if (search.trim()) {
      const queryRegex = new RegExp(search.trim(), 'i');
      const matchedDepts = await Department.find({
        $or: [
          { code: queryRegex },
          { name: queryRegex }
        ]
      }).select('_id').lean();
      const deptIds = matchedDepts.map(d => d._id);

      const studentFilters = [ { registerNumber: queryRegex } ];
      if (deptIds.length > 0) {
        studentFilters.push({ department: { $in: deptIds } });
      }
      const studentsList = await Student.find({ $or: studentFilters }).select('user').lean();

      const facultyFilters = [ { employeeId: queryRegex } ];
      if (deptIds.length > 0) {
        facultyFilters.push({ department: { $in: deptIds } });
      }
      const facultiesList = await Faculty.find({ $or: facultyFilters }).select('user').lean();

      matchedUserIdsByExtra = [
        ...studentsList.map(s => s.user),
        ...facultiesList.map(f => f.user)
      ];
    }

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
          return { data: [], total: 0 };
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
      if (roleParam) {
        roleRestriction = { role: roleParam };
      }
    }

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

    let dbSort = { name: 1 };
    if (sortBy === 'role') {
      dbSort = { role: 1, name: 1 };
    }

    const total = await User.countDocuments(queryConditions);
    const matchedUsers = await User.find(queryConditions)
      .select('name email role profilePhoto')
      .sort(dbSort)
      .skip(skip)
      .limit(limit)
      .lean();

    const populatedResults = await Promise.all(matchedUsers.map(async (u) => {
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

    if (sortBy === 'department') {
      populatedResults.sort((a, b) => {
        const deptA = a.department || '';
        const deptB = b.department || '';
        return deptA.localeCompare(deptB) || a.name.localeCompare(b.name);
      });
    }

    return { data: populatedResults, total };
  };

  // Test 1: Role-based Student Visibility Rule
  console.log('\n--- Test 1: Student A searching Student B (different department) ---');
  const res1 = await mockContactsQuery(studentA.user, { search: studentB.user.name });
  console.log(`Student A search returned: ${res1.data.map(u => u.name).join(', ')}`);
  if (!res1.data.some(u => u.userId.toString() === studentB.user._id.toString())) {
    console.log('✅ PASS: Student A cannot view Student B from a different department.');
  } else {
    console.log('❌ FAIL: Student A was able to view Student B from a different department!');
  }

  // Test 2: Admin Visibility Rule
  console.log('\n--- Test 2: Admin searching Student B ---');
  const res2 = await mockContactsQuery(admin, { search: studentB.user.name });
  console.log(`Admin search returned: ${res2.data.map(u => u.name).join(', ')}`);
  if (res2.data.some(u => u.userId.toString() === studentB.user._id.toString())) {
    console.log('✅ PASS: Admin successfully located Student B.');
  } else {
    console.log('❌ FAIL: Admin was unable to locate Student B!');
  }

  // Test 3: Pagination Check
  console.log('\n--- Test 3: Pagination page/limit check ---');
  const res3 = await mockContactsQuery(admin, { page: 1, limit: 2 });
  console.log(`Page limit 2 query returned ${res3.data.length} records. Total matches: ${res3.total}`);
  if (res3.data.length <= 2) {
    console.log('✅ PASS: Pagination limit successfully applied.');
  } else {
    console.log('❌ FAIL: Pagination limit failed to restrict results.');
  }

  // Test 4: Returned Fields verification
  console.log('\n--- Test 4: Sensitive fields check ---');
  const sample = res2.data[0];
  console.log('Sample keys returned:', Object.keys(sample));
  const badKeys = ['password', 'jwt', 'token', 'isTestData', 'testBatchYear'];
  const hasBad = badKeys.some(k => k in sample || sample[k] !== undefined);
  if (!hasBad) {
    console.log('✅ PASS: Sensitive database fields are successfully omitted.');
  } else {
    console.log('❌ FAIL: Exposed sensitive fields in search output!');
  }

  process.exit(0);
}

run().catch(console.error);
