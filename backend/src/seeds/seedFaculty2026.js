const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

const FIRST_NAMES_MALE = [
  'Rajesh', 'Suresh', 'Ramesh', 'Karan', 'Arvind', 'Prakash', 'Vikram', 'Anil',
  'Sunil', 'Pradeep', 'Sudhir', 'Madhaven', 'Raghav', 'Mohan', 'Shankar', 'Bala',
  'Narayanan', 'Venkat', 'Murugan', 'Ketan'
];

const FIRST_NAMES_FEMALE = [
  'Meenakshi', 'Geetha', 'Saraswathi', 'Radha', 'Lakshmi', 'Parvathi', 'Uma', 'Chitra',
  'Shanthi', 'Revathi', 'Sudha', 'Preetha', 'Malathi', 'Sujatha', 'Latha', 'Devi',
  'Vasanthi', 'Gayathri', 'Deepa', 'Padma'
];

const LAST_NAMES = [
  'Subramanian', 'Krishnan', 'Viswanathan', 'Ramakrishnan', 'Swamy', 'Iyer', 'Iyengar',
  'Nadar', 'Chettiar', 'Gounder', 'Naicker', 'Reddy', 'Choudhary', 'Deshmukh', 'Joshi',
  'Kulkarni', 'Bhatt', 'Mehta', 'Sen', 'Mukherjee'
];

const GENDERS = ['Male', 'Female'];

const seedFaculty = async () => {
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
      console.log('❌ No departments found in database. Seeding cannot proceed.');
      process.exit(1);
    }

    console.log(`Found ${departments.length} departments. Seeding 5 faculty members for each...`);

    const DESIGNATIONS = [
      { role: 'Professor', qual: 'Ph.D.', expMin: 15, expMax: 25 },
      { role: 'Associate Professor', qual: 'Ph.D.', expMin: 8, expMax: 14 },
      { role: 'Assistant Professor', qual: 'M.E. / M.Tech.', expMin: 4, expMax: 7 },
      { role: 'Assistant Professor', qual: 'M.E. / M.Tech.', expMin: 2, expMax: 4 },
      { role: 'Lab Instructor', qual: 'B.E. / B.Tech.', expMin: 1, expMax: 3 }
    ];

    let totalCreated = 0;
    let totalSkipped = 0;
    const credentialsList = [];

    for (const dept of departments) {
      console.log(`\nProcessing Department: ${dept.code} - ${dept.name}`);

      for (let i = 0; i < 5; i++) {
        const config = DESIGNATIONS[i];
        
        // Deterministic name selection
        const gender = GENDERS[i % GENDERS.length];
        const firstName = gender === 'Male'
          ? FIRST_NAMES_MALE[(dept.code.charCodeAt(0) + i) % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[(dept.code.charCodeAt(0) + i) % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(dept.code.charCodeAt(1) + i) % LAST_NAMES.length];

        const fullName = `${firstName} ${lastName}`;
        const email = `test.faculty.${dept.code.toLowerCase()}.${i + 1}@kathir.edu`;
        const employeeId = `EMP26${dept.code.toUpperCase()}${String(i + 1).padStart(3, '0')}`;

        // Check if user/faculty already exists
        const existingUser = await User.findOne({ email });
        const existingFaculty = await Faculty.findOne({ employeeId });

        if (existingUser || existingFaculty) {
          console.log(`  [SKIP] Faculty ${fullName} (${employeeId} / ${email}) already exists.`);
          totalSkipped++;
          
          // Still collect credentials information for final CSV if we need it
          credentialsList.push({
            name: fullName,
            dept: dept.name,
            deptCode: dept.code,
            designation: config.role,
            employeeId,
            email,
            password: 'Faculty@123',
            qualification: config.qual,
            experience: config.expMin + 2 // deterministic experience fallback
          });
          continue;
        }

        // Create User account
        const user = await User.create({
          name: fullName,
          email,
          password: 'Faculty@123', // Automatically hashed
          role: 'faculty',
          isTestData: true,
          testBatchYear: 2026
        });

        const experience = Math.floor(Math.random() * (config.expMax - config.expMin + 1)) + config.expMin;

        // Create Faculty details
        await Faculty.create({
          user: user._id,
          employeeId,
          phone: `99887${String(dept.code.charCodeAt(0) % 10)}${String(i + 1).padStart(3, '0')}`,
          department: dept._id,
          designation: config.role,
          specialization: `${dept.code} Research Area`,
          joiningDate: new Date(2026 - Math.floor(experience / 2), Math.floor(Math.random() * 12), 1),
          qualification: config.qual,
          experience,
          gender,
          isTestData: true,
          testBatchYear: 2026
        });

        console.log(`  [CREATED] ${fullName} (${employeeId}) - ${config.role}`);
        totalCreated++;

        credentialsList.push({
          name: fullName,
          dept: dept.name,
          deptCode: dept.code,
          designation: config.role,
          employeeId,
          email,
          password: 'Faculty@123',
          qualification: config.qual,
          experience
        });
      }
    }

    // Write reports
    const generatedDir = path.join(__dirname, '../../generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    // CSV report
    const csvHeader = 'Name,Department,Designation,Employee ID,Email,Password,Qualification,Experience\n';
    const csvRows = credentialsList.map(c => 
      `"${c.name}","${c.dept}","${c.designation}","${c.employeeId}","${c.email}","${c.password}","${c.qualification}",${c.experience}`
    ).join('\n');
    fs.writeFileSync(path.join(generatedDir, 'test-faculty-2026.csv'), csvHeader + csvRows);
    console.log('[REPORT] Created test-faculty-2026.csv successfully.');

    // Markdown report grouped by department
    let mdContent = '# TEST FACULTY CREDENTIALS (2026 BATCH)\n\n';
    
    // Group by department
    const grouped = {};
    credentialsList.forEach(c => {
      grouped[c.dept] = grouped[c.dept] || [];
      grouped[c.dept].push(c);
    });

    for (const [deptName, list] of Object.entries(grouped)) {
      mdContent += `## ${deptName}\n\n`;
      mdContent += '| Name | Designation | Employee ID | Email | Password | Qualification | Experience |\n';
      mdContent += '| --- | --- | --- | --- | --- | --- | --- |\n';
      list.forEach(c => {
        mdContent += `| ${c.name} | ${c.designation} | ${c.employeeId} | ${c.email} | \`${c.password}\` | ${c.qualification} | ${c.experience} years |\n`;
      });
      mdContent += '\n';
    }
    fs.writeFileSync(path.join(generatedDir, 'TEST_FACULTY_CREDENTIALS.md'), mdContent);
    console.log('[REPORT] Created TEST_FACULTY_CREDENTIALS.md successfully.');

    console.log(`\n🎉 Seeding completed.`);
    console.log(`Total faculty created: ${totalCreated}`);
    console.log(`Total faculty skipped: ${totalSkipped}`);

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedFaculty();
