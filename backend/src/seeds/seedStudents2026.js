const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Department = require('../models/Department');

const FIRST_NAMES_MALE = [
  'Aditya', 'Aarav', 'Amit', 'Arjun', 'Bhuvan', 'Chaitanya', 'Deepak', 'Dinesh',
  'Ganesh', 'Hari', 'Ishaan', 'Jatin', 'Karthik', 'Kiran', 'Manoj', 'Nikhil',
  'Pranav', 'Rahul', 'Sanjay', 'Vijay'
];

const FIRST_NAMES_FEMALE = [
  'Ananya', 'Aishwarya', 'Divya', 'Harini', 'Ishwarya', 'Jyothi', 'Kavya', 'Meera',
  'Nandhini', 'Pooja', 'Priya', 'Riya', 'Sandhya', 'Shruthi', 'Sneha', 'Swetha',
  'Vaishnavi', 'Yalini', 'Yamini', 'Anjali'
];

const LAST_NAMES = [
  'Kumar', 'Rajan', 'Ram', 'Prasad', 'Sharma', 'Patel', 'Nair', 'Menon',
  'Balakrishnan', 'Sundaram', 'Krishnan', 'Mani', 'Sekar', 'Srinivasan',
  'Subramanian', 'Reddy', 'Rao', 'Gopal', 'Naidu', ' Pillai'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const CITIES = ['Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Salem', 'Tiruppur', 'Erode'];

const seedStudents = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Database connected.');

    // Fetch all departments
    const departments = await Department.find();
    if (departments.length === 0) {
      console.log('❌ No departments found in database. Please run seed script first.');
      process.exit(1);
    }

    console.log(`Found ${departments.length} departments. Seeding 10 students for each...`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const dept of departments) {
      console.log(`\nProcessing Department: ${dept.code} - ${dept.name}`);

      for (let i = 1; i <= 10; i++) {
        // Deterministic generation values
        const gender = i % 2 === 0 ? 'Female' : 'Male';
        const firstName = gender === 'Male' 
          ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
          : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        
        const fullName = `${firstName} ${lastName}`;
        const email = `test.student.${dept.code.toLowerCase()}.${i}@kathir.edu`;
        const regNo = `KCE26${dept.code.toUpperCase()}${String(i).padStart(3, '0')}`;
        
        // Check if user/student already exists
        const existingUser = await User.findOne({ email });
        const existingStudent = await Student.findOne({ registerNumber: regNo });

        if (existingUser || existingStudent) {
          console.log(`  [SKIP] Student ${fullName} (${regNo} / ${email}) already exists.`);
          totalSkipped++;
          continue;
        }

        // Determine year and semester logically
        // 10 students distributed across years 1-4
        const year = (i % 4) + 1; // 1, 2, 3, 4
        const semester = year * 2 - (i % 2); // logical semester (e.g. year 2 -> sem 3 or 4)

        // Create User account
        const user = await User.create({
          name: fullName,
          email,
          password: 'Student@123', // Will be automatically hashed
          role: 'student',
          isTestData: true,
          testBatchYear: 2026
        });

        // Parent names
        const fatherName = `${lastName} Sr.`;
        const motherName = `Mrs. ${firstName} Mother`;

        // Create Student details
        await Student.create({
          user: user._id,
          registerNumber: regNo,
          phone: `98765${String(dept.code.charCodeAt(0) % 10)}${String(i).padStart(3, '0')}`,
          dateOfBirth: new Date(2004, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender,
          department: dept._id,
          year,
          semester,
          address: `No. ${10 + i}, College Main Road`,
          city: CITIES[i % CITIES.length],
          state: 'Tamil Nadu',
          pincode: `6410${String(30 + i).padStart(2, '0')}`,
          bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
          parentDetails: {
            fatherName,
            motherName,
            fatherPhone: `9123456${String(i).padStart(3, '0')}`,
            motherPhone: `9876543${String(i).padStart(3, '0')}`
          },
          isTestData: true,
          testBatchYear: 2026
        });

        console.log(`  [CREATED] ${fullName} (${regNo})`);
        totalCreated++;
      }
    }

    console.log(`\n🎉 Seeding completed.`);
    console.log(`Total students created: ${totalCreated}`);
    console.log(`Total students skipped: ${totalSkipped}`);

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedStudents();
