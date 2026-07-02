const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = require('../config');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Achievement = require('../models/Achievement');
const DisciplineReport = require('../models/DisciplineReport');
const Query = require('../models/Query');
const Announcement = require('../models/Announcement');
const IllegalActivity = require('../models/IllegalActivity');
const Notification = require('../models/Notification');

const seedData = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is required.");
    }

    try {
      console.log('🔄 Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected.');

    // 1. Clear existing data
    console.log('🔄 Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Admin.deleteMany({}),
      Department.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
      Marks.deleteMany({}),
      Achievement.deleteMany({}),
      DisciplineReport.deleteMany({}),
      Query.deleteMany({}),
      Announcement.deleteMany({}),
      IllegalActivity.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('✅ Collections cleared.');

    // 2. Seed Departments
    console.log('🔄 Seeding Departments...');
    const depts = [
      { name: 'Computer Science and Engineering', code: 'CSE', description: 'Department of CSE' },
      { name: 'Electronics and Communication Engineering', code: 'ECE', description: 'Department of ECE' },
      { name: 'Electrical and Electronics Engineering', code: 'EEE', description: 'Department of EEE' },
      { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mech' },
      { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil' },
      { name: 'Artificial Intelligence and Data Science', code: 'AIDS', description: 'Department of AI & DS' }
    ];
    const createdDepts = await Department.create(depts);
    console.log(`✅ Seeded ${createdDepts.length} departments.`);

    const deptMap = {};
    createdDepts.forEach(d => {
      deptMap[d.code] = d._id;
    });

    // 3. Seed Users (Admin, Faculty, Students)
    console.log('🔄 Seeding Users...');
    
    // Admin
    const adminUser = await User.create({
      name: 'Principal Administrator',
      email: 'admin@kce.edu',
      password: 'Admin@123',
      role: 'admin'
    });
    await Admin.create({
      user: adminUser._id,
      employeeId: 'KCE-ADM001',
      accessLevel: 'SuperAdmin'
    });

    // Faculty Users
    const faculties = [
      { name: 'Dr. A. Sharma', email: 'sharma.cse@college.edu', role: 'faculty', employeeId: 'KCE-FAC001', dept: 'CSE', designation: 'Professor & HOD', phone: '9876543101', spec: 'Cloud Computing' },
      { name: 'Dr. B. Verma', email: 'verma.ece@college.edu', role: 'faculty', employeeId: 'KCE-FAC002', dept: 'ECE', designation: 'Assoc. Professor', phone: '9876543102', spec: 'Digital Signals' },
      { name: 'Prof. C. Gupta', email: 'gupta.mech@college.edu', role: 'faculty', employeeId: 'KCE-FAC003', dept: 'MECH', designation: 'Asst. Professor', phone: '9876543103', spec: 'Thermodynamics' },
      { name: 'Prof. D. Rao', email: 'rao.civil@college.edu', role: 'faculty', employeeId: 'KCE-FAC004', dept: 'CIVIL', designation: 'Professor', phone: '9876543104', spec: 'Structural Engg' },
      { name: 'Dr. E. Mani', email: 'mani.eee@college.edu', role: 'faculty', employeeId: 'KCE-FAC005', dept: 'EEE', designation: 'Assoc. Professor', phone: '9876543105', spec: 'Power Systems' }
    ];

    const facultyMap = {};
    for (const f of faculties) {
      const fUser = await User.create({
        name: f.name,
        email: f.email,
        password: 'Faculty@123',
        role: 'faculty'
      });
      const fRecord = await Faculty.create({
        user: fUser._id,
        employeeId: f.employeeId,
        phone: f.phone,
        department: deptMap[f.dept],
        designation: f.designation,
        specialization: f.spec
      });
      facultyMap[f.employeeId] = fRecord;
      
      // Update HOD reference in Department
      if (f.designation.includes('HOD')) {
        await Department.findByIdAndUpdate(deptMap[f.dept], { hod: fRecord._id });
      }
    }
    console.log(`✅ Seeded ${faculties.length} faculty profiles.`);

    // 4. Seed Subjects
    console.log('🔄 Seeding Subjects...');
    const subjects = [
      // CSE Semester 1
      { name: 'Computer Programming', code: 'CS111', department: deptMap['CSE'], semester: 1, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Engineering Mathematics I', code: 'MA111', department: deptMap['CSE'], semester: 1, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Engineering Physics', code: 'PH111', department: deptMap['CSE'], semester: 1, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Engineering Chemistry', code: 'CY111', department: deptMap['CSE'], semester: 1, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Engineering Graphics', code: 'GE111', department: deptMap['CSE'], semester: 1, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Basic Sciences Lab', code: 'GE112', department: deptMap['CSE'], semester: 1, credits: 4, faculty: facultyMap['KCE-FAC001']._id },

      // CSE Semester 2
      { name: 'Digital Principles', code: 'CS121', department: deptMap['CSE'], semester: 2, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Engineering Mathematics II', code: 'MA121', department: deptMap['CSE'], semester: 2, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Materials Science', code: 'PH121', department: deptMap['CSE'], semester: 2, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Environmental Science', code: 'CY121', department: deptMap['CSE'], semester: 2, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Technical English', code: 'GE121', department: deptMap['CSE'], semester: 2, credits: 4, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Programming Lab', code: 'GE122', department: deptMap['CSE'], semester: 2, credits: 4, faculty: facultyMap['KCE-FAC001']._id },

      // CSE Semester 3
      { name: 'Data Structures', code: 'CS211', department: deptMap['CSE'], semester: 3, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Discrete Mathematics', code: 'MA211', department: deptMap['CSE'], semester: 3, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Object Oriented Programming', code: 'CS212', department: deptMap['CSE'], semester: 3, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Computer Architecture', code: 'CS213', department: deptMap['CSE'], semester: 3, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Data Structures Lab', code: 'CS214', department: deptMap['CSE'], semester: 3, credits: 5, faculty: facultyMap['KCE-FAC001']._id },

      // CSE Semester 4
      { name: 'Operating Systems', code: 'CS221', department: deptMap['CSE'], semester: 4, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Database Management Systems', code: 'CS222', department: deptMap['CSE'], semester: 4, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Software Engineering', code: 'CS223', department: deptMap['CSE'], semester: 4, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Design and Analysis of Algorithms', code: 'CS224', department: deptMap['CSE'], semester: 4, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Probability and Queueing Theory', code: 'MA221', department: deptMap['CSE'], semester: 4, credits: 6, faculty: facultyMap['KCE-FAC001']._id },

      // CSE Semester 5
      { name: 'Cloud Computing', code: 'CS301', department: deptMap['CSE'], semester: 5, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Computer Networks', code: 'CS312', department: deptMap['CSE'], semester: 5, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Theory of Computation', code: 'CS313', department: deptMap['CSE'], semester: 5, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Microprocessors and Microcontrollers', code: 'CS314', department: deptMap['CSE'], semester: 5, credits: 5, faculty: facultyMap['KCE-FAC001']._id },
      { name: 'Web Technology', code: 'CS315', department: deptMap['CSE'], semester: 5, credits: 5, faculty: facultyMap['KCE-FAC001']._id },

      // ECE/MECH/CIVIL/EEE/AIDS Semester 5
      { name: 'Digital Signal Processing', code: 'EC301', department: deptMap['ECE'], semester: 5, credits: 4, faculty: facultyMap['KCE-FAC002']._id },
      { name: 'Thermodynamics', code: 'ME301', department: deptMap['MECH'], semester: 5, credits: 3, faculty: facultyMap['KCE-FAC003']._id },
      { name: 'Structural Engineering', code: 'CE301', department: deptMap['CIVIL'], semester: 5, credits: 4, faculty: facultyMap['KCE-FAC004']._id },
      { name: 'Power Systems', code: 'EE301', department: deptMap['EEE'], semester: 5, credits: 3, faculty: facultyMap['KCE-FAC005']._id },
      { name: 'Machine Learning', code: 'AI302', department: deptMap['AIDS'], semester: 5, credits: 4 }
    ];
    const createdSubjects = await Subject.create(subjects);
    
    // Assign subject references back to faculty records
    for (const s of createdSubjects) {
      if (s.faculty) {
        await Faculty.findByIdAndUpdate(s.faculty, { $push: { subjects: s._id } });
      }
    }
    console.log(`✅ Seeded ${createdSubjects.length} subjects.`);

    const subjectMap = {};
    createdSubjects.forEach(s => {
      subjectMap[s.code] = s._id;
    });

    // 5. Seed Students
    console.log('🔄 Seeding Students...');
    const students = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@college.edu',
        registerNumber: 'CS2021001',
        phone: '+91 9876543210',
        dateOfBirth: new Date('2003-05-15'),
        gender: 'Male',
        department: deptMap['CSE'],
        year: 3,
        semester: 5,
        address: '123, MG Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        bloodGroup: 'O+',
        parentDetails: {
          fatherName: 'Kumar Selvam',
          fatherPhone: '+91 9876543211',
          motherName: 'Lakshmi Kumar',
          motherPhone: '+91 9876543212'
        }
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@college.edu',
        registerNumber: 'CS2021002',
        phone: '+91 9876543220',
        dateOfBirth: new Date('2003-08-22'),
        gender: 'Female',
        department: deptMap['CSE'],
        year: 3,
        semester: 5,
        address: '456, Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600040',
        bloodGroup: 'A+',
        parentDetails: {
          fatherName: 'Sharma Ravi',
          fatherPhone: '+91 9876543221',
          motherName: 'Meena Sharma',
          motherPhone: '+91 9876543222'
        }
      },
      {
        name: 'Aarav Kumar',
        email: 'student@kce.edu', // generic student email for easy testing
        registerNumber: '722821104001',
        phone: '+91 9876543230',
        dateOfBirth: new Date('2003-02-10'),
        gender: 'Male',
        department: deptMap['CSE'],
        year: 3,
        semester: 5,
        address: '78, Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641012',
        bloodGroup: 'B+',
        parentDetails: {
          fatherName: 'Raj Kumar',
          fatherPhone: '+91 9876543231',
          motherName: 'Sita Kumar',
          motherPhone: '+91 9876543232'
        }
      }
    ];

    const studentRecordMap = {};
    for (const s of students) {
      const sUser = await User.create({
        name: s.name,
        email: s.email,
        password: 'Student@123',
        role: 'student'
      });
      const sRecord = await Student.create({
        user: sUser._id,
        registerNumber: s.registerNumber,
        phone: s.phone,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        department: s.department,
        year: s.year,
        semester: s.semester,
        address: s.address,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        bloodGroup: s.bloodGroup,
        parentDetails: s.parentDetails
      });
      studentRecordMap[s.registerNumber] = sRecord;
    }
    console.log(`✅ Seeded ${students.length} students.`);

    // 6. Seed Attendance
    console.log('🔄 Seeding Attendance...');
    const attendanceRecords = [];
    const dates = [
      new Date('2026-06-22'),
      new Date('2026-06-23'),
      new Date('2026-06-24'),
      new Date('2026-06-25'),
      new Date('2026-06-26')
    ];

    // Seed attendance for Aarav Kumar in Cloud Computing
    const aarav = studentRecordMap['722821104001'];
    dates.forEach((d, idx) => {
      d.setHours(0, 0, 0, 0);
      attendanceRecords.push({
        student: aarav._id,
        subject: subjectMap['CS301'],
        date: d,
        status: idx === 2 ? 'Absent' : 'Present', // 1 absent out of 5 -> 80%
        markedBy: facultyMap['KCE-FAC001']._id
      });
    });

    await Attendance.create(attendanceRecords);
    console.log(`✅ Seeded ${attendanceRecords.length} attendance records.`);

    // 7. Seed Marks
    console.log('🔄 Seeding Marks...');
    const marksData = [];
    const facultyId = facultyMap['KCE-FAC001']._id;

    // Sem 1 (Averages 85)
    ['CS111', 'MA111', 'PH111', 'CY111', 'GE111', 'GE112'].forEach(code => {
      marksData.push({
        student: aarav._id,
        subject: subjectMap[code],
        examType: 'Semester',
        maxMarks: 100,
        obtainedMarks: 85,
        semester: 1,
        academicYear: '2023-2024',
        uploadedBy: facultyId
      });
    });

    // Sem 2 (Averages 87)
    ['CS121', 'MA121', 'PH121', 'CY121', 'GE121', 'GE122'].forEach(code => {
      marksData.push({
        student: aarav._id,
        subject: subjectMap[code],
        examType: 'Semester',
        maxMarks: 100,
        obtainedMarks: 87,
        semester: 2,
        academicYear: '2023-2024',
        uploadedBy: facultyId
      });
    });

    // Sem 3 (Averages 82)
    ['CS211', 'MA211', 'CS212', 'CS213', 'CS214'].forEach(code => {
      marksData.push({
        student: aarav._id,
        subject: subjectMap[code],
        examType: 'Semester',
        maxMarks: 100,
        obtainedMarks: 82,
        semester: 3,
        academicYear: '2024-2025',
        uploadedBy: facultyId
      });
    });

    // Sem 4 (Averages 89)
    ['CS221', 'CS222', 'CS223', 'CS224', 'MA221'].forEach(code => {
      marksData.push({
        student: aarav._id,
        subject: subjectMap[code],
        examType: 'Semester',
        maxMarks: 100,
        obtainedMarks: 89,
        semester: 4,
        academicYear: '2024-2025',
        uploadedBy: facultyId
      });
    });

    // Sem 5 (Averages 86)
    ['CS301', 'CS312', 'CS313', 'CS314', 'CS315'].forEach(code => {
      marksData.push({
        student: aarav._id,
        subject: subjectMap[code],
        examType: 'Semester',
        maxMarks: 100,
        obtainedMarks: 86,
        semester: 5,
        academicYear: '2025-2026',
        uploadedBy: facultyId
      });
    });

    await Marks.create(marksData);
    console.log(`✅ Seeded ${marksData.length} marks records.`);

    // 8. Seed Achievements
    console.log('🔄 Seeding Achievements...');
    await Achievement.create({
      student: aarav._id,
      title: 'First Place - Intercollege Hackathon',
      description: 'Won 1st prize in Smart India Hackathon internal trials.',
      type: 'technical',
      date: new Date('2026-02-15'),
      certificate: 'https://via.placeholder.com/150'
    });
    console.log('✅ Seeded achievements.');

    // 9. Seed Discipline Reports
    console.log('🔄 Seeding Discipline Reports...');
    await DisciplineReport.create({
      students: [aarav._id],
      issues: ['dresscode'],
      severity: 'Low',
      description: 'Dress code violation - Class wear instructions not adhered to.',
      reportedBy: facultyMap['KCE-FAC001']._id,
      status: 'Resolved',
      actionTaken: 'Verbal warning given by staff coordinator.',
      resolvedBy: adminUser._id,
      resolvedAt: new Date()
    });
    console.log('✅ Seeded discipline reports.');

    // 9.5. Seed Illegal Activities
    console.log('🔄 Seeding Illegal Activities...');
    await IllegalActivity.create({
      student: aarav._id,
      issue: 'Possession of prohibited items',
      severity: 'High',
      date: new Date('2026-06-10'),
      status: 'Under Investigation',
      reportedBy: 'Security Chief',
      details: 'Unauthorized electronic device found inside examination hall.'
    });
    console.log('✅ Seeded illegal activities.');

    // 10. Seed Queries
    console.log('🔄 Seeding Queries...');
    await Query.create({
      student: aarav._id,
      category: 'Academic',
      subject: 'Exam schedule discrepancy',
      description: 'Subject code CS301 timing clashes with elective subject timings on 3rd July.',
      status: 'open'
    });
    console.log('✅ Seeded helpdesk queries.');

    // 11. Seed Announcements
    console.log('🔄 Seeding Announcements...');
    await Announcement.create([
      {
        title: 'Odd Semester Registration Extended',
        content: 'Registration for odd semester has been extended until 30th June 2026 without fine.',
        targetAudience: 'students',
        postedBy: adminUser._id
      },
      {
        title: 'Internal Assessment - I Timetable',
        content: 'Internal Assessment I begins from 10th July 2026. The timetable is uploaded in department notice boards.',
        targetAudience: 'students',
        department: deptMap['CSE'],
        postedBy: facultyMap['KCE-FAC001']._id
      }
    ]);
    console.log('✅ Seeded announcements.');

    // 12. Seed Notifications
    console.log('🔄 Seeding Notifications...');
    await Notification.create({
      user: aarav.user,
      title: 'Welcome to KCE Portal',
      message: 'Your production-ready student portal account is active now.',
      type: 'success'
    });
    console.log('✅ Seeded notifications.');

    console.log('===========================================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===========================================================');
    console.log('Seeded Users:');
    console.log('  - Admin: admin@kce.edu / Admin@123');
    console.log('  - Faculty: sharma.cse@college.edu / Faculty@123');
    console.log('  - Student: student@kce.edu / Student@123 (Register No: 722821104001)');
    console.log('===========================================================');

    await mongoose.connection.close();
    console.log('👋 Mongoose connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
};

seedData();
