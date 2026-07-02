const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = require('../src/models/User');
  const Student = require('../src/models/Student');
  const Faculty = require('../src/models/Faculty');
  const Conversation = require('../src/models/Conversation');

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

  // Let's helper mock request
  const mockSearch = async (reqUser, queryText) => {
    const q = queryText;
    const currentUser = reqUser;
    
    const queryRegex = new RegExp(q.trim(), 'i');

    const Department = require('../src/models/Department');

    const matchedDepts = await Department.find({
      $or: [
        { code: queryRegex },
        { name: queryRegex }
      ]
    }).select('_id').lean();
    const deptIds = matchedDepts.map(d => d._id);

    const studentConditions = [ { registerNumber: queryRegex } ];
    if (deptIds.length > 0) {
      studentConditions.push({ department: { $in: deptIds } });
    }
    const matchedStudents = await Student.find({ $or: studentConditions }).select('user').lean();
    const studentUserIds = matchedStudents.map(s => s.user);

    const facultyConditions = [ { employeeId: queryRegex } ];
    if (deptIds.length > 0) {
      facultyConditions.push({ department: { $in: deptIds } });
    }
    const matchedFaculties = await Faculty.find({ $or: facultyConditions }).select('user').lean();
    const facultyUserIds = matchedFaculties.map(f => f.user);

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

    if (currentUser.role === 'student') {
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

    return matchedUsers;
  };

  // Assert role restrictions
  console.log('\n--- Test 1: Admin searching Student B ---');
  const adminResults = await mockSearch(admin, studentB.user.name);
  console.log(`Admin search returned: ${adminResults.map(u => u.name).join(', ')}`);
  if (adminResults.some(u => u._id.toString() === studentB.user._id.toString())) {
    console.log('✅ PASS: Admin successfully searched student B.');
  } else {
    console.log('❌ FAIL: Admin could not find student B.');
  }

  console.log('\n--- Test 2: Student A searching Student B (different department) ---');
  const studentAResults = await mockSearch(studentA.user, studentB.user.name);
  console.log(`Student A search returned: ${studentAResults.map(u => u.name).join(', ')}`);
  if (!studentAResults.some(u => u._id.toString() === studentB.user._id.toString())) {
    console.log('✅ PASS: Student A is blocked from finding Student B (different department).');
  } else {
    console.log('❌ FAIL: Student A was able to find Student B (different department!).');
  }

  console.log('\n--- Test 3: Student A searching Faculty ---');
  const studentAFacultyResults = await mockSearch(studentA.user, faculty.name);
  console.log(`Student A search for faculty returned: ${studentAFacultyResults.map(u => u.name).join(', ')}`);
  if (studentAFacultyResults.some(u => u._id.toString() === faculty._id.toString())) {
    console.log('✅ PASS: Student A successfully found faculty.');
  } else {
    console.log('❌ FAIL: Student A could not find faculty.');
  }

  // Deduplication check
  console.log('\n--- Test 4: Conversation creation deduplication check ---');
  const p1 = admin._id.toString();
  const p2 = faculty._id.toString();
  
  // Clear any existing conversations between them first to start clean
  await Conversation.deleteMany({
    type: 'direct',
    participants: { $all: [p1, p2], $size: 2 }
  });

  const { createConversation } = require('../src/services/message.service');
  
  const conv1 = await createConversation([p1, p2], 'direct');
  const conv2 = await createConversation([p1, p2], 'direct');
  
  console.log(`Conversation 1 ID: ${conv1._id}`);
  console.log(`Conversation 2 ID: ${conv2._id}`);
  
  if (conv1._id.toString() === conv2._id.toString()) {
    console.log('✅ PASS: No duplicates created. Existing conversation returned on second attempt.');
  } else {
    console.log('❌ FAIL: Duplicate conversation created!');
  }

  process.exit(0);
}

run().catch(console.error);
